import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findChromeReferences } from './bridge-boundary';

const ROOT = join(__dirname, '..');
const SCANNED_EXTENSIONS = ['.ts', '.js', '.mjs', '.html'];
// Only these locations may reference chrome.* (the bridge library and the
// plain-JS extension bootstrap).
const ALLOWED = ['projects/devtools-bridge/', 'extension/'];
const SKIPPED_DIRS = new Set([
  'node_modules',
  'dist',
  'out-tsc',
  'coverage',
  '.git',
  '.angular',
  '.claude',
  'docs',
]);

function* sourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) {
        yield* sourceFiles(path);
      }
    } else if (SCANNED_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      yield path;
    }
  }
}

describe('bridge boundary check (T2-AC-04)', () => {
  it('no file outside devtools-bridge and the extension bootstrap references chrome.*', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(ROOT)) {
      const relPath = relative(ROOT, file);
      if (ALLOWED.some((prefix) => relPath.startsWith(prefix))) {
        continue;
      }
      for (const ref of findChromeReferences(readFileSync(file, 'utf8'))) {
        offenders.push(`${relPath}:${ref.line} — ${ref.text}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('detects chrome API references (negative test)', () => {
    // Samples are concatenated so this spec file itself stays clean under the scan.
    const sample = `const panel = ${'chrome'}.devtools.panels.create('x', '', 'panel/index.html');`;
    expect(findChromeReferences(sample)).toHaveLength(1);
    expect(findChromeReferences(`window.${'chrome'}.runtime.sendMessage({})`)).toHaveLength(1);
  });

  it('does not flag chrome-extension:// URLs', () => {
    expect(findChromeReferences('// served from chrome-extension:// pages')).toEqual([]);
  });
});
