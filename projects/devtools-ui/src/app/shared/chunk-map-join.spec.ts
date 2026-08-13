/**
 * Chunk-file ↔ effective-map join specs — the single source of the chunk
 * cross-link (T12):
 *  - reproduces the ingest resolution exactly: per group, every file joins
 *    an entry iff the group's `mapped` flag holds (consistency pin over
 *    the corpus fixtures, both origins).
 *  - frankenstein-live (v4 dense): all 7 host chunk files join their
 *    `@nf-internal/chunk-*` entries in the page-base scope section, SRI
 *    present; bundle attribution carried per file.
 *  - non-dense (v4.5 pseudo-externals): pseudo groups join by the same
 *    resolution; the joined entry's specifier is the pseudo package.
 *  - a file resolving to no target stays `entry: null` — honest absence.
 *  - pure: inputs stay unmodified.
 */
import { FIXTURES, NF_HOST } from 'devtools-bridge';

import { chunkJoinsByTarget, joinChunkFilesToMap } from './chunk-map-join';
import type { FederationModel } from './store/federation-model';
import { ingestSnapshot } from './store/ingest';

const LIVE_BASE = 'https://lutzleonhardt.de/frankenstein-meeting-room/';

function modelOf(name: keyof typeof FIXTURES): FederationModel {
  return ingestSnapshot(FIXTURES[name]);
}

describe('joinChunkFilesToMap', () => {
  it('agrees with the ingest mapped flag on every corpus group (both origins)', () => {
    for (const fixture of Object.keys(FIXTURES) as (keyof typeof FIXTURES)[]) {
      const model = modelOf(fixture);
      const joins = joinChunkFilesToMap(model);
      for (const group of model.chunkGroups) {
        const groupJoins = joins.filter(
          (join) =>
            join.owningRemote === group.owningRemote &&
            join.bundleName === group.bundleName &&
            join.pseudoPackage === group.pseudoPackage,
        );
        expect(groupJoins.map((join) => join.file)).toEqual(group.files);
        expect(groupJoins.every((join) => join.entry !== null)).toBe(group.mapped);
      }
    }
  });

  it('joins all 7 live host chunk files to their scoped @nf-internal entries', () => {
    const joins = joinChunkFilesToMap(modelOf('frankenstein-live'));
    expect(joins).toHaveLength(7);
    for (const join of joins) {
      expect(join.owningRemote).toBe(NF_HOST);
      expect(join.origin).toBe('shared-chunks');
      expect(join.entry).not.toBeNull();
      expect(join.entry!.specifier).toBe(
        `@nf-internal/${join.file.replace(/\.js$/, '')}`,
      );
      expect(join.entry!.scope).toBe(LIVE_BASE);
      expect(join.entry!.hasIntegrity).toBe(true);
    }
    const common = joins.find((join) => join.bundleName === 'browser-angular_common');
    expect(common?.file).toBe('chunk-WW26EZ22.js');
    expect(common?.entry?.target).toBe(`${LIVE_BASE}chunk-WW26EZ22.js`);
  });

  it('joins non-dense pseudo-external groups onto their own specifiers', () => {
    const model = modelOf('non-dense');
    const joins = joinChunkFilesToMap(model);
    const pseudo = joins.filter((join) => join.origin === 'scoped-pseudo-external');
    expect(pseudo.length).toBeGreaterThan(0);
    for (const join of pseudo) {
      if (join.entry !== null) {
        expect(join.entry.specifier).toBe(join.pseudoPackage);
      }
    }
  });

  it('leaves a file without a map target as entry: null', () => {
    const model = modelOf('frankenstein-live');
    const seeded: FederationModel = {
      ...model,
      chunkGroups: [
        ...model.chunkGroups,
        {
          owningRemote: NF_HOST,
          bundleName: 'seeded-bundle',
          pseudoPackage: null,
          origin: 'shared-chunks',
          files: ['chunk-NOTINMAP.js'],
          mapped: false,
        },
      ],
    };
    const join = joinChunkFilesToMap(seeded).find(
      (candidate) => candidate.file === 'chunk-NOTINMAP.js',
    );
    expect(join).toBeDefined();
    expect(join!.entry).toBeNull();
  });

  it('is pure: same input yields deep-equal output and inputs stay unmodified', () => {
    const model = modelOf('frankenstein-live');
    const before = structuredClone(model);
    const first = joinChunkFilesToMap(model);
    const second = joinChunkFilesToMap(model);
    expect(second).toEqual(first);
    expect(model).toEqual(before);
  });
});

describe('chunkJoinsByTarget', () => {
  it('indexes the live joins one claim per target, unmapped files excluded', () => {
    const model = modelOf('frankenstein-live');
    const byTarget = chunkJoinsByTarget(joinChunkFilesToMap(model));
    expect(byTarget.size).toBe(7);
    const claims = byTarget.get(`${LIVE_BASE}chunk-WW26EZ22.js`);
    expect(claims).toHaveLength(1);
    expect(claims![0].bundleName).toBe('browser-angular_common');
  });
});
