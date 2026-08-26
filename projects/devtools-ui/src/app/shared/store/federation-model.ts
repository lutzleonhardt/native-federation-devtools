/**
 * Normalized store model — the projection target of one `SnapshotV1`
 * ingest (`ingestSnapshot`). Every view renders from this model.
 *
 * The snapshot's two evidence layers (runtime registry, import maps) stay
 * unmerged in the DTO; they meet here only through explicit,
 * corpus-verified joins. The effective map is computed from document tags,
 * then the canonical consumer resolver records mapped, unmapped, blocked, or
 * unknown outcomes, and the canonical pipeline publishes the raw-free
 * resolution projection the views read.
 */
import type { ChannelsV1, SnapshotGenerationV1 } from 'devtools-bridge';

import type {
  CanonicalRegistryEvidence,
  CanonicalResolutionProjection,
  EffectiveConsumerResolution,
} from './resolution';

/** Which loader owns the page's import maps, from observed tag types. */
export type MapMode = 'native' | 'shim' | 'none';

/**
 * Merged effective import map — the map ground truth computed from the
 * document tags. All keys and targets are absolute (resolved against the
 * page base); bare specifiers stay verbatim.
 */
export interface EffectiveMap {
  imports: Record<string, string>;
  scopes: Record<string, Record<string, string>>;
  /** Absolute target URL → SRI hash. */
  integrity: Record<string, string>;
}

/** Snapshot provenance carried into the store. */
export interface StoreProvenance {
  schemaVersion: 1;
  pageUrl: string;
  capturedAt: string;
  collectorVersion: string;
  generation: SnapshotGenerationV1;
}

export interface ExposeJoin {
  moduleName: string;
  file: string;
  /**
   * Map target joined via the naive `<remoteName>/<moduleName>` specifier
   * (live maps join naively, so the literal `/./` infix is tolerated on
   * both sides); null when no map entry joins.
   */
  mapTarget: string | null;
}

export interface RemoteEntity {
  name: string;
  isHost: boolean;
  /** As recorded — live registries keep relative scope URLs. */
  scopeUrl: string;
  /** Resolved against the page base. */
  resolvedScopeUrl: string;
  exposes: ExposeJoin[];
  /** File name → SRI hash, as recorded per remote. */
  integrity: Record<string, string>;
}

/** One flattened entry of the effective map. */
export interface ImportMapEntryRow {
  specifier: string;
  target: string;
  /** Owning scope prefix (absolute); null for top-level imports. */
  scope: string | null;
  hasIntegrity: boolean;
}

export interface FederationModel {
  provenance: StoreProvenance;
  /** Channel availability pass-through for honest-state rendering. */
  channels: ChannelsV1;
  mapMode: MapMode;
  effectiveMap: EffectiveMap;
  /** Canonical ordered registry evidence; all resolution work starts here. */
  registryEvidence: CanonicalRegistryEvidence;
  /** Canonical import-map outcome per unique consumer scope context and package specifier. */
  effectiveConsumerResolutions: EffectiveConsumerResolution[];
  /**
   * The raw-free canonical resolution projection — copies, consumer-copy
   * relations, chunk groups, bundle claims, claims, measures, and
   * completeness. Every view and the graph read this surface.
   */
  resolutionProjection: CanonicalResolutionProjection;
  remotes: RemoteEntity[];
  importMapEntries: ImportMapEntryRow[];
}
