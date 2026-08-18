/**
 * Source-comparison specs (T4-AC-05): only the three closed kinds with
 * canonical left/right orientation exist, IDs are deterministic, and
 * agreement statuses keep mismatch and ambiguity as data.
 */
import type {
  ObservedTargetProvider,
  QualifiedSourceClaim,
  ResolutionSubject,
  SourceMatch,
  SourceMatchOutcome,
} from './claims-model';
import {
  candidateTargetStatus,
  createSourceComparison,
  observedAgreementStatus,
} from './compare-sources';
import { registryEvidenceId } from './ids';
import type { EffectiveConsumerResolutionId, EvidenceProvenance } from './model';

const EMPTY_PROVENANCE: EvidenceProvenance = { evidence: [] };
const RESOLUTION_ID =
  'effective-consumer-resolution:["scope-context","pkg"]' as EffectiveConsumerResolutionId;
const CLAIM_ID = registryEvidenceId(
  'declaration-resolution-claim',
  ['shared', 'decl-a', 'cand-a'],
  0,
);
const SLOT_CLAIM_ID = registryEvidenceId('registry-serving-slot-claim', ['registration-a'], 0);
const DECLARATION_A = registryEvidenceId('participant-declaration', ['registration-a', 'mfe1'], 0);
const DECLARATION_B = registryEvidenceId('participant-declaration', ['registration-a', 'mfe2'], 0);
const PRIVATE_A = registryEvidenceId('private-registration', ['mfe1', 'pkg'], 0);
const CANDIDATE_A = registryEvidenceId('entrypoint-candidate', [DECLARATION_A, 'pkg', 'a.js'], 0);
const PROVIDER_ID = registryEvidenceId(
  'observed-target-provider',
  [RESOLUTION_ID, 'exact-candidate'],
  0,
);

const RULES: Record<SourceMatchOutcome, ObservedTargetProvider['rule']> = {
  'exact-candidate': 'exact-candidate',
  'ambiguous-candidate': 'none',
  'scope-derived': 'scope-prefix-match',
  'ambiguous-scope': 'none',
  'host-fallback': 'host-fallback',
  unattributable: 'none',
  unknown: 'none',
};

function observed(
  outcome: SourceMatchOutcome,
  options: { remote?: string | null; source?: ResolutionSubject | null } = {},
): { sourceMatch: SourceMatch; provider: ObservedTargetProvider } {
  const provider: ObservedTargetProvider = {
    id: registryEvidenceId('observed-target-provider', [RESOLUTION_ID, outcome], 0),
    resolutionId: RESOLUTION_ID,
    remote: options.remote ?? null,
    outcome,
    rule: RULES[outcome],
    provenance: EMPTY_PROVENANCE,
  };
  return {
    provider,
    sourceMatch: {
      resolutionId: RESOLUTION_ID,
      outcome,
      source: options.source ?? null,
      candidateIds: [],
      observedTargetProviderId: provider.id,
      provenance: EMPTY_PROVENANCE,
    },
  };
}

const SLOT_LEFT: QualifiedSourceClaim = {
  kind: 'registry-serving-slot',
  slotClaimId: SLOT_CLAIM_ID,
  declarationId: DECLARATION_A,
};
const ANCHOR_LEFT: QualifiedSourceClaim = {
  kind: 'explicit-anchor',
  declarationId: DECLARATION_A,
  remote: 'mfe1',
};
const CANDIDATE_LEFT: QualifiedSourceClaim = {
  kind: 'own-candidate',
  candidateId: CANDIDATE_A,
  normalizedUrl: 'https://seeded.example/a.js',
};
const OBSERVED_RIGHT: QualifiedSourceClaim = {
  kind: 'observed-target-source',
  observedTargetProviderId: PROVIDER_ID,
  subject: null,
};
const TARGET_RIGHT: QualifiedSourceClaim = {
  kind: 'effective-target',
  resolutionId: RESOLUTION_ID,
  normalizedUrl: 'https://seeded.example/a.js',
};

