import fs from 'fs-extra';
import path from 'path';

export const offline = {
  cache: new Map(),
  cacheDir: '.g360-cache',

  async isAvailable() {
    return true;
  },

  async getCached(asset) {
    return this.cache.get(asset);
  },

  async setCache(asset, data) {
    this.cache.set(asset, data);
  },

  async loadFromCache(asset) {
    const cachePath = path.join(this.cacheDir, `${asset}.json`);
    if (fs.existsSync(cachePath)) {
      return fs.readJson(cachePath);
    }
    return null;
  },

  async saveToCache(asset, data) {
    const cachePath = path.join(this.cacheDir, `${asset}.json`);
    await fs.ensureDir(this.cacheDir);
    await fs.writeJson(cachePath, data);
  }
};
