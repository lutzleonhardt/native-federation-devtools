import type { RegistryServingSlotClaim } from './claims-model';
import { registryEvidenceId } from './ids';
import type { CanonicalRegistryEvidence } from './model';

/**
 * Derives the source-defined basis slot of every version registration from
 * stored order alone: the first declaration of a non-empty non-`scope`
 * registration is the qualified basis slot. The slot is never recomputed
 * from `cached` and never manufactured by sorting declarations.
 */
export function deriveRegistryServingSlots(
  evidence: CanonicalRegistryEvidence,
): RegistryServingSlotClaim[] {
  return evidence.versionRegistrations.map((registration) => {
    const id = registryEvidenceId('registry-serving-slot-claim', [registration.id], 0);
    if (registration.action === 'scope') {
      return {
        id,
        versionRegistrationId: registration.id,
        declarationId: null,
        status: 'not-applicable' as const,
        provenance: registration.provenance,
      };
    }

    const firstDeclarationId = registration.participantDeclarationIds[0] ?? null;
    if (firstDeclarationId === null) {
      return {
        id,
        versionRegistrationId: registration.id,
        declarationId: null,
        status: 'empty' as const,
        provenance: registration.provenance,
      };
    }
    return {
      id,
      versionRegistrationId: registration.id,
      declarationId: firstDeclarationId,
      status: 'basis-slot' as const,
      provenance: registration.provenance,
    };
  });
}
