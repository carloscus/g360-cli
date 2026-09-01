"""
G360 App Registry — Sistema de identidad y descubrimiento entre apps G360.

Cada app G360 se registra automaticamente al iniciar con:
- Nombre unico
- Version
- Skill aplicado
- Eventos disponibles
- Endpoints de comunicacion

Las apps pueden descubrir otras apps y enviar eventos entre si.
"""
from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Callable, Any, Dict, List, Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime


# Ruta del registry global
REGISTRY_FILE = Path.home() / ".g360" / "apps_registry.json"


@dataclass
class AppMetadata:
    """Metadatos de una app G360."""
    name: str
    version: str
    skill: str
    framework: str
    description: str = ""
    author: str = ""
    created_at: str = ""
    updated_at: str = ""
    
    # Eventos que esta app puede procesar
    events: List[str] = field(default_factory=list)
    
    # Endpoints de comunicacion
    endpoints: Dict[str, str] = field(default_factory=dict)
    
    # Estado de salud
    status: str = "offline"  # online, offline, error
    last_seen: str = ""
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'AppMetadata':
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


class G360EventBus:
    """
    Bus de eventos estandarizado para comunicacion entre apps G360.
    
    Patrones de nombre de eventos:
    - app:{nombre}:{accion} — Eventos de la app
    - g360:{tipo}:{accion} — Eventos del sistema G360
    - {dominio}:{accion} — Eventos de dominio especifico
    
    Ejemplos:
    - app:stock-monitor:refresh
    - g360:theme:change
    - inventory:stock:low
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._subscribers: Dict[str, List[Callable]] = {}
        self._app_registry: Dict[str, AppMetadata] = {}
        self._history: List[dict] = []
        self._max_history = 100
    
    def subscribe(self, event_pattern: str, callback: Callable):
        """
        Suscribir a un evento (soporta wildcards).
        
        Args:
            event_pattern: patron del evento (ej: "app:*:refresh")
            callback: funcion a ejecutar
        """
        if event_pattern not in self._subscribers:
            self._subscribers[event_pattern] = []
        self._subscribers[event_pattern].append(callback)
    
    def unsubscribe(self, event_pattern: str, callback: Callable):
        """Desuscribir de un evento."""
        if event_pattern in self._subscribers:
            try:
                self._subscribers[event_pattern].remove(callback)
            except ValueError:
                pass
    
    def publish(self, event: str, data: Optional[dict] = None):
        """
        Publicar un evento.
        
        Args:
            event: nombre del evento
            data: datos opcionales
        """
        # Ejecutar suscriptores exactos
        if event in self._subscribers:
            for cb in self._subscribers[event]:
                try:
                    cb(data)
                except Exception as e:
                    print(f"[G360EventBus] Error en callback {event}: {e}")
        
        # Ejecutar suscriptores con wildcard
        for pattern, callbacks in self._subscribers.items():
            if '*' in pattern:
                if self._match_pattern(pattern, event):
                    for cb in callbacks:
                        try:
                            cb(data)
                        except Exception as e:
                            print(f"[G360EventBus] Error en callback {pattern}: {e}")
        
        # Registrar en historial
        self._history.append({
            "event": event,
            "data": data,
            "timestamp": datetime.now().isoformat()
        })
        if len(self._history) > self._max_history:
            self._history = self._history[-self._max_history:]
    
    def _match_pattern(self, pattern: str, event: str) -> bool:
        """Verificar si un evento coincide con un patron (wildcards)."""
        pattern_parts = pattern.split(':')
        event_parts = event.split(':')
        
        if len(pattern_parts) != len(event_parts):
            return False
        
        for p, e in zip(pattern_parts, event_parts):
            if p != '*' and p != e:
                return False
        return True
    
    def get_history(self, limit: int = 10) -> List[dict]:
        """Obtener historial de eventos."""
        return self._history[-limit:]


class G360AppRegistry:
    """
    Registry de apps G360.
    
    Permite:
    - Registrar una app
    - Descubrir apps disponibles
    - Ver estado de salud de apps
    - Comunicacion entre apps
    """
    
    def __init__(self, registry_file: Optional[Path] = None):
        self.registry_file = registry_file or REGISTRY_FILE
        self.registry_file.parent.mkdir(parents=True, exist_ok=True)
        self._apps: Dict[str, AppMetadata] = {}
        self._load_registry()
    
    def register(self, app: AppMetadata):
        """Registrar una app en el registry."""
        app.updated_at = datetime.now().isoformat()
        self._apps[app.name] = app
        self._save_registry()
    
    def unregister(self, app_name: str):
        """Dar de baja una app."""
        if app_name in self._apps:
            del self._apps[app_name]
            self._save_registry()
    
    def get_app(self, app_name: str) -> Optional[AppMetadata]:
        """Obtener metadatos de una app."""
        return self._apps.get(app_name)
    
    def list_apps(self) -> List[AppMetadata]:
        """Listar todas las apps registradas."""
        return list(self._apps.values())
    
    def find_by_skill(self, skill: str) -> List[AppMetadata]:
        """Buscar apps por skill."""
        return [app for app in self._apps.values() if app.skill == skill]
    
    def find_by_event(self, event: str) -> List[AppMetadata]:
        """Buscar apps que manejan un evento especifico."""
        return [app for app in self._apps.values() if event in app.events]
    
    def update_status(self, app_name: str, status: str):
        """Actualizar estado de una app."""
        if app_name in self._apps:
            self._apps[app_name].status = status
            self._apps[app_name].last_seen = datetime.now().isoformat()
            self._save_registry()
    
    def _load_registry(self):
        """Cargar registry desde archivo."""
        try:
            if self.registry_file.exists():
                with open(self.registry_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self._apps = {
                        name: AppMetadata.from_dict(app_data)
                        for name, app_data in data.items()
                    }
        except Exception:
            self._apps = {}
    
    def _save_registry(self):
        """Guardar registry en archivo."""
        try:
            data = {name: app.to_dict() for name, app in self._apps.items()}
            with open(self.registry_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception:
            pass


# Instancias globales
_event_bus = None
_app_registry = None


def get_event_bus() -> G360EventBus:
    """Obtener instancia singleton del event bus."""
    global _event_bus
    if _event_bus is None:
        _event_bus = G360EventBus()
    return _event_bus


def get_app_registry() -> G360AppRegistry:
    """Obtener instancia singleton del registry."""
    global _app_registry
    if _app_registry is None:
        _app_registry = G360AppRegistry()
    return _app_registry


def register_g360_app(
    name: str,
    version: str,
    skill: str,
    framework: str = "flet",
    events: Optional[List[str]] = None,
    endpoints: Optional[Dict[str, str]] = None,
):
    """
    Registrar una app G360 en el registry global.
    
    Usage:
        register_g360_app(
            name="stock-monitor",
            version="1.0.0",
            skill="cipsa",
            events=["app:stock:refresh", "app:data:update"]
        )
    """
    registry = get_app_registry()
    app = AppMetadata(
        name=name,
        version=version,
        skill=skill,
        framework=framework,
        events=events or [],
        endpoints=endpoints or {},
        status="online",
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat(),
        last_seen=datetime.now().isoformat(),
    )
    registry.register(app)
    return app


def unsubscribe_g360_event(event_pattern: str, callback: Callable):
    """Desuscribir de un evento G360."""
    bus = get_event_bus()
    bus.unsubscribe(event_pattern, callback)


def subscribe_g360_event(event_pattern: str, callback: Callable):
    """Suscribir a un evento G360."""
    bus = get_event_bus()
    bus.subscribe(event_pattern, callback)


def publish_g360_event(event: str, data: Optional[dict] = None):
    """Publicar un evento G360."""
    bus = get_event_bus()
    bus.publish(event, data)
