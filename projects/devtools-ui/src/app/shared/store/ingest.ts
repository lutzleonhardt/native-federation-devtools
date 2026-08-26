/**
 * `ingestSnapshot` — one ingest of a `SnapshotV1` produces the
 * `FederationModel` every view projects.
 *
 * Ingest rules (corpus-derived, see the plan/spec):
 * - The registry is read ONCE, into canonical evidence
 *   (`normalizeRegistryEvidence`): shared externals, version
 *   registrations, participant declarations, private registrations
 *   (true scoped packages), and entrypoint candidates — registrations
 *   keep their raw order, views sort. Chunk groups come from the
 *   canonical `deriveChunkGroups` over the UNION of both sources:
 *   scoped externals named `@nf-internal/...` (v4.5 non-dense) and the
 *   `shared-chunks` bundle lists (v4/dense); chunk groups never count
 *   as packages.
 * - An absent repository key equals `{}` (the mapper already projects
 *   lazily-absent keys to empty containers; `runtime: null` means the
 *   whole channel was missing — the one zero-entry accessor lives here).
 * - Expose joining tolerates the literal `/./` infix: live maps join
 *   naively (`<remoteName>/./<moduleName>`).
 * - Secondary-entry externals (`pkg/subpath`) stay their own externals;
 *   their spellings are entrypoint candidates of the registry evidence.
 * - Load-time-relative values (relative map targets, remote scope URLs)
 *   resolve against the recovered parse-time base
 *   (`deriveResolutionBase`), not `capture.pageUrl` — SPA navigation moves
 *   the capture URL away from the base the loader resolved against.
 */
import { NF_HOST, type SnapshotV1 } from 'devtools-bridge';
import type {
  EffectiveMap,
  ExposeJoin,
  FederationModel,
  ImportMapEntryRow,
  RemoteEntity,
} from './federation-model';
import {
  deriveResolutionBase,
  detectMapMode,
  mergeDocumentMaps,
  resolveUrl,
} from './merge-document-maps';
import {
  aggregatePackageMeasures,
  attachBundleClaimIds,
  attachCopyIds,
  buildCanonicalProjection,
  deriveBundleClaims,
  deriveChunkGroups,
  deriveResolutionClaims,
  materializeResolvedCopies,
  normalizeRegistryEvidence,
  resolveEffectiveConsumerBindings,
} from './resolution';

