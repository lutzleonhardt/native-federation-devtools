import type { ResolvedDependencyCopyId } from './copies-model';
import type {
  ParticipantDeclarationId,
  RegistryEvidenceId,
  SharedExternalId,
  VersionRegistrationId,
} from './model';

export type PackageScopeVerdictsId = RegistryEvidenceId<'package-scope-verdicts'>;

/**
 * What the resolver decided for one declaration (version-resolver step 2), read from the stored
 * row action; the range check only tells `reuses-shared` from `out-of-range` on `skip` rows.
 * - `provides`: first participant of a `share` row, whose file the mapping publishes
 * - `same-version`: another participant of a `share` row, or a `skip` row of the elected tag
 * - `reuses-shared`: `skip`, and the range accepts the elected tag
 * - `own-copy`: `scope`
 * - `out-of-range`: `skip`, not strict, and the range rejects the elected tag
 * - `unknown`: no elected tag, an unreadable range or version, or a row the rules cannot explain
 */
export type DeclarationVerdict =
  'provides' | 'same-version' | 'reuses-shared' | 'own-copy' | 'out-of-range' | 'unknown';

/**
 * - `shared` / `scoped`: some row of the tag carries action `share` / `scope`
 * - `partly-loaded`: neither, yet a copy of the tag materializes (it fills another version's
 *   entrypoints)
 * - `not-loaded`: no copy of the tag materializes
 */
export type VersionStatus = 'shared' | 'scoped' | 'partly-loaded' | 'not-loaded';

export interface DeclarationVerdictRecord {
  declarationId: ParticipantDeclarationId;
  participant: string;
  /** The tag this declaration ships. */
  tag: string;
  verdict: DeclarationVerdict;
  /** Whether `requiredVersion` accepts the elected tag per `semver`; null when either is unreadable or none is elected. */
  acceptsElected: boolean | null;
  /** Tag of the copy the package's own specifier resolves to; null when it resolves nowhere. */
  runsTag: string | null;
}

export interface VersionVerdict {
  tag: string;
  status: VersionStatus;
  registrationIds: VersionRegistrationId[];
  /** Declarations shipping this tag, registry order. */
  declarationIds: ParticipantDeclarationId[];
  /** Copies of this tag that materialize in this scope. */
  copyIds: ResolvedDependencyCopyId[];
}

/** The resolver's decisions for one registry key (share scope, package). */
export interface PackageScopeVerdicts {
  id: PackageScopeVerdictsId;
  sharedExternalId: SharedExternalId;
  shareScope: string;
  packageName: string;
  /** Tag of the `share` row; null in the `strict` scope, which elects none, or without a `share` row. */
  electedTag: string | null;
  /** First participant of the `share` row — the build the mapping publishes. */
  electedDeclarationId: ParticipantDeclarationId | null;
  /** Every registered tag, semver descending. */
  versions: VersionVerdict[];
  /** Every declaration, registry order. */
  declarations: DeclarationVerdictRecord[];
}
