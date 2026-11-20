import { describe, it, expect } from 'vitest';
import { g360CorePath } from './python-runner.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('g360CorePath — resolución de ruta py/src', () => {
  it('desde src/commands (escenario repositorio) apunta a py/src del paquete', () => {
    // Simula: comando instalado en node_modules/g360-cli/src/commands
    const simulatedCmdDir = path.resolve(__dirname, '..', '..', 'src', 'commands');
    const result = g360CorePath(simulatedCmdDir);
    
    // Debe contener la ruta absoluta a py/src
    const expectedPath = path.resolve(__dirname, '..', '..', 'py', 'src').replace(/\\/g, '\\\\');
    expect(result).toContain(expectedPath);
    expect(result).toContain('sys.path.insert');
  });

  it('desde una ruta simulada de npm install genera ruta correcta', () => {
    // Simula la estructura tras npm install: node_modules/g360-cli/src/commands
    const simulatedNpmDir = path.join(__dirname, 'tmp-sim-npm', 'node_modules', 'g360-cli', 'src', 'commands');
    
    const result = g360CorePath(simulatedNpmDir);
    
    // La ruta debe subir DOS niveles desde commands para alcanzar el package root
    const expectedFromNpm = path.join(simulatedNpmDir, '..', '..', 'py', 'src')
      .replace(/\\/g, '\\\\');
    expect(result).toContain(expectedFromNpm);
  });

  it('el camino calculado existe físicamente cuando se ejecuta desde el repo', () => {
    const cmdDir = path.resolve(__dirname, '..', 'commands');
    const result = g360CorePath(cmdDir);
    
    // Extraer la ruta del string generado
    const match = result.match(/sys\.path\.insert\(0,\s*'([^']+)'\)/);
    expect(match).not.toBeNull();
    const extractedPath = match[1].replace(/\\\\/g, '\\');
    expect(fs.existsSync(extractedPath)).toBe(true);
  });
});
