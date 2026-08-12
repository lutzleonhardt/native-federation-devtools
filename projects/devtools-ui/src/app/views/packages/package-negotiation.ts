import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StateBadge } from '../../shared/honest-state/state-badge';
import { ParticipantChip } from '../../shared/kit/participant-chip';
import { ParticipantRow } from '../../shared/kit/participant-row';
import { DetailVersionVm, NEGOTIATION_LEGEND } from './packages-view-model';

/**
 * Negotiation section of the package detail — version groups with their
 * participant rows, exception arrows, the winner's provider line, and the
 * losing-copy residual. Dumb over `DetailVersionVm[]`; participant chips
 * are the /remotes cross-links.
 */
@Component({
  selector: 'nf-package-negotiation',
  imports: [ParticipantRow, ParticipantChip, StateBadge, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './package-negotiation.html',
  styleUrl: './package-negotiation.css',
})
export class PackageNegotiation {
  readonly versions = input.required<DetailVersionVm[]>();
  /** Honest no-winner state line; null when a winner exists. */
  readonly note = input<string | null>(null);

  protected readonly legend = NEGOTIATION_LEGEND;
}
