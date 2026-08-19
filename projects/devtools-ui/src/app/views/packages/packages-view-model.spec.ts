/**
 * Packages view-model specs — canonical corpus acceptance (T7). The builder
 * consumes the Store façade only (`resolutionProjection`,
 * `effectiveConsumerResolutions`, `registryEvidence`); every pin navigates
 * canonical IDs through that surface:
 *  - T7-AC-01: co-declared-share — 1 registration, 2 declarations, 2
 *    consumer resolutions, 1 target, 1 copy; mfe1 selected, mfe2 not
 *    selected, no false multi-version or provider claim.
 *  - T7-AC-02: clean-skip / strict-split / strict-scope — the canonical
 *    four counts; the empty `__GLOBAL__` scope manufactures no packages.
 *  - T7-AC-03: requested vs resolved tags, qualified sources, dispositions,
 *    and roles stay distinct; equal-tag copies alone render no conflict.
 *  - T7-AC-04: only canonical bundle claims contribute chunks; uncertain
 *    claims stay visibly qualified.
 *  - T7-AC-05: canonical ID chains through the façade; purity.
 */
import { FIXTURES, NF_HOST, SnapshotV1 } from 'devtools-bridge';

import type { FederationModel } from '../../shared/store/federation-model';
import { ingestSnapshot } from '../../shared/store/ingest';
import {
  DetailParticipantVm,
  PackageDetailVm,
  PackageRowVm,
  PackagesUiState,
  PackagesVm,
  buildPackagesVm,
  packageId,
} from './packages-view-model';

function modelOf(name: keyof typeof FIXTURES): FederationModel {
  return ingestSnapshot(FIXTURES[name]);
}

function vmOf(name: keyof typeof FIXTURES, ui: Partial<PackagesUiState> = {}): PackagesVm {
  return buildPackagesVm(modelOf(name), { filter: 'all', selectedId: null, ...ui });
}

function packageRows(vm: PackagesVm): PackageRowVm[] {
  return vm.rows.map((row) => row.payload);
}

function participantOf(detail: PackageDetailVm, name: string): DetailParticipantVm {
  const participant = detail.negotiation
    .flatMap((version) => version.participants)
    .find((candidate) => candidate.name === name);
  if (participant === undefined) {
    throw new Error(`no negotiation participant ${name}`);
  }
  return participant;
}

const CONFLICT_LIB = packageId('__GLOBAL__', '@nf-lab/conflict-lib');

describe('buildPackagesVm — co-declared share (T7-AC-01)', () => {
  const model = modelOf('co-declared-share');
  const vm = buildPackagesVm(model, { filter: 'all', selectedId: CONFLICT_LIB });

  it('renders 1 registration, 2 declarations, 2 consumer resolutions, 1 target, 1 copy', () => {
    expect(vm.detail!.measures).toEqual({
      registrations: 1,
      declaredTags: 1,
      resolvedCopies: 1,
      resolvedTags: 1,
      unknownTagCopies: 0,
      declarations: 2,
    });
    // Two consumer resolutions share one effective target (façade check).
    const resolutions = model.effectiveConsumerResolutions.filter(
      (resolution) => resolution.specifier === '@nf-lab/conflict-lib',
    );
    expect(resolutions).toHaveLength(2);
    expect(new Set(resolutions.map((resolution) => resolution.targetUrl)).size).toBe(1);
    expect(vm.detail!.copies).toHaveLength(1);
    expect(vm.detail!.copies[0].entrypoints).toEqual([
      {
        specifier: '@nf-lab/conflict-lib',
        file: '_nf_lab_conflict_lib.JF7uEdSVsN.js',
        targetUrl: 'http://localhost:4300/mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js',
        hasIntegrity: false,
        importMapSelect: '@nf-lab/conflict-lib',
      },
    ]);
  });

  it('marks mfe1 selected and mfe2 not selected, no false multi-version or provider claim', () => {
    const mfe1 = participantOf(vm.detail!, 'mfe1');
    const mfe2 = participantOf(vm.detail!, 'mfe2');
    expect(mfe1.state?.label).toBe('selected');
    expect(mfe1.arrow).toBeNull();
    expect(mfe2.state?.label).toBe('not selected');
    expect(mfe2.arrow).toEqual({
      kind: 'winner',
      target: '_nf_lab_conflict_lib.JF7uEdSVsN.js',
      provider: 'mfe1',
    });

    const [row] = packageRows(vm);
    expect(row.versions).toEqual([{ tag: '1.0.0', muted: false, note: null }]);
    expect(row.conflict).toBeNull();
    // Only the copy's evidenced source claims sourcing; mfe2 stays a
    // consumer relation with its claim state, never a provider chip.
    expect(row.sources).toEqual([{ name: 'mfe1', host: false }]);
    expect(row.alsoResolvedBy).toEqual({
      count: 1,
      tooltip: 'also resolves here: mfe2 (not-selected)',
    });
  });

  it('chains the detail copy to the canonical projection by ID (T7-AC-05)', () => {
    const projection = model.resolutionProjection;
    expect(vm.detail!.copies.map((copy) => copy.copyId)).toEqual(
      projection.copies.map((copy) => copy.id),
    );
    // The not-selected claim references the same copy the detail renders.
    const claim = projection.declarationResolutionClaims.find(
      (candidate) => candidate.consumerRemote === 'mfe2',
    )!;
    expect(claim.copyId).toBe(vm.detail!.copies[0].copyId);
  });
});

