/**
 * Chunk section of the Packages detail pane — strictly gated on the
 * providing remote's attribution ladder (level package / remote / none),
 * with honest unavailability when no unique providing remote exists.
 */
import type { DerivedFederation, SharedRowFacts } from '../../shared/store/derived-model';
import { PackageGroup, chunkFileClaim, participantDisplay } from './packages-vm-shared';

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
       */
      packageEntry: {
        bundleName: string;
        files: string[];
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

/** Chunk section gated on the providing remote's attribution ladder. */
export function buildChunkSection(
  group: PackageGroup,
  winner: SharedRowFacts | null,
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
                  fileClaim: chunkFileClaim(entry.files),
                  mappedCount: attribution.groups
                    .filter(
                      (chunkGroup) =>
                        chunkGroup.origin === 'shared-chunks' &&
                        chunkGroup.bundleName === entry.bundleName &&
                        chunkGroup.mapped,
                    )
                    .reduce((count, chunkGroup) => count + chunkGroup.files.length, 0),
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
