/**
 * Remotes view-model specs — fixture-driven acceptance (T8): the remote as
 * a CONSUMER of the canonical resolution model.
 *  - T8-AC-01: co-declared-share — both remotes retain exactly one
 *    declaration and resolve to the same effective target/copy while their
 *    claim states differ (own arrow vs `not selected`).
 *  - T8-AC-02: clean-skip — the skip consumer draws an evidenced fallback
 *    arrow to the selected copy's source without a universal-provider
 *    claim; the selected consumer draws its own-copy arrow.
 *  - T8-AC-03: scoped — two complete private registration → claim →
 *    resolution → copy paths with retained `PrivateRegistrationId` and no
 *    fabricated share action or share scope.
 *  - T8-AC-04: pooling-anchor anchors, not-selected and unknown/unmapped
 *    evidence stay visible; the chunk section renders exclusively from
 *    canonical bundle claims and chunk groups.
 *  - T8-AC-05 (builder half): no `DerivedFederation` input; pure — same
 *    inputs, same output; inputs stay unmodified.
 * List/expose/badge behavior carried over from T11 is re-pinned on the
 * canonical grounding (declaration counts, projection-backed badges).
 *
 * The seed section (T8 review round) witnesses what the fixture corpus
 * cannot: the qualified-source ladder (ambiguous scope, host fallback,
 * unknown source — H1), relation-only consumers (H2), and private
 * not-selected / multi-entrypoint claims (H3).
 */
import { FIXTURES, NF_HOST, SnapshotV1 } from 'devtools-bridge';

import type { FederationModel } from '../../shared/store/federation-model';
import { ingestSnapshot } from '../../shared/store/ingest';
import { RemoteDetailVm, RemotesUiState, RemotesVm, buildRemotesVm } from './remotes-view-model';

function modelOf(name: keyof typeof FIXTURES): FederationModel {
  return ingestSnapshot(FIXTURES[name]);
}

function vmOf(name: keyof typeof FIXTURES, ui: Partial<RemotesUiState> = {}): RemotesVm {
  return buildRemotesVm(modelOf(name), { selectedName: null, ...ui });
}

function detailOf(name: keyof typeof FIXTURES, selectedName: string): RemoteDetailVm {
  return vmOf(name, { selectedName }).detail!;
}

describe('buildRemotesVm — left list', () => {
  it('lists the three live remotes in model order with the host marked', () => {
    const vm = vmOf('frankenstein-live');

    expect(vm.remoteCount).toBe(3);
    expect(vm.rows.map((row) => row.payload.name)).toEqual(['whiteboard', 'mermaid', NF_HOST]);
    expect(vm.rows.map((row) => row.payload.host)).toEqual([false, false, true]);
    // Flat list — nothing expands.
    expect(vm.rows.every((row) => !row.expandable && row.depth === 0)).toBe(true);
    expect(vm.emptyNote).toBeNull();
  });

  it('summarizes expose and DECLARATION counts per remote (clean-skip ground truth)', () => {
    const vm = vmOf('clean-skip');

    const summaries = new Map(vm.rows.map((row) => [row.payload.name, row.payload.summary]));
    // Declarations are called declarations — never versions, copies, or
    // providers (T8 instruction).
    expect(summaries.get('mfe1')).toBe('1 expose · 1 declaration');
    expect(summaries.get('mfe2')).toBe('1 expose · 1 declaration');
    expect(summaries.get(NF_HOST)).toBe('0 exposes · 0 declarations');
  });

  it('counts true private registrations in the summary, never chunk carriers', () => {
    const scopedSummaries = new Map(
      vmOf('scoped').rows.map((row) => [row.payload.name, row.payload.summary]),
    );
    expect(scopedSummaries.get('mfe1')).toContain('1 private registration');

    // non-dense mfe3 carries 7 reclassified `@nf-internal/` chunk carriers —
    // registry evidence, but presented as chunks, not as registrations.
    const nonDense = new Map(
      vmOf('non-dense').rows.map((row) => [row.payload.name, row.payload.summary]),
    );
    expect(nonDense.get('mfe3')).toContain('14 declarations');
    expect(nonDense.get('mfe3')).not.toContain('private registration');
  });

  it('renders an honest empty note when the capture holds no remotes', () => {
    const vm = vmOf('synthetic-empty-page');

    expect(vm.rows).toEqual([]);
    expect(vm.emptyNote).toBe('no remotes in this capture');
    expect(vm.detail).toBeNull();
  });
});

