import fs from 'fs-extra';

export const validator = {
  isValidProjectName(name) {
    return /^[a-z0-9][a-z0-9-]*$/.test(name);
  },

  isValidPath(path) {
    try {
      return fs.existsSync(path);
    } catch {
      return false;
    }
  },

  validateProject(projectDir) {
    const errors = [];
    const warnings = [];

    if (!fs.existsSync(projectDir)) {
      errors.push('Project directory does not exist');
      return { valid: false, errors, warnings };
    }

    const manifestPath = `${projectDir}/g360-manifest.json`;
    if (!fs.existsSync(manifestPath)) {
      warnings.push('No g360-manifest.json found');
    }

    const g360Dir = `${projectDir}/g360`;
    if (!fs.existsSync(g360Dir)) {
      warnings.push('No g360 directory found');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
};
