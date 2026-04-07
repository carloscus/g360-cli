import fs from 'fs-extra';
import path from 'path';

export const rollback = {
  history: new Map(),

  async snapshot(projectDir, label) {
    const snapshot = {
      timestamp: new Date().toISOString(),
      label,
      files: []
    };

    const g360Dir = path.join(projectDir, 'g360');
    if (fs.existsSync(g360Dir)) {
      const files = fs.readdirSync(g360Dir, { recursive: true, withFileTypes: true });
      snapshot.files = files.map(f => ({
        path: f.fullPath || path.join(g360Dir, f.name),
        type: f.isDirectory() ? 'dir' : 'file'
      }));
    }

    this.history.set(projectDir, snapshot);
    return snapshot;
  },

  async restore(projectDir) {
    const snapshot = this.history.get(projectDir);
    if (!snapshot) {
      throw new Error('No snapshot found for this project');
    }

    const g360Dir = path.join(projectDir, 'g360');
    
    if (fs.existsSync(g360Dir)) {
      await fs.remove(g360Dir);
    }

    for (const file of snapshot.files) {
      if (file.type === 'dir') {
        await fs.ensureDir(file.path);
      } else {
        await fs.ensureFile(file.path);
      }
    }

    return snapshot;
  }
};
