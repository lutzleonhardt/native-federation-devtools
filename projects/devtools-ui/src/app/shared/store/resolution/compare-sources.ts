import type {
  DeclarationResolutionClaimId,
  ObservedTargetProvider,
  QualifiedSourceClaim,
  SourceComparison,
  SourceComparisonKind,
  SourceMatch,
} from './claims-model';
import { registryEvidenceId } from './ids';
import type { EvidenceProvenance, ParticipantDeclarationId } from './model';

const VALID_PAIRINGS: Record<
  SourceComparisonKind,
  { left: QualifiedSourceClaim['kind']; right: QualifiedSourceClaim['kind'] }
> = {
  'slot-vs-observed': { left: 'registry-serving-slot', right: 'observed-target-source' },
  'anchor-vs-observed': { left: 'explicit-anchor', right: 'observed-target-source' },
  'candidate-vs-target': { left: 'own-candidate', right: 'effective-target' },
};

/**
 * Builds one comparison between two qualified source claims. Only the three
 * closed kind/orientation pairings are valid; any other discriminant pair is
 * rejected instead of silently reordered, so comparison IDs stay deterministic.
 */
export function createSourceComparison(options: {
  claimId: DeclarationResolutionClaimId;
  kind: SourceComparisonKind;
  left: QualifiedSourceClaim;
  right: QualifiedSourceClaim;
  status: SourceComparison['status'];
  provenance: EvidenceProvenance;
}): SourceComparison {
  const pairing = VALID_PAIRINGS[options.kind];
  if (options.left.kind !== pairing.left || options.right.kind !== pairing.right) {
    throw new Error(
      `Invalid source comparison pairing for ${options.kind}: ` +
        `${options.left.kind} vs ${options.right.kind}`,
    );
  }
  return {
    id: registryEvidenceId('source-comparison', [options.claimId, options.kind], 0),
    claimId: options.claimId,
    kind: options.kind,
    left: options.left,
    right: options.right,
    status: options.status,
    provenance: options.provenance,
  };
}

/**
 * Agreement between a registry-side expectation and the observed target
 * source. A unique exact source compares at declaration level when the
 * expectation names a declaration, otherwise at remote level; scope-derived
 * and host-fallback attributions compare at remote level only; ambiguous,
 * unattributable, and unknown attributions stay `unknown` — ambiguity remains
 * data and never forces a verdict.
 */
export function observedAgreementStatus(options: {
  /** Subject-level expectation (registry slot); null compares at remote level. */
  declarationId: ParticipantDeclarationId | null;
  /** Remote-level expectation (slot participant or `servedBy` anchor remote). */
  remote: string;
  sourceMatch: SourceMatch;
  provider: ObservedTargetProvider;
}): SourceComparison['status'] {
  if (options.provider.outcome === 'exact-candidate') {
    if (options.declarationId !== null) {
      return options.sourceMatch.source?.kind === 'shared' &&
        options.sourceMatch.source.participantDeclarationId === options.declarationId
        ? 'match'
        : 'mismatch';
    }
    return options.provider.remote === options.remote ? 'match' : 'mismatch';
  }
  if (
    options.provider.outcome === 'scope-derived' ||
    options.provider.outcome === 'host-fallback'
  ) {
    return options.provider.remote === options.remote ? 'match' : 'mismatch';
  }
  return 'unknown';
}

/** Exact own-candidate/target agreement; unevaluable sides stay `unknown`. */
export function candidateTargetStatus(
  ownCandidateUrl: string | null,
  effectiveTargetUrl: string | null,
): SourceComparison['status'] {
  if (ownCandidateUrl === null || effectiveTargetUrl === null) {
    return 'unknown';
  }
  return ownCandidateUrl === effectiveTargetUrl ? 'match' : 'mismatch';
}
