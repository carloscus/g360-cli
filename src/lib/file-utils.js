import fs from 'fs-extra';
import path from 'path';

const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'out', '.nuxt', 'coverage', '.cache', '.svelte-kit', '__pycache__', '.pytest_cache'];

export async function getAllFiles(dir, baseDir = dir) {
  const files = [];

  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    if (IGNORE_DIRS.includes(item.name)) continue;

    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (item.isDirectory()) {
      files.push(...await getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}
