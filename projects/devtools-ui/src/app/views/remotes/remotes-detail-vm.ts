/**
 * Detail half of the Remotes vm builder — the transposed projection of one
 * remote as a CONSUMER of the canonical resolution model: identity,
 * capability badges, exposes, this remote's shared declarations with their
 * claim mapping states and resolved copies, the remote's canonical bundle
 * claims, and its true private registrations with their full claim →
 * resolution → copy paths.
 *
 * Everything joins the canonical read surface — `model.resolutionProjection`,
 * `model.effectiveConsumerResolutions`, `model.registryEvidence` — by ID
 * only. Nothing re-derives elections, share counts, or source semantics;
 * a fallback arrow points at the selected copy's evidenced source without
 * turning it into a universal provider (T8).
 *
 * Arrow doctrine of the transposed view: EVERY dependency row draws its
 * resolution explicitly — with only one participant visible per package a
 * quiet row would be ambiguous (the Packages detail keeps the quiet norm
 * because the full negotiation is in sight). Deviations beyond the arrow
 * render as grounded state chips (T7 display vocabulary).
 */
import type { KvItem } from '../../shared/kit/kv-list';
import type { DeclaredVersion, ParticipantArrow } from '../../shared/kit/participant-row';
import type { FederationModel, RemoteEntity } from '../../shared/store/federation-model';
import type {
  BundleClaimStatus,
  DeclarationResolutionClaim,
  ParticipantDeclaration,
  PrivateRegistration,
  VersionRegistration,
} from '../../shared/store/resolution';
import {
  ACTION_NOTES,
  ACTION_SYMBOLS,
  CanonicalIndexes,
  GLOBAL_SCOPE,
  STRICT_SCOPE,
  chunkFileClaim,
  copySourceRemote,
  copySourceVmOf,
  countClaim,
  packageId,
  participantDisplay,
  targetFileName,
} from '../../shared/view-conventions';

/** One annotated fact — state chip or grounded note. */
export interface AnnotationVm {
  label: string;
  /** Grounded reason (tooltip); every annotation carries one. */
  note: string;
}

/** One observed capability of the remote (kit capability badge). */
export interface CapabilityVm {
  label: string;
  note: string;
}

export interface ExposeVm {
  /**
   * Remote-qualified module identity (the V1 rule: remote name + expose
   * key, never the key alone). Matches the naive map-join specifier, so
   * live maps keep their literal `/./` infix.
   */
  qualified: string;
  moduleName: string;
  file: string;
  /** Joined map target; null when no map entry joins (honest absence). */
  mapTarget: string | null;
}

/** One shared declaration of this remote with its canonical resolution. */
export interface RemoteDepVm {
  /** Canonical declaration ID (render tracking key — names can repeat). */
  declarationId: string;
  /** The registry package the remote declared under (consumer view). */
  packageName: string;
  /** `select` payload for the /packages cross-link. */
  packageSelect: string;
  /** Verbatim share-scope name (tooltip); label null in the global scope. */
  scope: string;
  scopeLabel: string | null;
  declared: DeclaredVersion;
  strict: boolean;
  /** Registry action, verbatim, with its glyph and grounded note. */
  action: string;
  symbol: string;
  actionNote: string;
  /** Always present — the transposed view draws every resolution explicitly. */
  arrow: ParticipantArrow;
  /** Deviation chips from the claims' mapping states; the norm renders none. */
  states: AnnotationVm[];
}

/**
 * One canonical consumer-copy relation of this remote WITHOUT an own claim
 * behind it — an alias or claim-less consumer whose binding still resolves
 * to a copy. The projection records a relation for every consumer of a
 * resolution; hiding these rows would silently drop canonical knowledge.
 */
export interface RelationConsumerVm {
  /** Canonical ConsumerCopyRelationId (render tracking key). */
  relationId: string;
  /** Source package of the related copy; null stays honest. */
  packageName: string | null;
  /** Resolved tag of the related copy; null stays honest. */
  copyTag: string | null;
  /** Qualified source of the copy — display name or qualified label. */
  source: AnnotationVm;
  /** The mapped bindings this relation rests on. */
  bindings: { resolutionId: string; specifier: string; file: string; targetUrl: string }[];
  /** Grounded rule note for the whole row. */
  note: string;
}

