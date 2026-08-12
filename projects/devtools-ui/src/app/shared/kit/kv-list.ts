import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One entry of a detail-pane key-value list. */
export interface KvItem {
  label: string;
  value: string;
  /** Render the value in the monospace identifier face. */
  mono?: boolean;
  /** Render the value as a link opening in a new tab. */
  href?: string;
}

/** Key-value list for detail panes. */
@Component({
  selector: 'nf-kv-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kv-list.html',
  styleUrl: './kv-list.css',
})
export class KvList {
  readonly items = input.required<readonly KvItem[]>();
}
