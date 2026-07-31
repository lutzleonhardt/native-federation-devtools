import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StateBadgeKind = 'partial' | 'ambiguous';

/**
 * Honest-state badge: 'partial' marks captured but coverage-limited data,
 * 'ambiguous' marks an association the evidence cannot prove. The two kinds
 * render distinctly (solid vs. dashed) so they are never conflated.
 */
@Component({
  selector: 'nf-state-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './state-badge.html',
  styleUrl: './state-badge.css',
})
export class StateBadge {
  readonly kind = input.required<StateBadgeKind>();
  /** Optional context, shown as a tooltip. */
  readonly note = input<string>();
}
