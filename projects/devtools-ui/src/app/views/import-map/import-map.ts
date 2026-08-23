import { NgTemplateOutlet } from '@angular/common';
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
import {
  IMPORT_MAP_SECTION_CONTRACT,
  ImportMapGroupVm,
  ImportMapSectionVm,
  ImportMapVm,
  OVERRIDES_GLOBAL_NOTE,
  buildImportMapVm,
} from './import-map-view-model';

/**
 * Import Map tab — the raw evidence view: every recorded (scope,
 * specifier, target) entry exactly once, sections per scope, rows grouped
 * into their evidence homes with the chunk-wiring fold collapsed by
 * default. Dumb component over the pure `buildImportMapVm` builder; the
 * `select` query param seeds row highlighting (specifier payload, `/./`
 * infix tolerated — cross-link convention, see `app.routes.ts`) and is
 * read once at init. Fold expansion is caller-owned UI state: an explicit
 * toggle wins, otherwise a fold holding the selected row auto-expands.
 */
@Component({
  selector: 'nf-import-map-view',
  imports: [NgTemplateOutlet, RouterLink, ParticipantChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './import-map.html',
  styleUrl: './import-map.css',
})
export class ImportMapView {
  private readonly store = inject(FederationStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly sectionContract = IMPORT_MAP_SECTION_CONTRACT;
  protected readonly overridesGlobalNote = OVERRIDES_GLOBAL_NOTE;

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

  /** Explicit fold choices per section; absent = the selection decides. */
  private readonly foldChoices = signal<ReadonlyMap<string, boolean>>(new Map());

  /** Structural fold key — a null scope never collides with a URL scope. */
  private foldKey(section: ImportMapSectionVm): string {
    return JSON.stringify(section.scope);
  }

  protected foldExpanded(section: ImportMapSectionVm, group: ImportMapGroupVm): boolean {
    return this.foldChoices().get(this.foldKey(section)) ?? group.containsSelection;
  }

  protected toggleFold(section: ImportMapSectionVm, group: ImportMapGroupVm): void {
    const next = new Map(this.foldChoices());
    next.set(this.foldKey(section), !this.foldExpanded(section, group));
    this.foldChoices.set(next);
  }

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
