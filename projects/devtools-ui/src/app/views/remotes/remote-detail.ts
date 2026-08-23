import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ParticipantChip } from '../../shared/kit/participant-chip';
import { RemoteDetailVm } from './remotes-view-model';

/**
 * Detail pane of the Remotes view (T8.6) — identity meta, the capabilities
 * meta line, exposes in file-line grammar, the three per-claim zones
 * (provides / consumes / unresolved), private registrations, the deduped
 * chunk section, and the divergence-only diagnostics footer. Dumb over
 * `RemoteDetailVm`; renders the selection prompt while `detail` is null.
 */
@Component({
  selector: 'nf-remote-detail',
  imports: [ParticipantChip, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './remote-detail.html',
  styleUrl: './remote-detail.css',
})
export class RemoteDetail {
  readonly detail = input.required<RemoteDetailVm | null>();
}