describe('buildPackagesVm — canonical four counts (T7-AC-02)', () => {
  it('shows 2 registrations, 2 declared tags, 1 copy, 1 resolved tag for clean-skip', () => {
    const vm = vmOf('clean-skip', { selectedId: CONFLICT_LIB });
    expect(vm.detail!.measures).toEqual({
      registrations: 2,
      declaredTags: 2,
      resolvedCopies: 1,
      resolvedTags: 1,
      unknownTagCopies: 0,
      declarations: 2,
    });
    const [row] = packageRows(vm);
    // Declared-only multiplicity is the mechanism succeeding — one
    // resolved tag, no conflict indicator.
    expect(row.versions).toEqual([{ tag: '2.0.0', muted: false, note: null }]);
    expect(row.conflict).toBeNull();
    expect(vm.conflictCount).toBe(0);
    expect(row.sources).toEqual([{ name: 'mfe2', host: false }]);
    expect(row.alsoResolvedBy).toEqual({
      count: 1,
      tooltip: 'also resolves here: mfe1 (fallback)',
    });
  });

  it('shows 3 registrations, 2 declared tags, 2 copies, 2 resolved tags for strict-split', () => {
    const vm = vmOf('strict-split', { selectedId: CONFLICT_LIB });
    expect(vm.detail!.measures).toEqual({
      registrations: 3,
      declaredTags: 2,
      resolvedCopies: 2,
      resolvedTags: 2,
      unknownTagCopies: 0,
      declarations: 3,
    });
  });

  it('shows 2 registrations, 2 declared tags, 2 copies, 2 resolved tags for strict-scope', () => {
    const vm = vmOf('strict-scope', { selectedId: packageId('strict', '@nf-lab/conflict-lib') });
    expect(vm.detail!.measures).toEqual({
      registrations: 2,
      declaredTags: 2,
      resolvedCopies: 2,
      resolvedTags: 2,
      unknownTagCopies: 0,
      declarations: 2,
    });
  });

  it('manufactures no packages from the empty __GLOBAL__ scope', () => {
    const vm = vmOf('strict-scope');
    expect(vm.packageCount).toBe(1);
    expect(vm.scopes).toEqual([{ scope: 'strict', label: 'strict', packageCount: 1 }]);
    expect(packageRows(vm).map((row) => row.scope)).toEqual(['strict']);
  });
});

