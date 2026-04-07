import fs from 'fs-extra';
import path from 'path';

export const manifest = {
  async init(projectDir, data) {
    const manifestPath = path.join(projectDir, 'g360-manifest.json');
    const manifest = {
      name: data.name,
      template: data.template,
      version: data.version,
      createdAt: new Date().toISOString(),
      assets: []
    };
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    return manifest;
  },

  async load(projectDir) {
    const manifestPath = path.join(projectDir, 'g360-manifest.json');
    if (fs.existsSync(manifestPath)) {
      return fs.readJson(manifestPath);
    }
    return null;
  },

  async addAsset(projectDir, asset) {
    const data = await this.load(projectDir);
    if (data) {
      data.assets.push({
        ...asset,
        addedAt: new Date().toISOString()
      });
      await fs.writeJson(path.join(projectDir, 'g360-manifest.json'), data, { spaces: 2 });
    }
  },

  async remove(projectDir) {
    const manifestPath = path.join(projectDir, 'g360-manifest.json');
    if (fs.existsSync(manifestPath)) {
      await fs.remove(manifestPath);
    }
  }
};
