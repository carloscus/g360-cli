
const fs = require("fs");
let c = fs.readFileSync("src/lib/auditor.js", "utf8");
const nuevo = `
//------------------------------------------------------------------------------
// checkRuleConflicts - Detecta inconsistencias entre catálogo, setup y permisos
//------------------------------------------------------------------------------
function checkRuleConflicts(projectDir) {
  const findings = [];
  const catPath = path.join(__dirname, "../assets/config/catalog.json");
  const cat = readJsonSafe(catPath);
  
  // Reglas sin implementación (solo advertencia)
  if (cat.reglas && cat.reglas.solo_infra_y_provider_pueden_publish) {
    findings.push({
      status: "warn",
      file: "catalog.json",
      message: "Regla solo_infra_y_provider_pueden_publish declarada pero sin check implementado"
    });
  }
  
  return { status: findings.length > 0 ? "warn" : "pass", findings };
}
module.exports.checkRuleConflicts = checkRuleConflicts;
`;
c = c.replace("module.exports = {", nuevo + "module.exports = {");
fs.writeFileSync("src/lib/auditor.js", c);
console.log("Insertado");

