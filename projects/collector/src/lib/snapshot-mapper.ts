/**
 * Maps raw probe results to `SnapshotV1`.
 *
 * Both inputs are untrusted: they crossed the eval boundary out of the
 * inspected page, so on a hostile page they are attacker-shaped
 * regardless of what the probes intended to return. Everything is read
 * defensively, re-projected through the schema allowlist (which sanitizes
 * every URL), and reduced to the DTO shape — raw document import-map text
 * never reaches the snapshot (counts only). Channel states follow the
 * honest-state rules of the DTO:
 * missing evidence is an explicit state with a reason, never an invented
 * default, and an unrecognized shape yields `not-recognized` with no raw
 * data copied.
 */
import type {
  ChannelStateV1,
  DocumentImportMapV1,
  EffectiveImportMapV1,
  ExposeV1,
  ExternalRemoteV1,
  ExternalScopesV1,
  ExternalV1,
  ExternalVersionV1,
  ImportMapEntryV1,
  ImportMapScopeV1,
  ImportMapsV1,
  RemoteV1,
  RuntimeRepositoriesV1,
  SnapshotV1,
} from 'devtools-bridge';
import { COLLECTOR_VERSION, DEFAULT_LIMITS, type CollectorLimits } from './constants';
import { appendError, projectCollectionError, type CollectionError } from './errors';
import { createContext, dataValue, isObjectLike } from './safe';
import { sanitizeUrl } from './privacy';
import { EFFECTIVE_IMPORT_MAP_SCHEMA, projectSchema, REPOSITORY_SCHEMAS } from './runtime-schema';

export interface CaptureContext {
  /** ISO-8601 capture timestamp, supplied by the caller (no clock access here). */
  capturedAt: string;
}

const REPOSITORY_KEYS = [
  'remotes',
  'scoped-externals',
  'shared-externals',
  'shared-chunks',
] as const;

type RepositoryKey = (typeof REPOSITORY_KEYS)[number];

/**
 * Repositories the runtime creates lazily: the orchestrator's storage
 * writes a key on its first dirty commit only, so pages that never
 * register such an entry have no key at all — seen in the wild for
 * `scoped-externals` (playground), and true for `shared-chunks` on
 * non-dense builds (chunks ship as scoped pseudo-externals there). An
 * explicitly absent optional repository is the observation "zero entries"
 * and maps to an empty projection; an unreadable one still means
 * `not-recognized`.
 */
const OPTIONAL_REPOSITORY_KEYS: ReadonlySet<RepositoryKey> = new Set([
  'scoped-externals',
  'shared-chunks',
]);

/**
 * `rawProbe` is the evaluated `PASSIVE_PROBE_SOURCE` result; `rawShimMap`
 * is the evaluated `SHIM_MAP_PROBE_SOURCE` result, or `null`/`undefined`
 * when the shim probe was not run (e.g. because the main probe reported no
 * readable `importShim`).
 */
export function mapProbeResult(
  rawProbe: unknown,
  rawShimMap: unknown,
  context: CaptureContext,
): SnapshotV1 {
  const limits = DEFAULT_LIMITS;
  const errors: CollectionError[] = [];

  if (!isObjectLike(rawProbe) || dataValue(rawProbe, 'schemaVersion') !== 'passive-probe/1') {
    appendError(errors, limits, 'mapper', 'probe-result-invalid');
    const reason = 'probe result unavailable';
    return {
      schemaVersion: 1,
      capture: emptyCapture(context),
      channels: {
        nativeFederationGlobals: { state: 'unavailable', reason },
        domImportMaps: { state: 'unavailable', reason },
        importShim: { state: 'unavailable', reason },
      },
      runtime: null,
      importMaps: null,
      errors,
    };
  }

  carryErrors(dataValue(rawProbe, 'errors'), errors, limits);

  const pageUrl = mapPageUrl(dataValue(rawProbe, 'page'), errors, limits);
  const globals = dataValue(rawProbe, 'globals');

  const { nfChannel, runtime } = mapRuntime(dataValue(globals, 'nativeFederation'), errors, limits);
  const { domChannel, documentMaps } = mapDocumentMaps(dataValue(rawProbe, 'importMaps'), limits);
  const { shimChannel, effective } = mapEffective(
    dataValue(globals, 'importShim'),
    rawShimMap,
    errors,
    limits,
  );

  const importMaps: ImportMapsV1 | null =
    domChannel.state === 'available' || shimChannel.state === 'available'
      ? { documentMaps, effective }
      : null;

  return {
    schemaVersion: 1,
    capture: {
      pageUrl,
      capturedAt: context.capturedAt,
      mode: 'passive',
      collectorVersion: COLLECTOR_VERSION,
    },
    channels: {
      nativeFederationGlobals: nfChannel,
      domImportMaps: domChannel,
      importShim: shimChannel,
    },
    runtime,
    importMaps,
    errors,
  };
}