describe('buildPackagesVm — requested vs resolved stay distinct (T7-AC-03)', () => {
  it('renders declared ranges in the negotiation and resolved tags on the row', () => {
    const vm = vmOf('strict-split', { selectedId: CONFLICT_LIB });
    // Requested: verbatim declared ranges per declaration, registry order.
    expect(
      vm.detail!.negotiation.flatMap((version) =>
        version.participants.map((participant) => participant.declared),
      ),
    ).toEqual([
      { kind: 'range', range: '>=1.0.0 <3.0.0' },
      { kind: 'range', range: '~1.0.0' },
      { kind: 'range', range: '~1.0.0' },
    ]);
    // Resolved: the copies' tags — shared-elected first, own copies muted.
    const [row] = packageRows(vm);
    expect(row.versions).toEqual([
      { tag: '2.0.0', muted: false, note: null },
      { tag: '1.0.0', muted: true, note: 'own copy of mfe3 (scope)' },
    ]);
    expect(row.conflict).toEqual({
      label: '⚠ 2 resolved versions',
      note: 'more than one distinct version resolves in this share scope (rule: resolved-tag-multiplicity)',
    });
  });

  it('keeps qualified sources, dispositions, and roles distinct facts', () => {
    const vm = vmOf('strict-split', { selectedId: CONFLICT_LIB });
    const [scopeCopy, shareCopy] = vm.detail!.copies;
    expect(scopeCopy.source.qualifier).toBe('exact-target-source');
    expect(scopeCopy.source.display).toBe('mfe3');
    expect(scopeCopy.disposition.label).toBe('scope-registration');
    expect(scopeCopy.roles.map((role) => role.label)).toEqual(['isolated-own']);
    expect(shareCopy.source.display).toBe('host');
    expect(shareCopy.source.host).toBe(true);
    expect(shareCopy.disposition.label).toBe('share-registration');
    expect(shareCopy.roles.map((role) => role.label)).toEqual(['ordinary-shared']);
  });

  it('qualifies the anchored claim and the anchor copy (pooling-anchor)', () => {
    const vm = vmOf('pooling-anchor', { selectedId: CONFLICT_LIB });
    // mfe2's skip claim is anchored to mfe1 — visible state, arrow to the
    // anchor's copy; mfe1's self-anchor stays an own-copy claim.
    const mfe2 = participantOf(vm.detail!, 'mfe2');
    expect(mfe2.state?.label).toBe('anchored');
    expect(mfe2.state?.note).toContain('servedBy anchor: mfe1');
    expect(mfe2.arrow).toEqual({
      kind: 'winner',
      target: '_nf_lab_conflict_lib.JF7uEdSVsN.js',
      provider: 'mfe1',
    });
    const mfe1 = participantOf(vm.detail!, 'mfe1');
    expect(mfe1.state?.label).toBe('anchored');
    expect(mfe1.arrow).toEqual({ kind: 'own' });
    // The anchor copy: explicit-anchor qualification, skip disposition and
    // anchor-source role stay separate facts.
    const anchorCopy = vm.detail!.copies.find((copy) =>
      copy.roles.some((role) => role.label === 'anchor-source'),
    )!;
    expect(anchorCopy.source.qualifier).toBe('explicit-anchor');
    expect(anchorCopy.source.display).toBe('mfe1');
    expect(anchorCopy.disposition.label).toBe('skip-registration');
    expect(anchorCopy.resolvedTag).toBe('1.0.0');
  });

  it('shares strict-scope copies side by side — selected, quiet, no conflict', () => {
    const strictLib = packageId('strict', '@nf-lab/conflict-lib');
    const vm = vmOf('strict-scope', { selectedId: strictLib });
    const [row] = packageRows(vm);
    expect(row.conflict).toBeNull();
    expect(vm.conflictCount).toBe(0);
    expect(row.versions).toEqual([
      { tag: '1.0.0', muted: false, note: null },
      { tag: '2.0.0', muted: false, note: null },
    ]);
    const participants = vm.detail!.negotiation.flatMap((version) => version.participants);
    expect(participants.map((participant) => participant.declared)).toEqual([
      { kind: 'pinned', tag: '2.0.0' },
      { kind: 'pinned', tag: '1.0.0' },
    ]);
    expect(participants.map((participant) => participant.state?.label)).toEqual([
      'selected',
      'selected',
    ]);
    expect(participants.map((participant) => participant.arrow)).toEqual([null, null]);
  });
});

/** One seeded shared-external declaration (v4.5 spelling). */
function declarationOf(
  name: string,
  entries: Record<string, string>,
  bundle: string | null = null,
) {
  return {
    name,
    requiredVersion: '^1.0.0',
    strictVersion: false,
    file: null,
    entries,
    cached: true,
    bundle,
    servedFiles: Object.entries(entries).map(([entry, file]) => ({ entry, file })),
    generation: 'v4.5',
  } as const;
}