describe('buildRemoteDetail — identity, selection, capabilities', () => {
  it('resolves the host selection by the verbatim sentinel, displayed as host', () => {
    const detail = detailOf('frankenstein-live', NF_HOST);

    expect(detail.name).toBe(NF_HOST);
    expect(detail.display).toBe('host');
    expect(detail.host).toBe(true);
    // Scope URL as recorded (live registries keep relative URLs) plus the
    // resolved form.
    expect(detail.identity).toEqual([
      { label: 'scope URL', value: './', mono: true },
      {
        label: 'resolved',
        value: 'https://lutzleonhardt.de/frankenstein-meeting-room/',
        mono: true,
        href: 'https://lutzleonhardt.de/frankenstein-meeting-room/',
      },
    ]);
  });

  it('yields no detail without a selection or for an unknown remote', () => {
    expect(vmOf('frankenstein-live').detail).toBeNull();
    expect(vmOf('frankenstein-live', { selectedName: 'display name' }).detail).toBeNull();
  });

  it('grounds the live badge matrix canonically: host fully dense, others SRI only', () => {
    // dense chunking ← projection `shared-chunks` groups of this emitter;
    // dense externals ← canonical declarations carrying a bundle; SRI ←
    // the remote's recorded integrity map.
    const host = detailOf('frankenstein-live', NF_HOST);
    expect(host.capabilities.map((capability) => capability.label)).toEqual([
      'dense chunking',
      'dense externals',
      'SRI',
    ]);

    for (const remote of ['whiteboard', 'mermaid']) {
      const detail = detailOf('frankenstein-live', remote);
      expect(detail.capabilities.map((capability) => capability.label)).toEqual(['SRI']);
    }
  });
});

describe('buildRemoteDetail — co-declared share (T8-AC-01)', () => {
  it('keeps one declaration per remote, same effective copy, different claim states', () => {
    const mfe1 = detailOf('co-declared-share', 'mfe1');
    const mfe2 = detailOf('co-declared-share', 'mfe2');

    // Each remote retains exactly ONE declaration row.
    expect(mfe1.deps).toHaveLength(1);
    expect(mfe2.deps).toHaveLength(1);
    const [dep1] = mfe1.deps;
    const [dep2] = mfe2.deps;
    expect(dep1.declarationId).not.toBe(dep2.declarationId);

    // Shared registry facts, verbatim.
    for (const dep of [dep1, dep2]) {
      expect(dep.packageName).toBe('@nf-lab/conflict-lib');
      expect(dep.packageSelect).toBe('__GLOBAL__|@nf-lab/conflict-lib');
      expect(dep.scopeLabel).toBeNull();
      expect(dep.declared).toEqual({ kind: 'range', range: '>=1.0.0 <3.0.0' });
      expect(dep.action).toBe('share');
      expect(dep.symbol).toBe('●');
    }

    // Same effective target/copy: mfe1's own copy serves both bindings —
    // mfe2's arrow names exactly mfe1's file. The claim states differ.
    expect(dep1.arrow).toEqual({ kind: 'own' });
    expect(dep1.states).toEqual([]);
    expect(dep2.arrow).toEqual({
      kind: 'winner',
      target: '_nf_lab_conflict_lib.JF7uEdSVsN.js',
      provider: 'mfe1',
    });
    expect(dep2.states).toEqual([
      {
        label: 'not selected',
        note: 'the own candidate is not selected in this capture — the binding resolves to the selected copy; a different composition may select it',
      },
    ]);
  });
});

