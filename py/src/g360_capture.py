"""
g360_capture.py — Captura screenshot de una app Flet sin tocar su codigo.

Lanza el entrypoint de la app, espera el primer render, captura la ventana y
guarda un PNG. Pensado para el loop visual del agente:

    proponer UI -> g360 capture -> mirar captura -> iterar

Compatibilidad:
  - flet >= 0.28: la ventana visible (FLUTTER_RUNNER_WIN32_WINDOW) pertenece a
    un proceso hijo lanzado por flet-desktop. Se localiza por arbol de procesos
    y se captura con Win32 + Pillow, sin tocar la app.
  - flet con page.screenshot_async()/screenshot(): se usa esa API.

Uso:
    python g360_capture.py <entry.py> --out salida.png [--wait 3] [--timeout 45]

Requiere: flet (mismo entorno de la app) + Pillow (solo para la vía Win32).
Autor: @carloscus — G360 ecosystem
"""

from __future__ import annotations

import argparse
import asyncio
import importlib.util
import os
import sys
import threading
import time
from pathlib import Path

TH32CS_SNAPPROCESS = 2
CONSOLE_CLASS = "ConsoleWindowClass"


# ---------------------------------------------------------------- process tree


def _descendant_pids(root_pid: int) -> set:
    """PIDs del proceso raiz + toda su descendencia (por si flet lanza el
    renderer Flutter como proceso hijo)."""
    try:
        import ctypes
    except Exception:
        return {root_pid}

    kernel32 = ctypes.windll.kernel32

    class PROCESSENTRY32(ctypes.Structure):
        _fields_ = [
            ("dwSize", ctypes.c_ulong),
            ("cntUsage", ctypes.c_ulong),
            ("th32ProcessID", ctypes.c_ulong),
            ("th32DefaultHeapID", ctypes.c_size_t),
            ("th32ModuleID", ctypes.c_ulong),
            ("cntThreads", ctypes.c_ulong),
            ("th32ParentProcessID", ctypes.c_ulong),
            ("pcPriClassBase", ctypes.c_long),
            ("dwFlags", ctypes.c_ulong),
            ("szExeFile", ctypes.c_char * 260),
        ]

    snapshot = kernel32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)
    if snapshot == -1:
        return {root_pid}

    entries = []
    pe = PROCESSENTRY32()
    pe.dwSize = ctypes.sizeof(PROCESSENTRY32)
    ok = kernel32.Process32First(snapshot, ctypes.byref(pe))
    while ok:
        entries.append((pe.th32ProcessID, pe.th32ParentProcessID))
        ok = kernel32.Process32Next(snapshot, ctypes.byref(pe))
    kernel32.CloseHandle(snapshot)

    pids = {root_pid}
    changed = True
    while changed:
        changed = False
        for pid, parent in entries:
            if parent in pids and pid not in pids:
                pids.add(pid)
                changed = True
    return pids


# ---------------------------------------------------------------- window search


def _find_app_window(min_area: int = 200 * 200):
    """Rect (left, top, right, bottom) de la ventana principal de la app:
    primero la clase FLUTTER_RUNNER_WIN32_WINDOW del arbol de procesos,
    si no, la ventana visible mas grande con titulo de ese arbol."""
    try:
        import ctypes
        from ctypes import wintypes
    except Exception:
        return None

    user32 = ctypes.windll.user32
    pids = _descendant_pids(os.getpid())

    flutter = None
    best = {"area": 0, "rect": None}

    def enum_cb(hwnd, _lparam):
        nonlocal flutter, best
        if not user32.IsWindowVisible(hwnd):
            return True
        wpid = wintypes.DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(wpid))
        if wpid.value not in pids:
            return True
        cls = ctypes.create_unicode_buffer(128)
        user32.GetClassNameW(hwnd, cls, 128)
        if cls.value == CONSOLE_CLASS:
            return True
        title = ctypes.create_unicode_buffer(256)
        user32.GetWindowTextW(hwnd, title, 256)
        rect = wintypes.RECT()
        user32.GetWindowRect(hwnd, ctypes.byref(rect))
        w = rect.right - rect.left
        h = rect.bottom - rect.top
        if cls.value == "FLUTTER_RUNNER_WIN32_WINDOW" and w * h >= min_area:
            flutter = (rect.left, rect.top, rect.right, rect.bottom)
            return False  # encontrado: detener
        if title.value and w * h > best["area"] and w * h >= min_area:
            best["area"] = w * h
            best["rect"] = (rect.left, rect.top, rect.right, rect.bottom)
        return True

    try:
        user32.EnumWindows(
            ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)(enum_cb),
            0,
        )
    except Exception:
        return None

    return flutter or best["rect"]


def _grab_window_sync(rect):
    """Captura el rectangulo de pantalla con Pillow (Windows, sin deps extra)."""
    from PIL import ImageGrab

    return ImageGrab.grab(bbox=rect)


# -------------------------------------------------------------------- grab loop


