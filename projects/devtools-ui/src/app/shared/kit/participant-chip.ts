import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { PARTICIPANT_COLOR_LOOKUP } from './participant-colors';

/**
 * Participant identity chip: remotes render their name verbatim, the host
 * registration renders as an inverted neutral 'host' badge with the verbatim
 * sentinel one hover away (`title`). Display only — the caller decides
 * host-ness; the kit interprets no registry names. Remotes carry a small
 * identity dot when the shared per-snapshot lookup assigns one; the host
 * never does — its badge fill is reserved styling, not a palette hue.
 */
@Component({
  selector: 'nf-participant-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './participant-chip.html',
  styleUrl: './participant-chip.css',
})
export class ParticipantChip {
  /** Verbatim participant name (registry evidence). */
  readonly name = input.required<string>();
  /** True when this participant is the host registration. */
  readonly host = input(false);

  private readonly colors = inject(PARTICIPANT_COLOR_LOOKUP);

  /** 1-based palette index; null renders no dot (host, or neutral capture). */
  protected readonly colorIndex = computed(() =>
    this.host() ? null : (this.colors().get(this.name()) ?? null),
  );
}
