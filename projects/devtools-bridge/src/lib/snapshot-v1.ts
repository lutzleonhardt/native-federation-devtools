/**
 * SnapshotV1 — versioned, JSON-serializable projection of the passive
 * federation evidence a page exposes.
 *
 * Layering rule: `runtime` (resolver outcome from the page global
 * `__NATIVE_FEDERATION__`) and `importMaps` (import-map resolution) are
 * separate evidence layers and must never be merged into one interpreted
 * structure. Missing evidence is an explicit channel state with a reason —
 * never an invented default.
 *
 * Field names inside the runtime projection follow the page repositories
 * verbatim (as projected by the collector) to keep the Task-7 collector
 * port a subset-copy, not a mapping layer.
 */

/** Availability of one evidence channel. */
export type ChannelStateV1 =
  | { state: 'available' }
  | { state: 'unavailable'; reason: string }
  | { state: 'not-recognized'; reason: string };

export interface CaptureMetaV1 {
  /** Sanitized page URL: origin + path only — never userinfo, query, or fragment. */
  pageUrl: string;
  /** ISO-8601 timestamp of the capture. */
  capturedAt: string;
  mode: 'passive';
  collectorVersion: string;
}

export interface ChannelsV1 {
  /** The page global `__NATIVE_FEDERATION__` (feeds `runtime`). */
  nativeFederationGlobals: ChannelStateV1;
  /** Import-map script tags in the document (feeds `importMaps.documentMaps`). */
  domImportMaps: ChannelStateV1;
  /** es-module-shims on the page (feeds `importMaps.effective`). */
  importShim: ChannelStateV1;
}

export interface ExposeV1 {
  moduleName: string;
  file: string;
}

export interface RemoteV1 {
  scopeUrl: string;
  exposes: ExposeV1[];
}

/** One remote's participation in a resolved external version. */
export interface ExternalRemoteV1 {
  name: string;
  requiredVersion: string;
  strictVersion: boolean;
  /**
   * Bundle file recorded by older runtimes; null on runtimes that record
   * per-entry file maps instead (not collected in Phase 1).
   */
  file: string | null;
  cached: boolean;
}

/** One resolved version of an external. */
export interface ExternalVersionV1 {
  /** Concrete version, e.g. '18.3.1'. */
  tag: string;
  /** Resolver outcome; demonstrated value: 'share'. */
  action: string;
  /** True when the host provides this version. */
  host: boolean;
  remotes: ExternalRemoteV1[];
}

export interface ExternalV1 {
  dirty: boolean;
  versions: ExternalVersionV1[];
}

/** scope ('__GLOBAL__' or a scope URL) → package name → external. */
export type ExternalScopesV1 = Record<string, Record<string, ExternalV1>>;

/** Reserved remote name under which the host registers itself in the repositories. */
export const NF_HOST = '__NF-HOST__';

/**
 * Projection of the four repositories on `__NATIVE_FEDERATION__`.
 * Non-null only when the channel is available: the repositories were
 * present and readable (otherwise the channel is 'not-recognized').
 * Exception: the runtime creates `scoped-externals` and `shared-chunks`
 * lazily, so an explicitly absent repository of these is the observation
 * "zero entries" and projects to an empty container.
 */
export interface RuntimeRepositoriesV1 {
  /** remote name → remote; '__NF-HOST__' is the host's own registration. */
  remotes: Record<string, RemoteV1>;
  scopedExternals: ExternalScopesV1;
  sharedExternals: ExternalScopesV1;
  /** provider name → bundle name → chunk files. */
  sharedChunks: Record<string, Record<string, string[]>>;
}

export interface ImportMapEntryV1 {
  specifier: string;
  target: string;
}

export interface ImportMapScopeV1 {
  scope: string;
  imports: ImportMapEntryV1[];
}

/** A document-declared import map — counts only; the merged result lives in `effective`. */
export interface DocumentImportMapV1 {
  /** Script type, demonstrated: 'importmap-shim'. */
  kind: string;
  parsed: boolean;
  importCount: number;
  scopeCount: number;
}

export interface EffectiveImportMapV1 {
  imports: ImportMapEntryV1[];
  scopes: ImportMapScopeV1[];
  /** Target URLs that carry an SRI integrity entry — presence only, hashes are never copied. */
  integrityFor: string[];
}

export interface ImportMapsV1 {
  documentMaps: DocumentImportMapV1[];
  /** Merged effective map reported by the shim; null when importShim is not available. */
  effective: EffectiveImportMapV1 | null;
}

export type CollectionErrorDetailV1 =
  | string
  | number
  | boolean
  | null
  | { [key: string]: CollectionErrorDetailV1 };

export interface CollectionErrorV1 {
  stage: string;
  code: string;
  detail?: CollectionErrorDetailV1;
}

export interface SnapshotV1 {
  schemaVersion: 1;
  capture: CaptureMetaV1;
  channels: ChannelsV1;
  /** Runtime resolver outcome; null when nativeFederationGlobals is not available. */
  runtime: RuntimeRepositoriesV1 | null;
  /** Import-map evidence; null when neither import-map channel yielded data. */
  importMaps: ImportMapsV1 | null;
  errors: CollectionErrorV1[];
}
