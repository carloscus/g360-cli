import json
from pathlib import Path

ACCENT = "#10B981"
ACCENT_DARK = "#047857"

DARK_COLORS = {
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
    "surface": "#141D33",
    "surface_variant": "#1B2740",
    "surface_sunken": "#0E1627",
    "background": "#0A0F1E",
    "border": "#FFFFFF17",
    "text_muted": "#8FA0BA",
    "text_primary": "#F1F5FB",
    "text_secondary": "#C9D4E6",
}

LIGHT_COLORS = {
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
    "surface": "#FFFFFF",
    "surface_variant": "#F7F9FC",
    "surface_sunken": "#EEF1F6",
    "background": "#F3F5F9",
    "border": "#E3E8F0",
    "text_muted": "#64748B",
    "text_primary": "#0F172A",
    "text_secondary": "#334155",
}


def get_colors(mode: str) -> dict:
    return dict(DARK_COLORS if mode == "dark" else LIGHT_COLORS)


def rgba(color: str, opacity: float) -> str:
    if color.startswith("#") and len(color) == 9:
        return color
    if color.startswith("#") and len(color) == 7:
        hex_color = color[1:]
        alpha = int(max(0.0, min(1.0, opacity)) * 255)
        return f"#{alpha:02x}{hex_color}"
    return color


def get_theme_file() -> Path:
    return Path.home() / ".g360" / f"{_get_app_name()}_config.json"


def _get_app_name() -> str:
    try:
        from pathlib import Path as _P
        _root = _P(__file__).resolve().parent.parent.parent.parent
        _skill = _root / "skill.json"
        if _skill.exists():
            with open(_skill, encoding="utf-8") as _f:
                _data = json.load(_f)
                return _data.get("name", "g360-app").replace("-", "_")
    except Exception:
        pass
    return "g360_app"


def load_theme_preference() -> str:
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
    try:
        config_file = get_theme_file()
        config_file.parent.mkdir(parents=True, exist_ok=True)
        config = {"theme_mode": mode}
        with open(config_file, "w", encoding="utf-8") as f:
            json.dump(config, f)
    except Exception:
        pass
