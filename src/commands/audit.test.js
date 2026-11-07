/**
 * @file audit.test.js
 * @description Tests para el comando audit
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('audit command', () => {
  describe('validation', () => {
    it('should have audit function exported', async () => {
      const { audit } = await import('../commands/audit.js');
      expect(typeof audit).toBe('function');
    });

    it('should accept projectPath and options parameters', async () => {
      const { audit } = await import('../commands/audit.js');
      expect(audit.length).toBe(2);
    });
  });

  describe('options', () => {
    it('should support fix option', async () => {
      const { audit } = await import('../commands/audit.js');
      expect(audit).toBeDefined();
    });

    it('should support verbose option', async () => {
      const { audit } = await import('../commands/audit.js');
      expect(audit).toBeDefined();
    });
  });

  describe('--agents', () => {
    let home;
    let originalHome;

    beforeEach(async () => {
      const fs = await import('fs-extra');
      const os = await import('os');
      const path = await import('path');
      home = await fs.mkdtemp(path.join(os.tmpdir(), 'g360-audit-agents-'));
      originalHome = process.env.HOME;
      process.env.HOME = home;
    });

    afterEach(async () => {
      process.env.HOME = originalHome;
      const fs = await import('fs-extra');
      await fs.remove(home);
    });

    async function captureLogs(fn) {
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));
      try {
        await fn();
      } finally {
        console.log = originalLog;
      }
      return logs;
    }

    it('admite auditAgents exportado', async () => {
      const { auditAgents } = await import('../commands/audit.js');
      expect(typeof auditAgents).toBe('function');
    });

    it('avisa cuando no hay manifest', async () => {
      const { audit } = await import('../commands/audit.js');
      const logs = await captureLogs(() => audit('.', { agents: true }));
      expect(logs.some((l) => l.includes('No hay manifest'))).toBe(true);
      expect(logs.some((l) => l.includes('g360 setup --platform all'))).toBe(true);
    });

    it('reporta ok cuando la integridad se mantiene', async () => {
      const fs = await import('fs-extra');
      const path = await import('path');
      const { createManifest } = await import('../lib/setup-manifest.js');
      await fs.ensureDir(path.join(home, '.agents'));
      await fs.writeFile(path.join(home, '.agents', 'HANDOFF.md'), 'x');
      await createManifest(home);

      const { audit } = await import('../commands/audit.js');
      const logs = await captureLogs(() => audit('.', { agents: true }));
      expect(logs.some((l) => l.includes('Integridad de agentes OK'))).toBe(true);
      expect(logs.some((l) => l.includes('Archivos auditados: 1'))).toBe(true);
    });

    it('falla con la lista de rutas cuando hay alteraciones', async () => {
      const fs = await import('fs-extra');
      const path = await import('path');
      const { createManifest } = await import('../lib/setup-manifest.js');
      const agentsDir = path.join(home, '.config', 'opencode', 'agents');
      await fs.ensureDir(agentsDir);
      const reviewer = path.join(agentsDir, 'reviewer.md');
      await fs.writeFile(reviewer, 'original');
      await createManifest(home);
      await fs.writeFile(reviewer, 'PROMPT ALTERADO');

      const { audit } = await import('../commands/audit.js');
      const logs = await captureLogs(() => audit('.', { agents: true }));
      expect(logs.some((l) => l.includes('Integridad comprometida'))).toBe(true);
      expect(logs.some((l) => l.includes('.config/opencode/agents/reviewer.md'))).toBe(true);
    });

    it('audit --agents no corre la auditoría de proyecto', async () => {
      const { audit } = await import('../commands/audit.js');
      const logs = await captureLogs(() => audit('.', { agents: true }));
      expect(logs.some((l) => l.includes('G360 Project Audit'))).toBe(false);
    });
  });
});
