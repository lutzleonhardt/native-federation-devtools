/**
 * Independent witness oracle (T11.5-AC-01, contributes to XC-03).
 *
 * Six corpus witnesses with HAND-READ expected values. Every expectation
 * cites, in its `evidence:` comment, the lab capture it was read from and
 * the predicate `scripts/validate-lab-corpus.mjs` enforces on that capture
 * — never resolver or builder output. The per-view suites pin probe-first
 * output (regression pins, green under a wrong-from-the-start reading);
 * this file is the recount that would stay red under one.
 *
 * Sensitivity proof: the co-declared witness is one throwing function; a
 * participant-flattening mutation of an in-memory fixture copy (the two
 * declarations collapsed into one) must make it throw.
 */
import { FIXTURES, FixtureId, SnapshotV1 } from 'devtools-bridge';

import { buildPackagesVm } from '../../views/packages/packages-view-model';
import type { FederationModel } from '../store/federation-model';
import { ingestSnapshot } from '../store/ingest';
import type { VersionRegistration } from '../store/resolution';

const CONFLICT_LIB = '@nf-lab/conflict-lib';

function modelOf(id: FixtureId): FederationModel {
  return ingestSnapshot(FIXTURES[id]);
}

/** The canonical records of one shared package, read off the façade collections. */
function packageEvidence(model: FederationModel, packageName: string) {
  const evidence = model.registryEvidence;
  const externals = evidence.sharedExternals.filter((e) => e.packageName === packageName);
  const externalIds = new Set(externals.map((e) => e.id));
  const registrations = evidence.versionRegistrations.filter((r) =>
    externalIds.has(r.sharedExternalId),
  );
  const registrationIds = new Set(registrations.map((r) => r.id));
  const declarations = evidence.participantDeclarations.filter((d) =>
    registrationIds.has(d.versionRegistrationId),
  );
  const candidates = evidence.entrypointCandidates.filter((c) => c.specifier === packageName);
  const resolutions = model.effectiveConsumerResolutions.filter((r) => r.specifier === packageName);
  const copies = model.resolutionProjection.copies.filter((c) => c.sourcePackage === packageName);
  const claims = model.resolutionProjection.declarationResolutionClaims.filter(
    (c) => c.specifier === packageName,
  );
  return { externals, registrations, declarations, candidates, resolutions, copies, claims };
}

const rowLabel = (registration: VersionRegistration): string =>
  `${registration.tag} ${registration.action}`;

const sorted = (values: readonly string[]): string[] => [...values].sort();

/**
 * co-declared-share: 1 registration, 2 declarations, 2 consumer-scope
 * resolutions, 1 target, 1 copy, 1 exact selected source.
 */
function assertCoDeclaredShare(model: FederationModel): void {
  const lib = packageEvidence(model, CONFLICT_LIB);

  // evidence: captures/co-declared-share/20260813T151211Z.json —
  // runtime.sharedExternals.__GLOBAL__['@nf-lab/conflict-lib'].versions is ONE
  // row { tag '1.0.0', action 'share' }; validator EVIDENCE['co-declared-share']:
  // "expected ONE co-declared version row", "expected action 'share'".
  expect(lib.externals.map((e) => e.shareScope)).toEqual(['__GLOBAL__']);
  expect(lib.registrations.map(rowLabel)).toEqual(['1.0.0 share']);

  // evidence: that row's `remotes` lists mfe1 (cached true) then mfe2 (cached
  // false); validator: "expected TWO declarers in one row", "exactly one
  // participant observed cached:true".
  expect(lib.declarations.map((d) => d.participant)).toEqual(['mfe1', 'mfe2']);
  expect(lib.declarations.filter((d) => d.cached).map((d) => d.participant)).toEqual(['mfe1']);

  // evidence: both declarers carry entries['@nf-lab/conflict-lib'] =
  // '_nf_lab_conflict_lib.JF7uEdSVsN.js' below their own scopeUrl (./mfe1/,
  // ./mfe2/); validator: "expected two distinct candidate URLs".
  expect(lib.candidates).toHaveLength(2);
  expect(new Set(lib.candidates.map((c) => c.candidateUrl)).size).toBe(2);

  // evidence: the single document import map has ONE global
  // '@nf-lab/conflict-lib' entry -> './mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js'
  // and no scope override, so both consumer scopes (./mfe1/, ./mfe2/) resolve
  // to that one target; validator: "expected exactly one selected target URL".
  expect(lib.resolutions).toHaveLength(2);
  expect(sorted(lib.resolutions.flatMap((r) => r.consumerRemotes))).toEqual(['mfe1', 'mfe2']);
  expect(lib.resolutions.map((r) => r.status)).toEqual(['mapped', 'mapped']);
  const targets = new Set(lib.resolutions.map((r) => r.targetUrl));
  expect(targets.size).toBe(1);
  expect([...targets][0]).toMatch(/\/mfe1\/_nf_lab_conflict_lib\.JF7uEdSVsN\.js$/);

  // one copy whose exact source is mfe1's declaration — the candidate the map
  // selected; validator: "expected exactly one candidate URL selected".
  expect(lib.copies).toHaveLength(1);
  const [copy] = lib.copies;
  expect(copy.source).toEqual({
    kind: 'shared-declaration',
    declarationId: lib.declarations[0].id,
    participant: 'mfe1',
  });
  expect(copy.sourceDisposition).toBe('share-registration');
  expect(sorted(copy.effectiveResolutionIds)).toEqual(sorted(lib.resolutions.map((r) => r.id)));
  expect(
    Object.fromEntries(lib.claims.map((c) => [c.consumerRemote, c.ownCandidateSelected])),
  ).toEqual({ mfe1: true, mfe2: false });
}

