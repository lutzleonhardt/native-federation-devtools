import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Honest state: an evidence channel is unavailable or was not captured.
 * The reason comes verbatim from the snapshot — never invented in the UI.
 */
@Component({
  selector: 'nf-missing-evidence',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './missing-evidence.html',
  styleUrl: './missing-evidence.css',
})
export class MissingEvidence {
  readonly reason = input.required<string>();
}
