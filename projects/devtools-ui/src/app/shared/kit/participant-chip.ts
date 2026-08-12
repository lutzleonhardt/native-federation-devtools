import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Participant identity chip: remotes render their name verbatim, the host
 * registration renders as a quiet 'host' chip with the verbatim sentinel
 * one hover away (`title`). Display only — the caller decides host-ness;
 * the kit interprets no registry names.
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
}