describe('createSourceComparison — closed kinds and canonical orientation (T4-AC-05)', () => {
  it('builds the three valid pairings with deterministic claim-and-kind ids', () => {
    const pairings = [
      { kind: 'slot-vs-observed', left: SLOT_LEFT, right: OBSERVED_RIGHT },
      { kind: 'anchor-vs-observed', left: ANCHOR_LEFT, right: OBSERVED_RIGHT },
      { kind: 'candidate-vs-target', left: CANDIDATE_LEFT, right: TARGET_RIGHT },
    ] as const;

    for (const pairing of pairings) {
      const comparison = createSourceComparison({
        claimId: CLAIM_ID,
        kind: pairing.kind,
        left: pairing.left,
        right: pairing.right,
        status: 'match',
        provenance: EMPTY_PROVENANCE,
      });
      expect(comparison.id).toBe(
        registryEvidenceId('source-comparison', [CLAIM_ID, pairing.kind], 0),
      );
      expect(comparison.claimId).toBe(CLAIM_ID);
      expect(comparison.left).toBe(pairing.left);
      expect(comparison.right).toBe(pairing.right);
    }
  });

  it('rejects every other discriminant pair instead of inventing an ordering', () => {
    const invalid = [
      { kind: 'slot-vs-observed', left: CANDIDATE_LEFT, right: OBSERVED_RIGHT },
      { kind: 'anchor-vs-observed', left: ANCHOR_LEFT, right: TARGET_RIGHT },
      { kind: 'candidate-vs-target', left: TARGET_RIGHT, right: CANDIDATE_LEFT },
      { kind: 'candidate-vs-target', left: CANDIDATE_LEFT, right: OBSERVED_RIGHT },
    ] as const;

    for (const pairing of invalid) {
      expect(() =>
        createSourceComparison({
          claimId: CLAIM_ID,
          kind: pairing.kind,
          left: pairing.left,
          right: pairing.right,
          status: 'unknown',
          provenance: EMPTY_PROVENANCE,
        }),
      ).toThrowError(/Invalid source comparison pairing/);
    }
  });
});

describe('observedAgreementStatus — agreement stays data (T4-AC-05)', () => {
  it('compares a declaration-level expectation against a unique exact source', () => {
    const sharedA: ResolutionSubject = { kind: 'shared', participantDeclarationId: DECLARATION_A };
    const sharedB: ResolutionSubject = { kind: 'shared', participantDeclarationId: DECLARATION_B };
    const privateA: ResolutionSubject = { kind: 'private', privateRegistrationId: PRIVATE_A };

    const same = observed('exact-candidate', { remote: 'mfe1', source: sharedA });
    expect(observedAgreementStatus({ declarationId: DECLARATION_A, remote: 'mfe1', ...same })).toBe(
      'match',
    );

    const other = observed('exact-candidate', { remote: 'mfe1', source: sharedB });
    expect(
      observedAgreementStatus({ declarationId: DECLARATION_A, remote: 'mfe1', ...other }),
    ).toBe('mismatch');

    // A private source is a different subject even when its owner remote matches.
    const privateSource = observed('exact-candidate', { remote: 'mfe1', source: privateA });
    expect(
      observedAgreementStatus({ declarationId: DECLARATION_A, remote: 'mfe1', ...privateSource }),
    ).toBe('mismatch');
  });

  it('compares a remote-level expectation for anchors and scope attributions', () => {
    const exact = observed('exact-candidate', {
      remote: 'mfe1',
      source: { kind: 'shared', participantDeclarationId: DECLARATION_A },
    });
    expect(observedAgreementStatus({ declarationId: null, remote: 'mfe1', ...exact })).toBe(
      'match',
    );
    expect(observedAgreementStatus({ declarationId: null, remote: 'mfe2', ...exact })).toBe(
      'mismatch',
    );

    const scoped = observed('scope-derived', { remote: 'mfe1' });
    expect(observedAgreementStatus({ declarationId: null, remote: 'mfe1', ...scoped })).toBe(
      'match',
    );
    expect(
      observedAgreementStatus({ declarationId: DECLARATION_A, remote: 'mfe2', ...scoped }),
    ).toBe('mismatch');

    const host = observed('host-fallback', { remote: '__NF-HOST__' });
    expect(observedAgreementStatus({ declarationId: null, remote: '__NF-HOST__', ...host })).toBe(
      'match',
    );
  });

  it('keeps ambiguous, unattributable, and unknown attributions unknown', () => {
    for (const outcome of [
      'ambiguous-candidate',
      'ambiguous-scope',
      'unattributable',
      'unknown',
    ] as const) {
      const attribution = observed(outcome);
      expect(
        observedAgreementStatus({ declarationId: DECLARATION_A, remote: 'mfe1', ...attribution }),
      ).toBe('unknown');
    }
  });
});

describe('candidateTargetStatus — exact own-candidate agreement (T4-AC-05)', () => {
  it('matches equal URLs, mismatches different URLs, and stays unknown for unevaluable sides', () => {
    expect(candidateTargetStatus('https://x/a.js', 'https://x/a.js')).toBe('match');
    expect(candidateTargetStatus('https://x/a.js', 'https://x/b.js')).toBe('mismatch');
    expect(candidateTargetStatus(null, 'https://x/a.js')).toBe('unknown');
    expect(candidateTargetStatus('https://x/a.js', null)).toBe('unknown');
  });
});