/** One canonical bundle claim this remote's evidenced sources emit. */
export interface RemoteBundleClaimVm {
  /** Canonical bundle-claim ID (render tracking key). */
  claimId: string;
  /** Source package of the claiming copy; null stays honest. */
  packageName: string | null;
  bundle: string;
  status: BundleClaimStatus;
  /** Grounded qualification of the claim (tooltip). */
  statusNote: string;
  /** Shared chunk-file wording; claims absence explicitly. */
  fileClaim: string;
}

/** Chunk section — exclusively canonical bundle claims and chunk groups. */
export type RemoteChunkSectionVm =
  | {
      level: 'bundle-claims';
      note: string;
      claims: RemoteBundleClaimVm[];
      rule: 'canonical-bundle-claims';
    }
  | {
      level: 'carrier-groups';
      note: string;
      groups: { groupId: string; label: string; fileClaim: string }[];
      rule: 'chunk-pseudo-externals';
    }
  | { level: 'none'; note: string; rule: 'no-chunk-evidence' };

/** One claim of a private registration with its resolution and copy. */
export interface ScopedClaimVm {
  /** Canonical claim ID (render tracking key). */
  claimId: string;
  specifier: string;
  state: AnnotationVm;
  /** Display file of the mapped target; null while unresolved. */
  file: string | null;
  targetUrl: string | null;
  /** Resolved tag of the materialized copy; null without a copy. */
  copyTag: string | null;
}

/**
 * One true private registration of this remote (never a reclassified chunk
 * carrier), with its complete claim → resolution → copy path. Private
 * registrations carry no shared action and no share scope — none is invented.
 */
export interface ScopedPackageVm {
  /** Canonical PrivateRegistrationId (render tracking key). */
  registrationId: string;
  packageName: string;
  tag: string;
  bundle: string | null;
  /** Grounded domain wording — private owner, never a share action/scope. */
  domainNote: string;
  claims: ScopedClaimVm[];
}

export interface RemoteDetailVm {
  /** Verbatim remote name (select payloads must match it). */
  name: string;
  /** Display form — the `__NF-HOST__` sentinel reads as 'host'. */
  display: string;
  host: boolean;
  /** Identity rows: scope URL as recorded plus the resolved URL. */
  identity: KvItem[];
  capabilities: CapabilityVm[];
  exposes: ExposeVm[];
  deps: RemoteDepVm[];
  /** Consumer-copy relations without an own claim (alias/claim-less consumers). */
  relationOnly: RelationConsumerVm[];
  chunks: RemoteChunkSectionVm;
  scoped: ScopedPackageVm[];
}

const CHUNK_EXPLANATION = "code shared between this remote's exposes, plus lazy modules";

/**
 * Capability badges, grounded canonically: dense chunking from the
 * projection's `shared-chunks` groups of this emitter, dense externals from
 * canonical participant declarations carrying a bundle, SRI from the
 * remote's recorded integrity map.
 */
function capabilitiesOf(remote: RemoteEntity, model: FederationModel): CapabilityVm[] {
  const capabilities: CapabilityVm[] = [];
  const denseChunking = model.resolutionProjection.chunkGroups.some(
    (group) => group.emitterRemote === remote.name && group.origin === 'shared-chunks',
  );
  if (denseChunking) {
    capabilities.push({
      label: 'dense chunking',
      note: 'the registry records per-bundle chunk lists for this remote — rule: shared-chunks-lists',
    });
  }
  const denseExternals = model.registryEvidence.participantDeclarations.some(
    (declaration) => declaration.participant === remote.name && declaration.bundle !== null,
  );
  if (denseExternals) {
    capabilities.push({
      label: 'dense externals',
      note: 'shared participants carry their serving bundle — rule: participant-bundle',
    });
  }
  if (Object.keys(remote.integrity).length > 0) {
    capabilities.push({
      label: 'SRI',
      note: `integrity hashes recorded for this remote's files — rule: integrity-map-present`,
    });
  }
  return capabilities;
}

function exposesOf(remote: RemoteEntity): ExposeVm[] {
  return remote.exposes.map((expose) => ({
    qualified: `${remote.name}/${expose.moduleName}`,
    moduleName: expose.moduleName,
    file: expose.file,
    mapTarget: expose.mapTarget,
  }));
}