/** Collapse the two co-declared participants into one (in-memory copy only). */
function flattenParticipants(snapshot: SnapshotV1): SnapshotV1 {
  const clone = structuredClone(snapshot);
  const runtime = clone.runtime;
  if (runtime === null) {
    throw new Error('co-declared-share carries a runtime');
  }
  const row = runtime.sharedExternals['__GLOBAL__'][CONFLICT_LIB].versions[0];
  row.remotes = row.remotes.slice(0, 1);
  return clone;
}

describe('witness oracle (T11.5-AC-01)', () => {
  it('co-declared-share: 1 registration, 2 declarations, 2 resolutions, 1 target, 1 copy, 1 exact source', () => {
    assertCoDeclaredShare(modelOf('co-declared-share'));
  });

  it('breaks under a participant-flattening mutation of co-declared-share', () => {
    const flattened = ingestSnapshot(flattenParticipants(FIXTURES['co-declared-share']));
    // The mutation is minimal: the registration row stays, one declarer is gone.
    const lib = packageEvidence(flattened, CONFLICT_LIB);
    expect(lib.registrations.map(rowLabel)).toEqual(['1.0.0 share']);
    expect(lib.declarations.map((d) => d.participant)).toEqual(['mfe1']);

    // The failing assertion is the participant count — mfe2 is what the
    // flattening removed — not a runtime error on the mutated model.
    expect(() => assertCoDeclaredShare(flattened)).toThrow(/mfe2/);
  });

  it('clean-skip: 2 registrations, 2 declared tags, 1 copy', () => {
    const lib = packageEvidence(modelOf('clean-skip'), CONFLICT_LIB);

    // evidence: captures/clean-skip/20260811T090637Z.json — versions in raw
    // order: { 2.0.0 share, remotes [mfe2] }, { 1.0.0 skip, remotes [mfe1] };
    // validator EVIDENCE['clean-skip']: "expected 2 version rows" and a skip
    // row with an intact participant list.
    expect(lib.registrations.map(rowLabel)).toEqual(['2.0.0 share', '1.0.0 skip']);
    expect(new Set(lib.registrations.map((r) => r.tag)).size).toBe(2);
    expect(lib.declarations.map((d) => d.participant)).toEqual(['mfe2', 'mfe1']);

    // evidence: the global import '@nf-lab/conflict-lib' ->
    // './mfe2/_nf_lab_conflict_lib.jvcc6K1csg.js' (the share row's file below
    // mfe2's scope), no scope override — one target for both consumers.
    expect(lib.resolutions).toHaveLength(2);
    expect(sorted(lib.resolutions.flatMap((r) => r.consumerRemotes))).toEqual(['mfe1', 'mfe2']);
    const targets = new Set(lib.resolutions.map((r) => r.targetUrl));
    expect(targets.size).toBe(1);
    expect([...targets][0]).toMatch(/\/mfe2\/_nf_lab_conflict_lib\.jvcc6K1csg\.js$/);

    expect(lib.copies).toHaveLength(1);
    const [copy] = lib.copies;
    expect(copy.resolvedTag).toBe('2.0.0');
    expect(copy.source).toMatchObject({ kind: 'shared-declaration', participant: 'mfe2' });
    expect(copy.sourceDisposition).toBe('share-registration');
    expect(sorted(copy.effectiveResolutionIds)).toEqual(sorted(lib.resolutions.map((r) => r.id)));
  });

  it('strict-split: 3 registrations, 2 declared tags, 2 copies', () => {
    const lib = packageEvidence(modelOf('strict-split'), CONFLICT_LIB);

    // evidence: captures/strict-split/20260811T094623Z.json — versions in raw
    // order: { 2.0.0 share, [__NF-HOST__] }, { 1.0.0 skip, [mfe1] },
    // { 1.0.0 scope, [mfe3] }; validator EVIDENCE['strict-split']: tag 1.0.0
    // is split into 'scope' + 'skip' rows.
    expect(lib.registrations.map(rowLabel)).toEqual(['2.0.0 share', '1.0.0 skip', '1.0.0 scope']);
    expect(new Set(lib.registrations.map((r) => r.tag)).size).toBe(2);
    expect(lib.declarations.map((d) => d.participant)).toEqual(['__NF-HOST__', 'mfe1', 'mfe3']);

    // evidence: import map — global '@nf-lab/conflict-lib' ->
    // './_nf_lab_conflict_lib.jvcc6K1csg.js' (the host's 2.0.0 file); scope
    // './mfe3/' -> './mfe3/_nf_lab_conflict_lib.JF7uEdSVsN.js' (mfe3's own
    // 1.0.0 file). Two distinct targets, two copies.
    const mapped = lib.resolutions.filter((r) => r.status === 'mapped');
    expect(new Set(mapped.map((r) => r.targetUrl)).size).toBe(2);
    expect(lib.copies).toHaveLength(2);
    expect(sorted(lib.copies.map((c) => `${c.resolvedTag} ${c.sourceDisposition}`))).toEqual([
      '1.0.0 scope-registration',
      '2.0.0 share-registration',
    ]);
  });

  it('strict-scope: the named scope is independent, the empty __GLOBAL__ creates no package', () => {
    const model = modelOf('strict-scope');
    const lib = packageEvidence(model, CONFLICT_LIB);

    // evidence: captures/strict-scope/20260811T095035Z.json —
    // runtime.sharedExternals has '__GLOBAL__': {} (present, EMPTY) and
    // 'strict': { '@nf-lab/conflict-lib': versions [{ 2.0.0 share, [mfe2] },
    // { 1.0.0 share, [mfe1] }] }; validator EVIDENCE['strict-scope']:
    // "expected TWO share rows under the strict scope".
    expect(
      model.registryEvidence.sharedExternals.map((e) => `${e.shareScope}|${e.packageName}`),
    ).toEqual(['strict|@nf-lab/conflict-lib']);
    expect(lib.registrations.map(rowLabel)).toEqual(['2.0.0 share', '1.0.0 share']);

    // evidence: the import map has no global entry for the package; scope
    // './mfe2/' -> './mfe2/_nf_lab_conflict_lib.jvcc6K1csg.js' and './mfe1/'
    // -> './mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js' — each consumer keeps its
    // own tag, nothing is negotiated across the two.
    expect(lib.resolutions).toHaveLength(2);
    expect(lib.copies).toHaveLength(2);
    expect(sorted(lib.copies.map((c) => c.resolvedTag ?? '?'))).toEqual(['1.0.0', '2.0.0']);
    for (const copy of lib.copies) {
      expect(copy.source.kind).toBe('shared-declaration');
      const participant = copy.source.kind === 'shared-declaration' ? copy.source.participant : '?';
      expect(copy.effectiveResolutionIds).toHaveLength(1);
      const resolution = lib.resolutions.find((r) => r.id === copy.effectiveResolutionIds[0]);
      expect(resolution?.consumerRemotes).toEqual([participant]);
      expect(resolution?.targetUrl).toMatch(new RegExp(`/${participant}/_nf_lab_conflict_lib\\.`));
    }

    // The empty __GLOBAL__ manufactures no package: Packages lists one scope
    // with one package.
    const packages = buildPackagesVm(model, {
      filter: 'all',
      selectedParticipant: null,
      selectedId: null,
    });
    expect(packages.scopes.map((s) => [s.scope, s.packageCount])).toEqual([['strict', 1]]);
    expect(packages.packageCount).toBe(1);
  });

  it('scoped: 2 private registration -> resolution -> copy paths', () => {
    const model = modelOf('scoped');
    const evidence = model.registryEvidence;

    // evidence: captures/scoped/20260811T095215Z.json — runtime.sharedExternals
    // carries no package; runtime.scopedExternals: mfe1 -> { tag '1.0.0',
    // entries { '@nf-lab/conflict-lib': '_nf_lab_conflict_lib.JF7uEdSVsN.js' } },
    // mfe2 -> { tag '2.0.0', entries { ...: '_nf_lab_conflict_lib.jvcc6K1csg.js' } };
    // validator EVIDENCE.scoped: populated scoped-externals with tag/entries.
    expect(evidence.sharedExternals).toEqual([]);
    expect(
      evidence.privateRegistrations.map((p) => `${p.ownerRemote} ${p.packageName} ${p.tag}`),
    ).toEqual(['mfe1 @nf-lab/conflict-lib 1.0.0', 'mfe2 @nf-lab/conflict-lib 2.0.0']);

    // evidence: import map scopes './mfe1/' and './mfe2/' each map
    // '@nf-lab/conflict-lib' to the owner's own file; no global entry.
    const resolutions = model.effectiveConsumerResolutions.filter(
      (r) => r.specifier === CONFLICT_LIB,
    );
    const copies = model.resolutionProjection.copies;
    expect(resolutions).toHaveLength(2);
    expect(copies).toHaveLength(2);
    for (const registration of evidence.privateRegistrations) {
      const owner = registration.ownerRemote;
      const ownResolutions = resolutions.filter((r) => r.consumerRemotes.includes(owner));
      expect(ownResolutions).toHaveLength(1);
      const [resolution] = ownResolutions;
      expect(resolution.status).toBe('mapped');
      expect(resolution.targetUrl).toMatch(new RegExp(`/${owner}/_nf_lab_conflict_lib\\.`));

      const ownCopies = copies.filter((c) =>
        c.sourceRegistrationRefs.some(
          (ref) => ref.kind === 'private' && ref.id === registration.id,
        ),
      );
      expect(ownCopies).toHaveLength(1);
      const [copy] = ownCopies;
      expect(copy.source).toEqual({
        kind: 'private-registration',
        registrationId: registration.id,
        ownerRemote: owner,
      });
      expect(copy.sourceDisposition).toBe('private-registration');
      expect(copy.resolvedTag).toBe(registration.tag);
      expect(copy.effectiveResolutionIds).toEqual([resolution.id]);
    }
  });

  it('frankenstein-live: 3 remotes, 22 global and 7 scoped import-map entries', () => {
    const model = modelOf('frankenstein-live');

    // evidence: captures/frankenstein-live/20260811T115536Z-01-initial.json —
    // runtime.remotes keys: whiteboard, mermaid, __NF-HOST__; the single
    // document import map: 22 `imports` entries and 7 entries across its
    // `scopes`; runtime.sharedExternals.__GLOBAL__ holds 20 packages,
    // scopedExternals is {}. Validator (live section): both phases
    // byte-identical, scoped-externals empty, integrity on 2+ remotes.
    const remoteNames = ['__NF-HOST__', 'mermaid', 'whiteboard'];
    expect(sorted(model.remotes.map((r) => r.name))).toEqual(remoteNames);
    expect(sorted(model.resolutionProjection.remotes.map((r) => r.name))).toEqual(remoteNames);
    expect(model.remotes.filter((r) => r.isHost).map((r) => r.name)).toEqual(['__NF-HOST__']);

    expect(model.importMapEntries.filter((e) => e.scope === null)).toHaveLength(22);
    expect(model.importMapEntries.filter((e) => e.scope !== null)).toHaveLength(7);

    expect(model.registryEvidence.sharedExternals).toHaveLength(20);
    expect(model.registryEvidence.privateRegistrations).toEqual([]);
  });
});
