import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * What the participant declares. The pinned variant renders the exact tag —
 * strict-scope rows must never present `requiredVersion` as a declared
 * range, so the two shapes are deliberately distinct.
 */
export type DeclaredVersion =
  | { kind: 'range'; range: string }
  | { kind: 'pinned'; tag: string };

/**
 * Where the participant's request resolves: to the elected winner's served
 * file, or to the participant's own copy.
 */
export type ParticipantArrow =
  | { kind: 'winner'; target: string; provider: string }
  | { kind: 'own' };

/**
 * The shared participant→resolution row rendered by both Packages and
 * Remotes. Fixed vocabulary: "resolves to" — never "uses", never bare
 * "loaded". Optional link slots project via the `nfRowLinks` attribute.
 */
@Component({
  selector: 'nf-participant-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './participant-row.html',
  styleUrl: './participant-row.css',
})
export class ParticipantRow {
  readonly name = input.required<string>();
  readonly declared = input.required<DeclaredVersion>();
  /** Marks strict version negotiation. */
  readonly strict = input(false);
  readonly arrow = input.required<ParticipantArrow>();
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
    return arrow.kind === 'winner' ? arrow : null;
  });

  protected readonly arrowLabel = computed(() => {
    const arrow = this.arrow();
    return arrow.kind === 'winner'
      ? `resolves to ${arrow.target} (provider: ${arrow.provider})`
      : 'resolves to own copy';
  });
}