function emptyCapture(context: CaptureContext): SnapshotV1['capture'] {
  return {
    pageUrl: '',
    capturedAt: context.capturedAt,
    mode: 'passive',
    collectorVersion: COLLECTOR_VERSION,
  };
}

function carryErrors(value: unknown, errors: CollectionError[], limits: CollectorLimits): void {
  if (!Array.isArray(value)) {
    return;
  }
  for (const entry of value.slice(0, limits.maxErrors)) {
    if (errors.length >= limits.maxErrors) {
      break;
    }
    errors.push(projectCollectionError(entry));
  }
}

function mapPageUrl(page: unknown, errors: CollectionError[], limits: CollectorLimits): string {
  const origin = dataValue(page, 'origin');
  const path = dataValue(page, 'path');
  if (typeof origin === 'string' && typeof path === 'string') {
    const sanitized = sanitizeUrl(origin + path);
    if (sanitized !== null) {
      return sanitized;
    }
  }
  appendError(errors, limits, 'mapper', 'page-url-unavailable');
  return '';
}

/** Bounds a page-derived string before it is interpolated into a reason. */
function boundedReasonToken(value: unknown): string {
  return String(value).slice(0, 64);
}

// --- runtime repositories -------------------------------------------------

function mapRuntime(
  summary: unknown,
  errors: CollectionError[],
  limits: CollectorLimits,
): { nfChannel: ChannelStateV1; runtime: RuntimeRepositoriesV1 | null } {
  if (!isObjectLike(summary) || dataValue(summary, 'present') !== true) {
    return {
      nfChannel: { state: 'unavailable', reason: 'window.__NATIVE_FEDERATION__ is not defined' },
      runtime: null,
    };
  }
  if (dataValue(summary, 'descriptor') !== 'data') {
    return {
      nfChannel: {
        state: 'not-recognized',
        reason: 'global is accessor-backed; passive read skipped',
      },
      runtime: null,
    };
  }
  const valueType = dataValue(summary, 'valueType');
  if (valueType !== 'object') {
    return {
      nfChannel: {
        state: 'not-recognized',
        reason: `global has type '${boundedReasonToken(valueType)}' instead of object`,
      },
      runtime: null,
    };
  }

  const repositories = dataValue(summary, 'repositories');
  const projected: Partial<Record<RepositoryKey, unknown>> = {};
  const missing: string[] = [];
  for (const key of REPOSITORY_KEYS) {
    const repository = dataValue(repositories, key);
    if (
      OPTIONAL_REPOSITORY_KEYS.has(key) &&
      isObjectLike(repository) &&
      dataValue(repository, 'present') === false
    ) {
      projected[key] = {};
      continue;
    }
    const readable =
      isObjectLike(repository) &&
      dataValue(repository, 'present') === true &&
      dataValue(repository, 'descriptor') === 'data'
        ? dataValue(repository, 'value')
        : undefined;
    if (readable === undefined) {
      missing.push(key);
      continue;
    }
    const projection = projectSchema(
      readable,
      REPOSITORY_SCHEMAS[key],
      createContext(limits, errors, 'mapper', `repository.${key}`),
    );
    if (projection === undefined) {
      missing.push(key);
    } else {
      projected[key] = projection;
    }
  }
  if (missing.length > 0) {
    return {
      nfChannel: {
        state: 'not-recognized',
        reason: `global present but repositories missing or unreadable: ${missing.join(', ')}`,
      },
      runtime: null,
    };
  }

  return {
    nfChannel: { state: 'available' },
    runtime: {
      remotes: toRemotes(projected['remotes'], errors, limits),
      scopedExternals: toExternalScopes(projected['scoped-externals'], errors, limits, 'scoped-externals'),
      sharedExternals: toExternalScopes(projected['shared-externals'], errors, limits, 'shared-externals'),
      sharedChunks: toSharedChunks(projected['shared-chunks']),
    },
  };
}

