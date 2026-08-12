/**
 * Detail half of the Remotes vm builder — the transposed projection of one
 * remote: identity, capability badges, exposes, this remote's dependency
 * rows, the chunk-attribution ladder, and true scoped externals.
 *
 * Arrow doctrine of the transposed view: EVERY dependency row draws its
 * resolution explicitly — with only one participant visible per package a
 * quiet row would be ambiguous (the Packages detail keeps the quiet norm
 * because the full negotiation is in sight). The elected winner carries an
 * `elected` marker beside its own-copy arrow instead of staying quiet.
 */
import type { KvItem } from '../../shared/kit/kv-list';
import type { DeclaredVersion, ParticipantArrow } from '../../shared/kit/participant-row';
import type {
  DerivedFederation,
  RemoteBadges,
  RemoteChunkAttribution,
} from '../../shared/store/derived-model';
import type { FederationModel, RemoteEntity } from '../../shared/store/federation-model';
import {
  ACTION_NOTES,
  ACTION_SYMBOLS,
  GLOBAL_SCOPE,
  STRICT_SCOPE,
  declaredOf,
  explicitArrowOf,
  packageId,
  participantDisplay,
} from '../../shared/view-conventions';

/** One observed capability of the remote (kit capability badge). */
export interface CapabilityVm {
  label: string;
  note: string;
}

export interface ExposeVm {
  /**
   * Remote-qualified module identity (the V1 rule: remote name + expose
   * key, never the key alone). Matches the naive map-join specifier, so
   * live maps keep their literal `/./` infix.
   */
  qualified: string;
  moduleName: string;
  file: string;
  /** Joined map target; null when no map entry joins (honest absence). */
  mapTarget: string | null;
}

/** One shared dependency from this remote's point of view. */
export interface RemoteDepVm {
  packageName: string;
  /** `select` payload for the /packages cross-link. */
  packageSelect: string;
  /** Verbatim share-scope name (tooltip); label null in the global scope. */
  scope: string;
  scopeLabel: string | null;
  declared: DeclaredVersion;
  strict: boolean;
  /** Registry action, verbatim, with its glyph and grounded note. */
  action: string;
  symbol: string;
  actionNote: string;
  /** Always present — the transposed view draws every resolution explicitly. */
  arrow: ParticipantArrow;
  /**
   * Present on share rows of a winner-less election — the exception speaks,
   * the elected norm stays quiet (T10 doctrine). Never raised in the strict
   * scope, where side-by-side sharing is by design.
   */
  noElection: { note: string } | null;
}

/** Chunk section over the remote's attribution-ladder entry. */
export type RemoteChunkSectionVm =
  | {
      level: 'package';
      note: string;
      /**
       * `fileClaim` renders the evidence, never a bare count: a bundle
       * without a recorded chunk list claims the absence explicitly instead
       * of masquerading as "0 files".
       */
      packages: { packageName: string; bundleName: string; fileClaim: string }[];
      rule: 'bundle-chunk-join';
    }
  | {
      level: 'remote';
      note: string;
      groups: { label: string; fileClaim: string; mapped: boolean }[];
      rule: 'chunk-pseudo-externals';
    }
  | { level: 'none'; note: string; rule: 'no-chunk-evidence' };

/** One true scoped package of this remote (never a reclassified chunk group). */
export interface ScopedPackageVm {
  packageName: string;
  tag: string;
  bundle: string | null;
  files: string[];
}

export interface RemoteDetailVm {
  /** Verbatim remote name (select payloads must match it). */
  name: string;
  /** Display form — the `__NF-HOST__` sentinel reads as 'host'. */
  display: string;
  host: boolean;
  /** Identity rows: scope URL as recorded plus the resolved URL. */
  identity: KvItem[];
  capabilities: CapabilityVm[];
  exposes: ExposeVm[];
  deps: RemoteDepVm[];
  chunks: RemoteChunkSectionVm;
  scoped: ScopedPackageVm[];
}

const CHUNK_EXPLANATION = "code shared between this remote's exposes, plus lazy modules";

