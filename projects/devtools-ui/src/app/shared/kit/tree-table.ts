import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  computed,
  contentChild,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';

/**
 * One rendered row of the tree-table. The input list is FLAT: hierarchy is
 * flattened in the caller's view-model projection (rows carry depth and
 * expanded flags); the component holds no hierarchy and no expansion state.
 */
export interface TreeTableRow<T = unknown> {
  /** Stable identity across re-renders; focus and selection key on it. */
  id: string;
  /** 0-based nesting depth, rendered as indentation and `aria-level`. */
  depth: number;
  expandable: boolean;
  /** Caller-owned UI state — the component only requests changes. */
  expanded: boolean;
  /** Typed payload rendered via the projected row template. */
  payload: T;
}

/** Expansion request: the caller flips its state and re-renders. */
export interface TreeTableToggle {
  id: string;
  /** The requested state (true = expand). */
  expanded: boolean;
}

/** Context of the projected row template. */
export interface TreeTableRowContext<T = unknown> {
  $implicit: T;
  row: TreeTableRow<T>;
}

/**
 * Dumb flat-list tree renderer. Callers project a row template
 * (`<ng-template let-payload let-row="row">`); identifiers inside it should
 * use the `--nf-font-mono` token. Keyboard: Up/Down move focus, Right/Left
 * request expand/collapse, Enter selects. Selection state is caller-owned
 * (`selectedId` in, `selectRow` out); focus is the only internal UI state
 * (roving tabindex).
 */
@Component({
  selector: 'nf-tree-table',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tree-table.html',
  styleUrl: './tree-table.css',
})
export class TreeTable {
  readonly rows = input.required<readonly TreeTableRow[]>();
  readonly selectedId = input<string | null>(null);
  /** Accessible name of the tree. */
  readonly label = input<string>();

  readonly toggleRow = output<TreeTableToggle>();
  readonly selectRow = output<TreeTableRow>();

  protected readonly rowTemplate =
    contentChild.required<TemplateRef<TreeTableRowContext>>(TemplateRef);

  private readonly rowElements = viewChildren<ElementRef<HTMLElement>>('rowEl');

  /** Last focused row id — only kept to place the roving tab stop. */
  private readonly focusedId = signal<string | null>(null);

  /** Roving tabindex home: last focused row, else selected row, else first. */
  protected readonly tabStopId = computed(() => {
    const rows = this.rows();
    const focused = this.focusedId();
    if (focused !== null && rows.some((row) => row.id === focused)) {
      return focused;
    }
    const selected = this.selectedId();
    if (selected !== null && rows.some((row) => row.id === selected)) {
      return selected;
    }
    return rows.length > 0 ? rows[0].id : null;
  });

  protected onRowClick(row: TreeTableRow): void {
    this.focusedId.set(row.id);
    this.selectRow.emit(row);
  }

  protected onTwistyClick(event: MouseEvent, row: TreeTableRow): void {
    // A twisty click toggles; it must not double as a selection click.
    event.stopPropagation();
    this.focusedId.set(row.id);
    this.toggleRow.emit({ id: row.id, expanded: !row.expanded });
  }

  protected onKeydown(event: KeyboardEvent, row: TreeTableRow, index: number): void {
    switch (event.key) {
      case 'ArrowDown':
        this.moveFocus(index + 1);
        break;
      case 'ArrowUp':
        this.moveFocus(index - 1);
        break;
      case 'ArrowRight':
        if (row.expandable && !row.expanded) {
          this.toggleRow.emit({ id: row.id, expanded: true });
        }
        break;
      case 'ArrowLeft':
        if (row.expandable && row.expanded) {
          this.toggleRow.emit({ id: row.id, expanded: false });
        }
        break;
      case 'Enter':
        this.selectRow.emit(row);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  private moveFocus(index: number): void {
    const rows = this.rows();
    if (index < 0 || index >= rows.length) {
      return;
    }
    this.focusedId.set(rows[index].id);
    this.rowElements()[index]?.nativeElement.focus();
  }
}
