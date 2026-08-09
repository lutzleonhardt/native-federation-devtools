import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ImportMapEntryV1 } from 'devtools-bridge';

import { MissingEvidence } from '../shared/honest-state/missing-evidence';
import { NotDetected } from '../shared/honest-state/not-detected';
import { importMapViewState } from '../shared/import-map-view-state';
import { SnapshotStore } from '../shared/snapshot-store';

interface ImportRow {
  specifier: string;
  target: string;
  /** True when the target URL carries an SRI integrity entry — presence only. */
  integrity: boolean;
}

interface ScopeGroup {
  scope: string;
  imports: ImportRow[];
}

function toRows(entries: ImportMapEntryV1[], integrityFor: ReadonlySet<string>): ImportRow[] {
  return entries.map((entry) => ({
    specifier: entry.specifier,
    target: entry.target,
    integrity: integrityFor.has(entry.target),
  }));
}

@Component({
  selector: 'nf-import-map',
  imports: [MissingEvidence, NotDetected],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './import-map.html',
  styleUrl: './import-map.css',
})
export class ImportMap {
  private readonly store = inject(SnapshotStore);

  protected readonly vm = computed(() => importMapViewState(this.store.state()));

  protected readonly globalImports = computed<ImportRow[]>(() => {
    const vm = this.vm();
    if (vm.kind !== 'ready') {
      return [];
    }
    return toRows(vm.effective.imports, new Set(vm.effective.integrityFor));
  });

  protected readonly scopeGroups = computed<ScopeGroup[]>(() => {
    const vm = this.vm();
    if (vm.kind !== 'ready') {
      return [];
    }
    const integrityFor = new Set(vm.effective.integrityFor);
    return vm.effective.scopes.map((scope) => ({
      scope: scope.scope,
      imports: toRows(scope.imports, integrityFor),
    }));
  });

  protected refresh(): void {
    void this.store.refresh();
  }
}