/**
 * The explicit resolution arrow of one declaration row, from its main
 * claim's canonical outcome: the own-copy arrow for an evidenced own
 * source; the arrow to the selected copy's QUALIFIED source via the T7
 * ladder — a fallback points there without claiming a universal provider,
 * ambiguity renders as ambiguity, never collapsed into "unknown"; or the
 * honest reason no target is derivable.
 */
function arrowOf(
  remoteName: string,
  claim: DeclarationResolutionClaim | null,
  indexes: CanonicalIndexes,
): ParticipantArrow {
  if (claim === null) {
    return { kind: 'none', reason: 'no resolution claim derivable' };
  }
  if (claim.copyId === null) {
    const resolution = indexes.resolutionById.get(claim.effectiveResolutionId);
    if (resolution?.status === 'unmapped') {
      return { kind: 'none', reason: 'no import-map binding in this capture' };
    }
    if (resolution?.status === 'blocked') {
      return { kind: 'none', reason: 'binding blocked by the matching import-map entry' };
    }
    return { kind: 'none', reason: 'mapping evidence missing in this capture' };
  }
  const copy = indexes.copyById.get(claim.copyId);
  if (copy === undefined) {
    return { kind: 'none', reason: 'mapping evidence missing in this capture' };
  }
  if (copySourceRemote(copy, indexes) === remoteName) {
    return { kind: 'own' };
  }
  const source = copySourceVmOf(copy, indexes);
  const resolution = indexes.resolutionById.get(claim.effectiveResolutionId);
  const targetUrl =
    resolution?.status === 'mapped'
      ? resolution.targetUrl
      : (copy.entrypoints[claim.specifier] ?? null);
  return {
    kind: 'winner',
    target: targetUrl === null ? '(no target file evidenced)' : targetFileName(targetUrl),
    provider: source.display ?? source.label,
  };
}

/**
 * Source-qualifier chip of ONE claim's resolved copy — null for the own
 * copy and for the unremarkable exact/anchor qualifiers (the arrow and the
 * anchored state chip already carry those). Every claim gets its own chip:
 * a secondary entrypoint can resolve to a differently qualified source
 * than the main claim, and that qualification must not disappear.
 */
function sourceChipOf(
  remoteName: string,
  claim: DeclarationResolutionClaim,
  indexes: CanonicalIndexes,
): AnnotationVm | null {
  if (claim.copyId === null) {
    return null;
  }
  const copy = indexes.copyById.get(claim.copyId);
  if (copy === undefined || copySourceRemote(copy, indexes) === remoteName) {
    return null;
  }
  const source = copySourceVmOf(copy, indexes);
  return source.qualifier === 'exact-target-source' || source.qualifier === 'explicit-anchor'
    ? null
    : { label: source.label, note: source.note };
}

/**
 * Deviation chips of one declaration row from its claims' canonical
 * mapping states (T7 display vocabulary, transposed wording). The norm —
 * selected share declaration, fallback with its arrow — renders none; a
 * claim for a secondary specifier prefixes its chip with the specifier.
 */
