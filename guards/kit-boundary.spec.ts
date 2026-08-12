import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findStoreImports } from './kit-boundary';

const ROOT = join(__dirname, '..');
const KIT_DIR = join(ROOT, 'projects/devtools-ui/src/app/shared/kit');

function* kitSources(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* kitSources(path);
    } else if (entry.name.endsWith('.ts')) {
      yield path;
    }
  }
}

describe('kit boundary check (T9-AC-04)', () => {
  it('no file under shared/kit/ imports from the store module', () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const file of kitSources(KIT_DIR)) {
      scanned += 1;
      for (const imp of findStoreImports(readFileSync(file, 'utf8'))) {
        offenders.push(`${relative(ROOT, file)}:${imp.line} — ${imp.specifier}`);
      }
    }
    expect(scanned).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });

  it('detects store imports (negative test)', () => {
    expect(
      findStoreImports(`import { FederationModel } from '../store/federation-model';`),
    ).toEqual([{ line: 1, specifier: '../store/federation-model' }]);
    expect(findStoreImports(`export { deriveFederation } from '../../store/derivations';`)).toHaveLength(1);
  });

  it('does not flag kit-local or framework imports', () => {
    expect(findStoreImports(`import { TreeTableRow } from './tree-table';`)).toEqual([]);
    expect(findStoreImports(`import { computed } from '@angular/core';`)).toEqual([]);
    // 'store' as part of a longer segment is not the store module.
    expect(findStoreImports(`import { x } from './storefront';`)).toEqual([]);
  });
});
