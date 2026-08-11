#!/usr/bin/env node
/**
 * Launcher for the TypeScript fixture deriver (scripts/derive-fixtures.ts).
 *
 * The derivation imports the real collector pipeline (probe sources +
 * mapper), which is TypeScript with extensionless imports — Node cannot
 * load that directly, so this bundles the entry with esbuild (a transitive
 * devDependency via @angular/build and vitest) into a temp file and runs
 * it. Run manually from the repo root — the generated fixtures are
 * committed as static files and never rewritten at build time:
 *
 *   node scripts/derive-fixtures.mjs
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const result = await build({
  entryPoints: [fileURLToPath(new URL('./derive-fixtures.ts', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
  logLevel: 'silent',
});

const directory = mkdtempSync(join(tmpdir(), 'derive-fixtures-'));
try {
  const bundle = join(directory, 'derive-fixtures.bundle.mjs');
  writeFileSync(bundle, result.outputFiles[0].text);
  const { deriveFixtures } = await import(pathToFileURL(bundle).href);
  deriveFixtures();
} finally {
  rmSync(directory, { recursive: true, force: true });
}
