/**
 * Chunk section of the Packages detail pane — rendered exclusively from the
 * canonical `BundleClaim` records of the group's resolved copies (T7-AC-04).
 * Only a `mapped-source` claim presents registered chunk files without
 * qualification; `source-only` and `ambiguous` claims surface their
 * uncertainty instead of implying mapped backing chunks. Files are recorded
 * registry evidence — available for loading, never proof of requests or
 * downloads.
 */
import type { BundleClaimStatus } from '../../shared/store/resolution';
import {
  CanonicalIndexes,
  PackageGroup,
  chunkFileClaim,
  isHostRemote,
  participantDisplay,
} from './packages-vm-shared';

/** One canonical bundle claim of a resolved copy, render-ready. */
export interface ChunkClaimVm {
  /** Canonical bundle-claim ID (structural tuple; render tracking key). */
  claimId: string;
  bundle: string;
  status: BundleClaimStatus;
  /** Grounded qualification of the claim (tooltip). */
  note: string;
  /**
   * Source remote of the claim; under ambiguity the candidate remote —
   * surfaced, never chosen. Null when no remote is named.
   */
  source: { display: string; host: boolean; remoteSelect: string } | null;
  /** Registered chunk files of the claim's chunk groups, registry order. */
  files: string[];
  /** Shared chunk-file wording (`view-conventions.ts`); claims absence explicitly. */
  fileClaim: string;
}

export interface ChunkSectionVm {
  claims: ChunkClaimVm[];
  rule: 'bundle-claim';
}

function claimNote(status: BundleClaimStatus, sourceDisplay: string | null): string {
  switch (status) {
    case 'mapped-source':
      return `registered chunk list of this source's bundle — available for loading, not proof of delivery`;
    case 'source-only':
      return 'the source names this bundle, but the capture registers no chunk list for it';
    case 'ambiguous':
      return `ambiguous source — ${
        sourceDisplay ?? 'a candidate'
      } is one candidate for this bundle; chunks are not attributed`;
  }
}

/** Chunk section from the canonical bundle claims of the group's copies. */
export function buildChunkSection(
  group: PackageGroup,
  indexes: CanonicalIndexes,
): { chunks: ChunkSectionVm | null; chunksUnavailable: string | null } {
  if (group.copies.length === 0) {
    return {
      chunks: null,
      chunksUnavailable: 'no resolved copies — no bundle evidence to attribute',
    };
  }
  const claims: ChunkClaimVm[] = [];
  for (const copy of group.copies) {
    for (const claimId of copy.bundleClaimIds) {
      const claim = indexes.bundleClaimById.get(claimId);
      if (claim === undefined) {
        continue;
      }
      const files = claim.chunkGroupIds.flatMap(
        (groupId) => indexes.chunkGroupById.get(groupId)?.files ?? [],
      );
      const sourceDisplay =
        claim.sourceRemote === null ? null : participantDisplay(claim.sourceRemote);
      claims.push({
        claimId: claim.id,
        bundle: claim.bundle,
        status: claim.status,
        note: claimNote(claim.status, sourceDisplay),
        source:
          claim.sourceRemote === null
            ? null
            : {
                display: sourceDisplay!,
                host: isHostRemote(claim.sourceRemote),
                remoteSelect: claim.sourceRemote,
              },
        files,
        fileClaim: chunkFileClaim(files),
      });
    }
  }
  if (claims.length === 0) {
    return {
      chunks: null,
      chunksUnavailable: 'no bundle claims recorded for this package’s copies',
    };
  }
  return { chunks: { claims, rule: 'bundle-claim' }, chunksUnavailable: null };
}
