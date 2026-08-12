/**
 * Remotes view-model specs — fixture-driven acceptance (T11):
 *  - T11-AC-01: frankenstein-live — three remotes with the host marked;
 *    host badges dense chunking + dense externals + SRI, whiteboard and
 *    mermaid SRI only.
 *  - T11-AC-02: dependency rows carry only this remote's own declaration
 *    plus an explicit arrow and a package link — the other participants of
 *    the negotiation are not rendered. Transposed-view arrow doctrine:
 *    every row draws its resolution; only the EXCEPTION is marked — a
 *    winner-less share row carries the no-election marker, the elected
 *    norm stays quiet (T10 doctrine), the strict scope never raises it.
 *  - T11-AC-03: scoped — the true scoped package renders in the
 *    scoped-externals list; non-dense — reclassified `@nf-internal/`
 *    chunks render in the chunk section (level-'remote' wording), never
 *    as scoped packages.
 *  - T11-AC-04: exposes render remote-qualified with joined map targets,
 *    including the live `/./` specifier infix.
 *  - T11-AC-05 (builder half): capture-boundary note; pure — same inputs,
 *    same output; inputs stay unmodified.
 */
import { FIXTURES, NF_HOST } from 'devtools-bridge';

import type { DerivedFederation } from '../../shared/store/derived-model';
import { deriveFederation } from '../../shared/store/derivations';
import type { FederationModel } from '../../shared/store/federation-model';
import { ingestSnapshot } from '../../shared/store/ingest';
import {
  RemoteDetailVm,
  RemotesUiState,
  RemotesVm,
  buildRemotesVm,
} from './remotes-view-model';

function inputsOf(name: keyof typeof FIXTURES): {
  model: FederationModel;
  derived: DerivedFederation;
} {
  const model = ingestSnapshot(FIXTURES[name]);
  return { model, derived: deriveFederation(model) };
}

function vmOf(name: keyof typeof FIXTURES, ui: Partial<RemotesUiState> = {}): RemotesVm {
  const { model, derived } = inputsOf(name);
  return buildRemotesVm(model, derived, { selectedName: null, ...ui });
}

function detailOf(name: keyof typeof FIXTURES, selectedName: string): RemoteDetailVm {
  return vmOf(name, { selectedName }).detail!;
}

