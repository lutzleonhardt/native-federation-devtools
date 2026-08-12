import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Honest stand-in for the V2 views (Tasks 10–13): claims nothing beyond
 * "not implemented yet" — no fake data.
 */
@Component({
  selector: 'nf-view-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './placeholder.html',
})
export class ViewPlaceholder {
  protected readonly title = inject(ActivatedRoute).snapshot.data['title'] as string;
}
