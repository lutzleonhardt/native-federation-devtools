/**
 * Chunk section of the Packages detail pane — strictly gated on the
 * providing remote's attribution ladder (level package / remote / none),
 * with honest unavailability when no unique providing remote exists.
 *
 * Per-file map evidence comes from the shared chunk-map join
 * (`shared/chunk-map-join.ts`) — the same source the Import Map view
 * annotates from, so the "mapped" link and the chunk-row annotation over
 * there cannot contradict each other (T12).
 */
import { ChunkFileMapJoin, joinChunkFilesToMap } from '../../shared/chunk-map-join';
import type { DerivedFederation, SharedRowFacts } from '../../shared/store/derived-model';
import type { FederationModel } from '../../shared/store/federation-model';
import { PackageGroup, chunkFileClaim, participantDisplay } from './packages-vm-shared';

/** One chunk file with its map evidence — the `select` payload is the entry's real specifier. */
export interface ChunkFileRowVm {
  file: string;
  /** Null when the file resolves to no effective-map target (honest). */
  mapped: {
    specifier: string;
    targetUrl: string;
    hasIntegrity: boolean;
    /** `select` payload for the /import-map cross-link. */
    select: string;
  } | null;
}

/** Chunk section, strictly gated on the providing remote's attribution ladder. */
export type ChunkSectionVm =
  | {
      level: 'package';
      remote: string;
      /** Display form of the remote (`__NF-HOST__` reads as 'host'). */
      remoteDisplay: string;
      /**
       * Null when the remote records chunk lists but none for this package.
       * `fileClaim` renders the evidence, never a bare count (shared wording
       * with the Remotes detail): an empty file list claims the absence.
       * `mappedCount` counts `fileRows` with map evidence — the claim line
       * and the per-file links speak about the same set by construction.
       */
      packageEntry: {
        bundleName: string;
        files: string[];
        fileRows: ChunkFileRowVm[];
        fileClaim: string;
        mappedCount: number;
      } | null;
      rule: 'bundle-chunk-join';
    }
  | {
      level: 'remote';
      remote: string;
      remoteDisplay: string;
      groupCount: number;
      note: string;
      rule: 'chunk-pseudo-externals';
    }
  | { level: 'none'; remote: string; remoteDisplay: string; note: string; rule: 'no-chunk-evidence' };

/** Per-file rows of one bundle from the shared chunk-map join. */
function fileRowsOf(
  files: string[],
  bundleName: string,
  remote: string,
  joins: ChunkFileMapJoin[],
): ChunkFileRowVm[] {
  const joinByFile = new Map<string, ChunkFileMapJoin>();
  for (const join of joins) {
    if (
      join.owningRemote === remote &&
      join.bundleName === bundleName &&
      !joinByFile.has(join.file)
    ) {
      joinByFile.set(join.file, join);
    }
  }
  return files.map((file) => {
    const entry = joinByFile.get(file)?.entry ?? null;
    return {
      file,
      mapped:
        entry === null
          ? null
          : {
              specifier: entry.specifier,
              targetUrl: entry.target,
              hasIntegrity: entry.hasIntegrity,
              select: entry.specifier,
            },
    };
  });
}

/** Chunk section gated on the providing remote's attribution ladder. */
export function buildChunkSection(
  group: PackageGroup,
  winner: SharedRowFacts | null,
  model: FederationModel,
  derived: DerivedFederation,
): { chunks: ChunkSectionVm | null; chunksUnavailable: string | null } {
  if (winner === null) {
    return { chunks: null, chunksUnavailable: 'no unique providing remote in this share scope' };
  }
  const remote = winner.row.participant;
  const remoteDisplay = participantDisplay(remote);
  const attribution = derived.chunkAttribution.find((entry) => entry.remote === remote);
  if (attribution === undefined) {
    return {
      chunks: null,
      chunksUnavailable: 'providing remote not present in the captured registry',
    };
  }
  switch (attribution.level) {
    case 'package': {
      const entry = attribution.packages.find(
        (candidate) => candidate.packageName === group.packageName,
      );
      const fileRows =
        entry === undefined
          ? []
          : fileRowsOf(entry.files, entry.bundleName, remote, joinChunkFilesToMap(model));
      return {
        chunks: {
          level: 'package',
          remote,
          remoteDisplay,
          packageEntry:
            entry === undefined
              ? null
              : {
                  bundleName: entry.bundleName,
                  files: entry.files,
                  fileRows,
                  fileClaim: chunkFileClaim(entry.files),
                  mappedCount: fileRows.filter((row) => row.mapped !== null).length,
                },
          rule: 'bundle-chunk-join',
        },
        chunksUnavailable: null,
      };
    }
    case 'remote':
      return {
        chunks: {
          level: 'remote',
          remote,
          remoteDisplay,
          groupCount: attribution.groups.length,
          note: `chunks belong to ${remoteDisplay}; package attribution not derivable`,
          rule: 'chunk-pseudo-externals',
        },
        chunksUnavailable: null,
      };
    case 'none':
      return {
        chunks: {
          level: 'none',
          remote,
          remoteDisplay,
          note: `no chunk evidence recorded for ${remoteDisplay} — the capture shows no chunk lists (dense-chunking capability absent)`,
          rule: 'no-chunk-evidence',
        },
        chunksUnavailable: null,
      };
  }
}