function depStatesOf(
  declaration: ParticipantDeclaration,
  registration: VersionRegistration,
  packageName: string,
  claims: DeclarationResolutionClaim[],
  indexes: CanonicalIndexes,
): AnnotationVm[] {
  if (claims.length === 0) {
    return [
      {
        label: 'declared',
        note: 'declaration without entrypoint candidates — no resolution claim derivable',
      },
    ];
  }
  const states: AnnotationVm[] = [];
  const push = (claim: DeclarationResolutionClaim, label: string, note: string) => {
    const full = claim.specifier === packageName ? label : `${claim.specifier}: ${label}`;
    if (!states.some((state) => state.label === full)) {
      states.push({ label: full, note });
    }
  };
  for (const claim of claims) {
    if (claim.copyId !== null) {
      switch (claim.mappingState) {
        case 'anchored': {
          const anchor = declaration.servedBy;
          push(
            claim,
            'anchored',
            `explicit servedBy anchor: ${
              anchor === null ? 'unknown' : participantDisplay(anchor)
            } — the binding resolves through the anchor's copy`,
          );
          break;
        }
        case 'self-filled':
          push(
            claim,
            'self-filled',
            'no applicable shared source — the consumer’s own copy fills the binding',
          );
          break;
        case 'own-selected':
          if (registration.action === 'scope') {
            // Grounded in THIS claim's own-selected state — no universal
            // audience claim (an anchor can route others to the same copy).
            push(
              claim,
              'kept own copy',
              'registered with action scope — the consumer’s own isolated copy is its effective binding in this capture',
            );
          }
          break;
        case 'not-selected':
          push(
            claim,
            'not selected',
            'the own candidate is not selected in this capture — the binding resolves to the selected copy; a different composition may select it',
          );
          break;
        // 'fallback' stays chip-less: the arrow to the selected copy speaks.
      }
      continue;
    }
    const resolution = indexes.resolutionById.get(claim.effectiveResolutionId);
    if (resolution?.status === 'unmapped') {
      push(
        claim,
        'not mapped',
        'no applicable import-map binding for this specifier in this capture',
      );
    } else if (resolution?.status === 'blocked') {
      push(
        claim,
        'blocked',
        `the matching import-map entry terminally blocks this binding (${resolution.blockedReason})`,
      );
    } else if (resolution?.status === 'unknown') {
      push(claim, 'unknown', `required evidence missing: ${resolution.unknownReasons.join(', ')}`);
    } else {
      push(claim, 'unknown', 'mapping state not derivable from the captured evidence');
    }
  }
  return states;
}

/** Shared declarations of this remote, canonical registry order. */
function depsOf(
  remote: RemoteEntity,
  model: FederationModel,
  indexes: CanonicalIndexes,
): RemoteDepVm[] {
  const deps: RemoteDepVm[] = [];
  for (const declaration of model.registryEvidence.participantDeclarations) {
    if (declaration.participant !== remote.name) {
      continue;
    }
    const registration = indexes.registrationById.get(declaration.versionRegistrationId);
    const external =
      registration === undefined
        ? undefined
        : indexes.sharedExternalById.get(registration.sharedExternalId);
    if (registration === undefined || external === undefined) {
      continue;
    }
    const claims = indexes.claimsByDeclaration.get(declaration.id) ?? [];
    const main =
      claims.find((claim) => claim.specifier === external.packageName) ?? claims[0] ?? null;
    const states = depStatesOf(declaration, registration, external.packageName, claims, indexes);
    // Every claim contributes its own source qualification — a secondary
    // entrypoint's ambiguous/observed/unknown source must stay visible even
    // when the main claim's source is exact (T8 review round 2).
    for (const claim of claims) {
      const chip = sourceChipOf(remote.name, claim, indexes);
      if (chip === null) {
        continue;
      }
      const label =
        claim.specifier === external.packageName ? chip.label : `${claim.specifier}: ${chip.label}`;
      if (!states.some((state) => state.label === label)) {
        states.push({ label, note: chip.note });
      }
    }
    const arrow = arrowOf(remote.name, main, indexes);
    deps.push({
      declarationId: declaration.id,
      packageName: external.packageName,
      packageSelect: packageId(external.shareScope, external.packageName),
      scope: external.shareScope,
      scopeLabel: external.shareScope === GLOBAL_SCOPE ? null : external.shareScope,
      declared:
        external.shareScope === STRICT_SCOPE
          ? { kind: 'pinned', tag: registration.tag }
          : { kind: 'range', range: declaration.requiredVersion },
      strict: declaration.strictVersion,
      action: registration.action,
      symbol: ACTION_SYMBOLS[registration.action] ?? '·',
      actionNote: ACTION_NOTES[registration.action] ?? 'registry action recorded verbatim',
      arrow,
      states,
    });
  }
  return deps;
}

/**
 * Canonical consumer-copy relations of this remote that no own claim backs
 * (`claimIds` empty): alias consumers of a shared scope URL and candidate-
 * less declarations still relate to the copies their bindings resolve to
 * (spec: a claim-less binding still relates). Claim-backed relations are
 * already rendered through the declaration and private-registration rows.
 */
