import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function signature(command, options) {
  const { path: targetPath = '.', force = false } = options;

  if (command === 'install') {
    console.log(chalk.bold.cyan('\n🔖 Instalando g360-signature\n'));

    const targetDir = path.resolve(process.cwd(), targetPath);
    const indexHtmlPath = path.join(targetDir, 'index.html');

    if (!fs.existsSync(indexHtmlPath)) {
      console.error(chalk.red('❌ No se encontro archivo index.html en el directorio actual'));
      return;
    }

    let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

    const scriptTag = '    <script type="module" src="https://unpkg.com/g360-signature@latest/index.js"></script>';
    const signatureComponent = `
    <!-- Firma Oficial G360 -->
    <g360-signature mode="powered" style="position: fixed; bottom: 16px; right: 16px; z-index: 99999;"></g360-signature>
`;

    // Si --force es true, eliminamos cualquier instancia existente para una reinstalación limpia.
    // De lo contrario, si ya está instalado y no se fuerza, salimos.
    if (force) {
      htmlContent = htmlContent.replace(new RegExp(scriptTag.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      htmlContent = htmlContent.replace(new RegExp(signatureComponent.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      htmlContent = htmlContent.replace(/\n\s*\n/g, '\n'); // Limpiar posibles líneas vacías extra
    } else if (htmlContent.includes('g360-signature')) {
      console.log(chalk.yellow('⚠️  g360-signature ya se encuentra instalado'));
      console.log(chalk.gray('Usa --force para reinstalar'));
      return;
    }

    if (!htmlContent.includes(scriptTag)) {
      htmlContent = htmlContent.replace('</body>', `${scriptTag}\n  </body>`);
    }

    if (!htmlContent.includes('<g360-signature')) {
      htmlContent = htmlContent.replace('</body>', `${signatureComponent}\n  </body>`);
    }

    fs.writeFileSync(indexHtmlPath, htmlContent, 'utf8');

    console.log(chalk.green('✅ g360-signature instalado exitosamente!'));
    console.log(chalk.gray('\nEl componente ha sido agregado en el pie de pagina de tu proyecto\n'));
  }
}