/** Minimal synthetic snapshot around seeded externals and map entries. */
function seedSnapshot(options: {
  remotes: Record<string, string>;
  sharedExternals: NonNullable<SnapshotV1['runtime']>['sharedExternals'];
  imports?: { specifier: string; target: string }[];
  scopes?: { scope: string; imports: { specifier: string; target: string }[] }[];
}): SnapshotV1 {
  return {
    schemaVersion: 1,
    capture: {
      pageUrl: 'https://seed.example/',
      capturedAt: '2026-08-19T00:00:00.000Z',
      mode: 'passive',
      collectorVersion: 'seed/1',
    },
    channels: {
      nativeFederationGlobals: { state: 'available' },
      domImportMaps: { state: 'available' },
      importShim: { state: 'unavailable', reason: 'window.importShim is not present' },
    },
    runtime: {
      remotes: Object.fromEntries(
        Object.entries(options.remotes).map(([name, scopeUrl]) => [
          name,
          { scopeUrl, exposes: [], integrity: {} },
        ]),
      ),
      scopedExternals: {},
      sharedExternals: options.sharedExternals,
      sharedChunks: {},
      generation: 'v4.5',
    },
    importMaps: {
      documentMaps: [
        {
          kind: 'importmap',
          parsed: true,
          importCount: options.imports?.length ?? 0,
          scopeCount: options.scopes?.length ?? 0,
          imports: options.imports ?? [],
          scopes: options.scopes ?? [],
          integrity: {},
        },
      ],
      effective: { imports: [], scopes: [], integrityFor: [] },
    },
    errors: [],
  };
}

const SEED_REMOTES = {
  '__NF-HOST__': 'https://seed.example/',
  mfe1: 'https://seed.example/mfe1/',
  mfe2: 'https://seed.example/mfe2/',
};

/**
 * Equal-tag seed: two share registrations of the SAME tag (and action —
 * canonical ordinals keep them distinct), each consumer's scoped map
 * selecting its own copy — two copies, one resolved tag (T7-AC-03).
 */
const EQUAL_TAG_SEED = seedSnapshot({
  remotes: SEED_REMOTES,
  sharedExternals: {
    __GLOBAL__: {
      'ui-lib': {
        dirty: false,
        versions: [
          {
            tag: '1.0.0',
            action: 'share',
            host: false,
            remotes: [declarationOf('mfe1', { 'ui-lib': 'ui-lib.AAAA.js' }, 'bundle-a')],
          },
          {
            tag: '1.0.0',
            action: 'share',
            host: false,
            remotes: [declarationOf('mfe2', { 'ui-lib': 'ui-lib.BBBB.js' }, 'bundle-b')],
          },
        ],
      },
    },
  },
  scopes: [
    { scope: './mfe1/', imports: [{ specifier: 'ui-lib', target: './mfe1/ui-lib.AAAA.js' }] },
    { scope: './mfe2/', imports: [{ specifier: 'ui-lib', target: './mfe2/ui-lib.BBBB.js' }] },
  ],
});

describe('buildPackagesVm — equal-tag copies are no conflict (T7-AC-03)', () => {
  const model = ingestSnapshot(EQUAL_TAG_SEED);
  const vm = buildPackagesVm(model, {
    filter: 'all',
    selectedId: packageId('__GLOBAL__', 'ui-lib'),
  });

  it('renders two copies with one resolved tag and no conflict indicator', () => {
    expect(vm.detail!.measures).toEqual({
      registrations: 2,
      declaredTags: 1,
      resolvedCopies: 2,
      resolvedTags: 1,
      unknownTagCopies: 0,
      declarations: 2,
    });
    const [row] = packageRows(vm);
    expect(row.versions).toEqual([{ tag: '1.0.0', muted: false, note: null }]);
    expect(row.conflict).toBeNull();
    expect(vm.conflictCount).toBe(0);
    expect(vm.detail!.copies).toHaveLength(2);
  });

  it('keeps equal (tag, action) registrations distinct via canonical IDs', () => {
    const versions = vm.detail!.negotiation;
    expect(versions.map((version) => `${version.tag} ${version.action}`)).toEqual([
      '1.0.0 share',
      '1.0.0 share',
    ]);
    // Render tracking keys on the canonical registration/declaration IDs —
    // `(tag, action)` legitimately repeats and must not collide.
    expect(new Set(versions.map((version) => version.registrationId)).size).toBe(2);
    expect(
      new Set(
        versions.flatMap((version) =>
          version.participants.map((participant) => participant.declarationId),
        ),
      ).size,
    ).toBe(2);
  });
});

