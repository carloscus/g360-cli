/**
 * @file adversary-reporter.js
 * @description Helper que formatea los hallazgos del agente adversary para su
 * reporte pre-implementación. Puro: sin efectos de red ni de disco, por lo que
 * se testa sin mocks.
 */

/**
 * Formatea una lista de hallazgos adversariales en markdown.
 *
 * Cada hallazgo se numera como ADV-001, ADV-002... e incluye título, severidad,
 * ubicación, problema y consecuencia.
 *
 * @param {Array<{title: string, severity: string, location: string, problem: string, consequence: string}>} findings
 * @returns {string} Markdown con todos los hallazgos, o cadena vacía si no hay ninguno.
 */
export function formatFindings(findings) {
  return findings.map((f, i) =>
    `### ADV-${String(i + 1).padStart(3, '0')} ${f.title}\n\n- **Severidad:** ${f.severity}\n- **Ubicación:** ${f.location}\n- **Problema:** ${f.problem}\n- **Consecuencia:** ${f.consequence}\n`
  ).join('\n');
}

/**
 * Crea un reporte estructurado de revisión adversarial.
 *
 * @param {string} specPath - Ruta al archivo de especificación revisado.
 * @param {Array} findings - Lista de hallazgos encontrados.
 * @returns {{timestamp: string, spec: string, total_findings: number, critical: number, major: number, minor: number, findings: Array}} Reporte JSON-serializable.
 */
export function createReport(specPath, findings) {
  return {
    timestamp: new Date().toISOString(),
    spec: specPath,
    total_findings: findings.length,
    critical: findings.filter((f) => f.severity === 'CRÍTICO').length,
    major: findings.filter((f) => f.severity === 'MAYOR').length,
    minor: findings.filter((f) => f.severity === 'MENOR').length,
    findings,
  };
}
