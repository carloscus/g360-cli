# g360-cli

CLI tool for bootstrapping G360 ecosystem projects with standardized structure.

## Quick Start

```bash
# Initialize a new project
g360 init my-project

# Bring G360 assets into your project
g360 bring

# List available templates
g360 list templates

# Present your project structure
g360 present

# Audit your project
g360 audit

# Clean embedded assets before deployment
g360 clean

# Check system health
g360 health

# Update to latest version
g360 update
```

## Commands

- `g360 init <name>` - Initialize a new G360 project
- `g360 bring <asset>` - Bring assets into current project
- `g360 list [type]` - List available templates/components/skills
- `g360 present [path]` - Present project structure
- `g360 audit [path]` - Audit project for G360 compliance
- `g360 clean [path]` - Clean embedded assets
- `g360 health` - Check system health
- `g360 update` - Update g360-cli to latest version

## Options

- `--dry-run` - Preview changes without applying
- `--force` - Overwrite existing files
- `--verbose` - Verbose output
- `--offline` - Work offline (use cached assets)

## License

MIT