/** Same package name in TWO share scopes — counts must stay scope-specific. */
const MULTI_SCOPE_SEED = seedSnapshot({
  remotes: SEED_REMOTES,
  sharedExternals: {
    __GLOBAL__: {
      'ui-lib': {
        dirty: false,
        versions: [
          {
            tag: '1.0.0',
            action: 'share',
            host: false,
            remotes: [declarationOf('mfe1', { 'ui-lib': 'ui-lib.AAAA.js' })],
          },
        ],
      },
    },
    team: {
      'ui-lib': {
        dirty: false,
        versions: [
          {
            tag: '2.0.0',
            action: 'share',
            host: false,
            remotes: [declarationOf('mfe2', { 'ui-lib': 'ui-lib.BBBB.js' })],
          },
        ],
      },
    },
  },
  scopes: [
    { scope: './mfe1/', imports: [{ specifier: 'ui-lib', target: './mfe1/ui-lib.AAAA.js' }] },
    { scope: './mfe2/', imports: [{ specifier: 'ui-lib', target: './mfe2/ui-lib.BBBB.js' }] },
  ],
});

describe('buildPackagesVm — scope-specific counts (T7-AC-02)', () => {
  const model = ingestSnapshot(MULTI_SCOPE_SEED);
  const build = (selectedId: string) => buildPackagesVm(model, { filter: 'all', selectedId });

  it('counts each share scope of an equally named package separately', () => {
    const scopeCounts = {
      registrations: 1,
      declaredTags: 1,
      resolvedCopies: 1,
      resolvedTags: 1,
      unknownTagCopies: 0,
      declarations: 1,
    };
    const globalDetail = build(packageId('__GLOBAL__', 'ui-lib')).detail!;
    expect(globalDetail.measures).toEqual(scopeCounts);
    expect(globalDetail.copies.map((copy) => copy.source.display)).toEqual(['mfe1']);
    expect(globalDetail.copies.map((copy) => copy.resolvedTag)).toEqual(['1.0.0']);

    const teamDetail = build(packageId('team', 'ui-lib')).detail!;
    expect(teamDetail.measures).toEqual(scopeCounts);
    expect(teamDetail.copies.map((copy) => copy.source.display)).toEqual(['mfe2']);
    expect(teamDetail.copies.map((copy) => copy.resolvedTag)).toEqual(['2.0.0']);
  });
});

/** Deep subpath chain — every package keeps a row in the flat list. */
const SUBPATH_SEED = seedSnapshot({
  remotes: SEED_REMOTES,
  sharedExternals: {
    __GLOBAL__: {
      foo: {
        dirty: false,
        versions: [
          {
            tag: '1.0.0',
            action: 'share',
            host: false,
            remotes: [declarationOf('mfe1', { foo: 'foo.js' })],
          },
        ],
      },
      'foo/bar': {
        dirty: false,
        versions: [
          {
            tag: '1.0.0',
            action: 'share',
            host: false,
            remotes: [declarationOf('mfe1', { 'foo/bar': 'foo-bar.js' })],
          },
        ],
      },
      'foo/bar/baz': {
        dirty: false,
        versions: [
          {
            tag: '1.0.0',
            action: 'share',
            host: false,
            remotes: [declarationOf('mfe1', { 'foo/bar/baz': 'foo-bar-baz.js' })],
          },
        ],
      },
    },
  },
});

describe('buildPackagesVm — deep subpath chains keep every row', () => {
  it('links every subpath to its base package and loses no package', () => {
    const model = ingestSnapshot(SUBPATH_SEED);
    const vm = buildPackagesVm(model, { filter: 'all', selectedId: null });
    expect(vm.packageCount).toBe(3);
    expect(vm.rows.map((row) => ({ id: row.id, depth: row.depth }))).toEqual([
      { id: packageId('__GLOBAL__', 'foo'), depth: 0 },
      { id: packageId('__GLOBAL__', 'foo/bar'), depth: 1 },
      { id: packageId('__GLOBAL__', 'foo/bar/baz'), depth: 1 },
    ]);
    expect(packageRows(vm).map((row) => row.displayName)).toEqual(['foo', '/bar', '/bar/baz']);
    const detail = buildPackagesVm(model, {
      filter: 'all',
      selectedId: packageId('__GLOBAL__', 'foo/bar/baz'),
    }).detail!;
    expect(detail.parent).toEqual({
      packageName: 'foo',
      packageId: packageId('__GLOBAL__', 'foo'),
      rule: 'name-derived',
    });
  });
});

