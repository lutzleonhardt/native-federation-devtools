/**
 * Observed-target attribution specs (T4-AC-04): the six ladder outcomes are
 * distinct and deterministic, exact candidate equality outranks scope
 * ownership, and no outcome claims delivery.
 */
import { NF_HOST, type SnapshotV1 } from 'devtools-bridge';

import { mergeDocumentMaps, resolveUrl } from '../merge-document-maps';
import {
  attributeObservedTargetProviders,
  type ObservedTargetAttribution,
} from './attribute-observed-target-providers';
import { registryEvidenceId } from './ids';
import type { EffectiveConsumerResolution } from './model';
import { normalizeRegistryEvidence } from './normalize-registry-evidence';
import { resolveEffectiveConsumerBindings } from './resolve-effective-consumer-bindings';

const PAGE_URL = 'https://seeded.example/app/';

interface SeedParticipant {
  name: string;
  entries: Record<string, string>;
  pool?: string;
  servedBy?: string;
  cached?: boolean;
}

interface SeedRegistration {
  tag: string;
  action: string;
  host?: boolean;
  participants: SeedParticipant[];
}

interface Seed {
  remotes: Record<string, string>;
  shared?: Record<string, Record<string, SeedRegistration[]>>;
  scoped?: Record<string, Record<string, { tag: string; entries: Record<string, string> }>>;
  imports?: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

function seedSnapshot(seed: Seed): SnapshotV1 {
  const sharedExternals: NonNullable<SnapshotV1['runtime']>['sharedExternals'] = {};
  for (const [shareScope, packages] of Object.entries(seed.shared ?? {})) {
    sharedExternals[shareScope] = {};
    for (const [packageName, registrations] of Object.entries(packages)) {
      sharedExternals[shareScope][packageName] = {
        dirty: false,
        versions: registrations.map((registration) => ({
          tag: registration.tag,
          action: registration.action,
          host: registration.host ?? false,
          remotes: registration.participants.map((participant) => ({
            name: participant.name,
            requiredVersion: '*',
            strictVersion: false,
            file: null,
            entries: participant.entries,
            cached: participant.cached ?? false,
            bundle: null,
            ...(participant.pool === undefined ? {} : { pool: participant.pool }),
            ...(participant.servedBy === undefined ? {} : { servedBy: participant.servedBy }),
            servedFiles: Object.entries(participant.entries).map(([entry, file]) => ({
              entry,
              file,
            })),
            generation: 'v4.5' as const,
          })),
        })),
      };
    }
  }
  const scopedExternals: NonNullable<SnapshotV1['runtime']>['scopedExternals'] = {};
  for (const [ownerRemote, packages] of Object.entries(seed.scoped ?? {})) {
    scopedExternals[ownerRemote] = {};
    for (const [packageName, scopedPackage] of Object.entries(packages)) {
      scopedExternals[ownerRemote][packageName] = {
        tag: scopedPackage.tag,
        bundle: null,
        entries: scopedPackage.entries,
      };
    }
  }
  const imports = Object.entries(seed.imports ?? {}).map(([specifier, target]) => ({
    specifier,
    target,
  }));
  const scopes = Object.entries(seed.scopes ?? {}).map(([scope, entries]) => ({
    scope,
    imports: Object.entries(entries).map(([specifier, target]) => ({ specifier, target })),
  }));
  return {
    schemaVersion: 1,
    capture: {
      pageUrl: PAGE_URL,
      capturedAt: '2026-08-18T00:00:00.000Z',
      mode: 'passive',
      collectorVersion: 'nf-devtools-collector/3',
    },
    channels: {
      nativeFederationGlobals: { state: 'available' },
      domImportMaps: { state: 'available' },
      importShim: { state: 'available' },
    },
    runtime: {
      remotes: Object.fromEntries(
        Object.entries(seed.remotes).map(([name, scopeUrl]) => [
          name,
          { scopeUrl, exposes: [], integrity: {} },
        ]),
      ),
      scopedExternals,
      sharedExternals,
      sharedChunks: {},
      generation: 'v4.5',
    },
    importMaps: {
      documentMaps: [
        {
          kind: 'importmap',
          parsed: true,
          importCount: imports.length,
          scopeCount: scopes.length,
          imports,
          scopes,
          integrity: {},
        },
      ],
      effective: null,
    },
    errors: [],
  };
}

interface Harness {
  attribution: ObservedTargetAttribution;
  resolutions: EffectiveConsumerResolution[];
}

function attributeSnapshot(snapshot: SnapshotV1): Harness {
  const pageUrl = snapshot.capture.pageUrl;
  const effectiveMap = mergeDocumentMaps(snapshot.importMaps?.documentMaps ?? [], pageUrl);
  const remoteScopeUrlByName = new Map(
    Object.entries(snapshot.runtime?.remotes ?? {}).map(([name, remote]) => [
      name,
      resolveUrl(remote.scopeUrl, pageUrl),
    ]),
  );
  const evidence = normalizeRegistryEvidence(snapshot);
  const resolutions = resolveEffectiveConsumerBindings(evidence, {
    pageUrl,
    mapAvailable: snapshot.channels.domImportMaps.state === 'available',
    effectiveMap,
    consumerScopeUrlByRemote: remoteScopeUrlByName,
  });
  return {
    resolutions,
    attribution: attributeObservedTargetProviders(evidence, resolutions, {
      remoteScopeUrlByName,
      hostRemote: NF_HOST,
    }),
  };
}

function bySpecifier(harness: Harness, specifier: string) {
  const resolution = harness.resolutions.find((candidate) => candidate.specifier === specifier);
  expect(resolution).toBeDefined();
  const provider = harness.attribution.observedTargetProviders.find(
    (candidate) => candidate.resolutionId === resolution!.id,
  );
  const sourceMatch = harness.attribution.sourceMatches.find(
    (candidate) => candidate.resolutionId === resolution!.id,
  );
  expect(provider).toBeDefined();
  expect(sourceMatch).toBeDefined();
  return { resolution: resolution!, provider: provider!, sourceMatch: sourceMatch! };
}

describe('attributeObservedTargetProviders — attribution ladder (T4-AC-04)', () => {
  const harness = attributeSnapshot(
    seedSnapshot({
      remotes: {
        [NF_HOST]: './',
        'remote-a': './a/',
        'remote-b-deep': './b/deep/',
        'remote-b': './b/',
        'alias-c1': './c/',
        'alias-c2': './c/',
      },
      shared: {
        __GLOBAL__: {
          'pkg-exact': [
            {
              tag: '1.0.0',
              action: 'share',
              participants: [{ name: 'remote-a', entries: { 'pkg-exact': 'x.js' } }],
            },
          ],
          'pkg-ambiguous': [
            {
              tag: '1.0.0',
              action: 'share',
              participants: [
                { name: 'alias-c1', entries: { 'pkg-ambiguous': 'y.js' } },
                { name: 'alias-c2', entries: { 'pkg-ambiguous': 'y.js' } },
              ],
            },
          ],
          'pkg-scope': [
            {
              tag: '1.0.0',
              action: 'share',
              participants: [{ name: 'remote-a', entries: { 'pkg-scope': 's1.js' } }],
            },
          ],
          'pkg-scope-ambiguous': [
            {
              tag: '1.0.0',
              action: 'share',
              participants: [{ name: 'remote-a', entries: { 'pkg-scope-ambiguous': 's2.js' } }],
            },
          ],
          'pkg-host': [
            {
              tag: '1.0.0',
              action: 'share',
              participants: [{ name: 'remote-a', entries: { 'pkg-host': 'h.js' } }],
            },
          ],
          'pkg-cdn': [
            {
              tag: '1.0.0',
              action: 'share',
              participants: [{ name: 'remote-a', entries: { 'pkg-cdn': 'c.js' } }],
            },
          ],
          'pkg-unmapped': [
            {
              tag: '1.0.0',
              action: 'share',
              participants: [{ name: 'remote-a', entries: { 'pkg-unmapped': 'm.js' } }],
            },
          ],
        },
      },
      imports: {
        'pkg-exact': './a/x.js',
        'pkg-ambiguous': './c/y.js',
        'pkg-scope': './b/deep/other.js',
        'pkg-scope-ambiguous': './c/unrelated.js',
        'pkg-host': './host-only.js',
        'pkg-cdn': 'https://cdn.example/lib.js',
      },
    }),
  );

  it('attributes a unique exact candidate as the strongest observed source', () => {
    const { resolution, provider, sourceMatch } = bySpecifier(harness, 'pkg-exact');
    // The target sits inside ./a/ too — exact equality must outrank the scope rule.
    expect(provider).toMatchObject({
      remote: 'remote-a',
      outcome: 'exact-candidate',
      rule: 'exact-candidate',
    });
    expect(provider.id).toBe(
      registryEvidenceId('observed-target-provider', [resolution.id, 'exact-candidate'], 0),
    );
    expect(sourceMatch.source?.kind).toBe('shared');
    expect(sourceMatch.candidateIds).toHaveLength(1);
  });

  it('retains all candidates and chooses none for an exact ambiguity', () => {
    const { provider, sourceMatch } = bySpecifier(harness, 'pkg-ambiguous');
    expect(provider).toMatchObject({ remote: null, outcome: 'ambiguous-candidate', rule: 'none' });
    expect(sourceMatch.source).toBeNull();
    expect(sourceMatch.candidateIds).toHaveLength(2);
  });

  it('attributes the unique most-specific non-host scope owner', () => {
    const { provider, sourceMatch } = bySpecifier(harness, 'pkg-scope');
    // Both ./b/ and ./b/deep/ contain the target; the longer scope wins alone.
    expect(provider).toMatchObject({
      remote: 'remote-b-deep',
      outcome: 'scope-derived',
      rule: 'scope-prefix-match',
    });
    expect(sourceMatch.source).toBeNull();
  });

  it('keeps equally specific scope owners ambiguous', () => {
    const { provider } = bySpecifier(harness, 'pkg-scope-ambiguous');
    expect(provider).toMatchObject({ remote: null, outcome: 'ambiguous-scope', rule: 'none' });
  });

  it('marks a host-base-only target as the weaker host fallback', () => {
    const { provider } = bySpecifier(harness, 'pkg-host');
    expect(provider).toMatchObject({
      remote: NF_HOST,
      outcome: 'host-fallback',
      rule: 'host-fallback',
    });
  });

  it('leaves a foreign-origin target unattributable', () => {
    const { provider, sourceMatch } = bySpecifier(harness, 'pkg-cdn');
    expect(provider).toMatchObject({ remote: null, outcome: 'unattributable', rule: 'none' });
    expect(sourceMatch.candidateIds).toHaveLength(0);
  });

  it('yields the unknown outcome for a binding without a mapped target', () => {
    const { resolution, provider, sourceMatch } = bySpecifier(harness, 'pkg-unmapped');
    expect(resolution.status).toBe('unmapped');
    expect(provider).toMatchObject({ remote: null, outcome: 'unknown', rule: 'none' });
    expect(sourceMatch.source).toBeNull();
  });
});
