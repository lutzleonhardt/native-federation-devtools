/**
 * Import Map view model — the raw evidence view (spec 4.3): unchanged in
 * role, demoted as a destination, promoted as a data source. Sections
 * render the store's flattened effective map verbatim in map order
 * (GLOBAL IMPORTS first, then one section per scope prefix); every
 * annotation joins existing store/derived knowledge — the view derives
 * nothing itself: providers by target URL (`derived.providers`), owning
 * packages by the rows' map-backed resolutions, chunk files via the
 * shared chunk-map join. Honest outcomes stay visible: an ambiguous
 * provider renders the `ambiguous` badge, a foreign-origin target states
 * "unattributable" — never a guessed owner.
 *
 * Inputs are the store's model + derived projections plus caller-owned UI
 * state; the output is render-ready only: templates consume these rows,
 * never store types (XC-06).
 */
import { NF_HOST } from 'devtools-bridge';

import { ChunkFileMapJoin, chunkJoinsByTarget, joinChunkFilesToMap } from '../../shared/chunk-map-join';
import type { DerivedFederation, ProviderDerivation } from '../../shared/store/derived-model';
import type { FederationModel, ImportMapEntryRow } from '../../shared/store/federation-model';
import { countClaim, packageId, participantDisplay } from '../../shared/view-conventions';

/** Caller-owned UI state — the `select` payload seeds row highlighting. */
export interface ImportMapUiState {
  /** Specifier payload (cross-link convention); `/./` infixes tolerated. */
  selected: string | null;
}

/** The V1 honesty caption, verbatim (spec 4.3). */
export const IMPORT_MAP_CAPTION =
  'This layer proves resolution only — an import-mapped file is not necessarily requested, and a requested file is not proof of execution.';

/** Provider annotation of one row — the three honest outcomes, never a guess. */
export type RowProviderVm =
  | {
      outcome: 'derived';
      remote: string;
      /** Display form (`__NF-HOST__` reads as 'host'). */
      display: string;
      host: boolean;
      hostFallback: boolean;
      /** Verbatim `select` payload for the /remotes cross-link. */
      select: string;
      note: string;
      rule: 'scope-prefix-match';
    }
  | { outcome: 'ambiguous'; candidates: string[]; note: string; rule: 'scope-prefix-match' }
  | { outcome: 'unattributable'; note: string; rule: 'scope-prefix-match' };


/** Chunk-file attribution of a row (shared chunk-map join). */
export interface RowChunkVm {
  owningRemote: string;
  display: string;
  /** Verbatim `select` payload for the /remotes cross-link. */
  select: string;
  bundleName: string | null;
  pseudoPackage: string | null;
  /** Group label — the bundle name, or the pseudo package for v4.5 groups. */
  groupLabel: string;
  /** Annotation noun: 'bundle'/'bundles' with bundle names, 'chunk group' otherwise. */
  groupNoun: 'bundle' | 'bundles' | 'chunk group';
  note: string;
}

export interface ImportMapRowVm {
  specifier: string;
  /** Verbatim target URL (tooltip evidence). */
  target: string;
  /**
   * Display form: relative to the page base — the verbatim URL stays one
   * hover away. A foreign-origin target keeps its absolute URL and
   * visibly stands out (honest signal, matches `unattributable`).
   */
  targetDisplay: string;
  hasIntegrity: boolean;
  provider: RowProviderVm;
  /**
   * True when this row's provider merely restates the section owner —
   * the header carries the claim, the row stays quiet (only exceptions
   * speak, T10 doctrine). Always false in the global section.
   */
  providerQuiet: boolean;
  /** `/packages?select=` payload of the owning package, where derivable. */
  packageSelect: string | null;
  chunk: RowChunkVm | null;
  selected: boolean;
}

/** Scope-section owner — consensus of the section rows' provider derivations. */
export type SectionOwnerVm =
  | {
      kind: 'remote';
      remote: string;
      display: string;
      host: boolean;
      hostFallback: boolean;
      select: string;
      note: string;
    }
  | { kind: 'mixed'; note: string };