/**
 * Two equally specific remote scope prefixes match the resolved target and
 * no exact candidate does — the canonical attribution is `ambiguous-scope`
 * (remote: null) and must render as an ambiguous source, never "unknown".
 */
const AMBIGUOUS_SCOPE_SEED = seedSnapshot({
  remotes: {
    '__NF-HOST__': 'https://seed.example/',
    r1: 'https://seed.example/shared/',
    r2: 'https://seed.example/shared/',
  },
  sharedExternals: {
    __GLOBAL__: {
      'amb-lib': {
        dirty: false,
        versions: [
          {
            tag: '1.0.0',
            action: 'share',
            host: false,
            remotes: [declarationOf('r1', { 'amb-lib': 'a.js' })],
          },
        ],
      },
    },
  },
  imports: [{ specifier: 'amb-lib', target: './shared/b.js' }],
});

describe('buildPackagesVm — ambiguous scope attribution stays ambiguous', () => {
  it('qualifies the copy source as ambiguous instead of unknown', () => {
    const model = ingestSnapshot(AMBIGUOUS_SCOPE_SEED);
    const vm = buildPackagesVm(model, {
      filter: 'all',
      selectedId: packageId('__GLOBAL__', 'amb-lib'),
    });
    const [copy] = vm.detail!.copies;
    expect(copy.source.qualifier).toBe('ambiguous-source');
    expect(copy.source.display).toBeNull();
    expect(copy.source.note).toContain('equally specific remote scope prefixes');
    expect(copy.disposition.label).toBe('target-only');
    const [row] = packageRows(vm);
    expect(row.sources).toEqual([]);
    expect(row.unknownTagged).toEqual({
      count: 1,
      note: '1 copy without a uniquely evidenced source tag',
    });
  });
});

/**
 * One declaration claiming TWO specifiers: the main specifier resolves, the
 * secondary entrypoint stays unmapped — its claim must remain visible
 * beside the main claim, never collapsed away.
 */
const MULTI_ENTRY_SEED = seedSnapshot({
  remotes: SEED_REMOTES,
  sharedExternals: {
    __GLOBAL__: {
      'ui-lib': {
        dirty: false,
        versions: [
          {
            tag: '1.0.0',
            action: 'share',
            host: false,
            remotes: [
              declarationOf('mfe1', {
                'ui-lib': 'ui-lib.AAAA.js',
                'ui-lib/sub': 'ui-lib-sub.BBBB.js',
              }),
            ],
          },
        ],
      },
    },
  },
  imports: [{ specifier: 'ui-lib', target: './mfe1/ui-lib.AAAA.js' }],
});

describe('buildPackagesVm — multi-entrypoint declarations keep every claim', () => {
  it('renders the secondary specifier claim beside the main claim', () => {
    const model = ingestSnapshot(MULTI_ENTRY_SEED);
    const vm = buildPackagesVm(model, {
      filter: 'all',
      selectedId: packageId('__GLOBAL__', 'ui-lib'),
    });
    const participant = participantOf(vm.detail!, 'mfe1');
    expect(participant.state?.label).toBe('selected');
    expect(participant.otherClaims).toEqual([
      {
        claimId: expect.any(String) as string,
        specifier: 'ui-lib/sub',
        state: {
          label: 'not mapped',
          note: 'no applicable import-map binding for this specifier in this capture',
        },
        target: null,
      },
    ]);
    // The unmapped secondary claim materializes no copy entrypoint.
    expect(vm.detail!.copies[0].entrypoints.map((entry) => entry.specifier)).toEqual(['ui-lib']);
  });
});

/**
 * Cross-package source convergence: this package's bindings map, but the
 * resolved copy is attributed to ANOTHER package's source. The no-copy
 * wording must not claim a missing import-map binding.
 */
