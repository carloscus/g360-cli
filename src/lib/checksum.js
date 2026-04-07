import fs from 'fs-extra';
import crypto from 'crypto';

export const checksum = {
  async calculate(filePath) {
    const content = await fs.readFile(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  },

  async verify(filePath, expectedHash) {
    const actualHash = await this.calculate(filePath);
    return actualHash === expectedHash;
  },

  async generateManifest(dir, files = []) {
    const manifest = {};
    
    for (const file of files) {
      const filePath = `${dir}/${file}`;
      if (fs.existsSync(filePath)) {
        manifest[file] = await this.calculate(filePath);
      }
    }
    
    return manifest;
  }
};