export interface ImportMapSectionVm {
  kind: 'global' | 'scope';
  /** 'GLOBAL IMPORTS', or the scope prefix verbatim. */
  label: string;
  scope: string | null;
  /** Owner annotation of a scope section; null on the global section. */
  owner: SectionOwnerVm | null;
  /** e.g. "22 entries". */
  countClaim: string;
  /** False when every row's provider restates the owner (cells stay empty). */
  showProvider: boolean;
  /** True when any row carries chunk attribution. */
  showBundle: boolean;
  /**
   * Header of the trailing attribution column — 'served by', 'bundle',
   * both, or '' when nothing renders there. The column itself is always
   * present so every section table keeps the same geometry.
   */
  trailingLabel: string;
  rows: ImportMapRowVm[];
}

export interface ImportMapVm {
  sections: ImportMapSectionVm[];
  caption: string;
  /** Honest empty state; null while the map has entries. */
  emptyNote: string | null;
}

const GLOBAL_LABEL = 'GLOBAL IMPORTS';

/** Select matching tolerates the literal `/./` infix (same rule as the ingest expose join). */
function collapseDotInfix(specifier: string): string {
  return specifier.replace(/\/\.\//g, '/');
}

function toProviderVm(derivation: ProviderDerivation | undefined): RowProviderVm {
  if (derivation === undefined) {
    return {
      outcome: 'unattributable',
      note: 'no provider derivation recorded for this target',
      rule: 'scope-prefix-match',
    };
  }
  switch (derivation.outcome) {
    case 'derived': {
      const display = participantDisplay(derivation.remote!);
      return {
        outcome: 'derived',
        remote: derivation.remote!,
        display,
        host: derivation.remote === NF_HOST,
        hostFallback: derivation.hostFallback,
        select: derivation.remote!,
        note: derivation.hostFallback
          ? 'attributed to the host as least-specific fallback — no remote scope prefix matches this target (rule: scope-prefix-match)'
          : `most-specific scope prefix belongs to ${display} (rule: scope-prefix-match)`,
        rule: 'scope-prefix-match',
      };
    }
    case 'ambiguous':
      // The candidate list is most-specific first with the host always
      // last (T7) — the tie sits at its head, so the note must not claim
      // every candidate as tied.
      return {
        outcome: 'ambiguous',
        candidates: derivation.candidates,
        note: `no unique most-specific scope prefix — candidates (most specific first): ${derivation.candidates.map(participantDisplay).join(', ')} (rule: scope-prefix-match)`,
        rule: 'scope-prefix-match',
      };
    case 'unattributable':
      return {
        outcome: 'unattributable',
        note: 'no registry scope matches this target — CDN or foreign origin (rule: scope-prefix-match)',
        rule: 'scope-prefix-match',
      };
  }
}

/**
 * Owning-package select payloads from the rows' map-backed resolutions.
 * Key: `${specifier}\u0000${target}` — a package link only where the row's
 * specifier IS the package name and the target is the row's resolution;
 * an alias specifier on the same target stays link-free. First join in
 * store order wins — the Packages detail shows the full negotiation
 * either way.
 */
function packageSelects(derived: DerivedFederation): Map<string, string> {
  const bySpecAndTarget = new Map<string, string>();
  for (const facts of derived.sharedRowFacts) {
    const target = facts.row.resolution?.targetUrl;
    if (target === undefined) {
      continue;
    }
    const key = `${facts.row.packageName}\u0000${target}`;
    if (!bySpecAndTarget.has(key)) {
      bySpecAndTarget.set(key, packageId(facts.row.scope, facts.row.packageName));
    }
  }
  return bySpecAndTarget;
}

function toChunkVm(claims: ChunkFileMapJoin[] | undefined): RowChunkVm | null {
  if (claims === undefined || claims.length === 0) {
    return null;
  }
  // Several claims on one target are simultaneously true (registry
  // evidence, e.g. one esbuild chunk in two bundle lists) — the label
  // names them all, never silently just the first.
  const first = claims[0];
  const display = participantDisplay(first.owningRemote);
  const labels = [
    ...new Set(claims.map((claim) => claim.bundleName ?? claim.pseudoPackage ?? 'chunk group')),
  ];
  return {
    owningRemote: first.owningRemote,
    display,
    select: first.owningRemote,
    bundleName: first.bundleName,
    pseudoPackage: first.pseudoPackage,
    groupLabel: labels.join(' · '),
    groupNoun:
      first.bundleName !== null ? (labels.length > 1 ? 'bundles' : 'bundle') : 'chunk group',
    note: `chunk file of ${display} — joined via the effective-map target (rule: bundle-chunk join)`,
  };
}

/** Consensus owner of a scope section — mixed attribution stays honest. */
function ownerOf(rows: ImportMapRowVm[]): SectionOwnerVm {
  const first = rows[0]?.provider;
  if (
    first !== undefined &&
    first.outcome === 'derived' &&
    rows.every(
      (row) => row.provider.outcome === 'derived' && row.provider.remote === first.remote,
    )
  ) {
    const hostFallback = rows.every(
      (row) => row.provider.outcome === 'derived' && row.provider.hostFallback,
    );
    return {
      kind: 'remote',
      remote: first.remote,
      display: first.display,
      host: first.host,
      hostFallback,
      select: first.remote,
      note: hostFallback
        ? 'attributed to the host as least-specific fallback — no remote scope prefix matches these targets (rule: scope-prefix-match)'
        : 'most-specific scope-prefix match (rule: scope-prefix-match)',
    };
  }
  return {
    kind: 'mixed',
    note: 'no single owning remote derivable for this scope',
  };
}

export function buildImportMapVm(
  model: FederationModel,
  derived: DerivedFederation,
  ui: ImportMapUiState,
): ImportMapVm {
  if (model.mapMode === 'none') {
    return {
      sections: [],
      caption: IMPORT_MAP_CAPTION,
      emptyNote: 'no import map recorded in this capture',
    };
  }

  const providerByTarget = new Map(
    derived.providers.map((derivation) => [derivation.targetUrl, derivation]),
  );
  const packages = packageSelects(derived);
  const chunksByTarget = chunkJoinsByTarget(joinChunkFilesToMap(model));
  const wanted = ui.selected === null ? null : collapseDotInfix(ui.selected);
  const pageBase = model.provenance.pageUrl;

  const rowOf = (entry: ImportMapEntryRow): ImportMapRowVm => ({
    specifier: entry.specifier,
    target: entry.target,
    targetDisplay:
      entry.target.startsWith(pageBase) && entry.target.length > pageBase.length
        ? entry.target.slice(pageBase.length)
        : entry.target,
    hasIntegrity: entry.hasIntegrity,
    provider: toProviderVm(providerByTarget.get(entry.target)),
    providerQuiet: false,
    packageSelect: packages.get(`${entry.specifier}\u0000${entry.target}`) ?? null,
    chunk: toChunkVm(chunksByTarget.get(entry.target)),
    selected: wanted !== null && collapseDotInfix(entry.specifier) === wanted,
  });

  // The flattened effective map is already in map order (top-level first,
  // then scopes); sections keep first-appearance order.
  const sections: ImportMapSectionVm[] = [];
  const byScope = new Map<string | null, ImportMapSectionVm>();
  for (const entry of model.importMapEntries) {
    let section = byScope.get(entry.scope);
    if (section === undefined) {
      section = {
        kind: entry.scope === null ? 'global' : 'scope',
        label: entry.scope ?? GLOBAL_LABEL,
        scope: entry.scope,
        owner: null,
        countClaim: '',
        showProvider: true,
        showBundle: false,
        trailingLabel: '',
        rows: [],
      };
      byScope.set(entry.scope, section);
      sections.push(section);
    }
    section.rows.push(rowOf(entry));
  }
  for (const section of sections) {
    section.countClaim = countClaim(section.rows.length, 'entry', 'entries');
    if (section.kind === 'scope') {
      section.owner = ownerOf(section.rows);
      // Only exceptions speak: a row restating the section owner stays
      // quiet; the header carries the claim.
      if (section.owner.kind === 'remote') {
        const owner = section.owner;
        for (const row of section.rows) {
          row.providerQuiet =
            row.provider.outcome === 'derived' && row.provider.remote === owner.remote;
        }
      }
    }
    section.showProvider = section.rows.some((row) => !row.providerQuiet);
    section.showBundle = section.rows.some((row) => row.chunk !== null);
    section.trailingLabel = [
      ...(section.showProvider ? ['served by'] : []),
      ...(section.showBundle ? ['bundle'] : []),
    ].join(' / ');
  }

  return {
    sections,
    caption: IMPORT_MAP_CAPTION,
    emptyNote:
      sections.length === 0 ? 'the recorded import map tags merge to an empty map' : null,
  };
}
