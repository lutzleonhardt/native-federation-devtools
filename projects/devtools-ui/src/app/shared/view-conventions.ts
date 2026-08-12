/**
 * Cross-view vm conventions — the vocabulary every V2 view renders
 * identically: sentinel display mapping, action glyphs and their grounded
 * notes, select-payload builders of the cross-link convention (see
 * `app.routes.ts`), and the shared row-mapping rules (declared version,
 * explicit resolution arrow). Established with the Packages view (T10,
 * T10.5), lifted here with its second consumer (Remotes, T11).
 *
 * Pure vocabulary of the vm layer: no component, no interpretation beyond
 * display. This deliberately does NOT live in the kit — the kit interprets
 * no registry names.
 */
import { NF_HOST } from 'devtools-bridge';

import type { DeclaredVersion, ParticipantArrow } from './kit/participant-row';
import type { SharedRowFacts } from './store/derived-model';

/** The registry's strict share scope name (spec-pinned, matches derivations). */
export const STRICT_SCOPE = 'strict';
export const GLOBAL_SCOPE = '__GLOBAL__';

/** Selection / `select`-param id of one (share scope, package). */
export function packageId(scope: string, packageName: string): string {
  return `${scope}|${packageName}`;
}

/** Display form of a participant — the `__NF-HOST__` sentinel reads as 'host'. */
export function participantDisplay(name: string): string {
  return name === NF_HOST ? 'host' : name;
}

/**
 * Action glyphs distinguish by SHAPE, not fill pattern (T10.5): filled =
 * a mapped copy exists, circle = takes part in the election, diamond =
 * isolated outside it, open = no own mapped copy.
 */
export const ACTION_SYMBOLS: Record<string, string> = { share: '●', skip: '○', scope: '◆' };

/** Grounded action vocabulary (rule: registry-election). Verbatim action stays the label. */
export const ACTION_NOTES: Record<string, string> = {
  share: 'offers this copy to the version election',
  skip: "this copy is not taken; the participant resolves to the elected copy",
  scope: 'keeps its own copy, mapped only for its own declarers',
};

/** Glyph legend of an action section — single source with the symbols/notes above. */
export const NEGOTIATION_LEGEND: { symbol: string; action: string; note: string }[] = [
  'share',
  'scope',
  'skip',
].map((action) => ({ symbol: ACTION_SYMBOLS[action], action, note: ACTION_NOTES[action] }));

/** Kit declared-version of one row — strict-pinned rows render the exact tag, never a range. */
export function declaredOf(facts: SharedRowFacts): DeclaredVersion {
  return facts.strictPinned !== null
    ? { kind: 'pinned', tag: facts.row.tag }
    : { kind: 'range', range: facts.row.requiredVersion };
}

/**
 * Explicit kit arrow of one row (rule: registry-election): a skip row
 * points at the winner's file (or the honest winner-less state), share and
 * scope rows claim their own copy. Callers with the full negotiation in
 * sight (Packages detail) gate this behind the quiet norm; the transposed
 * Remotes view draws every arrow.
 */
export function explicitArrowOf(facts: SharedRowFacts): ParticipantArrow {
  const arrow = facts.arrow;
  if (arrow.kind === 'winner') {
    if (arrow.providerParticipant === null) {
      return { kind: 'none', reason: 'no unique winner' };
    }
    return {
      kind: 'winner',
      target: arrow.file ?? arrow.targetUrl ?? '(no served file recorded)',
      provider: participantDisplay(arrow.providerParticipant),
    };
  }
  return { kind: 'own' };
}
