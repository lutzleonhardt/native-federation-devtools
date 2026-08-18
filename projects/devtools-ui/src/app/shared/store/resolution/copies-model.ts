import type {
  DeclarationResolutionClaimId,
  ObservedTargetProvider,
  RegistryServingSlotClaim,
  ResolutionDomain,
} from './claims-model';
import type {
  EffectiveConsumerResolutionId,
  EvidenceProvenance,
  ParticipantDeclarationId,
  PrivateRegistrationId,
  RegistrationAction,
  RegistryEvidenceId,
  VersionRegistrationId,
} from './model';

export type ResolvedDependencyCopyId = RegistryEvidenceId<'resolved-dependency-copy'>;

/**
 * Hierarchical source-oriented copy source: a uniquely evidenced source
 * record wins; otherwise the normalized target URL identifies the copy. The
 * copy ID additionally namespaces URL-identified copies by snapshot identity
 * for cross-snapshot storage. Consumer context is never part of the source.
 */
export type ResolvedCopySource =
  | { kind: 'shared-declaration'; declarationId: ParticipantDeclarationId }
  | { kind: 'private-registration'; registrationId: PrivateRegistrationId }
  | { kind: 'target-url'; targetUrl: string };

/**
 * Where the copy's bytes come from, independent of any consumer behavior. A
 * unique shared source maps its raw action; `ambiguous-source` retains that
 * exact candidates exist without choosing one; `target-only` means only the
 * resolved URL itself is evidenced.
 */
export type ResolvedCopySourceDisposition =
  | 'share-registration'
  | 'scope-registration'
  | 'skip-registration'
  | 'private-registration'
  | 'target-only'
  | 'ambiguous-source'
  | 'unknown-registration';

/**
 * How consumers effectively relate to the copy, derived from the attached
 * claim and mapping evidence: a selected `share` surface contributes
 * `ordinary-shared`, a `scope` declaration's own mapping `isolated-own`, a
 * selected skip self-fill source `self-filled-source`, selection through an
 * explicit `servedBy` `anchor-source`, and a private registration's own
 * mapping `private-own`. Roles coexist; a copy no closed rule explains stays
 * `unclassified`.
 */
export type ResolvedCopyEffectiveRole =
  | 'ordinary-shared'
  | 'isolated-own'
  | 'self-filled-source'
  | 'anchor-source'
  | 'private-own'
  | 'unclassified';

/** One consumer-side context using the copy; claims, not copies, own the details. */
export interface ResolvedCopyResolutionContext {
  resolutionDomain: ResolutionDomain;
  /** The registry package the consumers declared under, not the source package. */
  consumerRegistryPackage: string;
  claimIds: DeclarationResolutionClaimId[];
}

/** Evidenced source registrations behind the copy; plural only under ambiguity. */
export type ResolvedCopySourceRegistrationRef =
  { kind: 'shared'; id: VersionRegistrationId } | { kind: 'private'; id: PrivateRegistrationId };

/**
 * One materially resolved dependency instance, derived only from mapped
 * effective resolutions and their claims. A copy proves map resolution, not
 * that the browser requested, downloaded, evaluated, or used the target.
 * `bundleClaimIds` from the specification is deliberately absent until a
 * bundle-claim layer exists.
 */
export interface ResolvedDependencyCopy {
  id: ResolvedDependencyCopyId;
  /** Source registration's package; null when no source is uniquely evidenced. */
  sourcePackage: string | null;
  /** Tag of the uniquely matched source registration only; never a consumer's declared tag. */
  resolvedTag: string | null;
  source: ResolvedCopySource;
  sourceDisposition: ResolvedCopySourceDisposition;
  /** Sorted distinct effective roles contributed by the copy's claims. */
  effectiveRoles: ResolvedCopyEffectiveRole[];
  /** Sorted distinct actions of evidenced sources, not of consumer claims. */
  sourceActions: (RegistrationAction | 'private')[];
  /** Specifier -> effective target URL across the copy's mapped members. */
  entrypoints: Record<string, string>;
  /** Sorted distinct mapped resolutions whose targets this copy materializes. */
  effectiveResolutionIds: EffectiveConsumerResolutionId[];
  /** Grouped per resolution domain and consumer registry package, sorted claim IDs. */
  resolutionContexts: ResolvedCopyResolutionContext[];
  sourceRegistrationRefs: ResolvedCopySourceRegistrationRef[];
  /** Observed attributions of the member resolutions, sorted by ID. */
  observedTargetProviders: ObservedTargetProvider[];
  /** Serving slots of the evidenced source registrations, sorted by ID. */
  registryServingSlotClaims: RegistryServingSlotClaim[];
  provenance: EvidenceProvenance;
}

/**
 * Canonical package-level measures. The four headline counts stay separate on
 * purpose: registrations and declared tags describe shared registry intent,
 * copies and resolved tags describe materialized outcome. No field states a
 * version conflict — equal-tag copy multiplicity alone is not conflict
 * evidence.
 */
export interface PackageResolutionMeasures {
  packageName: string;
  /** Shared version registrations of this package; private records stay separate. */
  registrationCount: number;
  /** Distinct tags across this package's shared version registrations. */
  distinctDeclaredTagCount: number;
  resolvedCopyCount: number;
  /** Distinct non-null resolved tags across this package's copies. */
  distinctResolvedTagCount: number;
  /** Copies of this package whose source tag is not uniquely evidenced. */
  unknownResolvedTagCopyCount: number;
  /** Supporting measure: shared participant declarations of this package. */
  declarationCount: number;
  /** Supporting measure: claims declared under this registry package. */
  claimCount: number;
}
