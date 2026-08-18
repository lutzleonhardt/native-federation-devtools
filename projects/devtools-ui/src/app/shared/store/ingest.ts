/**
 * `ingestSnapshot` — one ingest of a `SnapshotV1` produces the
 * `FederationModel` every V2 view projects.
 *
 * Ingest rules (corpus-derived, see the V2 plan/spec):
 * - Chunk reclassification reads the UNION of both sources: scoped
 *   externals named `@nf-internal/...` (v4.5 non-dense) and the
 *   `shared-chunks` bundle lists (v4/dense). Reclassified entries
 *   become chunk groups of their owning remote and never count as
 *   packages; true scoped packages stay scoped externals.
 * - Version rows sort (semver tag desc, action) in the store — the
 *   registry's semver order is reliable, its same-tag tie order is not.
 * - An absent repository key equals `{}` (the mapper already projects
 *   lazily-absent keys to empty containers; `runtime: null` means the
 *   whole channel was missing — the one zero-entry accessor lives here).
 * - Expose joining tolerates the literal `/./` infix: live maps join
 *   naively (`<remoteName>/./<moduleName>`).
 * - Secondary-entry externals (`pkg/subpath`) stay their own externals —
 *   parent linking is a Task-7 derivation.
 */
import { NF_HOST, type SnapshotV1 } from 'devtools-bridge';
import type {
  ChunkGroup,
  EffectiveMap,
  ExposeJoin,
  FederationModel,
  ImportMapEntryRow,
  RemoteEntity,
  ScopedPackageRow,
} from './federation-model';
import { detectMapMode, mergeDocumentMaps, resolveUrl } from './merge-document-maps';
import { normalizeRegistryEvidence } from './resolution/normalize-registry-evidence';
import { resolveEffectiveConsumerBindings } from './resolution/resolve-effective-consumer-bindings';
import { projectSharedRows } from './resolution/shared-rows-compat';

/** Stable specifier marker of chunk pseudo-externals in both generations. */
const CHUNK_PSEUDO_PACKAGE_PREFIX = '@nf-internal/';

export function ingestSnapshot(snapshot: SnapshotV1): FederationModel {
  const pageUrl = snapshot.capture.pageUrl;
  const tags = snapshot.importMaps?.documentMaps ?? [];
  const mapMode = detectMapMode(tags);
  const effectiveMap = mergeDocumentMaps(tags, pageUrl);
  const mapTargets = collectTargets(effectiveMap);

  const runtime = snapshot.runtime;
  const remotesRepo = runtime?.remotes ?? {};
  const scopedRepo = runtime?.scopedExternals ?? {};
  const chunksRepo = runtime?.sharedChunks ?? {};

  const remotes: RemoteEntity[] = Object.entries(remotesRepo).map(([name, remote]) => ({
    name,
    isHost: name === NF_HOST,
    scopeUrl: remote.scopeUrl,
    resolvedScopeUrl: resolveUrl(remote.scopeUrl, pageUrl),
    exposes: remote.exposes.map(
      (expose): ExposeJoin => ({
        moduleName: expose.moduleName,
        file: expose.file,
        mapTarget: joinExpose(name, expose.moduleName, effectiveMap),
      }),
    ),
    integrity: remote.integrity,
  }));
  const scopeUrlByRemote = new Map(
    remotes.map((remote) => [remote.name, remote.resolvedScopeUrl]),
  );
  const registryEvidence = normalizeRegistryEvidence(snapshot);
  const effectiveConsumerResolutions = resolveEffectiveConsumerBindings(registryEvidence, {
    pageUrl,
    // Document tags are the merge ground truth; the shim map is only a cross-check.
    mapAvailable: snapshot.channels.domImportMaps.state === 'available',
    effectiveMap,
    consumerScopeUrlByRemote: scopeUrlByRemote,
  });
  const sharedRows = projectSharedRows(registryEvidence, {
    effectiveConsumerResolutions,
  });

  const scopedPackages: ScopedPackageRow[] = [];
  const chunkGroups: ChunkGroup[] = [];
  for (const [scope, packages] of Object.entries(scopedRepo)) {
    for (const [packageName, scopedPackage] of Object.entries(packages)) {
      if (packageName.startsWith(CHUNK_PSEUDO_PACKAGE_PREFIX)) {
        const files = Object.values(scopedPackage.entries);
        chunkGroups.push({
          owningRemote: scope,
          bundleName: scopedPackage.bundle,
          pseudoPackage: packageName,
          origin: 'scoped-pseudo-external',
          files,
          mapped: allFilesMapped(files, scope, scopeUrlByRemote, pageUrl, mapTargets),
        });
      } else {
        scopedPackages.push({
          scope,
          packageName,
          tag: scopedPackage.tag,
          bundle: scopedPackage.bundle,
          entries: scopedPackage.entries,
        });
      }
    }
  }
  for (const [remoteName, bundles] of Object.entries(chunksRepo)) {
    for (const [bundleName, files] of Object.entries(bundles)) {
      // The registry writes structural zero-entry bundle lists
      // ('mapping-or-exposed' is empty in every capture — nothing may
      // depend on its contents); zero files contribute zero chunks.
      if (files.length === 0) {
        continue;
      }
      chunkGroups.push({
        owningRemote: remoteName,
        bundleName,
        pseudoPackage: null,
        origin: 'shared-chunks',
        files,
        mapped: allFilesMapped(files, remoteName, scopeUrlByRemote, pageUrl, mapTargets),
      });
    }
  }

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
    sharedRows,
    scopedPackages,
    remotes,
    chunkGroups,
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

function allFilesMapped(
  files: string[],
  owningRemote: string,
  scopeUrlByRemote: Map<string, string>,
  pageUrl: string,
  mapTargets: Set<string>,
): boolean {
  const base = scopeUrlByRemote.get(owningRemote) ?? pageUrl;
  return files.every((file) => mapTargets.has(resolveUrl(file, base)));
}

function collectTargets(effectiveMap: EffectiveMap): Set<string> {
  const targets = new Set(Object.values(effectiveMap.imports));
  for (const scopeImports of Object.values(effectiveMap.scopes)) {
    for (const target of Object.values(scopeImports)) {
      targets.add(target);
    }
  }
  return targets;
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}