describe('buildRemoteDetail — evidenced fallback (T8-AC-02)', () => {
  it('draws the skip consumer’s fallback to the selected copy without a provider claim', () => {
    const detail = detailOf('clean-skip', 'mfe1');

    expect(detail.deps).toHaveLength(1);
    const [dep] = detail.deps;
    expect(dep.action).toBe('skip');
    expect(dep.symbol).toBe('○');
    // The arrow names the selected copy's file and its evidenced source —
    // a per-binding fact, not a universal provider.
    expect(dep.arrow).toEqual({
      kind: 'winner',
      target: '_nf_lab_conflict_lib.jvcc6K1csg.js',
      provider: 'mfe2',
    });
    // Fallback stays chip-less: the arrow speaks. The action note states
    // registry evidence only — never a mapping outcome (T8 review H4).
    expect(dep.states).toEqual([]);
    expect(dep.actionNote).toBe(
      'registered with action skip — the registry election does not take this copy',
    );
  });

  it('keeps the selected consumer on its own-copy arrow', () => {
    const detail = detailOf('clean-skip', 'mfe2');

    expect(detail.deps).toHaveLength(1);
    const [dep] = detail.deps;
    expect(dep.action).toBe('share');
    expect(dep.arrow).toEqual({ kind: 'own' });
    expect(dep.states).toEqual([]);
  });
});

describe('buildRemoteDetail — private registrations (T8-AC-03)', () => {
  it('renders two complete private registration → claim → resolution → copy paths', () => {
    const expectations = [
      ['mfe1', '1.0.0', '_nf_lab_conflict_lib.JF7uEdSVsN.js'],
      ['mfe2', '2.0.0', '_nf_lab_conflict_lib.jvcc6K1csg.js'],
    ] as const;
    for (const [remote, tag, file] of expectations) {
      const detail = detailOf('scoped', remote);

      // Private registrations never leak into the shared declaration rows.
      expect(detail.deps).toEqual([]);
      expect(detail.scoped).toHaveLength(1);
      const [scoped] = detail.scoped;
      // The canonical PrivateRegistrationId is retained as the identity.
      expect(scoped.registrationId).toContain('private-registration');
      expect(scoped.registrationId).toContain(remote);
      expect(scoped.packageName).toBe('@nf-lab/conflict-lib');
      expect(scoped.tag).toBe(tag);
      expect(scoped.bundle).toBe('browser-shared');
      expect(scoped.domainNote).toContain('no share action, no share scope');
      // No share action or share scope is fabricated — the vm shape has no
      // such field at all.
      expect(Object.keys(scoped).sort()).toEqual([
        'bundle',
        'claims',
        'domainNote',
        'packageName',
        'registrationId',
        'tag',
      ]);

      // claim → resolution → copy, complete.
      expect(scoped.claims).toHaveLength(1);
      const [claim] = scoped.claims;
      expect(claim.specifier).toBe('@nf-lab/conflict-lib');
      expect(claim.state.label).toBe('own mapping');
      expect(claim.state.note).toContain('private domain, no share action, no share scope');
      expect(claim.file).toBe(file);
      expect(claim.targetUrl).toContain(`/${remote}/`);
      expect(claim.copyTag).toBe(tag);
    }
  });
});