async def _grab(page, out: Path, wait: float, window_wait: float = 25.0) -> None:
    # Espera a que la ventana exista (la app puede tardar en construir el layout)
    deadline = time.monotonic() + window_wait
    rect = None
    while time.monotonic() < deadline:
        rect = _find_app_window()
        if rect:
            break
        await asyncio.sleep(0.5)
    if not rect:
        print("G360_CAPTURE_ERROR:ventana de la app no encontrada", file=sys.stderr)
        _close_page(page)
        return

    try:
        page.window.to_front()
    except Exception:
        pass  # version sin to_front o sin page.window

    await asyncio.sleep(wait)

    # 1) API nativa si alguna versión de flet la expone
    data = None
    try:
        data = await page.screenshot_async()
    except AttributeError:
        data = None
    except Exception as exc:
        print(f"G360_CAPTURE_ERROR:screenshot_async fallo: {exc}", file=sys.stderr)

    if data is None:
        try:
            data = page.screenshot()
        except (AttributeError, TypeError):
            data = None
        except Exception as exc:
            print(f"G360_CAPTURE_ERROR:screenshot fallo: {exc}", file=sys.stderr)

    # 2) Fallback: captura de ventana Win32
    if data is None:
        loop = asyncio.get_event_loop()
        try:
            img = await loop.run_in_executor(None, _grab_window_sync, rect)
        except Exception as exc:
            print(
                f"G360_CAPTURE_ERROR:captura de ventana fallo: {exc}", file=sys.stderr
            )
            _close_page(page)
            return
        if not img:
            print("G360_CAPTURE_ERROR:captura vacia", file=sys.stderr)
            _close_page(page)
            return
        out.parent.mkdir(parents=True, exist_ok=True)
        try:
            img.save(out, format="PNG")
        except Exception as exc:
            print(f"G360_CAPTURE_ERROR:guardado PNG fallo: {exc}", file=sys.stderr)
            _close_page(page)
            return
    else:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(data)

    print(f"G360_CAPTURE_OK:{out}")
    _close_page(page)


def _close_page(page) -> None:
    closed = False
    for closer in (
        lambda: page.window.close(),
        lambda: page.window.destroy(),
        lambda: page.app_exit(),
    ):
        try:
            closer()
            closed = True
            break
        except Exception:
            continue
    if not closed:
        # Ninguna API de cierre disponible
        os._exit(0)
        return
    # flet puede no retornar de ft.app() tras cerrar la ventana: watchdog corto
    # para no dejar el proceso colgado (deja grace para on_close de la app).
    threading.Timer(4.0, lambda: os._exit(0)).start()


def _load_entry(entry: Path):
    """Importa el entrypoint y devuelve su funcion main(page)."""
    sys.path.insert(0, str(entry.resolve().parent))
    spec = importlib.util.spec_from_file_location("g360_capture_target", entry)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"No se pudo cargar el entrypoint: {entry}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)

    main_fn = getattr(module, "main", None)
    if not callable(main_fn):
        raise RuntimeError(
            f"{entry.name} no expone una funcion main(page). "
            "G360 no puede capturarla automaticamente."
        )
    return main_fn


def main() -> int:
    parser = argparse.ArgumentParser(description="Captura screenshot de una app Flet")
    parser.add_argument("entry", help="Archivo entrypoint (ej. main.py)")
    parser.add_argument("--out", required=True, help="Ruta del PNG de salida")
    parser.add_argument(
        "--wait", type=float, default=3.0, help="Segundos de espera tras el render"
    )
    parser.add_argument(
        "--timeout", type=float, default=45.0, help="Hard timeout en segundos"
    )
    args = parser.parse_args()

    entry = Path(args.entry)
    out = Path(args.out)

    if not entry.exists():
        print(f"G360_CAPTURE_ERROR:entrypoint no existe: {entry}", file=sys.stderr)
        return 2

    try:
        import flet  # noqa: F401
    except ImportError:
        print(
            "G360_CAPTURE_ERROR:flet no instalado (pip install flet)", file=sys.stderr
        )
        return 3

    try:
        target = _load_entry(entry)
    except Exception as exc:
        print(f"G360_CAPTURE_ERROR:import fallo: {exc}", file=sys.stderr)
        return 4

    def force_quit():
        print("G360_CAPTURE_ERROR:timeout alcanzado", file=sys.stderr)
        os._exit(5)

    threading.Timer(args.timeout, force_quit).start()

    def wrapped(page):
        try:
            target(page)
        except Exception as exc:
            print(f"G360_CAPTURE_ERROR:main() fallo: {exc}", file=sys.stderr)
            _close_page(page)
            return
        page.run_task(_grab, page, out, args.wait)

    import flet as ft

    try:
        ft.app(target=wrapped, view=ft.AppView.FLET_APP)
    except TypeError:
        ft.app(target=wrapped)
    return 0


if __name__ == "__main__":
    sys.exit(main())
