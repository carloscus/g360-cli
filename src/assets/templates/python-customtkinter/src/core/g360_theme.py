import json
from pathlib import Path


class G360Theme:
    def __init__(self, skill_path=None):
        self._search_paths(skill_path)
        self._load_colors()

    def _search_paths(self, skill_path):
        if skill_path and Path(skill_path).exists():
            self.config_path = Path(skill_path)
            return
        candidates = [
            Path("skill.json"),
            Path("src/core/skill.json"),
            Path(__file__).resolve().parent.parent.parent / "skill.json",
            Path(__file__).resolve().parent / "skill.json",
        ]
        for c in candidates:
            if c.exists():
                self.config_path = c
                return
        raise FileNotFoundError("skill.json not found")

    def _load_colors(self):
        with open(self.config_path, encoding="utf-8") as f:
            config = json.load(f)
        colors = config.get("colors", {})
        self.bg = colors.get("bg", "#0b1220")
        self.surface = colors.get("surface", "#1a2332")
        self.accent = colors.get("accent", "#00d084")
        self.text = colors.get("text", "#f0f4f8")
        self.muted = colors.get("muted", "#94a3b8")
        self.success = colors.get("success", "#22c55e")
        self.warning = colors.get("warning", "#f59e0b")
        self.error = colors.get("error", "#ef4444")

    def apply_ctk(self):
        import customtkinter as ctk
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("green")

    def build_name(self):
        build_cfg = self.config.get("build", {})
        return build_cfg.get("name", "G360-App")

    @property
    def as_dict(self):
        return {
            "bg": self.bg,
            "surface": self.surface,
            "accent": self.accent,
            "text": self.text,
            "muted": self.muted,
        }
