import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SIGNATURE_ASSETS = path.join(__dirname, '..', 'assets', 'signature');

const VALID_COMMANDS = ['install', 'positions'];

const POSITIONS = {
  'bottom-right': 'position: fixed; bottom: 16px; right: 16px; z-index: 99999;',
  'bottom-left': 'position: fixed; bottom: 16px; left: 16px; z-index: 99999;',
  'bottom-center': 'position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 99999;',
  'footer-right': 'position: static; float: right;',
  'footer-left': 'position: static; float: left;',
};

const FLET_POSITIONS = {
  'sidebar': 'En el sidebar como footer',
  'footer': 'En el footer de la pagina',
  'fixed-bottom': 'Fijo abajo a la derecha',
  'header': 'En el header/cabecera',
};

export async function signature(command, options) {
  // Validacion del comando
  if (!VALID_COMMANDS.includes(command)) {
    console.error(chalk.red(`❌ Comando invalido: "${command}"`));
    console.log(chalk.gray('Comandos disponibles:'));
    console.log(chalk.gray('  install   - Instalar g360-signature en un proyecto'));
    console.log(chalk.gray('  positions - Mostrar posiciones disponibles'));
    console.log(chalk.gray('\nEjemplo:'));
    console.log(chalk.gray('  g360 signature install'));
    console.log(chalk.gray('  g360 signature positions'));
    return;
  }

  const {
    path: targetPath = '.',
    force = false,
    mode = 'powered',
    version = null,
    position = 'bottom-right',
    interactive = false,
  } = options;

  if (command === 'install') {
    console.log(chalk.bold.cyan('\n🔖 Instalando g360-signature\n'));

    const targetDir = path.resolve(process.cwd(), targetPath);
    const projectType = detectProjectType(targetDir);

    if (!projectType) {
      console.error(chalk.red('❌ No se detecto un proyecto web o Flet en el directorio actual'));
      console.log(chalk.gray('Proyectos soportados: web (HTML), Flet (Python)'));
      return;
    }

    // Modo interactivo: guiar al usuario con inquirer
    let resolvedPosition = position;
    let resolvedMode = mode;

    if (interactive) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'mode',
          message: 'Selecciona el modo de la firma:',
          choices: [
            { name: 'Powered by G360 (recomendado)', value: 'powered' },
            { name: 'Own (G360 by ccusi)', value: 'own' },
          ],
          default: 'powered',
        },
        {
          type: 'list',
          name: 'position',
          message: 'Selecciona la posicion de la firma:',
          choices: projectType === 'flet'
            ? Object.entries(FLET_POSITIONS).map(([key, desc]) => ({ name: `${key}: ${desc}`, value: key }))
            : Object.entries(POSITIONS).map(([key, desc]) => ({ name: `${key}: ${desc}`, value: key })),
          default: 'bottom-right',
        },
      ]);

      resolvedMode = answers.mode;
      resolvedPosition = answers.position;
    }

    if (projectType === 'flet') {
      await installFlet(targetDir, { force, mode: resolvedMode, version, position: resolvedPosition });
    } else if (projectType === 'web') {
      await installWeb(targetDir, { force, mode: resolvedMode, version, position: resolvedPosition });
    }

    console.log(chalk.green('\n✅ g360-signature instalado exitosamente!'));
    showUsageTips(projectType, resolvedPosition);
  }

  if (command === 'positions') {
    showPositions();
  }
}

function detectProjectType(dir) {
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
  const indexHtml = path.join(dir, 'index.html');
  if (fs.existsSync(indexHtml)) return 'web';
  return null;
}

function showPositions() {
  console.log(chalk.bold.cyan('\n📍 Posiciones disponibles para Web:\n'));
  Object.entries(POSITIONS).forEach(([key, value]) => {
    console.log(chalk.white(`  ${key.padEnd(18)} ${chalk.gray(value)}`));
  });

  console.log(chalk.bold.cyan('\n📍 Posiciones disponibles para Flet:\n'));
  Object.entries(FLET_POSITIONS).forEach(([key, value]) => {
    console.log(chalk.white(`  ${key.padEnd(18)} ${chalk.gray(value)}`));
  });

  console.log(chalk.gray('\nEjemplo: g360 signature install --position bottom-left\n'));
}

function showUsageTips(projectType, position) {
  console.log(chalk.bold.cyan('\n💡 Tips de uso:\n'));

  if (projectType === 'web') {
    console.log(chalk.white('  Web Component:'));
    console.log(chalk.gray('    <g360-signature mode="powered"></g360-signature>'));
    console.log(chalk.gray('    <g360-signature mode="own" version="1.0"></g360-signature>\n'));
  } else {
    console.log(chalk.white('  Flet Widget:'));
    console.log(chalk.gray('    from core.components.g360_signature import G360Signature, g360_footer'));
    console.log(chalk.gray('    page.add(g360_footer(version="1.0"))'));
    console.log(chalk.gray('    page.add(G360Signature(mode="own"))\n'));
  }

  console.log(chalk.white('  Cambiar posicion:'));
  console.log(chalk.gray('    g360 signature install --position bottom-left\n'));

  console.log(chalk.white('  Ver todas las posiciones:'));
  console.log(chalk.gray('    g360 signature positions\n'));
}

