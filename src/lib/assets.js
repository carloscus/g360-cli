import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const assets = {
  path: path.join(__dirname, '../assets'),

  exists(assetPath) {
    return fs.existsSync(path.join(this.path, assetPath));
  },

  async copy(assetPath, destPath, options = {}) {
    const { overwrite = false } = options;
    const src = path.join(this.path, assetPath);
    const dest = path.join(destPath, path.basename(assetPath));

    if (!this.exists(assetPath)) {
      throw new Error(`Asset not found: ${assetPath}`);
    }

    if (fs.existsSync(dest) && !overwrite) {
      throw new Error(`Destination already exists: ${dest}`);
    }

    await fs.copy(src, dest, { overwrite });
    return dest;
  },

  list(category) {
    const categoryPath = path.join(this.path, category);
    if (!fs.existsSync(categoryPath)) {
      return [];
    }
    return fs.readdirSync(categoryPath);
  }
};
