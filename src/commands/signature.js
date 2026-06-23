import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SIGNATURE_ASSETS = path.join(__dirname, '..', 'assets', 'signature');

export async function signature(command, options) {
  const { path: targetPath = '.', force = false, mode = 'powered', version = null } = options;

  if (command === 'install') {
    console.log(chalk.bold.cyan('\n🔖 Instalando g360-signature\n'));

    const targetDir = path.resolve(process.cwd(), targetPath);
    const projectType = detectProjectType(targetDir);

    if (projectType === 'flet') {
      await installFlet(targetDir, { force, mode, version });
    } else if (projectType === 'web') {
      await installWeb(targetDir, { force, mode, version });
    } else {
      console.error(chalk.red('❌ No se detecto un proyecto web o Flet en el directorio actual'));
      console.log(chalk.gray('Proyectos soportados: web (HTML), Flet (Python)'));
      return;
    }

    console.log(chalk.green('\n✅ g360-signature instalado exitosamente!'));
  }
}

function detectProjectType(dir) {
  // Flet: tiene pyproject.toml con flet o src/main.py
  const pyprojectPath = path.join(dir, 'pyproject.toml');
  if (fs.existsSync(pyprojectPath)) {
    const content = fs.readFileSync(pyprojectPath, 'utf8');
    if (content.includes('flet')) return 'flet';
  }
  const mainPy = path.join(dir, 'src', 'main.py');
  if (fs.existsSync(mainPy)) {
    const content = fs.readFileSync(mainPy, 'utf8');
    if (content.includes('flet')) return 'flet';
  }

  // Web: tiene index.html
  const indexHtml = path.join(dir, 'index.html');
  if (fs.existsSync(indexHtml)) return 'web';

  return null;
}

async function installWeb(targetDir, { force, mode, version }) {
  console.log(chalk.gray('Detectado: Proyecto Web'));

  const indexHtmlPath = path.join(targetDir, 'index.html');
  let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

  // Script tag: usar version local si existe, sino CDN
  const hasLocalIndex = fs.existsSync(path.join(targetDir, 'g360-signature', 'index.js'));
  const scriptSrc = hasLocalIndex
    ? '    <script src="g360-signature/index.js"></script>'
    : '    <script src="https://unpkg.com/g360-signature@latest/index.js"></script>';

  const versionAttr = version ? ` version="${version}"` : '';
  const signatureComponent = `
    <!-- Firma Oficial G360 -->
    <g360-signature mode="${mode}"${versionAttr} style="position: fixed; bottom: 16px; right: 16px; z-index: 99999;"></g360-signature>
`;

  // Si --force, eliminar existente
  if (force) {
    htmlContent = htmlContent.replace(/\n.*g360-signature.*\n/g, '\n');
    htmlContent = htmlContent.replace(/<script[^>]*unpkg\.com\/g360-signature[^>]*><\/script>/g, '');
    htmlContent = htmlContent.replace(/<script[^>]*g360-signature\/index\.js[^>]*><\/script>/g, '');
    htmlContent = htmlContent.replace(/\n\s*\n/g, '\n');
  } else if (htmlContent.includes('g360-signature')) {
    console.log(chalk.yellow('⚠️  g360-signature ya se encuentra instalado'));
    console.log(chalk.gray('Usa --force para reinstalar'));
    return;
  }

  // Copiar archivos locales si no existen
  if (!hasLocalIndex) {
    const sigDir = path.join(targetDir, 'g360-signature');
    fs.copySync(SIGNATURE_ASSETS, sigDir);
    console.log(chalk.gray('  Archivos copiados a g360-signature/'));
  }

  // Inyectar en HTML
  if (!htmlContent.includes('g360-signature/index.js') && !htmlContent.includes('unpkg.com/g360-signature')) {
    htmlContent = htmlContent.replace('</body>', `${scriptSrc}\n  </body>`);
  }
  if (!htmlContent.includes('<g360-signature')) {
    htmlContent = htmlContent.replace('</body>', `${signatureComponent}\n  </body>`);
  }

  fs.writeFileSync(indexHtmlPath, htmlContent, 'utf8');
  console.log(chalk.gray('  index.html actualizado'));
}

async function installFlet(targetDir, { force, mode, version }) {
  console.log(chalk.gray('Detectado: Proyecto Flet'));

  // Determinar destino del widget
  const fletDestDir = path.join(targetDir, 'src', 'core', 'components');
  if (!fs.existsSync(fletDestDir)) {
    fs.mkdirSync(fletDestDir, { recursive: true });
  }

  const widgetDest = path.join(fletDestDir, 'g360_signature.py');

  if (fs.existsSync(widgetDest) && !force) {
    console.log(chalk.yellow('⚠️  g360-signature ya se encuentra instalado'));
    console.log(chalk.gray('Usa --force para reinstalar'));
    return;
  }

  // Copiar widget
  const widgetSrc = path.join(SIGNATURE_ASSETS, 'g360_flet', 'g360_signature.py');
  fs.copySync(widgetSrc, widgetDest);
  console.log(chalk.gray('  Widget copiado a src/core/components/g360_signature.py'));

  // Crear __init__.py si no existe
  const initPath = path.join(fletDestDir, '__init__.py');
  if (!fs.existsSync(initPath)) {
    fs.writeFileSync(initPath, '', 'utf8');
  }

  // Inyectar en main.py si existe
  const mainPyPath = path.join(targetDir, 'src', 'main.py');
  if (fs.existsSync(mainPyPath)) {
    let mainContent = fs.readFileSync(mainPyPath, 'utf8');

    const importLine = 'from core.components.g360_signature import G360Signature, g360_footer';
    const versionAttr = version ? `, version="${version}"` : '';
    const footerCode = `\n    # Firma G360\n    page.add(g360_footer(${versionAttr.trim() ? versionAttr : ''}))\n`;

    if (!mainContent.includes('g360_signature')) {
      // Agregar import despues de otros imports
      mainContent = mainContent.replace(
        /(from\s+core\.\w+.*\n)/,
        `$1${importLine}\n`
      );

      // Agregar footer antes del ultimo page.add o al final
      if (mainContent.includes('page.add')) {
        const lastAdd = mainContent.lastIndexOf('page.add');
        const endOfLine = mainContent.indexOf('\n', lastAdd);
        mainContent = mainContent.slice(0, endOfLine + 1) + footerCode + mainContent.slice(endOfLine + 1);
      } else {
        mainContent += footerCode;
      }

      fs.writeFileSync(mainPyPath, mainContent, 'utf8');
      console.log(chalk.gray('  main.py actualizado con footer G360'));
    }
  }

  console.log(chalk.gray('\nUso en tu codigo:'));
  console.log(chalk.white('  from core.components.g360_signature import G360Signature, g360_footer'));
  console.log(chalk.white('  page.add(g360_footer(version="1.0"))'));
}