function relationOnlyOf(
  remote: RemoteEntity,
  model: FederationModel,
  indexes: CanonicalIndexes,
): RelationConsumerVm[] {
  const rows: RelationConsumerVm[] = [];
  for (const relation of model.resolutionProjection.consumerRelations) {
    if (relation.consumerRemote !== remote.name || relation.claimIds.length > 0) {
      continue;
    }
    const copy = indexes.copyById.get(relation.copyId);
    if (copy === undefined) {
      continue;
    }
    const source = copySourceVmOf(copy, indexes);
    rows.push({
      relationId: relation.id,
      packageName: copy.sourcePackage,
      copyTag: copy.resolvedTag,
      source: {
        label: source.display ?? source.label,
        note: `${source.label} — ${source.note}`,
      },
      bindings: relation.effectiveResolutionIds.flatMap((resolutionId) => {
        const resolution = indexes.resolutionById.get(resolutionId);
        return resolution?.status === 'mapped'
          ? [
              {
                resolutionId,
                specifier: resolution.specifier,
                file: targetFileName(resolution.targetUrl),
                targetUrl: resolution.targetUrl,
              },
            ]
          : [];
      }),
      note: 'this remote is a consumer of these mapped bindings without an own resolution claim in this capture (rule: consumer-copy-relation)',
    });
  }
  return rows;
}

function bundleStatusNote(status: BundleClaimStatus): string {
  switch (status) {
    case 'mapped-source':
      return `registered chunk list of this source's bundle — capture evidence, not proof of delivery`;
    case 'source-only':
      return 'the source names this bundle, but the capture registers no chunk list for it';
    case 'ambiguous':
      return 'ambiguous source — this remote is one candidate for the bundle; chunks are not attributed';
  }
}

/**
 * Chunk section from the canonical projection only: the bundle claims whose
 * evidenced source is this remote, else the remote's pseudo-external carrier
 * groups, else the honest absence.
 */
function chunksOf(
  remote: RemoteEntity,
  display: string,
  model: FederationModel,
  indexes: CanonicalIndexes,
): RemoteChunkSectionVm {
  const projection = model.resolutionProjection;
  const claims = projection.bundleClaims.filter((claim) => claim.sourceRemote === remote.name);
  if (claims.length > 0) {
    return {
      level: 'bundle-claims',
      note: `${CHUNK_EXPLANATION} — attributed through the canonical bundle claims of ${display}'s resolved copies`,
      claims: claims.map((claim) => {
        const files = claim.chunkGroupIds.flatMap(
          (groupId) => indexes.chunkGroupById.get(groupId)?.files ?? [],
        );
        return {
          claimId: claim.id,
          packageName: indexes.copyById.get(claim.copyId)?.sourcePackage ?? null,
          bundle: claim.bundle,
          status: claim.status,
          statusNote: bundleStatusNote(claim.status),
          fileClaim: chunkFileClaim(files),
        };
      }),
      rule: 'canonical-bundle-claims',
    };
  }
  const carriers = projection.chunkGroups.filter(
    (group) => group.emitterRemote === remote.name && group.origin === 'scoped-pseudo-external',
  );
  if (carriers.length > 0) {
    return {
      level: 'carrier-groups',
      note: `${CHUNK_EXPLANATION} — chunks belong to ${display}; package attribution is not derivable in this capture`,
      groups: carriers.map((group) => ({
        groupId: group.id,
        label: group.pseudoPackage ?? group.bundleName ?? '(unnamed group)',
        fileClaim: countClaim(group.files.length, 'file'),
      })),
      rule: 'chunk-pseudo-externals',
    };
  }
  const unclaimed = projection.chunkGroups.some((group) => group.emitterRemote === remote.name);
  return {
    level: 'none',
    note: unclaimed
      ? `chunk lists are recorded for ${display}, but no resolved copy claims them in this capture`
      : `no chunk evidence recorded for ${display} — the capture shows no chunk lists (dense-chunking capability absent)`,
    rule: 'no-chunk-evidence',
  };
}

/**
 * State chip of one private-registration claim (no share vocabulary). The
 * chip grounds on the claim's canonical `mappingState` — an attached
 * `copyId` only proves the binding MAPS, not that the registration's own
 * candidate is the binding (a private claim can be not-selected and still
 * point at the materialized copy).
 */
