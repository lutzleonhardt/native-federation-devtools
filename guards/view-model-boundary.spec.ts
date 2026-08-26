import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findBoundaryViolations } from './view-model-boundary';

const ROOT = join(__dirname, '..');
const APP = join(ROOT, 'projects/devtools-ui/src/app');

/**
 * The resolution UI in scope: every production TypeScript source of the
 * views and the shell, the shared view conventions, and the app root.
 * Specs are excluded — they build models through the ingest on purpose.
 */
const SCOPE = [
  join(APP, 'views'),
  join(APP, 'shell'),
  join(APP, 'shared/view-conventions.ts'),
  join(APP, 'app.ts'),
];

function* productionSources(path: string): Generator<string> {
  if (statSync(path).isFile()) {
    yield path;
    return;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) {
      yield* productionSources(child);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      yield child;
    }
  }
}

describe('view-model boundary check (T11-AC-01)', () => {
  it('no production view, shell, or view-convention source crosses the canonical boundary', () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const root of SCOPE) {
      for (const file of productionSources(root)) {
        scanned += 1;
        for (const violation of findBoundaryViolations(readFileSync(file, 'utf8'))) {
          offenders.push(
            `${relative(ROOT, file)}:${violation.line} — ${violation.rule}: ${violation.detail}`,
          );
        }
      }
    }
    // Four views, the shell, the conventions, and the app root.
    expect(scanned).toBeGreaterThan(20);
    expect(offenders).toEqual([]);
  });

  // Seeded failing cases — one per rule (negative tests).
  it('flags every bridge import outside the allow-list, even as type imports', () => {
    expect(
      findBoundaryViolations(`import { FIXTURES, SnapshotV1 } from 'devtools-bridge';`),
    ).toEqual([
      { line: 1, rule: 'raw-snapshot-import', detail: `SnapshotV1 from 'devtools-bridge'` },
    ]);
    // DTO element types that the old deny-list did not name are denied by default.
    expect(
      findBoundaryViolations(
        `import type {\n  CaptureMetaV1,\n  ServedFileV1,\n  ChannelsV1,\n} from 'devtools-bridge';`,
      ),
    ).toEqual([
      {
        line: 1,
        rule: 'raw-snapshot-import',
        detail: `CaptureMetaV1, ServedFileV1 from 'devtools-bridge'`,
      },
    ]);
    expect(
      findBoundaryViolations(`import { SNAPSHOT_PROVIDER } from 'devtools-bridge';`),
    ).toHaveLength(1);
    expect(findBoundaryViolations(`import * as bridge from 'devtools-bridge';`)).toHaveLength(1);
  });

  it('flags the ingest and the retired derivations modules', () => {
    expect(
      findBoundaryViolations(`import { ingestSnapshot } from '../../shared/store/ingest';`),
    ).toEqual([{ line: 1, rule: 'ingest-import', detail: `from '../../shared/store/ingest'` }]);
    expect(
      findBoundaryViolations(`import { deriveFederation } from '../shared/store/derivations';`).map(
        (violation) => violation.rule,
      ),
    ).toEqual(['legacy-derivations-import', 'legacy-participant-surface']);
    expect(
      findBoundaryViolations(
        `import type { DerivedFederation } from '../store/derived-model';`,
      ).map((violation) => violation.rule),
    ).toEqual(['legacy-derivations-import', 'legacy-participant-surface']);
  });

  it('flags resolution algorithms: deep imports and value imports from the barrel', () => {
    expect(
      findBoundaryViolations(
        `import { resolveEffectiveConsumerBindings } from '../../shared/store/resolution/resolve-effective-consumer-bindings';`,
      ),
    ).toEqual([
      {
        line: 1,
        rule: 'resolution-algorithm-import',
        detail: `deep import from '../../shared/store/resolution/resolve-effective-consumer-bindings'`,
      },
    ]);
    expect(
      findBoundaryViolations(
        `import {\n  type ResolvedDependencyCopy,\n  materializeResolvedCopies,\n} from '../../shared/store/resolution';`,
      ),
    ).toEqual([
      {
        line: 1,
        rule: 'resolution-algorithm-import',
        detail: `value import of materializeResolvedCopies from '../../shared/store/resolution'`,
      },
    ]);
  });

  it('flags dynamic imports of the same modules', () => {
    expect(
      findBoundaryViolations(
        [
          `const lazy = () => import('../../shared/store/ingest');`,
          `const bridge = await import('devtools-bridge');`,
          `const algorithms = import(\n  '../../shared/store/resolution'\n);`,
        ].join('\n'),
      ).map((violation) => [violation.line, violation.rule]),
    ).toEqual([
      [1, 'ingest-import'],
      [2, 'raw-snapshot-import'],
      [3, 'resolution-algorithm-import'],
    ]);
  });

  it('flags raw snapshot access through the capture state, not the router snapshot', () => {
    expect(
      findBoundaryViolations(
        [
          `const state = this.store.state();`,
          `const { pageUrl } = state.snapshot.capture;`,
          `const raw = this.store.state().snapshot;`,
          `const select = inject(ActivatedRoute).snapshot.queryParamMap.get('select');`,
          `const title = route.snapshot.data['title'];`,
        ].join('\n'),
      ).map((violation) => [violation.line, violation.rule]),
    ).toEqual([
      [2, 'raw-snapshot-access'],
      [3, 'raw-snapshot-access'],
    ]);
  });

  it('flags the retired participant-row surface in code, not in comments', () => {
    expect(
      findBoundaryViolations(
        `const rows = model.sharedRows;\nconst derived = this.store.derived();`,
      ),
    ).toEqual([
      { line: 1, rule: 'legacy-participant-surface', detail: 'sharedRows' },
      { line: 2, rule: 'legacy-participant-surface', detail: '.derived()' },
    ]);
    expect(
      findBoundaryViolations(
        `// sharedRows once lived here\n/* DerivedFederation too — see state.snapshot.runtime */\nconst x = 1;`,
      ),
    ).toEqual([]);
  });

  it('allows the canonical vocabulary and the Store façade', () => {
    expect(
      findBoundaryViolations(
        [
          `import { FederationStore } from '../../shared/store/federation-store';`,
          `import type { FederationModel } from '../../shared/store/federation-model';`,
          `import type { ResolvedDependencyCopy, SharedExternalId } from '../../shared/store/resolution';`,
          `import { type BundleClaim, type CopyId } from '../../shared/store/resolution';`,
          `import { ChannelStateV1, ChannelsV1, SnapshotGenerationV1 } from 'devtools-bridge';`,
          `import { FIXTURES, PRIMARY_FIXTURE_ID, fixtureIdFromQuery } from 'devtools-bridge';`,
          `import { NF_HOST } from 'devtools-bridge';`,
          `import { resolveUrl } from '../../shared/store/merge-document-maps';`,
          `const url = 'https://example.test/store/ingest';`,
          `const capturing = computed(() => this.store.state().status === 'capturing');`,
          `const { pageUrl, capturedAt } = model.provenance;`,
        ].join('\n'),
      ),
    ).toEqual([]);
  });
});