export function ingestSnapshot(snapshot: SnapshotV1): FederationModel {
  const pageUrl = snapshot.capture.pageUrl;
  const tags = snapshot.importMaps?.documentMaps ?? [];
  const mapMode = detectMapMode(tags);
  // Load-time-relative values (map targets, remote scope URLs) resolve
  // against the parse-time document base, not the capture URL — on an SPA
  // page `pushState` has moved `pageUrl` away from the base the loader and
  // the NF runtime already resolved against.
  const resolutionBase = deriveResolutionBase(
    tags,
    snapshot.importMaps?.effective ?? null,
    pageUrl,
  );
  const baseUrl = resolutionBase.url;
  const effectiveMap = mergeDocumentMaps(tags, baseUrl);

  const runtime = snapshot.runtime;
  const remotesRepo = runtime?.remotes ?? {};
  const chunksRepo = runtime?.sharedChunks ?? {};

  const remotes: RemoteEntity[] = Object.entries(remotesRepo).map(([name, remote]) => ({
    name,
    isHost: name === NF_HOST,
    scopeUrl: remote.scopeUrl,
    resolvedScopeUrl: resolveUrl(remote.scopeUrl, baseUrl),
    exposes: remote.exposes.map((expose): ExposeJoin => ({
      moduleName: expose.moduleName,
      file: expose.file,
      mapTarget: joinExpose(name, expose.moduleName, effectiveMap),
    })),
    integrity: remote.integrity,
  }));
  const scopeUrlByRemote = new Map(remotes.map((remote) => [remote.name, remote.resolvedScopeUrl]));
  const registryEvidence = normalizeRegistryEvidence(snapshot, { resolutionBase });
  const effectiveConsumerResolutions = resolveEffectiveConsumerBindings(registryEvidence, {
    resolutionBaseUrl: baseUrl,
    // Document tags are the merge ground truth; the shim map is only a
    // cross-check — plus the base-recovery oracle after SPA navigation.
    mapAvailable: snapshot.channels.domImportMaps.state === 'available',
    effectiveMap,
    consumerScopeUrlByRemote: scopeUrlByRemote,
  });
  const resolutionClaims = deriveResolutionClaims(registryEvidence, effectiveConsumerResolutions, {
    remoteScopeUrlByName: scopeUrlByRemote,
    hostRemote: NF_HOST,
  });
  const materializedCopies = materializeResolvedCopies(
    registryEvidence,
    effectiveConsumerResolutions,
    resolutionClaims,
    // URL-identified copy IDs are namespaced by capture identity.
    { snapshotIdentity: `${snapshot.capture.capturedAt}|${pageUrl}` },
  );
  const declarationResolutionClaims = attachCopyIds(
    resolutionClaims.declarationResolutionClaims,
    materializedCopies,
  );
  const canonicalChunkGroups = deriveChunkGroups(registryEvidence, chunksRepo);
  const bundleClaims = deriveBundleClaims(
    registryEvidence,
    resolutionClaims,
    materializedCopies,
    canonicalChunkGroups,
  );
  const resolvedCopies = attachBundleClaimIds(materializedCopies, bundleClaims);
  const resolutionProjection = buildCanonicalProjection({
    remotes: remotes.map(({ name, isHost, scopeUrl, resolvedScopeUrl }) => ({
      name,
      isHost,
      scopeUrl,
      resolvedScopeUrl,
    })),
    resolutions: effectiveConsumerResolutions,
    claims: { ...resolutionClaims, declarationResolutionClaims },
    copies: resolvedCopies,
    chunkGroups: canonicalChunkGroups,
    bundleClaims,
    packageMeasures: aggregatePackageMeasures(
      registryEvidence,
      declarationResolutionClaims,
      resolvedCopies,
    ),
  });

  const importMapEntries: ImportMapEntryRow[] = [];
  for (const [specifier, target] of Object.entries(effectiveMap.imports)) {
    importMapEntries.push({
      specifier,
      target,
      scope: null,
      hasIntegrity: hasOwn(effectiveMap.integrity, target),
    });
  }
  for (const [scope, entries] of Object.entries(effectiveMap.scopes)) {
    for (const [specifier, target] of Object.entries(entries)) {
      importMapEntries.push({
        specifier,
        target,
        scope,
        hasIntegrity: hasOwn(effectiveMap.integrity, target),
      });
    }
  }

  return {
    provenance: {
      schemaVersion: snapshot.schemaVersion,
      pageUrl,
      capturedAt: snapshot.capture.capturedAt,
      collectorVersion: snapshot.capture.collectorVersion,
      generation: runtime?.generation ?? 'unknown',
    },
    channels: snapshot.channels,
    mapMode,
    effectiveMap,
    registryEvidence,
    effectiveConsumerResolutions,
    resolutionProjection,
    remotes,
    importMapEntries,
  };
}

/** Finds the map target for an expose via the naive `<remote>/<moduleName>` join. */
function joinExpose(
  remoteName: string,
  moduleName: string,
  effectiveMap: EffectiveMap,
): string | null {
  const wanted = collapseDotInfix(`${remoteName}/${moduleName}`);
  for (const [specifier, target] of Object.entries(effectiveMap.imports)) {
    if (collapseDotInfix(specifier) === wanted) {
      return target;
    }
  }
  for (const scopeImports of Object.values(effectiveMap.scopes)) {
    for (const [specifier, target] of Object.entries(scopeImports)) {
      if (collapseDotInfix(specifier) === wanted) {
        return target;
      }
    }
  }
  return null;
}

function collapseDotInfix(specifier: string): string {
  return specifier.replace(/\/\.\//g, '/');
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}
