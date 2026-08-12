import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CapabilityBadge } from '../../shared/kit/capability-badge';
import { KvList } from '../../shared/kit/kv-list';
import { ParticipantRow } from '../../shared/kit/participant-row';
import { NEGOTIATION_LEGEND, RemoteDetailVm } from './remotes-view-model';

/**
 * Detail pane of the Remotes view — identity, capability badges, exposes,
 * this remote's dependency rows (kit participant row with the package link
 * projected as the row identity), the chunk-attribution ladder, and true
 * scoped externals. Dumb over `RemoteDetailVm`; renders the selection
 * prompt while `detail` is null.
 */
@Component({
  selector: 'nf-remote-detail',
  imports: [CapabilityBadge, KvList, ParticipantRow, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './remote-detail.html',
  styleUrl: './remote-detail.css',
})
export class RemoteDetail {
  readonly detail = input.required<RemoteDetailVm | null>();

  protected readonly legend = NEGOTIATION_LEGEND;
}