function toRemotes(
  value: unknown,
  errors: CollectionError[],
  limits: CollectorLimits,
): Record<string, RemoteV1> {
  const output: Record<string, RemoteV1> = {};
  if (!isObjectLike(value)) {
    return output;
  }
  for (const [name, remote] of Object.entries(value)) {
    if (!isObjectLike(remote)) {
      continue;
    }
    const scopeUrl = dataValue(remote, 'scopeUrl');
    if (typeof scopeUrl !== 'string') {
      appendError(errors, limits, 'mapper', 'remote-incomplete', { path: `remotes.${name}` });
      continue;
    }
    const exposes: ExposeV1[] = [];
    const exposesRaw = dataValue(remote, 'exposes');
    if (Array.isArray(exposesRaw)) {
      for (const entry of exposesRaw) {
        const file = dataValue(entry, 'file');
        const moduleName = dataValue(entry, 'moduleName');
        if (typeof file === 'string' && typeof moduleName === 'string') {
          exposes.push({ moduleName, file });
        } else {
          appendError(errors, limits, 'mapper', 'expose-incomplete', { path: `remotes.${name}` });
        }
      }
    }
    output[name] = { scopeUrl, exposes };
  }
  return output;
}

function toExternalScopes(
  value: unknown,
  errors: CollectionError[],
  limits: CollectorLimits,
  repository: string,
): ExternalScopesV1 {
  const output: ExternalScopesV1 = {};
  if (!isObjectLike(value)) {
    return output;
  }
  for (const [scopeKey, packages] of Object.entries(value)) {
    const scope = sanitizeMaybeUrl(scopeKey);
    if (scope === null) {
      appendError(errors, limits, 'mapper', 'scope-key-dropped', { path: repository });
      continue;
    }
    if (!isObjectLike(packages)) {
      continue;
    }
    const scopeOutput: Record<string, ExternalV1> = {};
    for (const [pkg, externalRaw] of Object.entries(packages)) {
      if (!isObjectLike(externalRaw)) {
        continue;
      }
      scopeOutput[pkg] = {
        dirty: dataValue(externalRaw, 'dirty') === true,
        versions: toExternalVersions(dataValue(externalRaw, 'versions'), errors, limits, `${repository}.${pkg}`),
      };
    }
    output[scope] = scopeOutput;
  }
  return output;
}

function toExternalVersions(
  value: unknown,
  errors: CollectionError[],
  limits: CollectorLimits,
  path: string,
): ExternalVersionV1[] {
  const versions: ExternalVersionV1[] = [];
  if (!Array.isArray(value)) {
    return versions;
  }
  for (const versionRaw of value) {
    const tag = dataValue(versionRaw, 'tag');
    const action = dataValue(versionRaw, 'action');
    if (typeof tag !== 'string' || typeof action !== 'string') {
      appendError(errors, limits, 'mapper', 'external-version-incomplete', { path });
      continue;
    }
    versions.push({
      tag,
      action,
      host: dataValue(versionRaw, 'host') === true,
      remotes: toExternalRemotes(dataValue(versionRaw, 'remotes'), errors, limits, path),
    });
  }
  return versions;
}

