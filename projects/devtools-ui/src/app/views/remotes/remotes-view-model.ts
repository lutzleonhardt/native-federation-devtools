/**
 * Remotes view model — the per-remote perspective (spec 4.2): what is the
 * state of this remote? The detail is the transposed projection — all
 * packages from one participant's point of view; a package's full
 * negotiation is deliberately NOT repeated here (one click away via the
 * package link). Inputs are the store model's canonical read surface plus
 * caller-owned UI state; the output is render-ready only: templates
 * consume these rows, never store types (XC-06).
 *
 * This file is the FACADE: the left list and the public surface. The
 * detail half lives beside it (`remotes-detail-vm.ts`). Views import from
 * here only.
 */
import type { TreeTableRow } from '../../shared/kit/tree-table';
import type { FederationModel } from '../../shared/store/federation-model';
import { buildCanonicalIndexes, countClaim } from '../../shared/view-conventions';
import { RemoteDetailVm, buildRemoteDetail, unresolvedDeclarationCount } from './remotes-detail-vm';

export type {
  AnnotationVm,
  CapabilityVm,
  ConsumesRowVm,
  ConsumesSourceVm,
  DeclaredDisplayVm,
  ExposeVm,
  ProvidesBlockVm,
  RelationConsumerVm,
  RemoteChunkRowVm,
  RemoteChunkSectionVm,
  RemoteDetailVm,
  RemoteUnresolvedRowVm,
  ScopedClaimVm,
  ScopedPackageVm,
  ZoneFileVm,
} from './remotes-detail-vm';

/** Caller-owned UI state — selection lives in the view. */
export interface RemotesUiState {
  /** Verbatim remote name, seeded from the `select` query param. */
  selectedName: string | null;
}

/** One remote of the left list, model order. */
export interface RemoteRowVm {
  kind: 'remote';
  /** Verbatim remote name — selection and select payloads match it. */
  name: string;
  host: boolean;
  /** Quiet scan tail, e.g. "1 expose · 12 declarations". */
  summary: string;
  /**
   * `⚠` marker with its count tooltip — only when the remote has
   * declarations whose claims resolve nowhere in this capture; null is the
   * norm. Conflict involvement stays the package pivot's job.
   */
  unresolved: { count: number; note: string } | null;
}

export interface RemotesVm {
  remoteCount: number;
  rows: TreeTableRow<RemoteRowVm>[];
  detail: RemoteDetailVm | null;
  /** Capture-boundary statement — what this list cannot enumerate. */
  boundaryNote: string;
  /** Honest empty note; null while the list has rows. */
  emptyNote: string | null;
}

/**
 * A remote without any registry trace is indistinguishable from an absent
 * one in passive capture data, so the claim is a capture boundary, never an
 * error (spec 2.3) — and never a statement about loading or delivery.
 */
export const REMOTES_BOUNDARY_NOTE =
  'a remote without a registry trace in this capture cannot appear here — this list cannot enumerate what the capture cannot see';

export function buildRemotesVm(model: FederationModel, ui: RemotesUiState): RemotesVm {
  const indexes = buildCanonicalIndexes(model);
  const declarationCounts = new Map<string, number>();
  for (const declaration of model.registryEvidence.participantDeclarations) {
    declarationCounts.set(
      declaration.participant,
      (declarationCounts.get(declaration.participant) ?? 0) + 1,
    );
  }
  // Chunk-carrier pseudo packages stay out of the private count — the
  // detail presents them in the chunk section, not as registrations.
  const carrierPackages = new Set(
    model.resolutionProjection.chunkGroups
      .filter((group) => group.origin === 'scoped-pseudo-external')
      .map((group) => group.pseudoPackage),
  );
  const privateCounts = new Map<string, number>();
  for (const registration of model.registryEvidence.privateRegistrations) {
    if (carrierPackages.has(registration.packageName)) {
      continue;
    }
    privateCounts.set(
      registration.ownerRemote,
      (privateCounts.get(registration.ownerRemote) ?? 0) + 1,
    );
  }

  const rows: TreeTableRow<RemoteRowVm>[] = model.remotes.map((remote) => {
    const declarationCount = declarationCounts.get(remote.name) ?? 0;
    const privateCount = privateCounts.get(remote.name) ?? 0;
    const summary =
      `${countClaim(remote.exposes.length, 'expose')} · ${countClaim(declarationCount, 'declaration')}` +
      (privateCount > 0 ? ` · ${countClaim(privateCount, 'private registration')}` : '');
    const unresolvedCount = unresolvedDeclarationCount(remote.name, model, indexes);
    return {
      id: remote.name,
      depth: 0,
      expandable: false,
      expanded: false,
      payload: {
        kind: 'remote' as const,
        name: remote.name,
        host: remote.isHost,
        summary,
        unresolved:
          unresolvedCount === 0
            ? null
            : {
                count: unresolvedCount,
                note: `${countClaim(unresolvedCount, 'declaration')} of this remote ${
                  unresolvedCount === 1 ? 'resolves' : 'resolve'
                } nowhere in this capture`,
              },
      },
    };
  });

  return {
    remoteCount: model.remotes.length,
    rows,
    detail: buildRemoteDetail(model, indexes, ui.selectedName),
    boundaryNote: REMOTES_BOUNDARY_NOTE,
    emptyNote: rows.length === 0 ? 'no remotes in this capture' : null,
  };
}
