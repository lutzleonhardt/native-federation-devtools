import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ParticipantChip } from './participant-chip';

/**
 * What the participant declares. The pinned variant renders the exact tag —
 * strict-scope rows must never present `requiredVersion` as a declared
 * range, so the two shapes are deliberately distinct.
 */
export type DeclaredVersion = { kind: 'range'; range: string } | { kind: 'pinned'; tag: string };

/**
 * Where the participant's request resolves: to the selected copy's served
 * file, or — honest state — nowhere the evidence can point (`none`, e.g.
 * a skip row without a unique winner). The reason renders verbatim; the
 * row never guesses a target. The own-copy arrow is gone since T8.6: zone
 * membership (provides vs consumes) says it in the one remaining consumer.
 */
export type ParticipantArrow =
  { kind: 'winner'; target: string; provider: string } | { kind: 'none'; reason: string };

/**
 * The shared participant→resolution row of the view kit. Fixed
 * vocabulary: "resolves to" — never "uses", never bare "loaded". The
 * arrow is optional: the norm stays quiet, only exceptions speak. The
 * name renders as the participant chip by default; callers may project a
 * linked replacement via the `nfParticipant` slot (the kit stays
 * router-free). The winner arrow's source renders as `from` plus the
 * provider name — callers may project a linked chip via `nfArrowSource`.
 * Optional trailing links project via `nfRowLinks`.
 */
@Component({
  selector: 'nf-participant-row',
  imports: [ParticipantChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './participant-row.html',
  styleUrl: './participant-row.css',
})
export class ParticipantRow {
  /** Verbatim participant name; rendered via the participant chip. */
  readonly name = input.required<string>();
  /** True when this participant is the host registration. */
  readonly host = input(false);
  readonly declared = input.required<DeclaredVersion>();
  /**
   * Optional grounded tooltip on the declared version (e.g. the consumer's
   * registration evidence); the pinned variant falls back to its exact-tag
   * explanation when absent.
   */
  readonly declaredNote = input<string>();
  /** Marks strict version negotiation. */
  readonly strict = input(false);
  /** Optional — absent means the quiet norm (no resolution claim drawn). */
  readonly arrow = input<ParticipantArrow>();
  /** Registry action, verbatim (share/skip/scope). */
  readonly action = input<string>();
  /** Optional action explanation, shown as a tooltip on the chip. */
  readonly actionNote = input<string>();

  protected readonly declaredRange = computed(() => {
    const declared = this.declared();
    return declared.kind === 'range' ? declared : null;
  });

  protected readonly declaredPinned = computed(() => {
    const declared = this.declared();
    return declared.kind === 'pinned' ? declared : null;
  });

  protected readonly winnerArrow = computed(() => {
    const arrow = this.arrow();
    return arrow?.kind === 'winner' ? arrow : null;
  });

  protected readonly noneArrow = computed(() => {
    const arrow = this.arrow();
    return arrow?.kind === 'none' ? arrow : null;
  });

  protected readonly pinnedNote = computed(
    () =>
      this.declaredNote() ??
      'exact tag — pinned by the strict share scope; the configured requiredVersion range is not stored',
  );

  protected readonly arrowLabel = computed(() => {
    const arrow = this.arrow();
    switch (arrow?.kind) {
      case 'winner':
        // "source", not "provider": the named remote is the resolved
        // target's evidenced source, never a delivery claim (T7 wording).
        return `resolves to ${arrow.target} (source: ${arrow.provider})`;
      case 'none':
        // No resolution claim — the honest state names its reason instead.
        return `resolution not derived: ${arrow.reason}`;
      case undefined:
        return null;
    }
  });
}
