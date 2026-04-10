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

    // Verificar si ya esta instalado
    if (htmlContent.includes('g360-signature') && !force) {
      console.log(chalk.yellow('⚠️  g360-signature ya se encuentra instalado'));
      console.log(chalk.gray('Usa --force para reinstalar'));
      return;
    }

    // Agregar script CDN antes del cierre del body
    const scriptTag = '    <script type="module" src="https://unpkg.com/g360-signature@latest/index.js"></script>';
    const signatureComponent = `
    <!-- Firma Oficial G360 -->
    <g360-signature mode="powered" style="position: fixed; bottom: 16px; right: 16px; z-index: 99999;"></g360-signature>
`;

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