describe('buildRemoteDetail — anchor, not-selected, unknown evidence (T8-AC-04)', () => {
  it('keeps the explicit servedBy anchor visible on both sides of the pool', () => {
    const mfe1 = detailOf('pooling-anchor', 'mfe1');
    const mfe2 = detailOf('pooling-anchor', 'mfe2');

    // The anchor's own row: own-copy arrow plus the anchored chip. The
    // action tooltip must NOT contradict them with a mapping claim — this
    // skip consumer resolves to its OWN copy through the anchor (H4).
    const anchor1 = mfe1.deps.find((dep) => dep.packageName === '@nf-lab/conflict-lib')!;
    expect(anchor1.action).toBe('skip');
    expect(anchor1.arrow).toEqual({ kind: 'own' });
    expect(anchor1.actionNote).toBe(
      'registered with action skip — the registry election does not take this copy',
    );
    expect(anchor1.states).toEqual([
      {
        label: 'anchored',
        note: "explicit servedBy anchor: mfe1 — the binding resolves through the anchor's copy",
      },
    ]);

    // The pooled consumer: anchored chip plus the arrow to the anchor copy.
    const anchor2 = mfe2.deps.find((dep) => dep.packageName === '@nf-lab/conflict-lib')!;
    expect(anchor2.arrow).toEqual({
      kind: 'winner',
      target: '_nf_lab_conflict_lib.JF7uEdSVsN.js',
      provider: 'mfe1',
    });
    expect(anchor2.states.map((state) => state.label)).toEqual(['anchored']);

    // The secondary external keeps its own not-selected evidence.
    const extra2 = mfe2.deps.find((dep) => dep.packageName === '@nf-lab/conflict-lib/extra')!;
    expect(extra2.arrow).toEqual({
      kind: 'winner',
      target: '_nf_lab_conflict_lib_extra.GWjTDmPaoo.js',
      provider: 'mfe1',
    });
    expect(extra2.states.map((state) => state.label)).toEqual(['not selected']);
  });

  it('keeps unresolved declarations visible with an honest none-arrow', () => {
    // synthetic-multi-version carries no import maps — the canonical claims
    // resolve nowhere; the old view's local election marker is gone.
    for (const remote of ['calendar', 'chat']) {
      const detail = detailOf('synthetic-multi-version', remote);
      expect(detail.deps).toHaveLength(1);
      const [dep] = detail.deps;
      expect(dep.arrow).toEqual({
        kind: 'none',
        reason: 'no import-map binding in this capture',
      });
      expect(dep.states.map((state) => state.label)).toEqual(['not mapped']);
      expect(dep.strict).toBe(true);
    }
  });

  it('renders the strict scope side by side with pinned tags and no exception', () => {
    for (const [remote, tag] of [
      ['mfe1', '1.0.0'],
      ['mfe2', '2.0.0'],
    ] as const) {
      const detail = detailOf('strict-scope', remote);
      expect(detail.deps).toHaveLength(1);
      const [dep] = detail.deps;
      expect(dep.scopeLabel).toBe('strict');
      expect(dep.declared).toEqual({ kind: 'pinned', tag });
      expect(dep.arrow).toEqual({ kind: 'own' });
      expect(dep.states).toEqual([]);
    }
  });
});

describe('buildRemoteDetail — canonical chunk section (T8-AC-04)', () => {
  it('renders the dense host from canonical bundle claims, qualification intact', () => {
    const chunks = detailOf('frankenstein-live', NF_HOST).chunks;

    expect(chunks.level).toBe('bundle-claims');
    if (chunks.level !== 'bundle-claims') {
      return;
    }
    expect(chunks.rule).toBe('canonical-bundle-claims');
    expect(chunks.note).toContain('canonical bundle claims');
    // Registered chunk evidence presents its count; a bundle without a
    // recorded chunk list claims the absence and stays visibly qualified.
    expect(chunks.claims).toContainEqual({
      claimId: expect.stringContaining('bundle-claim'),
      packageName: '@angular/common',
      bundle: 'browser-angular_common',
      status: 'mapped-source',
      statusNote: `registered chunk list of this source's bundle — capture evidence, not proof of delivery`,
      fileClaim: '1 chunk file',
    });
    expect(chunks.claims).toContainEqual({
      claimId: expect.stringContaining('bundle-claim'),
      packageName: 'tslib',
      bundle: 'browser-tslib',
      status: 'source-only',
      statusNote: 'the source names this bundle, but the capture registers no chunk list for it',
      fileClaim: 'no chunk list recorded in this capture',
    });
  });

  it('states explicit chunk absence for the v4 live remotes', () => {
    const chunks = detailOf('frankenstein-live', 'whiteboard').chunks;

    expect(chunks.level).toBe('none');
    expect(chunks.note).toContain('no chunk evidence recorded');
    expect(chunks.note).toContain('dense-chunking capability absent');
  });

  it('renders reclassified carrier groups at their own level, never as scoped packages', () => {
    const detail = detailOf('non-dense', 'mfe3');

    expect(detail.scoped).toEqual([]);
    expect(detail.chunks.level).toBe('carrier-groups');
    if (detail.chunks.level !== 'carrier-groups') {
      return;
    }
    expect(detail.chunks.note).toContain('package attribution is not derivable');
    expect(detail.chunks.groups).toHaveLength(7);
    for (const group of detail.chunks.groups) {
      expect(group.groupId).toContain('chunk-group');
      expect(group.label.startsWith('@nf-internal/')).toBe(true);
      expect(group.fileClaim).toBe('1 file');
    }
  });
});

