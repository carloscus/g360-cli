import json
from pathlib import Path

# Colores G360 estandar como referencia
G360_DEFAULTS = {
    "dark": {
        "accent": "#10B981",
        "accent_dark": "#047857",
        "success": "#34D399",
        "warning": "#F59E0B",
        "error": "#EF4444",
        "info": "#3B82F6",
        "violet": "#8B5CF6",
        "pink": "#EC4899",
        "cyan": "#06B6D4",
        "orange": "#F97316",
        "surface": "#141D33",
        "surface_variant": "#1B2740",
        "surface_sunken": "#0E1627",
        "background": "#0A0F1E",
        "border": "#FFFFFF17",
        "text_muted": "#8FA0BA",
        "text_primary": "#F1F5FB",
        "text_secondary": "#C9D4E6",
        "kpis": {
            "primary": "#06B6D4",
            "secondary": "#8B5CF6",
            "tertiary": "#0EA5E9",
            "quaternary": "#6366F1",
            "quinary": "#EC4899",
            "senary": "#F59E0B",
            "septenary": "#EF4444",
            "octonary": "#F97316",
        },
    },
    "light": {
        "accent": "#047857",
        "accent_dark": "#065F46",
        "success": "#15803D",
        "warning": "#B45309",
        "error": "#DC2626",
        "info": "#2563EB",
        "violet": "#7C3AED",
        "pink": "#DB2777",
        "cyan": "#0891B2",
        "orange": "#EA580C",
        "surface": "#FFFFFF",
        "surface_variant": "#F7F9FC",
        "surface_sunken": "#EEF1F6",
        "background": "#F3F5F9",
        "border": "#E3E8F0",
        "text_muted": "#64748B",
        "text_primary": "#0F172A",
        "text_secondary": "#334155",
        "kpis": {
            "primary": "#0891B2",
            "secondary": "#7C3AED",
            "tertiary": "#0284C7",
            "quaternary": "#4F46E5",
            "quinary": "#DB2777",
            "senary": "#B45309",
            "septenary": "#DC2626",
            "octonary": "#EA580C",
        },
    },
}


def get_colors(mode: str = None, skill_path: Path = None) -> dict:
    """
    Carga la paleta de colores para el modo especificado.
    
    Prioridad:
    1. skill.json del proyecto (si existe)
    2. Configuracion guardada en ~/.g360/
    3. Valores por defecto G360
    
    Args:
        mode: 'dark' o 'light'. Si es None, lee de la preferencia guardada.
        skill_path: Ruta al skill.json. Si es None, busca automaticamente.
    
    Returns:
        dict con los colores aplicados
    """
    # Determinar modo
    if mode is None:
        mode = load_theme_preference()
    
    # Cargar desde skill.json si existe
    skill_colors = _load_skill_colors(skill_path)
    
    # Combinar: defaults -> skill overrides
    defaults = G360_DEFAULTS.get(mode, G360_DEFAULTS["dark"])
    
    if skill_colors:
        # Skill tiene colores propios, usarlos
        colors = {**defaults, **skill_colors}
        # Asegurar que kpis se fusionen correctamente
        if "kpis" in skill_colors:
            colors["kpis"] = {**defaults.get("kpis", {}), **skill_colors["kpis"]}
    else:
        colors = defaults.copy()
        if "kpis" not in colors:
            colors["kpis"] = defaults.get("kpis", {}).copy()
    
    return colors


def _load_skill_colors(skill_path: Path = None) -> dict | None:
    """Carga colores desde skill.json del proyecto."""
    try:
        if skill_path is None:
            skill_path = _find_skill_json()
        
        if skill_path and skill_path.exists():
            with open(skill_path, encoding="utf-8") as f:
                data = json.load(f)
                return data.get("colors", {})
    except Exception:
        pass
    return None


def _find_skill_json() -> Path | None:
    """Busca skill.json en las ubicaciones posibles."""
    candidates = [
        Path("skill.json"),
        Path("src/core/skill.json"),
        Path(__file__).resolve().parent.parent.parent / "skill.json",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def rgba(color: str, opacity: float) -> str:
    """Convierte un color hex a rgba con la opacidad especificada."""
    if color.startswith("#") and len(color) == 9:
        return color  # Ya tiene alpha
    if color.startswith("#") and len(color) == 7:
        hex_color = color[1:]
        alpha = int(max(0.0, min(1.0, opacity)) * 255)
        return f"#{alpha:02x}{hex_color}"
    return color  # Retornar como esta si no es hex valido


def get_theme_file() -> Path:
    """Retorna la ruta del archivo de preferencia de tema."""
    app_name = _get_app_name()
    return Path.home() / ".g360" / f"{app_name}_config.json"


def _get_app_name() -> str:
    """Obtiene el nombre de la app desde skill.json o el nombre del directorio."""
    try:
        skill_path = _find_skill_json()
        if skill_path and skill_path.exists():
            with open(skill_path, encoding="utf-8") as f:
                data = json.load(f)
                return data.get("name", Path(__file__).resolve().parent.parent.parent.name)
    except Exception:
        pass
    return Path(__file__).resolve().parent.parent.parent.name


def load_theme_preference() -> str:
    """Carga la preferencia de tema guardada (dark/light)."""
    try:
        config_file = get_theme_file()
        if config_file.exists():
            with open(config_file, encoding="utf-8") as f:
                config = json.load(f)
                return config.get("theme_mode", "dark")
    except Exception:
        pass
    return "dark"


def save_theme_preference(mode: str):
    """Guarda la preferencia de tema."""
    try:
        config_file = get_theme_file()
        config_file.parent.mkdir(parents=True, exist_ok=True)
        config = {"theme_mode": mode}
        with open(config_file, "w", encoding="utf-8") as f:
            json.dump(config, f)
    except Exception:
        pass


def set_brand_colors(colors: dict):
    """
    Permite sobrescribir los colores de la marca en runtime.
    Useful para apps que necesitan colores dinamicos.
    """
    global G360_DEFAULTS
    # Actualizar solo los modos que existan
    for mode in ["dark", "light"]:
        if mode in G360_DEFAULTS and mode in colors:
            G360_DEFAULTS[mode].update(colors[mode])