async function installWeb(targetDir, { force, mode, version, position }) {
  console.log(chalk.gray('Detectado: Proyecto Web'));

  const indexHtmlPath = path.join(targetDir, 'index.html');
  let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

  const hasLocalIndex = fs.existsSync(path.join(targetDir, 'g360-signature', 'index.js'));
  const scriptSrc = hasLocalIndex
    ? '    <script src="g360-signature/index.js"></script>'
    : '    <script src="https://unpkg.com/g360-signature@latest/index.js"></script>';

  const versionAttr = version ? ` version="${version}"` : '';
  const positionStyle = POSITIONS[position] || POSITIONS['bottom-right'];

  const signatureComponent = `
    <!-- Firma Oficial G360 -->
    <g360-signature mode="${mode}"${versionAttr} style="${positionStyle}"></g360-signature>
`;

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

  if (!hasLocalIndex) {
    const sigDir = path.join(targetDir, 'g360-signature');
    fs.copySync(SIGNATURE_ASSETS, sigDir);
    console.log(chalk.gray('  Archivos copiados a g360-signature/'));
  }

  if (!htmlContent.includes('g360-signature/index.js') && !htmlContent.includes('unpkg.com/g360-signature')) {
    htmlContent = htmlContent.replace('</body>', `${scriptSrc}\n  </body>`);
  }
  if (!htmlContent.includes('<g360-signature')) {
    htmlContent = htmlContent.replace('</body>', `${signatureComponent}\n  </body>`);
  }

  fs.writeFileSync(indexHtmlPath, htmlContent, 'utf8');
  console.log(chalk.gray('  index.html actualizado'));
}

async function installFlet(targetDir, { force, mode, version, position }) {
  console.log(chalk.gray('Detectado: Proyecto Flet'));

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

  const widgetSrc = path.join(SIGNATURE_ASSETS, 'g360_flet', 'g360_signature.py');
  fs.copySync(widgetSrc, widgetDest);
  console.log(chalk.gray('  Widget copiado a src/core/components/g360_signature.py'));

  const initPath = path.join(fletDestDir, '__init__.py');
  if (!fs.existsSync(initPath)) {
    fs.writeFileSync(initPath, '', 'utf8');
  }

  // Insertar en main.py
  const mainPyPath = path.join(targetDir, 'src', 'main.py');
  if (fs.existsSync(mainPyPath)) {
    let mainContent = fs.readFileSync(mainPyPath, 'utf8');

    const importLine = 'from core.components.g360_signature import G360Signature, g360_footer';
    const versionAttr = version ? `, version="${version}"` : '';

    // Codigo de insercion segun posicion
    let footerCode;
    switch (position) {
      case 'sidebar':
        footerCode = `\n    # Firma G360 en sidebar\n    sidebar.controls.append(g360_footer(${versionAttr.trim() ? versionAttr : ''}))\n`;
        break;
      case 'header':
        footerCode = `\n    # Firma G360 en header\n    header.controls.append(G360Signature(mode="${mode}"${versionAttr}))\n`;
        break;
      case 'fixed-bottom':
        footerCode = `\n    # Firma G360 fija abajo\n    page.overlay.append(G360Signature(mode="${mode}"${versionAttr}))\n`;
        break;
      default: // footer
        footerCode = `\n    # Firma G360\n    page.add(g360_footer(${versionAttr.trim() ? versionAttr : ''}))\n`;
    }

    if (!mainContent.includes('from core.components.g360_signature')) {
      // Intentar agregar import despues de otros imports de core
      const importRegex = /(from\s+core\.\w+.*\n)/;
      if (importRegex.test(mainContent)) {
        mainContent = mainContent.replace(importRegex, `$1${importLine}\n`);
      } else {
        // Si no hay imports de core, agregar despues del ultimo import
        const lastImport = mainContent.lastIndexOf('import ');
        if (lastImport !== -1) {
          const endOfLine = mainContent.indexOf('\n', lastImport);
          if (endOfLine !== -1) {
            mainContent = mainContent.slice(0, endOfLine + 1) + importLine + '\n' + mainContent.slice(endOfLine + 1);
          } else {
            mainContent = mainContent + '\n' + importLine + '\n';
          }
        } else {
          // Si no hay imports, agregar al inicio
          mainContent = importLine + '\n\n' + mainContent;
        }
      }
    }

    if (!mainContent.includes('g360_footer()') && !mainContent.includes('G360Signature')) {
      if (mainContent.includes('page.add')) {
        const lastAdd = mainContent.lastIndexOf('page.add');
        const endOfLine = mainContent.indexOf('\n', lastAdd);
        mainContent = mainContent.slice(0, endOfLine + 1) + footerCode + mainContent.slice(endOfLine + 1);
      } else {
        mainContent += footerCode;
      }
    }

    fs.writeFileSync(mainPyPath, mainContent, 'utf8');
    console.log(chalk.gray('  main.py actualizado'));
  }
}