describe('buildRemoteDetail — exposes', () => {
  it('qualifies exposes with the remote name and joins the live /./ map target', () => {
    const detail = detailOf('frankenstein-live', 'whiteboard');

    expect(detail.exposes).toEqual([
      {
        qualified: 'whiteboard/./Bootstrap',
        moduleName: './Bootstrap',
        file: 'Bootstrap-7COJRA5I.js',
        mapTarget:
          'https://lutzleonhardt.de/frankenstein-meeting-room/whiteboard/Bootstrap-7COJRA5I.js',
      },
    ]);
    expect(detail.exposes[0].qualified).toContain('/./');
  });

  it('keeps the host expose list honestly empty', () => {
    expect(detailOf('frankenstein-live', NF_HOST).exposes).toEqual([]);
  });
});

describe('buildRemotesVm — capture boundary and purity (T8-AC-05)', () => {
  it('claims the enumeration boundary as a capture limit in registry language', () => {
    const vm = vmOf('frankenstein-live');

    expect(vm.boundaryNote).toContain('registry trace');
    expect(vm.boundaryNote).toContain('cannot enumerate what the capture cannot see');
    // Delivery wording is gone — the capture records registry evidence,
    // never loading.
    expect(vm.boundaryNote).not.toContain('loaded');
    expect(vm.boundaryNote).not.toContain('error');
  });

  it('is pure: identical inputs produce identical output and stay unmodified', () => {
    const model = modelOf('pooling-anchor');
    const modelBefore = JSON.stringify(model);
    const ui: RemotesUiState = { selectedName: 'mfe2' };

    const first = buildRemotesVm(model, ui);
    const second = buildRemotesVm(model, ui);

    expect(second).toEqual(first);
    expect(JSON.stringify(model)).toBe(modelBefore);
  });
});

/** One seeded shared-external declaration (v4.5 spelling). */
function declarationOf(name: string, entries: Record<string, string>) {
  return {
    name,
    requiredVersion: '^1.0.0',
    strictVersion: false,
    file: null,
    entries,
    cached: true,
    bundle: null,
    servedFiles: Object.entries(entries).map(([entry, file]) => ({ entry, file })),
    generation: 'v4.5',
  } as const;
}