describe('buildRemotesVm — left list (T11-AC-01)', () => {
  it('lists the three live remotes in model order with the host marked', () => {
    const vm = vmOf('frankenstein-live');

    expect(vm.remoteCount).toBe(3);
    expect(vm.rows.map((row) => row.payload.name)).toEqual(['whiteboard', 'mermaid', NF_HOST]);
    expect(vm.rows.map((row) => row.payload.host)).toEqual([false, false, true]);
    // Flat list — nothing expands.
    expect(vm.rows.every((row) => !row.expandable && row.depth === 0)).toBe(true);
    expect(vm.emptyNote).toBeNull();
  });

  it('summarizes expose and shared counts per remote (clean-skip ground truth)', () => {
    const vm = vmOf('clean-skip');

    const summaries = new Map(
      vm.rows.map((row) => [row.payload.name, row.payload.summary]),
    );
    expect(summaries.get('mfe1')).toBe('1 expose · 1 shared');
    expect(summaries.get('mfe2')).toBe('1 expose · 1 shared');
    expect(summaries.get(NF_HOST)).toBe('0 exposes · 0 shared');
  });

  it('derives the live badge matrix: host fully dense, whiteboard/mermaid SRI only', () => {
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

  it('renders an honest empty note when the capture holds no remotes', () => {
    const vm = vmOf('synthetic-empty-page');

    expect(vm.rows).toEqual([]);
    expect(vm.emptyNote).toBe('no remotes in this capture');
    expect(vm.detail).toBeNull();
  });
});

describe('buildRemoteDetail — identity and selection', () => {
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
});

describe('buildRemoteDetail — dependency rows (T11-AC-02)', () => {
  it('renders only the own skip declaration with the explicit arrow to the winner', () => {
    const detail = detailOf('clean-skip', 'mfe1');

    // The transposed projection: one row — this remote's declaration; the
    // other participants of the negotiation are not rendered.
    expect(detail.deps).toHaveLength(1);
    const [dep] = detail.deps;
    expect(dep.packageName).toBe('@nf-lab/conflict-lib');
    expect(dep.packageSelect).toBe('__GLOBAL__|@nf-lab/conflict-lib');
    expect(dep.scopeLabel).toBeNull();
    expect(dep.declared).toEqual({ kind: 'range', range: '>=1.0.0 <3.0.0' });
    expect(dep.action).toBe('skip');
    expect(dep.symbol).toBe('○');
    expect(dep.arrow).toEqual({
      kind: 'winner',
      target: '_nf_lab_conflict_lib.jvcc6K1csg.js',
      provider: 'mfe2',
    });
    expect(dep.noElection).toBeNull();
  });

  it('keeps the elected winner quiet — the norm carries no marker', () => {
    const detail = detailOf('clean-skip', 'mfe2');

    expect(detail.deps).toHaveLength(1);
    const [dep] = detail.deps;
    expect(dep.action).toBe('share');
    expect(dep.symbol).toBe('●');
    expect(dep.arrow).toEqual({ kind: 'own' });
    expect(dep.noElection).toBeNull();
  });

  it('marks the winner-less share rows of a multi-share group', () => {
    for (const remote of ['calendar', 'chat']) {
      const detail = detailOf('synthetic-multi-version', remote);
      expect(detail.deps).toHaveLength(1);
      const [dep] = detail.deps;
      // Two share declarations — no privileged copy; the row still says
      // where it resolves, and the exception speaks.
      expect(dep.arrow).toEqual({ kind: 'own' });
      expect(dep.noElection).not.toBeNull();
      expect(dep.noElection!.note).toBe(
        '2 versions are declared share in this scope — the registry elected no single version (rule: registry-election)',
      );
      expect(dep.strict).toBe(true);
    }
  });

  it('never raises the no-election marker in the strict scope', () => {
    for (const remote of ['mfe1', 'mfe2']) {
      const detail = detailOf('strict-scope', remote);
      expect(detail.deps).toHaveLength(1);
      const [dep] = detail.deps;
      // Side-by-side sharing is the strict-scope design — the pinned tag
      // and the scope chip explain it, no exception marker.
      expect(dep.scopeLabel).toBe('strict');
      expect(dep.declared.kind).toBe('pinned');
      expect(dep.noElection).toBeNull();
    }
  });
});

describe('buildRemoteDetail — exposes (T11-AC-04)', () => {
  it('qualifies exposes with the remote name and joins the live /./ map target', () => {
    const detail = detailOf('frankenstein-live', 'whiteboard');

    expect(detail.exposes).toEqual([
      {
        qualified: 'whiteboard/./Bootstrap',
        moduleName: './Bootstrap',
        file: 'Bootstrap-7COJRA5I.js',
        mapTarget: 'https://lutzleonhardt.de/frankenstein-meeting-room/whiteboard/Bootstrap-7COJRA5I.js',
      },
    ]);
    expect(detail.exposes[0].qualified).toContain('/./');
  });

  it('keeps the host expose list honestly empty', () => {
    expect(detailOf('frankenstein-live', NF_HOST).exposes).toEqual([]);
  });
});

describe('buildRemoteDetail — chunk ladder and scoped externals (T11-AC-03)', () => {
  it('renders level-package chunk data for the dense live host', () => {
    const chunks = detailOf('frankenstein-live', NF_HOST).chunks;

    expect(chunks.level).toBe('package');
    if (chunks.level !== 'package') {
      return;
    }
    expect(chunks.note).toContain("this remote's exposes, plus lazy modules");
    expect(chunks.packages).toContainEqual({
      packageName: '@angular/common',
      bundleName: 'browser-angular_common',
      fileClaim: '1 chunk file',
    });
    // A bundle named on the participant but absent from the chunks
    // repository claims the missing list — never a zero count.
    expect(chunks.packages).toContainEqual({
      packageName: 'tslib',
      bundleName: 'browser-tslib',
      fileClaim: 'no chunk list recorded in this capture',
    });
  });

  it('renders reclassified @nf-internal chunks at level remote, never as scoped packages', () => {
    const detail = detailOf('non-dense', 'mfe3');

    expect(detail.scoped).toEqual([]);
    expect(detail.chunks.level).toBe('remote');
    if (detail.chunks.level !== 'remote') {
      return;
    }
    expect(detail.chunks.note).toContain('package attribution is not derivable');
    expect(detail.chunks.groups).toHaveLength(7);
    for (const group of detail.chunks.groups) {
      expect(group.label.startsWith('@nf-internal/')).toBe(true);
      expect(group.fileClaim).toBe('1 file');
    }
  });

  it('states explicit chunk absence for the v4 live remotes', () => {
    const chunks = detailOf('frankenstein-live', 'whiteboard').chunks;

    expect(chunks.level).toBe('none');
    expect(chunks.note).toContain('no chunk evidence recorded');
    expect(chunks.note).toContain('dense-chunking capability absent');
  });

  it('lists the true scoped package of the scoped fixture', () => {
    const detail = detailOf('scoped', 'mfe1');

    expect(detail.scoped).toEqual([
      {
        packageName: '@nf-lab/conflict-lib',
        tag: '1.0.0',
        bundle: 'browser-shared',
        files: ['_nf_lab_conflict_lib.JF7uEdSVsN.js'],
      },
    ]);
  });
});

describe('buildRemotesVm — capture boundary and purity (T11-AC-05)', () => {
  it('claims the enumeration boundary as a capture limit, not an error', () => {
    const vm = vmOf('frankenstein-live');

    expect(vm.boundaryNote).toContain('no registry trace');
    expect(vm.boundaryNote).toContain('cannot enumerate what the capture cannot see');
    expect(vm.boundaryNote).not.toContain('error');
  });

  it('is pure: identical inputs produce identical output and stay unmodified', () => {
    const { model, derived } = inputsOf('frankenstein-live');
    const modelBefore = JSON.stringify(model);
    const derivedBefore = JSON.stringify(derived);
    const ui: RemotesUiState = { selectedName: NF_HOST };

    const first = buildRemotesVm(model, derived, ui);
    const second = buildRemotesVm(model, derived, ui);

    expect(second).toEqual(first);
    expect(JSON.stringify(model)).toBe(modelBefore);
    expect(JSON.stringify(derived)).toBe(derivedBefore);
  });
});
