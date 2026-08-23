import { TestBed } from '@angular/core/testing';
import {
  ExternalRemoteV1,
  FIXTURES,
  SNAPSHOT_PROVIDER,
  SnapshotProvider,
  SnapshotV1,
} from 'devtools-bridge';

import { PARTICIPANT_COLOR_LOOKUP } from '../kit/participant-colors';
import { provideParticipantColors } from './participant-colors-provider';

class StubSnapshotProvider implements SnapshotProvider {
  constructor(private readonly snapshot: SnapshotV1) {}

  captureSnapshot(): Promise<SnapshotV1> {
    return Promise.resolve(structuredClone(this.snapshot));
  }
}

function frankensteinWith(mutate: (snapshot: SnapshotV1) => void = () => {}): SnapshotV1 {
  const snapshot = structuredClone(FIXTURES['frankenstein-live']);
  mutate(snapshot);
  return snapshot;
}

/** A declaration-only participant: declares under a shared external but has
 * no registry entry of its own (the missing-remote case). */
function ghostDeclaration(name: string): ExternalRemoteV1 {
  return {
    name,
    requiredVersion: '^0.18.0',
    strictVersion: false,
    file: 'ghost.js',
    entries: null,
    cached: false,
    bundle: null,
    servedFiles: [{ entry: null, file: 'ghost.js' }],
    generation: 'v4',
  };
}

async function lookupFor(snapshot: SnapshotV1) {
  TestBed.configureTestingModule({
    providers: [
      { provide: SNAPSHOT_PROVIDER, useValue: new StubSnapshotProvider(snapshot) },
      provideParticipantColors(),
    ],
  });
  const lookup = TestBed.inject(PARTICIPANT_COLOR_LOOKUP);
  expect(lookup().size).toBe(0); // capturing → neutral
  await new Promise((resolve) => setTimeout(resolve));
  return lookup;
}

describe('provideParticipantColors (store-backed lookup binding)', () => {
  // T7.7-AC-02/-AC-04: the store-backed binding derives from the capture's
  // renderable names, excludes the host registration (it neither gets a
  // color nor counts against the threshold), and sorts by name.
  it('derives the host-free sorted assignment from the store snapshot', async () => {
    const lookup = await lookupFor(frankensteinWith());
    expect(lookup()).toEqual(
      new Map([
        ['mermaid', 1],
        ['whiteboard', 2],
      ]),
    );
  });

  // T7.7-AC-02 (review fix): a declaration-only participant without its own
  // registry entry still renders as a chip — it gets a slot like any remote.
  it('colors a declared participant that has no registry entry of its own', async () => {
    const lookup = await lookupFor(
      frankensteinWith((snapshot) => {
        snapshot.runtime!.sharedExternals['__GLOBAL__'][
          '@excalidraw/excalidraw'
        ].versions[0].remotes.push(ghostDeclaration('aaa-ghost'));
      }),
    );
    expect(lookup()).toEqual(
      new Map([
        ['aaa-ghost', 1],
        ['mermaid', 2],
        ['whiteboard', 3],
      ]),
    );
  });

  // T7.7-AC-03 (review fix): the threshold counts every renderable name —
  // 8 registry remotes plus 1 declaration-only participant → all neutral,
  // never "8 colored, 1 orphan".
  it('goes fully neutral when registry remotes plus orphan declarations exceed the palette', async () => {
    const lookup = await lookupFor(
      frankensteinWith((snapshot) => {
        for (let i = 0; i < 6; i += 1) {
          snapshot.runtime!.remotes[`filler-${i}`] = {
            scopeUrl: `./filler-${i}/`,
            exposes: [],
            integrity: {},
          };
        }
        snapshot.runtime!.sharedExternals['__GLOBAL__'][
          '@excalidraw/excalidraw'
        ].versions[0].remotes.push(ghostDeclaration('aaa-ghost'));
      }),
    );
    expect(lookup().size).toBe(0);
  });
});
