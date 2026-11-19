import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ingest } from './ingest.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock de python-runner para no depender de Python en los tests
vi.mock('../lib/python-runner.js', () => ({
  runPython: vi.fn(() => Promise.resolve({ stdout: '', stderr: '' })),
  runPythonStdout: vi.fn(() => Promise.resolve('')),
  g360CorePath: vi.fn(() => 'import sys\nsys.path.insert(0, \'./py/src\')'),
}));

import { runPython } from '../lib/python-runner.js';

const logs = [];
const originalLog = console.log;
const originalError = console.error;
const originalExit = process.exit;

beforeEach(() => {
  logs.length = 0;
  console.log = (...args) => logs.push(args.join(' '));
  console.error = (...args) => logs.push(args.join(' '));
  process.exit = vi.fn(() => {
    throw new Error('process.exit called');
  });
  vi.clearAllMocks();
});

afterEach(() => {
  console.log = originalLog;
  console.error = originalError;
  process.exit = originalExit;
});

const captureExit = async (fn) => {
  try {
    await fn();
    return { exited: false, code: null };
  } catch (e) {
    if (e.message === 'process.exit called') {
      const call = process.exit.mock.calls[process.exit.mock.calls.length - 1];
      return { exited: true, code: call ? call[0] : 1 };
    }
    throw e;
  }
};

describe('ingest command', () => {
  it('exporta una función ingest', async () => {
    const mod = await import('./ingest.js');
    expect(mod).toHaveProperty('ingest');
    expect(typeof mod.ingest).toBe('function');
  });

  it('maneja archivo que no existe (exit code 1)', async () => {
    const result = await captureExit(() => ingest('no-existe.csv', {}));
    expect(result.exited).toBe(true);
    expect(result.code).toBe(1);
    expect(logs.some(l => l.includes('Ruta no encontrada'))).toBe(true);
  });

  it('soporta flag --dry-run (solo anuncia, no escribe)', async () => {
    const tmpFile = path.join(__dirname, '__tmp_ingest_dryrun.csv');
    await fs.writeFile(tmpFile, 'col1,col2\n1,2\n', 'utf8');

    await ingest(tmpFile, { dryRun: true, output: path.join(__dirname, '__tmp_out.csv') });

    expect(logs.join('\n')).toContain('Iniciando ingesta');
    // dry-run no debe escribir archivo de salida (mock de runPython no genera stdout real)
    await fs.remove(tmpFile);
  });

  it('detecta encoding UTF-8 vs latin1 en el contenido leído', async () => {
    const tmpFile = path.join(__dirname, '__tmp_ingest_encoding.csv');
    const utf8Content = 'nombre,valor\ncafé,1\n';
    await fs.writeFile(tmpFile, utf8Content, 'utf8');

    const readBack = fs.readFileSync(tmpFile, 'utf8');
    expect(readBack).toContain('café');

    const latin1Buf = Buffer.from('nombre,valor\ncaf\xE9,1\n', 'latin1');
    const latin1File = path.join(__dirname, '__tmp_ingest_latin1.csv');
    await fs.writeFile(latin1File, latin1Buf, { encoding: 'binary' });

    const latin1Read = fs.readFileSync(latin1File, 'latin1');
    expect(latin1Read).toContain('café');

    await fs.remove(tmpFile);
    await fs.remove(latin1File);
  });

  it('procesa un archivo CSV válido (mock runPython)', async () => {
    const tmpFile = path.join(__dirname, '__tmp_ingest_valid.csv');
    await fs.writeFile(tmpFile, 'col1,col2\n1,2\n', 'utf8');

    vi.mocked(runPython).mockResolvedValueOnce({ stdout: 'col1,col2\n1,2\n', stderr: '' });

    const outFile = path.join(__dirname, '__tmp_ingest_out.csv');
    await ingest(tmpFile, { output: outFile });

    expect(runPython).toHaveBeenCalled();
    expect(fs.existsSync(outFile)).toBe(true);
    const content = fs.readFileSync(outFile, 'utf8');
    expect(content).toContain('col1,col2');

    await fs.remove(tmpFile);
    await fs.remove(outFile);
  });
});
