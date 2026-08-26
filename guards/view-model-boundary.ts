/**
 * View-model boundary rule (T11-AC-01, contributes to XC-01): the resolution
 * UI — views, shell, the shared view conventions, and the app root —
 * consumes canonical types and the Store façade only.
 *
 * A production source in scope must not:
 *  - import anything from `devtools-bridge` beyond the allow-listed
 *    channel/generation types and fixture-picker helpers — the raw snapshot
 *    DTO and its repository types are evidence, never a view input
 *    (allow-list, so a NEW raw type is denied by default);
 *  - import the ingest or the retired derivations modules;
 *  - import a resolution algorithm — a deep import into
 *    `store/resolution/<module>` or a VALUE import from the barrel (type
 *    imports from the barrel are the canonical vocabulary and stay allowed);
 *  - reach the raw snapshot through the façade's capture state
 *    (`state().snapshot.<runtime|importMaps|capture|…>`);
 *  - reference the retired participant-row surface (`SharedParticipantRow`,
 *    `sharedRows`, `DerivedFederation`, `store.derived()`, ...).
 *
 * Static and dynamic (`import('…')`) imports are covered; comments are
 * ignored. Specs are out of scope on purpose: they build models through the
 * ingest.
 */
import { lineOf, splitSourceLayers } from './source-text';

export type BoundaryRule =
  | 'raw-snapshot-import'
  | 'raw-snapshot-access'
  | 'ingest-import'
  | 'legacy-derivations-import'
  | 'resolution-algorithm-import'
  | 'legacy-participant-surface';

export interface BoundaryViolation {
  line: number;
  rule: BoundaryRule;
  detail: string;
}

/**
 * The only bridge exports the resolution UI may import: channel state and
 * generation labels (honest-state rendering) and the fixture-picker helpers
 * of the dev shell. Everything else — `SnapshotV1`, repository and DTO
 * element types, the provider token — is raw evidence.
 */
export const BRIDGE_ALLOWED_SYMBOLS: ReadonlySet<string> = new Set([
  'ChannelStateV1',
  'ChannelsV1',
  'SnapshotGenerationV1',
  'GenerationV1',
  'FIXTURES',
  'FixtureId',
  'PRIMARY_FIXTURE_ID',
  'fixtureIdFromQuery',
  'NF_HOST',
]);

const BRIDGE_MODULE = /^devtools-bridge$/;
const INGEST_MODULE = /(^|\/)store\/ingest$/;
const LEGACY_DERIVATIONS_MODULE = /(^|\/)store\/(derivations|derived-model)$/;
const RESOLUTION_DEEP_MODULE = /(^|\/)store\/resolution\/.+/;
const RESOLUTION_BARREL = /(^|\/)store\/resolution$/;
const LEGACY_SURFACE =
  /\b(SharedParticipantRow|sharedRows|DerivedFederation|deriveFederation|projectSharedRows|SharedRowFacts)\b|\.derived\(\)/;
// `.snapshot` of the store state — not Angular's `ActivatedRoute.snapshot`.
const RAW_SNAPSHOT_ACCESS =
  /\.snapshot\b(?!\s*\.\s*(queryParamMap|paramMap|params|queryParams|data|url|fragment|title|routeConfig|root|parent|firstChild|children|pathFromRoot|outlet|component)\b)/;

// import / export-from statements, including multi-line specifier lists:
// `import type { A } from 'm'`, `import D, { B } from 'm'`, `export * from 'm'`.
const IMPORT_STATEMENT =
  /\b(import|export)\s+(type\s+)?(\{[^}]*\}|\*(?:\s+as\s+[\w$]+)?|[\w$]+(?:\s*,\s*\{[^}]*\})?)\s+from\s+['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

interface ImportedSymbol {
  name: string;
  typeOnly: boolean;
}

function importedSymbols(clause: string, statementTypeOnly: boolean): ImportedSymbol[] {
  const braced = /\{([^}]*)\}/.exec(clause);
  const symbols: ImportedSymbol[] = [];
  const outside = braced ? clause.replace(braced[0], '') : clause;
  const bare = outside.replace(/,/g, ' ').trim();
  if (bare.length > 0) {
    // default or namespace import — cannot be narrowed, treated as a value.
    symbols.push({ name: bare.replace(/^\*\s+as\s+/, '* as '), typeOnly: statementTypeOnly });
  }
  if (braced) {
    for (const entry of braced[1].split(',')) {
      const trimmed = entry.trim();
      if (trimmed.length === 0) {
        continue;
      }
      const typeOnly = statementTypeOnly || /^type\s+/.test(trimmed);
      const name = trimmed
        .replace(/^type\s+/, '')
        .replace(/\s+as\s+[\w$]+$/, '')
        .trim();
      symbols.push({ name, typeOnly });
    }
  }
  return symbols;
}

function moduleViolation(
  line: number,
  specifier: string,
  symbols: ImportedSymbol[] | null,
): BoundaryViolation | null {
  if (BRIDGE_MODULE.test(specifier)) {
    if (symbols === null) {
      return { line, rule: 'raw-snapshot-import', detail: `dynamic import of '${specifier}'` };
    }
    const raw = symbols.filter((symbol) => !BRIDGE_ALLOWED_SYMBOLS.has(symbol.name));
    return raw.length === 0
      ? null
      : {
          line,
          rule: 'raw-snapshot-import',
          detail: `${raw.map((symbol) => symbol.name).join(', ')} from '${specifier}'`,
        };
  }
  if (INGEST_MODULE.test(specifier)) {
    return { line, rule: 'ingest-import', detail: `from '${specifier}'` };
  }
  if (LEGACY_DERIVATIONS_MODULE.test(specifier)) {
    return { line, rule: 'legacy-derivations-import', detail: `from '${specifier}'` };
  }
  if (RESOLUTION_DEEP_MODULE.test(specifier)) {
    return {
      line,
      rule: 'resolution-algorithm-import',
      detail: `deep import from '${specifier}'`,
    };
  }
  if (RESOLUTION_BARREL.test(specifier)) {
    if (symbols === null) {
      return {
        line,
        rule: 'resolution-algorithm-import',
        detail: `dynamic import of '${specifier}'`,
      };
    }
    const values = symbols.filter((symbol) => !symbol.typeOnly);
    return values.length === 0
      ? null
      : {
          line,
          rule: 'resolution-algorithm-import',
          detail: `value import of ${values.map((symbol) => symbol.name).join(', ')} from '${specifier}'`,
        };
  }
  return null;
}

export function findBoundaryViolations(content: string): BoundaryViolation[] {
  const source = splitSourceLayers(content).code;
  const violations: BoundaryViolation[] = [];

  for (const match of source.matchAll(IMPORT_STATEMENT)) {
    const violation = moduleViolation(
      lineOf(source, match.index),
      match[4],
      importedSymbols(match[3], match[2] !== undefined),
    );
    if (violation) {
      violations.push(violation);
    }
  }
  for (const match of source.matchAll(DYNAMIC_IMPORT)) {
    const violation = moduleViolation(lineOf(source, match.index), match[1], null);
    if (violation) {
      violations.push(violation);
    }
  }

  source.split('\n').forEach((text, index) => {
    const legacy = LEGACY_SURFACE.exec(text);
    if (legacy) {
      violations.push({ line: index + 1, rule: 'legacy-participant-surface', detail: legacy[0] });
    }
    const raw = RAW_SNAPSHOT_ACCESS.exec(text);
    if (raw) {
      violations.push({ line: index + 1, rule: 'raw-snapshot-access', detail: text.trim() });
    }
  });

  return violations.sort((a, b) => a.line - b.line);
}
