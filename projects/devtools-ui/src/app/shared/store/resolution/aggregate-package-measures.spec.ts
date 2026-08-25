/**
 * Package-measure specs (Task 5, T5-AC-06): the four canonical counts stay
 * separately accessible, supporting declaration/claim counts stay distinct,
 * and equal-tag copy multiplicity alone never emits a version-conflict
 * result — the aggregation has no conflict field at all.
 */
import { FIXTURES, NF_HOST, type SnapshotV1 } from 'devtools-bridge';

import { mergeDocumentMaps, resolveUrl } from '../merge-document-maps';
import { aggregatePackageMeasures } from './aggregate-package-measures';
import type { PackageResolutionMeasures } from './copies-model';
import { deriveResolutionClaims } from './derive-declaration-claims';
import { materializeResolvedCopies } from './materialize-resolved-copies';
import { normalizeRegistryEvidence } from './normalize-registry-evidence';
import { resolveEffectiveConsumerBindings } from './resolve-effective-consumer-bindings';

const PAGE_URL = 'https://seeded.example/app/';

interface SeedParticipant {
  name: string;
  entries: Record<string, string>;
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
      scopedExternals: {},
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

function measures(snapshot: SnapshotV1): PackageResolutionMeasures[] {
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
    resolutionBaseUrl: pageUrl,
    mapAvailable: snapshot.channels.domImportMaps.state === 'available',
    effectiveMap,
    consumerScopeUrlByRemote: remoteScopeUrlByName,
  });
  const claims = deriveResolutionClaims(evidence, resolutions, {
    remoteScopeUrlByName,
    hostRemote: NF_HOST,
  });
  const copies = materializeResolvedCopies(evidence, resolutions, claims, {
    snapshotIdentity: `${snapshot.capture.capturedAt}|${snapshot.capture.pageUrl}`,
  });
  return aggregatePackageMeasures(evidence, claims.declarationResolutionClaims, copies);
}

describe('aggregatePackageMeasures — canonical package counts (T5-AC-06)', () => {
  it('keeps the four measures separately accessible for the shared corpus fixtures', () => {
    expect(measures(FIXTURES['clean-skip'])).toEqual([
      {
        packageName: '@nf-lab/conflict-lib',
        registrationCount: 2,
        distinctDeclaredTagCount: 2,
        resolvedCopyCount: 1,
        distinctResolvedTagCount: 1,
        unknownResolvedTagCopyCount: 0,
        declarationCount: 2,
        claimCount: 2,
      },
    ]);

    expect(measures(FIXTURES['strict-split'])).toEqual([
      {
        packageName: '@nf-lab/conflict-lib',
        registrationCount: 3,
        distinctDeclaredTagCount: 2,
        resolvedCopyCount: 2,
        distinctResolvedTagCount: 2,
        unknownResolvedTagCopyCount: 0,
        declarationCount: 3,
        claimCount: 3,
      },
    ]);
  });

  it('keeps private registrations out of the shared registration and declared-tag counts', () => {
    expect(measures(FIXTURES['scoped'])).toEqual([
      {
        packageName: '@nf-lab/conflict-lib',
        registrationCount: 0,
        distinctDeclaredTagCount: 0,
        resolvedCopyCount: 2,
        distinctResolvedTagCount: 2,
        unknownResolvedTagCopyCount: 0,
        declarationCount: 0,
        claimCount: 2,
      },
    ]);
  });

  it('exposes equal-tag copy multiplicity as counts without any version-conflict field', () => {
    const rows = measures(
      seedSnapshot({
        remotes: { mfe1: './mfe1/', mfe2: './mfe2/' },
        shared: {
          default: {
            pkg: [
              {
                tag: '1.0.0',
                action: 'scope',
                participants: [{ name: 'mfe1', entries: { pkg: 'pkg-one.js' } }],
              },
              {
                tag: '1.0.0',
                action: 'scope',
                participants: [{ name: 'mfe2', entries: { pkg: 'pkg-two.js' } }],
              },
            ],
          },
        },
        scopes: {
          './mfe1/': { pkg: './mfe1/pkg-one.js' },
          './mfe2/': { pkg: './mfe2/pkg-two.js' },
        },
      }),
    );

    // Two copies, one declared and one resolved tag — the counts make the
    // split visible; nothing labels it a conflict.
    expect(rows).toEqual([
      {
        packageName: 'pkg',
        registrationCount: 2,
        distinctDeclaredTagCount: 1,
        resolvedCopyCount: 2,
        distinctResolvedTagCount: 1,
        unknownResolvedTagCopyCount: 0,
        declarationCount: 2,
        claimCount: 2,
      },
    ]);
    expect(Object.keys(rows[0]).sort()).toEqual([
      'claimCount',
      'declarationCount',
      'distinctDeclaredTagCount',
      'distinctResolvedTagCount',
      'packageName',
      'registrationCount',
      'resolvedCopyCount',
      'unknownResolvedTagCopyCount',
    ]);
  });

  it('counts a URL-identified copy under its consumer registry package with an unknown tag', () => {
    const rows = measures(
      seedSnapshot({
        remotes: { mfe1: './mfe1/', mfe2: './mfe2/' },
        shared: {
          default: {
            pkg: [
              {
                tag: '1.0.0',
                action: 'share',
                participants: [
                  { name: 'mfe1', entries: { pkg: 'pkg-mfe1.js' } },
                  { name: 'mfe2', entries: { pkg: 'pkg-mfe2.js' } },
                ],
              },
            ],
          },
        },
        imports: { pkg: 'https://cdn.example/pkg.js' },
      }),
    );

    expect(rows).toEqual([
      {
        packageName: 'pkg',
        registrationCount: 1,
        distinctDeclaredTagCount: 1,
        resolvedCopyCount: 1,
        distinctResolvedTagCount: 0,
        unknownResolvedTagCopyCount: 1,
        declarationCount: 2,
        claimCount: 2,
      },
    ]);
  });
});
