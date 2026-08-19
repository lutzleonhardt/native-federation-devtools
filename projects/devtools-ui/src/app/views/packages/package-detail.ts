import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StateBadge } from '../../shared/honest-state/state-badge';
import { ParticipantChip } from '../../shared/kit/participant-chip';
import { PackageNegotiation } from './package-negotiation';
import { PackageDetailVm } from './packages-view-model';

/**
 * Detail pane of the Packages view — meta line, canonical resolution
 * measures, negotiation (via `nf-package-negotiation`), resolved copies
 * with qualified sources, integrity, and the bundle-claim chunk section.
 * Dumb over `PackageDetailVm`; renders the selection prompt while `detail`
 * is null.
 */
@Component({
  selector: 'nf-package-detail',
  imports: [PackageNegotiation, ParticipantChip, RouterLink, StateBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './package-detail.html',
  styleUrl: './package-detail.css',
})
export class PackageDetail {
  readonly detail = input.required<PackageDetailVm | null>();
}