function toExternalRemotes(
  value: unknown,
  errors: CollectionError[],
  limits: CollectorLimits,
  path: string,
): ExternalRemoteV1[] {
  const remotes: ExternalRemoteV1[] = [];
  if (!Array.isArray(value)) {
    return remotes;
  }
  for (const remoteRaw of value) {
    const name = dataValue(remoteRaw, 'name');
    const requiredVersion = dataValue(remoteRaw, 'requiredVersion');
    const file = dataValue(remoteRaw, 'file');
    if (typeof name !== 'string' || typeof requiredVersion !== 'string') {
      appendError(errors, limits, 'mapper', 'external-remote-incomplete', { path });
      continue;
    }
    remotes.push({
      name,
      requiredVersion,
      strictVersion: dataValue(remoteRaw, 'strictVersion') === true,
      // Newer runtimes record per-entry files instead of one bundle file
      // (not collected in Phase 1) — the remote is still a real participant.
      file: typeof file === 'string' ? file : null,
      cached: dataValue(remoteRaw, 'cached') === true,
    });
  }
  return remotes;
}

function toSharedChunks(value: unknown): Record<string, Record<string, string[]>> {
  const output: Record<string, Record<string, string[]>> = {};
  if (!isObjectLike(value)) {
    return output;
  }
  for (const [provider, bundles] of Object.entries(value)) {
    if (!isObjectLike(bundles)) {
      continue;
    }
    const providerOutput: Record<string, string[]> = {};
    for (const [bundleName, files] of Object.entries(bundles)) {
      providerOutput[bundleName] = Array.isArray(files)
        ? files.filter((file): file is string => typeof file === 'string')
        : [];
    }
    output[provider] = providerOutput;
  }
  return output;
}

// --- import maps ----------------------------------------------------------

function mapDocumentMaps(
  value: unknown,
  limits: CollectorLimits,
): { domChannel: ChannelStateV1; documentMaps: DocumentImportMapV1[] } {
  if (!Array.isArray(value)) {
    return {
      domChannel: {
        state: 'unavailable',
        reason: 'DOM import-map inventory could not be read',
      },
      documentMaps: [],
    };
  }
  const documentMaps: DocumentImportMapV1[] = [];
  for (const entry of value.slice(0, limits.maxImportMaps)) {
    if (!isObjectLike(entry)) {
      continue;
    }
    const kindRaw = dataValue(entry, 'type');
    const kind = typeof kindRaw === 'string' ? kindRaw.slice(0, 64) : 'unknown';
    const text = dataValue(entry, 'text');
    let parsed = false;
    let importCount = 0;
    let scopeCount = 0;
    if (typeof text === 'string') {
      try {
        const parsedMap: unknown = JSON.parse(text);
        if (isObjectLike(parsedMap) && !Array.isArray(parsedMap)) {
          parsed = true;
          const imports = dataValue(parsedMap, 'imports');
          const scopes = dataValue(parsedMap, 'scopes');
          importCount = isObjectLike(imports) ? Object.keys(imports).length : 0;
          scopeCount = isObjectLike(scopes) ? Object.keys(scopes).length : 0;
        }
      } catch {
        // parsed stays false — the DTO records the parse failure as data.
      }
    }
    documentMaps.push({ kind, parsed, importCount, scopeCount });
  }
  return { domChannel: { state: 'available' }, documentMaps };
}

