import { TestBed } from '@angular/core/testing';

import {
  PARTICIPANT_COLOR_LOOKUP,
  PARTICIPANT_PALETTE_SIZE,
  assignParticipantColors,
} from './participant-colors';

describe('assignParticipantColors', () => {
  // T7.7-AC-02: pure function of the sorted name set — input order, duplicates,
  // and locale never influence the assignment.
  it('assigns 1-based palette indexes by sorted name, independent of input order', () => {
    const assignment = assignParticipantColors(['whiteboard', 'mermaid', 'aaa-remote']);
    expect(assignment).toEqual(
      new Map([
        ['aaa-remote', 1],
        ['mermaid', 2],
        ['whiteboard', 3],
      ]),
    );
    expect(assignParticipantColors(['mermaid', 'aaa-remote', 'whiteboard', 'mermaid'])).toEqual(
      assignment,
    );
  });

  it('colors a capture that exactly fills the palette', () => {
    const names = Array.from({ length: PARTICIPANT_PALETTE_SIZE }, (_, i) => `remote-${i}`);
    const assignment = assignParticipantColors(names);
    expect(assignment.size).toBe(PARTICIPANT_PALETTE_SIZE);
    expect(new Set(assignment.values()).size).toBe(PARTICIPANT_PALETTE_SIZE);
  });

  // T7.7-AC-03: above the threshold every chip is neutral — an empty map,
  // not a partial or recycled assignment.
  it('assigns nothing when the remote count exceeds the palette', () => {
    const names = Array.from({ length: PARTICIPANT_PALETTE_SIZE + 1 }, (_, i) => `remote-${i}`);
    expect(assignParticipantColors(names).size).toBe(0);
  });
});

describe('PARTICIPANT_COLOR_LOOKUP', () => {
  // Kit-boundary consequence: the kit token derives nothing itself — without
  // the store-side binding every chip renders neutral. The capture-backed
  // behavior is participant-colors-provider.spec (store side) scope.
  it('defaults to permanently neutral without the store binding', () => {
    expect(TestBed.inject(PARTICIPANT_COLOR_LOOKUP)().size).toBe(0);
  });
});