const CROSS_SOURCE_SEED = seedSnapshot({
  remotes: SEED_REMOTES,
  sharedExternals: {
    __GLOBAL__: {
      'lib-a': {
        dirty: false,
        versions: [
          {
            tag: '1.0.0',
            action: 'share',
            host: false,
            remotes: [declarationOf('mfe1', { 'lib-a': 'a.js' })],
          },
        ],
      },
      'lib-b': {
        dirty: false,
        versions: [
          {
            tag: '1.0.0',
            action: 'share',
            host: false,
            remotes: [declarationOf('mfe2', { 'lib-a': 'shared.js', 'lib-b': 'b.js' })],
          },
        ],
      },
    },
  },
  imports: [
    { specifier: 'lib-a', target: './mfe2/shared.js' },
    { specifier: 'lib-b', target: './mfe2/b.js' },
  ],
});

describe('buildPackagesVm — missing source copy is not a missing binding', () => {
  it('states source-copy absence while the arrows keep the mapped target', () => {
    const model = ingestSnapshot(CROSS_SOURCE_SEED);
    const vm = buildPackagesVm(model, {
      filter: 'all',
      selectedId: packageId('__GLOBAL__', 'lib-a'),
    });
    const detail = vm.detail!;
    expect(detail.copies).toEqual([]);
    expect(detail.resolutionNote).toBe(
      'no source copy is attributed to this package — its bindings resolve to copies of other packages',
    );
    const row = packageRows(vm).find((candidate) => candidate.packageName === 'lib-a')!;
    expect(row.noCopy).toEqual({
      label: 'no resolved copies',
      note: 'no source copy is attributed to this package — its bindings resolve to copies of other packages',
    });
    // The binding itself stays visible: mfe1 resolves to mfe2's copy.
    const mfe1 = participantOf(detail, 'mfe1');
    expect(mfe1.arrow).toEqual({ kind: 'winner', target: 'shared.js', provider: 'mfe2' });
  });
});

describe('buildPackagesVm — chunks from canonical bundle claims only (T7-AC-04)', () => {
  const model = modelOf('frankenstein-live');
  const build = (selectedId: string | null) =>
    buildPackagesVm(model, { filter: 'all', selectedId });

  it('renders the mapped-source claim of a host-provided package with its chunk file', () => {
    const vm = build(packageId('__GLOBAL__', '@angular/common'));
    expect(vm.detail!.chunks).toEqual({
      claims: [
        {
          claimId: vm.detail!.chunks!.claims[0].claimId,
          bundle: 'browser-angular_common',
          status: 'mapped-source',
          note: expect.stringContaining('available for loading') as string,
          source: { display: 'host', host: true, remoteSelect: NF_HOST },
          files: ['chunk-WW26EZ22.js'],
          fileClaim: '1 chunk file',
        },
      ],
      rule: 'bundle-claim',
    });
    // The claim ID chains into the canonical projection (T7-AC-05).
    const claim = model.resolutionProjection.bundleClaims.find(
      (candidate) => candidate.id === vm.detail!.chunks!.claims[0].claimId,
    );
    expect(claim?.status).toBe('mapped-source');
  });

  it('qualifies a source-only claim and claims chunk-list absence explicitly', () => {
    const vm = build(packageId('__GLOBAL__', 'tslib'));
    expect(vm.detail!.chunks!.claims).toEqual([
      expect.objectContaining({
        bundle: 'browser-tslib',
        status: 'source-only',
        files: [],
        fileClaim: 'no chunk list recorded in this capture',
      }),
    ]);
  });

  it('states honest absence for a package whose copies carry no bundle claims', () => {
    const vm = build(packageId('__GLOBAL__', '@excalidraw/excalidraw'));
    expect(vm.detail!.chunks).toBeNull();
    expect(vm.detail!.chunksUnavailable).toBe(
      'no bundle claims recorded for this package’s copies',
    );
  });

  it('lets only the selected declaration claim the shared bundle (pooling-anchor /extra)', () => {
    const vm = vmOf('pooling-anchor', {
      selectedId: packageId('__GLOBAL__', '@nf-lab/conflict-lib/extra'),
    });
    // mfe2 also declares /extra with the same bundle but is not selected —
    // it donates nothing; only mfe1's source claim renders.
    const claims = vm.detail!.chunks!.claims;
    expect(claims).toHaveLength(1);
    expect(claims[0].source).toEqual({ display: 'mfe1', host: false, remoteSelect: 'mfe1' });
    expect(claims[0].status).toBe('source-only');
  });
});

