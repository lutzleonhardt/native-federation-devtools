// Assembles a Chrome-loadable MV3 extension at dist/extension/ from the
// extension shell (extension/) and the Angular AOT production build.
// Pure copy — no file is modified during assembly.
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const browserOut = join(root, 'dist/devtools-ui/browser');
const extensionOut = join(root, 'dist/extension');

// baseHref "./" so the panel's assets resolve relative to panel/index.html
// on the chrome-extension:// origin.
execSync('npx ng build devtools-ui --base-href ./', { cwd: root, stdio: 'inherit' });

rmSync(extensionOut, { recursive: true, force: true });
mkdirSync(extensionOut, { recursive: true });

for (const file of ['manifest.json', 'devtools.html', 'devtools.js']) {
  cpSync(join(root, 'extension', file), join(extensionOut, file));
}

cpSync(browserOut, join(extensionOut, 'panel'), { recursive: true });

execSync(`node ${JSON.stringify(join(root, 'scripts/check-panel-bundle.mjs'))}`, {
  cwd: root,
  stdio: 'inherit',
});

console.log(`\nExtension assembled at ${extensionOut}`);
