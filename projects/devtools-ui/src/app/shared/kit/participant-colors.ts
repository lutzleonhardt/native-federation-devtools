import { InjectionToken, Signal, signal } from '@angular/core';

/**
 * Participant identity palette size — must match the
 * `--nf-participant-color-1..N` theme tokens in styles.css.
 */
export const PARTICIPANT_PALETTE_SIZE = 8;

/**
 * Deterministic per-capture color assignment: unique remote names, sorted by
 * code point (locale-independent), indexed 1-based into the palette tokens.
 *
 * Honest threshold: more remotes than hues → empty map, every chip renders
 * neutral. No recycling and no hashing — two remotes sharing a hue would
 * visually claim a relationship that does not exist; 25–50-remote
 * configurations are real, so the neutral fallback is designed behavior.
 */
export function assignParticipantColors(
  remoteNames: readonly string[],
): ReadonlyMap<string, number> {
  const unique = [...new Set(remoteNames)];
  if (unique.length > PARTICIPANT_PALETTE_SIZE) {
    return new Map();
  }
  unique.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return new Map(unique.map((name, position) => [name, position + 1]));
}

/**
 * The one shared name → palette-index lookup per snapshot, injected by every
 * participant chip (and reusable unchanged by a future graph view): identical
 * remote name → identical color across Packages, Remotes, Import Map, and
 * participant rows.
 *
 * The default is permanently neutral (no dots) — the kit derives nothing
 * itself (kit-boundary guard: no store imports). The app binds the
 * capture-backed lookup via `provideParticipantColors()` from
 * shared/store/participant-colors-provider.ts.
 */
export const PARTICIPANT_COLOR_LOOKUP = new InjectionToken<Signal<ReadonlyMap<string, number>>>(
  'PARTICIPANT_COLOR_LOOKUP',
  {
    providedIn: 'root',
    factory: () => signal<ReadonlyMap<string, number>>(new Map()).asReadonly(),
  },
);