describe('buildPackagesVm — honest no-copy rendering (synthetic-multi-version)', () => {
  it('renders declared registrations with zero copies and no conflict', () => {
    const uiLib = packageId('__GLOBAL__', 'ui-lib');
    const vm = vmOf('synthetic-multi-version', { selectedId: uiLib });

    const [row] = packageRows(vm);
    expect(row.versions).toEqual([]);
    expect(row.noCopy).toEqual({
      label: 'no resolved copies',
      note: 'declared, but no import-map binding resolves this package in this capture',
    });
    expect(row.conflict).toBeNull();
    expect(row.sources).toEqual([]);

    expect(vm.detail!.measures).toEqual({
      registrations: 2,
      declaredTags: 2,
      resolvedCopies: 0,
      resolvedTags: 0,
      unknownTagCopies: 0,
      declarations: 2,
    });
    expect(vm.detail!.resolutionNote).toBe(
      'declared, but no import-map binding resolves this package in this capture',
    );
    const participants = vm.detail!.negotiation.flatMap((version) => version.participants);
    expect(participants.map((participant) => participant.state?.label)).toEqual([
      'not mapped',
      'not mapped',
    ]);
    expect(vm.detail!.chunksUnavailable).toBe(
      'no resolved copies — no bundle evidence to attribute',
    );
  });
});

describe('buildPackagesVm — flat list, links, filter, scopes (structure preserved)', () => {
  it('lists all 20 live packages as flat leaf rows', () => {
    const vm = vmOf('frankenstein-live');
    expect(vm.packageCount).toBe(20);
    expect(packageRows(vm)).toHaveLength(20);
    expect(vm.rows.every((row) => !row.expandable)).toBe(true);
    expect(vm.scopes.reduce((sum, scope) => sum + scope.packageCount, 0)).toBe(20);
    const common = packageRows(vm).find((row) => row.packageName === '@angular/common')!;
    expect(common.sources).toEqual([{ name: NF_HOST, host: true }]);
    expect(common.alsoResolvedBy).toBeNull();
  });

  it('renders /extra as a linked sibling directly under its parent', () => {
    const vm = vmOf('self-fill');
    const extraRow = vm.rows.find(
      (row) => row.id === packageId('__GLOBAL__', '@nf-lab/conflict-lib/extra'),
    )!;
    expect(extraRow.depth).toBe(1);
    expect(vm.rows.indexOf(extraRow)).toBe(1);
    expect(extraRow.payload.displayName).toBe('/extra');
    expect(extraRow.payload.linked).toEqual({
      parentPackage: '@nf-lab/conflict-lib',
      rule: 'name-derived',
    });
    const detail = vmOf('self-fill', {
      selectedId: packageId('__GLOBAL__', '@nf-lab/conflict-lib/extra'),
    }).detail!;
    expect(detail.parent).toEqual({
      packageName: '@nf-lab/conflict-lib',
      packageId: CONFLICT_LIB,
      rule: 'name-derived',
    });
  });

  it('narrows the Conflicts filter to resolved-tag multiplicity only', () => {
    const clean = vmOf('self-fill', { filter: 'conflicts' });
    expect(clean.conflictCount).toBe(0);
    expect(clean.rows).toEqual([]);
    expect(clean.emptyNote).toBe('no version conflicts in this capture');

    const split = vmOf('strict-split', { filter: 'conflicts' });
    expect(split.conflictCount).toBe(1);
    expect(packageRows(split).map((row) => row.packageName)).toEqual(['@nf-lab/conflict-lib']);
  });

  it('reads the __GLOBAL__ sentinel as the global label, verbatim preserved', () => {
    const vm = vmOf('clean-skip');
    expect(vm.scopes).toEqual([{ scope: '__GLOBAL__', label: 'global', packageCount: 1 }]);
    const detail = vmOf('clean-skip', { selectedId: CONFLICT_LIB }).detail!;
    expect(detail.scope).toBe('__GLOBAL__');
    expect(detail.scopeDisplay).toBe('global');
  });
});

describe('buildPackagesVm — purity (T7-AC-05)', () => {
  it('is pure: identical inputs produce identical output and stay unmodified', () => {
    const model = modelOf('self-fill');
    const modelBefore = JSON.stringify(model);
    const ui: PackagesUiState = { filter: 'all', selectedId: CONFLICT_LIB };

    const first = buildPackagesVm(model, ui);
    const second = buildPackagesVm(model, ui);

    expect(second).toEqual(first);
    expect(JSON.stringify(model)).toBe(modelBefore);
  });
});
