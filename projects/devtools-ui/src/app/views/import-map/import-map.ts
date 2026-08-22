import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ParticipantChip } from '../../shared/kit/participant-chip';
import { FederationStore } from '../../shared/store/federation-store';
import { ImportMapVm, buildImportMapVm } from './import-map-view-model';

/**
 * Import Map tab — the raw evidence view: the effective map verbatim, in
 * map order, every row annotated from the canonical read surface
 * (resolutions, claims, copies, bundle claims, chunk groups, exposes).
 * Dumb component over the pure `buildImportMapVm` builder; the `select`
 * query param seeds row highlighting (specifier payload, `/./` infix
 * tolerated — cross-link convention, see `app.routes.ts`) and is read
 * once at init.
 */
@Component({
  selector: 'nf-import-map-view',
  imports: [RouterLink, ParticipantChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './import-map.html',
  styleUrl: './import-map.css',
})
export class ImportMapView {
  private readonly store = inject(FederationStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly selected = signal<string | null>(
    inject(ActivatedRoute).snapshot.queryParamMap.get('select'),
  );

  protected readonly vm = computed<ImportMapVm | null>(() => {
    const model = this.store.model();
    if (model === null) {
      return null;
    }
    return buildImportMapVm(model, { selected: this.selected() });
  });

  /** The seeded selection scrolls into view once, after the rows exist. */
  private scrolledToSelection = false;

  constructor() {
    effect(() => {
      if (this.selected() === null || this.vm() === null || this.scrolledToSelection) {
        return;
      }
      // Defer past the render pass that materializes the rows.
      setTimeout(() => {
        const row = this.host.nativeElement.querySelector('.row-selected');
        if (row !== null) {
          this.scrolledToSelection = true;
          row.scrollIntoView?.({ block: 'center' });
        }
      });
    });
  }
}
