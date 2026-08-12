import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Quiet presence chip for observed capabilities (e.g. "chunking ✓",
 * "SRI ✓"). Deliberately distinct from the honest-state `StateBadge`
 * (partial/ambiguous), which stays reserved for evidence limits: this chip
 * is muted and lowercase where the state badge is warning-toned and
 * uppercase.
 */
@Component({
  selector: 'nf-capability-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './capability-badge.html',
  styleUrl: './capability-badge.css',
})
export class CapabilityBadge {
  readonly label = input.required<string>();
  /** Optional explanation, shown as a tooltip (dotted-underline affordance). */
  readonly note = input<string>();
}