function countClaim(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function capabilitiesOf(badges: RemoteBadges | undefined): CapabilityVm[] {
  if (badges === undefined) {
    return [];
  }
  const capabilities: CapabilityVm[] = [];
  if (badges.denseChunking.present) {
    capabilities.push({
      label: 'dense chunking',
      note: `the registry records per-bundle chunk lists for this remote — rule: ${badges.denseChunking.rule}`,
    });
  }
  if (badges.denseExternals.present) {
    capabilities.push({
      label: 'dense externals',
      note: `shared participants carry their serving bundle — rule: ${badges.denseExternals.rule}`,
    });
  }
  if (badges.sri.present) {
    capabilities.push({
      label: 'SRI',
      note: `integrity hashes recorded for this remote's files — rule: ${badges.sri.rule}`,
    });
  }
  return capabilities;
}

function exposesOf(remote: RemoteEntity): ExposeVm[] {
  return remote.exposes.map((expose) => ({
    qualified: `${remote.name}/${expose.moduleName}`,
    moduleName: expose.moduleName,
    file: expose.file,
    mapTarget: expose.mapTarget,
  }));
}

function depsOf(remote: RemoteEntity, derived: DerivedFederation): RemoteDepVm[] {
  // Unique-winner test per (scope, package): a second share row makes the
  // election winner-less. Only that exception is marked — the elected norm
  // stays quiet; the strict scope shares side by side by design (the
  // pinned tag and the scope chip explain it).
  const shareCounts = new Map<string, number>();
  for (const facts of derived.sharedRowFacts) {
    if (facts.row.action === 'share') {
      const id = packageId(facts.row.scope, facts.row.packageName);
      shareCounts.set(id, (shareCounts.get(id) ?? 0) + 1);
    }
  }
  return derived.sharedRowFacts
    .filter((facts) => facts.row.participant === remote.name)
    .map((facts) => {
      const id = packageId(facts.row.scope, facts.row.packageName);
      const shareCount = shareCounts.get(id) ?? 0;
      const winnerLess =
        facts.row.action === 'share' && shareCount > 1 && facts.row.scope !== STRICT_SCOPE;
      return {
        packageName: facts.row.packageName,
        packageSelect: id,
        scope: facts.row.scope,
        scopeLabel: facts.row.scope === GLOBAL_SCOPE ? null : facts.row.scope,
        declared: declaredOf(facts),
        strict: facts.row.strictVersion,
        action: facts.row.action,
        symbol: ACTION_SYMBOLS[facts.row.action] ?? '·',
        actionNote: ACTION_NOTES[facts.row.action] ?? 'registry action recorded verbatim',
        arrow: explicitArrowOf(facts),
        noElection: winnerLess
          ? {
              note: `${shareCount} versions are declared share in this scope — the registry elected no single version (rule: registry-election)`,
            }
          : null,
      };
    });
}

function chunksOf(
  display: string,
  attribution: RemoteChunkAttribution | undefined,
): RemoteChunkSectionVm {
  if (attribution === undefined || attribution.level === 'none') {
    return {
      level: 'none',
      note: `no chunk evidence recorded for ${display} — the capture shows no chunk lists (dense-chunking capability absent)`,
      rule: 'no-chunk-evidence',
    };
  }
  if (attribution.level === 'remote') {
    return {
      level: 'remote',
      note: `${CHUNK_EXPLANATION} — chunks belong to ${display}; package attribution is not derivable in this capture`,
      groups: attribution.groups.map((group) => ({
        label: group.pseudoPackage ?? group.bundleName ?? '(unnamed group)',
        fileClaim: countClaim(group.files.length, 'file'),
        mapped: group.mapped,
      })),
      rule: 'chunk-pseudo-externals',
    };
  }
  return {
    level: 'package',
    note: `${CHUNK_EXPLANATION} — loaded on demand`,
    // An empty list is the no-list marker (spec-pinned since T7): the
    // participant names the bundle, the chunks repository holds no list —
    // claim the absence instead of rendering a zero.
    packages: attribution.packages.map((entry) => ({
      packageName: entry.packageName,
      bundleName: entry.bundleName,
      fileClaim:
        entry.files.length === 0
          ? 'no chunk list recorded in this capture'
          : countClaim(entry.files.length, 'chunk file'),
    })),
    rule: 'bundle-chunk-join',
  };
}

function scopedOf(remote: RemoteEntity, model: FederationModel): ScopedPackageVm[] {
  return model.scopedPackages
    .filter((row) => row.scope === remote.name)
    .map((row) => ({
      packageName: row.packageName,
      tag: row.tag,
      bundle: row.bundle,
      files: Object.values(row.entries),
    }));
}

export function buildRemoteDetail(
  model: FederationModel,
  derived: DerivedFederation,
  selectedName: string | null,
): RemoteDetailVm | null {
  const remote =
    selectedName === null
      ? null
      : (model.remotes.find((candidate) => candidate.name === selectedName) ?? null);
  if (remote === null) {
    return null;
  }
  const display = participantDisplay(remote.name);
  return {
    name: remote.name,
    display,
    host: remote.isHost,
    identity: [
      { label: 'scope URL', value: remote.scopeUrl, mono: true },
      {
        label: 'resolved',
        value: remote.resolvedScopeUrl,
        mono: true,
        href: remote.resolvedScopeUrl,
      },
    ],
    capabilities: capabilitiesOf(
      derived.remoteBadges.find((badges) => badges.remote === remote.name),
    ),
    exposes: exposesOf(remote),
    deps: depsOf(remote, derived),
    chunks: chunksOf(
      display,
      derived.chunkAttribution.find((entry) => entry.remote === remote.name),
    ),
    scoped: scopedOf(remote, model),
  };
}
