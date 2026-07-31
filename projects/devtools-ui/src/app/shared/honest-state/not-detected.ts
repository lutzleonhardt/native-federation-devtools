import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Global empty state: the page carries no recognizable Native Federation.
 * Shown with the channel's reason; views render no data rows in this state.
 */
@Component({
  selector: 'nf-not-detected',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './not-detected.html',
  styleUrl: './not-detected.css',
})
export class NotDetected {
  readonly reason = input.required<string>();
}
