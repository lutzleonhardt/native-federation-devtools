/**
 * Public surface of the canonical resolution layer. Outside consumers import
 * from this barrel only; everything not exported here is folder-internal
 * (`ids`, `derive-registry-serving-slots`, `attribute-observed-target-providers`,
 * `compare-sources`). The exports follow the pipeline order: registry
 * evidence, consumer bindings, declaration claims, resolved copies, package
 * measures, chunk groups, bundle claims, and the canonical projection.
 */
export type * from './model';
export type * from './claims-model';
export type * from './copies-model';
export type * from './bundle-claims-model';
export type * from './projection-model';

export {
  normalizeRegistryEvidence,
  type NormalizeRegistryEvidenceOptions,
} from './normalize-registry-evidence';
export {
  resolveEffectiveConsumerBindings,
  type ResolveEffectiveConsumerBindingsContext,
} from './resolve-effective-consumer-bindings';
export { deriveResolutionClaims, type ResolutionClaimsContext } from './derive-declaration-claims';
export {
  attachCopyIds,
  materializeResolvedCopies,
  type MaterializeResolvedCopiesContext,
} from './materialize-resolved-copies';
export { aggregatePackageMeasures } from './aggregate-package-measures';
export { deriveChunkGroups } from './derive-chunk-groups';
export { attachBundleClaimIds, deriveBundleClaims } from './derive-bundle-claims';
export {
  buildCanonicalProjection,
  type CanonicalProjectionInputs,
} from './build-canonical-projection';
