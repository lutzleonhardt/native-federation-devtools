import type { RuntimeRepositoriesV1 } from 'devtools-bridge';

import type { ChunkGroupProjection } from './bundle-claims-model';
import { registryEvidenceId } from './ids';
import type { CanonicalRegistryEvidence } from './model';

/** Stable specifier marker of legacy chunk pseudo-externals. */
export const CHUNK_PSEUDO_PACKAGE_PREFIX = '@nf-internal/';

/**
 * Derives the emitter-aware canonical chunk groups from both witnessed chunk
 * sources: the dense `shared-chunks` registry and legacy `@nf-internal/...`
 * pseudo-externals already normalized as private registrations. The raw
 * repository shape is consumed at this ingest boundary only; the output is
 * raw-free. The registry writes structural zero-entry bundle lists
 * (`mapping-or-exposed` is empty in every capture — nothing may depend on
 * its contents); zero files contribute zero chunk groups.
 */
export function deriveChunkGroups(
  evidence: CanonicalRegistryEvidence,
  sharedChunks: RuntimeRepositoriesV1['sharedChunks'],
): ChunkGroupProjection[] {
  const groups: ChunkGroupProjection[] = [];
  for (const [emitterRemote, bundles] of Object.entries(sharedChunks)) {
    for (const [bundleName, files] of Object.entries(bundles)) {
      if (files.length === 0) {
        continue;
      }
      groups.push({
        id: registryEvidenceId('chunk-group', [emitterRemote, 'shared-chunks', bundleName], 0),
        emitterRemote,
        origin: 'shared-chunks',
        bundleName,
        pseudoPackage: null,
        files: [...files],
        provenance: {
          evidence: [
            {
              source: 'snapshot',
              path: ['runtime', 'sharedChunks', emitterRemote, bundleName],
              state: 'present',
            },
          ],
        },
      });
    }
  }

  const candidatesById = new Map(
    evidence.entrypointCandidates.map((candidate) => [candidate.id, candidate]),
  );
  for (const registration of evidence.privateRegistrations) {
    if (!registration.packageName.startsWith(CHUNK_PSEUDO_PACKAGE_PREFIX)) {
      continue;
    }
    const files: string[] = [];
    for (const candidateId of registration.entrypointCandidateIds) {
      const candidate = candidatesById.get(candidateId);
      if (candidate === undefined) {
        throw new Error(`Chunk-group derivation references a missing candidate: ${candidateId}`);
      }
      files.push(candidate.file);
    }
    if (files.length === 0) {
      continue;
    }
    groups.push({
      id: registryEvidenceId(
        'chunk-group',
        [registration.ownerRemote, 'scoped-pseudo-external', registration.packageName],
        registration.ordinal,
      ),
      emitterRemote: registration.ownerRemote,
      origin: 'scoped-pseudo-external',
      bundleName: registration.bundle,
      pseudoPackage: registration.packageName,
      files,
      provenance: registration.provenance,
    });
  }
  return groups.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
