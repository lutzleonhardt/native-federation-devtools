import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ParticipantChip } from '../../shared/kit/participant-chip';
import { ParticipantRow } from '../../shared/kit/participant-row';
import { DetailVersionVm, NEGOTIATION_LEGEND } from './packages-view-model';

/**
 * Negotiation section of the package detail — version registrations with
 * their declaration rows, canonical claim-state chips (selected, not
 * selected, anchored, …), and resolution arrows. Dumb over
 * `DetailVersionVm[]`; participant chips are the /remotes cross-links.
 */
@Component({
  selector: 'nf-package-negotiation',
  imports: [ParticipantRow, ParticipantChip, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './package-negotiation.html',
  styleUrl: './package-negotiation.css',
})
export class PackageNegotiation {
  readonly versions = input.required<DetailVersionVm[]>();
  /** Honest no-copy resolution note; null while copies exist. */
  readonly note = input<string | null>(null);

  protected readonly legend = NEGOTIATION_LEGEND;
}