function mapEffective(
  summary: unknown,
  rawShimMap: unknown,
  errors: CollectionError[],
  limits: CollectorLimits,
): { shimChannel: ChannelStateV1; effective: EffectiveImportMapV1 | null } {
  if (!isObjectLike(summary) || dataValue(summary, 'present') !== true) {
    return {
      shimChannel: { state: 'unavailable', reason: 'window.importShim is not present' },
      effective: null,
    };
  }
  if (dataValue(summary, 'descriptor') !== 'data') {
    return {
      shimChannel: {
        state: 'not-recognized',
        reason: 'importShim is accessor-backed; passive read skipped',
      },
      effective: null,
    };
  }

  if (
    !isObjectLike(rawShimMap) ||
    dataValue(rawShimMap, 'schemaVersion') !== 'shim-map-probe/1'
  ) {
    if (rawShimMap !== null && rawShimMap !== undefined) {
      appendError(errors, limits, 'mapper', 'shim-result-invalid');
    }
    return {
      shimChannel: {
        state: 'not-recognized',
        reason: 'importShim present but the shim map probe returned no result',
      },
      effective: null,
    };
  }

  carryErrors(dataValue(rawShimMap, 'errors'), errors, limits);

  const rawMap = dataValue(rawShimMap, 'map');
  if (!isObjectLike(rawMap)) {
    return {
      shimChannel: {
        state: 'not-recognized',
        reason: 'importShim present but the effective map could not be read',
      },
      effective: null,
    };
  }

  const projection = projectSchema(
    rawMap,
    EFFECTIVE_IMPORT_MAP_SCHEMA,
    createContext(limits, errors, 'mapper', 'effectiveImportMap'),
  );
  return {
    shimChannel: { state: 'available' },
    effective: toEffective(projection, errors, limits),
  };
}

function toEffective(
  value: unknown,
  errors: CollectionError[],
  limits: CollectorLimits,
): EffectiveImportMapV1 {
  const imports = toEntries(dataValue(value, 'imports'), errors, limits, 'effectiveImportMap.imports');
  const scopes: ImportMapScopeV1[] = [];
  const scopesRaw = dataValue(value, 'scopes');
  if (isObjectLike(scopesRaw)) {
    for (const [scopeKey, scopeImports] of Object.entries(scopesRaw)) {
      const scope = sanitizeMaybeUrl(scopeKey);
      if (scope === null) {
        appendError(errors, limits, 'mapper', 'scope-key-dropped', {
          path: 'effectiveImportMap.scopes',
        });
        continue;
      }
      scopes.push({
        scope,
        imports: toEntries(scopeImports, errors, limits, 'effectiveImportMap.scopes'),
      });
    }
  }
  // The integrity projection keys are already sanitized target URLs; the
  // SRI hash values are dropped here — presence only.
  const integrityRaw = dataValue(value, 'integrity');
  const integrityFor = isObjectLike(integrityRaw) ? Object.keys(integrityRaw) : [];
  return { imports, scopes, integrityFor };
}

function toEntries(
  value: unknown,
  errors: CollectionError[],
  limits: CollectorLimits,
  path: string,
): ImportMapEntryV1[] {
  const entries: ImportMapEntryV1[] = [];
  if (!isObjectLike(value)) {
    return entries;
  }
  for (const [specifierKey, target] of Object.entries(value)) {
    if (typeof target !== 'string') {
      continue;
    }
    const specifier = sanitizeMaybeUrl(specifierKey);
    if (specifier === null) {
      appendError(errors, limits, 'mapper', 'specifier-dropped', { path });
      continue;
    }
    entries.push({ specifier, target });
  }
  return entries;
}

/**
 * Map keys can be bare specifiers or URLs. URL-shaped keys — absolute,
 * protocol-relative, or path-relative (`/`, `./`, `../`) — are sanitized
 * like every other URL (userinfo, query, and fragment stripped). Bare
 * specifiers pass through untouched: `foo?x` is a legal specifier name,
 * not a URL, so nothing may be stripped there. Returns null when a
 * URL-shaped key cannot be sanitized — the caller drops the entry.
 */
function sanitizeMaybeUrl(key: string): string | null {
  if (
    /^https?:\/\//i.test(key) ||
    key.startsWith('/') ||
    key.startsWith('./') ||
    key.startsWith('../')
  ) {
    return sanitizeUrl(key);
  }
  return key;
}
