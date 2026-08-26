import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findVocabularyViolations } from './resolution-vocabulary';

const ROOT = join(__dirname, '..');
const APP = join(ROOT, 'projects/devtools-ui/src/app');

/**
 * The resolution UI: every view, the shell, the view kit, the shared
 * conventions, and the app root template — the same surface the
 * view-model boundary guard scans, plus the templates.
 */
const SCOPE = [
  join(APP, 'views'),
  join(APP, 'shell'),
  join(APP, 'shared/kit'),
  join(APP, 'shared/view-conventions.ts'),
  join(APP, 'app.html'),
];

function* uiFiles(path: string): Generator<string> {
  if (statSync(path).isFile()) {
    yield path;
    return;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) {
      yield* uiFiles(child);
    } else if (
      entry.name.endsWith('.html') ||
      (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts'))
    ) {
      yield child;
    }
  }
}

describe('resolution vocabulary check (T11-AC-05)', () => {
  it('no view, shell, or kit template and no UI string literal claims delivery or cost', () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const root of SCOPE) {
      for (const file of uiFiles(root)) {
        scanned += 1;
        const kind = file.endsWith('.html') ? 'template' : 'source';
        for (const violation of findVocabularyViolations(readFileSync(file, 'utf8'), kind)) {
          offenders.push(
            `${relative(ROOT, file)}:${violation.line} — "${violation.term}" in: ${violation.text}`,
          );
        }
      }
    }
    expect(scanned).toBeGreaterThan(25);
    expect(offenders).toEqual([]);
  });

  // Seeded wording violations (negative tests).
  it('flags delivery and cost wording in rendered template text and attributes', () => {
    expect(
      findVocabularyViolations(
        `<span class="cell">served by {{ row.remote }}</span>\n<abbr title="chunk loaded from cache">SRI</abbr>`,
        'template',
      ),
    ).toEqual([
      { line: 1, term: 'served by', text: '<span class="cell">served by {{ row.remote }}</span>' },
      { line: 2, term: 'loaded', text: '<abbr title="chunk loaded from cache">SRI</abbr>' },
    ]);
    expect(
      findVocabularyViolations(`<td>{{ copy.byteSize }} byte size</td>`, 'template'),
    ).toHaveLength(1);
  });

  it('flags wording in source string literals but not in comments or identifiers', () => {
    expect(
      findVocabularyViolations(
        `/** vocabulary: never "loaded" */\nconst note = 'resolved copy, loaded by the host';\nconst isLoaded = true; // fetched?`,
        'source',
      ),
    ).toEqual([
      { line: 2, term: 'loaded', text: `const note = 'resolved copy, loaded by the host';` },
    ]);
    expect(
      findVocabularyViolations('const tip = `${count} files\nexecuted at runtime`;', 'source'),
    ).toHaveLength(1);
  });

  it('reads string literals through comment-like and comment-adjacent text', () => {
    // A string that LOOKS like a comment is still rendered text.
    expect(findVocabularyViolations(`const label = '/* loaded */';`, 'source')).toHaveLength(1);
    expect(findVocabularyViolations(`const hint = "// served by";`, 'source')).toHaveLength(1);
    // A comment with an apostrophe must not swallow the following string.
    expect(
      findVocabularyViolations(`// it's fine\nconst word = 'fetched';`, 'source').map(
        (v) => v.line,
      ),
    ).toEqual([2]);
    // A regex literal ending in an escaped slash pair is not a comment start.
    expect(
      findVocabularyViolations(`const infix = /\\/\\.\\//g; const word = 'downloaded';`, 'source'),
    ).toHaveLength(1);
    // Block comments never leak, wherever the words sit.
    expect(
      findVocabularyViolations(
        `/* loaded\n   fetched 'executed' */\nconst ok = 'mapped';`,
        'source',
      ),
    ).toEqual([]);
  });

  it('ignores HTML comments and the resolution vocabulary itself', () => {
    expect(
      findVocabularyViolations(
        `<!-- never say "served by" here -->\n<span>resolves to {{ target }}</span>`,
        'template',
      ),
    ).toEqual([]);
    expect(
      findVocabularyViolations(
        `const words = ['mapped', 'declared', 'resolves to', 'source-only'];`,
        'source',
      ),
    ).toEqual([]);
  });
});