/** Minimal synthetic snapshot around seeded externals and map entries. */
function seedSnapshot(options: {
  remotes: Record<string, string>;
  sharedExternals?: NonNullable<SnapshotV1['runtime']>['sharedExternals'];
  scopedExternals?: NonNullable<SnapshotV1['runtime']>['scopedExternals'];
  imports?: { specifier: string; target: string }[];
  scopes?: { scope: string; imports: { specifier: string; target: string }[] }[];
}): SnapshotV1 {
  return {
    schemaVersion: 1,
    capture: {
      pageUrl: 'https://seed.example/',
      capturedAt: '2026-08-21T00:00:00.000Z',
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
      scopedExternals: options.scopedExternals ?? {},
      sharedExternals: options.sharedExternals ?? {},
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

function seededDetail(seed: SnapshotV1, selectedName: string): RemoteDetailVm {
  return buildRemotesVm(ingestSnapshot(seed), { selectedName }).detail!;
}

/**
 * Two equally specific remote scope prefixes match the resolved target and
 * no exact candidate does — the canonical attribution is `ambiguous-scope`
 * and the row must render it as an AMBIGUOUS source, never as unknown and
 * never as a bare "no evidenced source" (T8 review H1).
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

/**
 * The resolved target lives under the HOST scope only — the observed
 * attribution is the host as least-specific fallback and must render as an
 * observed (not exact, not own) source (T8 review H1).
 */
const HOST_FALLBACK_SEED = seedSnapshot({
  remotes: {
    '__NF-HOST__': 'https://seed.example/',
    r1: 'https://seed.example/r1/',
  },
  sharedExternals: {
    __GLOBAL__: {
      'host-lib': {
        dirty: false,
        versions: [
          {
            tag: '1.0.0',
            action: 'share',
            host: false,
            remotes: [declarationOf('r1', { 'host-lib': 'a.js' })],
          },
        ],
      },
    },
  },
  imports: [{ specifier: 'host-lib', target: './host-lib.js' }],
});

/**
 * The resolved target lives on a foreign origin — no source record and no
 * scope prefix matches; the source must stay a QUALIFIED unknown
 * (T8 review H1).
 */
const UNKNOWN_SOURCE_SEED = seedSnapshot({
  remotes: {
    '__NF-HOST__': 'https://seed.example/',
    r1: 'https://seed.example/r1/',
  },
  sharedExternals: {
    __GLOBAL__: {
      'cdn-lib': {
        dirty: false,
        versions: [
          {
            tag: '1.0.0',
            action: 'share',
            host: false,
            remotes: [declarationOf('r1', { 'cdn-lib': 'a.js' })],
          },
        ],
      },
    },
  },
  imports: [{ specifier: 'cdn-lib', target: 'https://cdn.example/lib.js' }],
});

describe('buildRemoteDetail — qualified source ladder (T8 review H1)', () => {
  it('renders an ambiguous-scope attribution as an ambiguous source, never unknown', () => {
    const detail = seededDetail(AMBIGUOUS_SCOPE_SEED, 'r1');

    expect(detail.deps).toHaveLength(1);
    const [dep] = detail.deps;
    expect(dep.arrow).toEqual({ kind: 'winner', target: 'b.js', provider: 'ambiguous source' });
    expect(dep.states).toEqual([
      {
        label: 'not selected',
        note: 'the own candidate is not selected in this capture — the binding resolves to the selected copy; a different composition may select it',
      },
      {
        label: 'ambiguous source',
        note: 'equally specific remote scope prefixes match this target — none is chosen',
      },
    ]);
  });

  it('renders a host-fallback attribution as an observed target source', () => {
    const detail = seededDetail(HOST_FALLBACK_SEED, 'r1');

    expect(detail.deps).toHaveLength(1);
    const [dep] = detail.deps;
    expect(dep.arrow).toEqual({ kind: 'winner', target: 'host-lib.js', provider: 'host' });
    expect(dep.states.map((state) => state.label)).toEqual([
      'not selected',
      'observed target source',
    ]);
    const observed = dep.states.find((state) => state.label === 'observed target source')!;
    expect(observed.note).toContain('host as least-specific fallback');
    expect(observed.note).toContain('not an exact candidate match');
  });

  it('keeps a source-less foreign target a QUALIFIED unknown source', () => {
    const detail = seededDetail(UNKNOWN_SOURCE_SEED, 'r1');

    expect(detail.deps).toHaveLength(1);
    const [dep] = detail.deps;
    expect(dep.arrow).toEqual({ kind: 'winner', target: 'lib.js', provider: 'unknown source' });
    expect(dep.states.map((state) => state.label)).toEqual(['not selected', 'unknown source']);
    const unknown = dep.states.find((state) => state.label === 'unknown source')!;
    expect(unknown.note).toBe(
      'only the resolved URL is evidenced — no source record or scope prefix matches',
    );
  });
});

/**
 * r1 and r2 share one scope URL; r1's candidate is selected, r2 declares
 * WITHOUT entrypoint candidates. The canonical projection still records a
 * consumer-copy relation for r2 (a claim-less binding still relates) — the
 * detail must surface it instead of dropping it (T8 review H2).
 */
const RELATION_ONLY_SEED = seedSnapshot({
  remotes: {
    '__NF-HOST__': 'https://seed.example/',
    r1: 'https://seed.example/shared/',
    r2: 'https://seed.example/shared/',
  },
  sharedExternals: {
    __GLOBAL__: {
      'alias-lib': {
        dirty: false,
        versions: [
          {
            tag: '1.0.0',
            action: 'share',
            host: false,
            remotes: [declarationOf('r1', { 'alias-lib': 'lib.js' }), declarationOf('r2', {})],
          },
        ],
      },
    },
  },
  scopes: [
    {
      scope: './shared/',
      imports: [{ specifier: 'alias-lib', target: './shared/lib.js' }],
    },
  ],
});

describe('buildRemoteDetail — relation-only consumers stay visible (T8 review H2)', () => {
  it('surfaces the claim-less consumer relation with copy, source, and binding', () => {
    const detail = seededDetail(RELATION_ONLY_SEED, 'r2');

    // The candidate-less declaration row stays honest…
    expect(detail.deps).toHaveLength(1);
    expect(detail.deps[0].arrow).toEqual({
      kind: 'none',
      reason: 'no resolution claim derivable',
    });
    expect(detail.deps[0].states.map((state) => state.label)).toEqual(['declared']);

    // …while the canonical relation shows where the binding resolves.
    expect(detail.relationOnly).toHaveLength(1);
    const [relation] = detail.relationOnly;
    expect(relation.relationId).toContain('consumer-copy-relation');
    expect(relation.packageName).toBe('alias-lib');
    expect(relation.copyTag).toBe('1.0.0');
    expect(relation.source.label).toBe('r1');
    expect(relation.source.note).toContain('exact target source');
    expect(relation.bindings).toEqual([
      {
        resolutionId: expect.stringContaining('alias-lib'),
        specifier: 'alias-lib',
        file: 'lib.js',
        targetUrl: 'https://seed.example/shared/lib.js',
      },
    ]);
    // "resolution claim", not "declaration" — a candidate-less DECLARATION
    // exists in this very seed (T8 review round 2).
    expect(relation.note).toContain('without an own resolution claim');
  });

  it('keeps the claim-backed consumer free of relation-only rows', () => {
    const detail = seededDetail(RELATION_ONLY_SEED, 'r1');

    expect(detail.deps).toHaveLength(1);
    expect(detail.deps[0].arrow).toEqual({ kind: 'own' });
    expect(detail.relationOnly).toEqual([]);
  });

  it('yields no relation-only rows in the fixture corpus (every relation is claim-backed)', () => {
    for (const name of ['co-declared-share', 'clean-skip', 'scoped', 'pooling-anchor'] as const) {
      const model = modelOf(name);
      for (const remote of model.remotes) {
        expect(buildRemotesVm(model, { selectedName: remote.name }).detail!.relationOnly).toEqual(
          [],
        );
      }
    }
  });
});

/**
 * A private registration whose own candidate is NOT the effective binding:
 * the claim maps (copyId attached) but the state must ground on the
 * canonical mappingState, never on the mere existence of a copy
 * (T8 review H3).
 */
const PRIVATE_NOT_SELECTED_SEED = seedSnapshot({
  remotes: {
    '__NF-HOST__': 'https://seed.example/',
    mfe1: 'https://seed.example/mfe1/',
  },
  scopedExternals: {
    mfe1: {
      'priv-lib': {
        tag: '1.0.0',
        bundle: 'bundle-p',
        entries: { 'priv-lib': 'own.js' },
      },
    },
  },
  scopes: [{ scope: './mfe1/', imports: [{ specifier: 'priv-lib', target: './mfe1/other.js' }] }],
});

/** A private registration serving TWO specifiers — both paths stay visible. */
const PRIVATE_MULTI_SEED = seedSnapshot({
  remotes: {
    '__NF-HOST__': 'https://seed.example/',
    mfe1: 'https://seed.example/mfe1/',
  },
  scopedExternals: {
    mfe1: {
      'multi-lib': {
        tag: '2.0.0',
        bundle: 'bundle-m',
        entries: { 'multi-lib': 'main.js', 'multi-lib/extra': 'extra.js' },
      },
    },
  },
  scopes: [
    {
      scope: './mfe1/',
      imports: [
        { specifier: 'multi-lib', target: './mfe1/main.js' },
        { specifier: 'multi-lib/extra', target: './mfe1/extra.js' },
      ],
    },
  ],
});

describe('buildRemoteDetail — private claim states ground on mappingState (T8 review H3)', () => {
  it('renders a mapped-but-not-own private claim as NOT selected, never own mapping', () => {
    const detail = seededDetail(PRIVATE_NOT_SELECTED_SEED, 'mfe1');

    expect(detail.scoped).toHaveLength(1);
    const [scoped] = detail.scoped;
    expect(scoped.tag).toBe('1.0.0');
    expect(scoped.claims).toHaveLength(1);
    const [claim] = scoped.claims;
    expect(claim.state.label).toBe('not selected');
    expect(claim.state.note).toContain('not the effective binding in this capture');
    // The path stays complete: the binding's actual target and copy remain
    // visible beside the honest state.
    expect(claim.file).toBe('other.js');
    expect(claim.copyTag).toBeNull();
  });

  it('keeps every specifier path of a multi-entrypoint private registration visible', () => {
    const detail = seededDetail(PRIVATE_MULTI_SEED, 'mfe1');

    expect(detail.scoped).toHaveLength(1);
    const [scoped] = detail.scoped;
    expect(scoped.claims.map((claim) => claim.specifier)).toEqual(['multi-lib', 'multi-lib/extra']);
    for (const claim of scoped.claims) {
      expect(claim.state.label).toBe('own mapping');
      expect(claim.copyTag).toBe('2.0.0');
    }
    expect(scoped.claims.map((claim) => claim.file)).toEqual(['main.js', 'extra.js']);
  });
});

/**
 * One declaration, TWO entrypoint claims with DIFFERENT source outcomes:
 * the main specifier selects the own copy, the secondary resolves to a
 * foreign target no source or scope explains. The secondary's source
 * qualification must stay visible beside the main claim's quiet own arrow
 * (T8 review round 2, finding 1).
 */
const MULTI_ENTRY_QUALIFIER_SEED = seedSnapshot({
  remotes: {
    '__NF-HOST__': 'https://seed.example/',
    r1: 'https://seed.example/r1/',
  },
  sharedExternals: {
    __GLOBAL__: {
      'me-lib': {
        dirty: false,
        versions: [
          {
            tag: '1.0.0',
            action: 'share',
            host: false,
            remotes: [declarationOf('r1', { 'me-lib': 'main.js', 'me-lib/extra': 'x.js' })],
          },
        ],
      },
    },
  },
  imports: [{ specifier: 'me-lib/extra', target: 'https://cdn.example/extra.js' }],
  scopes: [{ scope: './r1/', imports: [{ specifier: 'me-lib', target: './r1/main.js' }] }],
});

/**
 * A scope-action registration whose own claim is selected: the action note
 * and the kept-own-copy chip must both stay registry-/claim-grounded — no
 * universal "mapped only for" audience claim (T8 review round 2, finding 2).
 */
const SCOPE_ACTION_SEED = seedSnapshot({
  remotes: {
    '__NF-HOST__': 'https://seed.example/',
    r1: 'https://seed.example/r1/',
  },
  sharedExternals: {
    __GLOBAL__: {
      'iso-lib': {
        dirty: false,
        versions: [
          {
            tag: '1.0.0',
            action: 'scope',
            host: false,
            remotes: [declarationOf('r1', { 'iso-lib': 'iso.js' })],
          },
        ],
      },
    },
  },
  scopes: [{ scope: './r1/', imports: [{ specifier: 'iso-lib', target: './r1/iso.js' }] }],
});

describe('buildRemoteDetail — per-claim source qualification (T8 review round 2)', () => {
  it('keeps a secondary claim’s source qualification beside the quiet main claim', () => {
    const detail = seededDetail(MULTI_ENTRY_QUALIFIER_SEED, 'r1');

    expect(detail.deps).toHaveLength(1);
    const [dep] = detail.deps;
    // Main claim: own copy — quiet arrow, no chip of its own.
    expect(dep.arrow).toEqual({ kind: 'own' });
    // Secondary claim: its mapping state AND its source qualification stay
    // visible, specifier-prefixed.
    expect(dep.states.map((state) => state.label)).toEqual([
      'me-lib/extra: not selected',
      'me-lib/extra: unknown source',
    ]);
    const unknown = dep.states.find((state) => state.label === 'me-lib/extra: unknown source')!;
    expect(unknown.note).toBe(
      'only the resolved URL is evidenced — no source record or scope prefix matches',
    );
  });

  it('keeps the scope action note and kept-own-copy chip registry-grounded', () => {
    const detail = seededDetail(SCOPE_ACTION_SEED, 'r1');

    expect(detail.deps).toHaveLength(1);
    const [dep] = detail.deps;
    expect(dep.action).toBe('scope');
    // Registry evidence only — no mapping/audience claim in the action note.
    expect(dep.actionNote).toBe(
      'registered with action scope — an isolated registration outside the version election',
    );
    expect(dep.arrow).toEqual({ kind: 'own' });
    expect(dep.states).toEqual([
      {
        label: 'kept own copy',
        note: 'registered with action scope — the consumer’s own isolated copy is its effective binding in this capture',
      },
    ]);
  });
});