function scopedClaimStateOf(
  claim: DeclarationResolutionClaim,
  indexes: CanonicalIndexes,
): AnnotationVm {
  if (claim.copyId !== null) {
    if (claim.mappingState === 'own-selected') {
      return {
        label: 'own mapping',
        note: 'the registration’s own candidate is the effective import-map binding of its owner — private domain, no share action, no share scope',
      };
    }
    if (claim.mappingState === 'not-selected') {
      return {
        label: 'not selected',
        note: 'the registration’s own candidate is not the effective binding in this capture — the binding resolves to another copy',
      };
    }
    return {
      label: claim.mappingState,
      note: 'canonical mapping state of this private claim, recorded verbatim',
    };
  }
  const resolution = indexes.resolutionById.get(claim.effectiveResolutionId);
  if (resolution?.status === 'unmapped') {
    return {
      label: 'not mapped',
      note: 'no applicable import-map binding for this specifier in this capture',
    };
  }
  if (resolution?.status === 'blocked') {
    return {
      label: 'blocked',
      note: `the matching import-map entry terminally blocks this binding (${resolution.blockedReason})`,
    };
  }
  return { label: 'unknown', note: 'mapping state not derivable from the captured evidence' };
}

/**
 * True private registrations of this remote with their full canonical
 * paths. Chunk-carrier pseudo packages (identified via the projection's
 * `scoped-pseudo-external` groups, never by name convention) stay in the
 * chunk section and are excluded here.
 */
function scopedOf(
  remote: RemoteEntity,
  display: string,
  model: FederationModel,
  indexes: CanonicalIndexes,
): ScopedPackageVm[] {
  const carrierPackages = new Set(
    model.resolutionProjection.chunkGroups
      .filter((group) => group.origin === 'scoped-pseudo-external')
      .map((group) => group.pseudoPackage)
      .filter((name): name is string => name !== null),
  );
  const claimsByRegistration = new Map<string, DeclarationResolutionClaim[]>();
  for (const claim of model.resolutionProjection.declarationResolutionClaims) {
    if (claim.subject.kind !== 'private') {
      continue;
    }
    const id = claim.subject.privateRegistrationId;
    claimsByRegistration.set(id, [...(claimsByRegistration.get(id) ?? []), claim]);
  }
  return model.registryEvidence.privateRegistrations
    .filter(
      (registration) =>
        registration.ownerRemote === remote.name && !carrierPackages.has(registration.packageName),
    )
    .map((registration) => ({
      registrationId: registration.id,
      packageName: registration.packageName,
      tag: registration.tag,
      bundle: registration.bundle,
      domainNote: `private registration of ${display} — resolved in its own private domain, no share action, no share scope`,
      claims: (claimsByRegistration.get(registration.id) ?? []).map((claim) => {
        const resolution = indexes.resolutionById.get(claim.effectiveResolutionId);
        const targetUrl = resolution?.status === 'mapped' ? resolution.targetUrl : null;
        const copy = claim.copyId === null ? undefined : indexes.copyById.get(claim.copyId);
        return {
          claimId: claim.id,
          specifier: claim.specifier,
          state: scopedClaimStateOf(claim, indexes),
          file: targetUrl === null ? null : targetFileName(targetUrl),
          targetUrl,
          copyTag: copy?.resolvedTag ?? null,
        };
      }),
    }));
}

export function buildRemoteDetail(
  model: FederationModel,
  indexes: CanonicalIndexes,
  selectedName: string | null,
): RemoteDetailVm | null {
  const remote =
    selectedName === null
      ? null
      : (model.remotes.find((candidate) => candidate.name === selectedName) ?? null);
  if (remote === null) {
    return null;
  }
  const display = participantDisplay(remote.name);
  return {
    name: remote.name,
    display,
    host: remote.isHost,
    identity: [
      { label: 'scope URL', value: remote.scopeUrl, mono: true },
      {
        label: 'resolved',
        value: remote.resolvedScopeUrl,
        mono: true,
        href: remote.resolvedScopeUrl,
      },
    ],
    capabilities: capabilitiesOf(remote, model),
    exposes: exposesOf(remote),
    deps: depsOf(remote, model, indexes),
    relationOnly: relationOnlyOf(remote, model, indexes),
    chunks: chunksOf(remote, display, model, indexes),
    scoped: scopedOf(remote, display, model, indexes),
  };
}
