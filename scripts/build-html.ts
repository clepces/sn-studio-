import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Resolves modular sub-partials recursively.
 * Matches syntax like {{translation/subtab-bar}} or {{translation/workspace}}
 */
export function resolvePartials(templateText: string, currentDir: string): string {
  return templateText.replace(/\{\{([a-zA-Z0-9_\-\/]+)\}\}/g, (match, partialPath) => {
    // Top-level shell placeholders
    if (['dock', 'sidebar', 'header', 'telemetry', 'modal', 'views'].includes(partialPath)) {
      return match;
    }

    const candidateFiles = [
      path.join(currentDir, `${partialPath}.partial.html`),
      path.join(currentDir, `${partialPath}.template.html`),
      path.join(currentDir, `${partialPath}.html`),
      path.join(rootDir, 'src/frontend/templates/views', `${partialPath}.partial.html`),
      path.join(rootDir, 'src/frontend/templates/views', `${partialPath}.template.html`),
      path.join(rootDir, 'src/frontend/templates/views', `${partialPath}.html`),
      path.join(rootDir, 'src/frontend/templates', `${partialPath}.partial.html`),
      path.join(rootDir, 'src/frontend/templates', `${partialPath}.template.html`),
      path.join(rootDir, 'src/frontend/templates', `${partialPath}.html`)
    ];

    for (const cand of candidateFiles) {
      if (fs.existsSync(cand)) {
        const fileContent = fs.readFileSync(cand, 'utf-8');
        return resolvePartials(fileContent, path.dirname(cand));
      }
    }

    return match;
  });
}

export function assembleSpaHtml(): string {
  const layoutsDir = path.join(rootDir, 'src/frontend/templates/layouts');
  const viewsDir = path.join(rootDir, 'src/frontend/templates/views');

  const appShellFile = path.join(layoutsDir, 'app-shell.template.html');
  const dockFile = path.join(layoutsDir, 'dock.template.html');
  const sidebarFile = path.join(layoutsDir, 'sidebar.template.html');
  const headerFile = path.join(layoutsDir, 'header.template.html');
  const telemetryFile = path.join(layoutsDir, 'telemetry.template.html');
  const modalFile = path.join(layoutsDir, 'modal-edit.template.html');

  const dockContent = fs.existsSync(dockFile) ? resolvePartials(fs.readFileSync(dockFile, 'utf-8'), layoutsDir) : '';
  const sidebarContent = fs.existsSync(sidebarFile) ? resolvePartials(fs.readFileSync(sidebarFile, 'utf-8'), layoutsDir) : '';
  const headerContent = fs.existsSync(headerFile) ? resolvePartials(fs.readFileSync(headerFile, 'utf-8'), layoutsDir) : '';
  const telemetryContent = fs.existsSync(telemetryFile) ? resolvePartials(fs.readFileSync(telemetryFile, 'utf-8'), layoutsDir) : '';
  const modalContent = fs.existsSync(modalFile) ? resolvePartials(fs.readFileSync(modalFile, 'utf-8'), layoutsDir) : '';

  const viewNames = [
    'dashboard', 'studio', 'translation', 'mods', 'system',
    'entities', 'galaxy', 'convert', 'network', 'pipeline',
    'swarm', 'vault'
  ];

  let viewsContent = '';
  for (const v of viewNames) {
    const vPath = path.join(viewsDir, `${v}.template.html`);
    if (fs.existsSync(vPath)) {
      const rawContent = fs.readFileSync(vPath, 'utf-8');
      const resolvedView = resolvePartials(rawContent, viewsDir);
      viewsContent += `\n${resolvedView}`;
    }
  }

  let html = fs.readFileSync(appShellFile, 'utf-8');
  html = html
    .replace('{{dock}}', dockContent)
    .replace('{{sidebar}}', sidebarContent)
    .replace('{{header}}', headerContent)
    .replace('{{telemetry}}', telemetryContent)
    .replace('{{modal}}', modalContent)
    .replace('{{views}}', viewsContent);

  // Sync title and meta tags with metadata.json
  const metaTags = `
  <title>Solaris Nexus Studio</title>
  <meta name="description" content="Enterprise mod creation, localization, entity inspection, and galaxy topologist studio for Sins of a Solar Empire." />
  <meta property="og:title" content="Solaris Nexus Studio" />
  <meta property="og:description" content="Enterprise mod creation, localization, entity inspection, and galaxy topologist studio for Sins of a Solar Empire." />`;

  html = html.replace(/<title>.*?<\/title>/i, metaTags);

  return html;
}

if (process.argv[1] === __filename) {
  const html = assembleSpaHtml();
  fs.writeFileSync(path.join(rootDir, 'index.html'), html, 'utf-8');
  console.log('Successfully generated index.html at root with modular template resolution');
}
