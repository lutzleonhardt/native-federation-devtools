/**
 * Chunk-file ↔ effective-map join — the single source both sides of the
 * chunk cross-link consume: the Packages detail derives its per-file
 * "mapped" links from these rows, the Import Map view derives its
 * chunk-row annotations from the same rows, so the two views cannot
 * contradict each other by construction (the `mappedTags` doctrine, T10.5).
 *
 * The join reproduces the ingest's `ChunkGroup.mapped` resolution exactly:
 * a file resolves against its owning remote's resolved scope URL (page
 * base when the remote is not in the registry) and joins the entry whose
 * target is that URL. A file that resolves to no entry stays `entry:
 * null` — honest absence, never a name-derived guess.
 */
import type {
  ChunkOrigin,
  FederationModel,
  ImportMapEntryRow,
} from './store/federation-model';
import { resolveUrl } from './store/merge-document-maps';

/** One chunk file of one group, joined to the effective-map entry serving it. */
export interface ChunkFileMapJoin {
  owningRemote: string;
  /** Bundle name when the group's source carries one. */
  bundleName: string | null;
  /** The `@nf-internal/...` package name for reclassified scoped externals. */
  pseudoPackage: string | null;
  origin: ChunkOrigin;
  file: string;
  /** Entry serving this file (first in map order); null = not mapped. */
  entry: ImportMapEntryRow | null;
}

/** All chunk files of the capture, group order, joined to the effective map. */
export function joinChunkFilesToMap(model: FederationModel): ChunkFileMapJoin[] {
  const baseByRemote = new Map(
    model.remotes.map((remote) => [remote.name, remote.resolvedScopeUrl]),
  );
  const entryByTarget = new Map<string, ImportMapEntryRow>();
  for (const entry of model.importMapEntries) {
    if (!entryByTarget.has(entry.target)) {
      entryByTarget.set(entry.target, entry);
    }
  }
  return model.chunkGroups.flatMap((group) => {
    const base = baseByRemote.get(group.owningRemote) ?? model.provenance.pageUrl;
    return group.files.map((file) => ({
      owningRemote: group.owningRemote,
      bundleName: group.bundleName,
      pseudoPackage: group.pseudoPackage,
      origin: group.origin,
      file,
      entry: entryByTarget.get(resolveUrl(file, base)) ?? null,
    }));
  });
}

/** Joined rows indexed by their entry's target URL (unmapped files excluded). */
export function chunkJoinsByTarget(
  joins: ChunkFileMapJoin[],
): Map<string, ChunkFileMapJoin[]> {
  const byTarget = new Map<string, ChunkFileMapJoin[]>();
  for (const join of joins) {
    if (join.entry === null) {
      continue;
    }
    const claims = byTarget.get(join.entry.target);
    if (claims === undefined) {
      byTarget.set(join.entry.target, [join]);
    } else {
      claims.push(join);
    }
  }
  return byTarget;
}
