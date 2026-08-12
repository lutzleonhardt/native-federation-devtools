import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Master-detail split: navigable list left, detail pane right. Pure layout —
 * callers project content into the two slots via the `nfMaster` and
 * `nfDetail` attributes; each pane scrolls independently.
 */
@Component({
  selector: 'nf-master-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './master-detail.html',
  styleUrl: './master-detail.css',
})
export class MasterDetail {}
