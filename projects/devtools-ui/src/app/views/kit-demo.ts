import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { StateBadge } from '../shared/honest-state/state-badge';
import { CapabilityBadge } from '../shared/kit/capability-badge';
import { KvItem, KvList } from '../shared/kit/kv-list';
import { MasterDetail } from '../shared/kit/master-detail';
import {
  DeclaredVersion,
  ParticipantArrow,
  ParticipantRow,
} from '../shared/kit/participant-row';
import { TreeTable, TreeTableRow, TreeTableToggle } from '../shared/kit/tree-table';

interface DemoNode {
  id: string;
  name: string;
  hint?: string;
  children?: DemoNode[];
}

interface DemoRowPayload {
  name: string;
  hint?: string;
}

interface RowVariant {
  caption: string;
  name: string;
  host?: boolean;
  declared: DeclaredVersion;
  strict: boolean;
  /** Absent = the quiet norm (no resolution claim drawn). */
  arrow?: ParticipantArrow;
  action?: string;
  actionNote?: string;
  link?: boolean;
}

const DEMO_TREE: DemoNode[] = [
  {
    id: 'global',
    name: '__GLOBAL__',
    hint: 'shared scope',
    children: [
      { id: 'global|@angular/core', name: '@angular/core', hint: '3 participants' },
      { id: 'global|rxjs', name: 'rxjs', hint: '2 participants' },
    ],
  },
  {
    id: 'strict',
    name: 'strict',
    hint: 'strict scope',
    children: [{ id: 'strict|@demo/ui-kit', name: '@demo/ui-kit', hint: 'pinned' }],
  },
];

function findNode(nodes: DemoNode[], id: string): DemoNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const child = node.children && findNode(node.children, id);
    if (child) {
      return child;
    }
  }
  return null;
}

/**
 * Dev-only playground for the view kit (Task 9) — reachable at
 * `#/kit-demo` under `ng serve` only; the extension environment ships no
 * route to it. Demo data is hand-made, not captured evidence.
 */
@Component({
  selector: 'nf-kit-demo',
  imports: [TreeTable, MasterDetail, ParticipantRow, KvList, CapabilityBadge, StateBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kit-demo.html',
  styleUrl: './kit-demo.css',
})
export class KitDemo {
  /** Caller-owned tree UI state, as the kit contract demands. */
  private readonly expandedIds = signal<ReadonlySet<string>>(new Set(['global']));
  protected readonly selectedId = signal<string | null>('global|@angular/core');

  protected readonly rows = computed<TreeTableRow<DemoRowPayload>[]>(() => {
    const expanded = this.expandedIds();
    const rows: TreeTableRow<DemoRowPayload>[] = [];
    const visit = (nodes: DemoNode[], depth: number): void => {
      for (const node of nodes) {
        const expandable = (node.children?.length ?? 0) > 0;
        const isExpanded = expandable && expanded.has(node.id);
        rows.push({
          id: node.id,
          depth,
          expandable,
          expanded: isExpanded,
          payload: { name: node.name, hint: node.hint },
        });
        if (isExpanded) {
          visit(node.children!, depth + 1);
        }
      }
    };
    visit(DEMO_TREE, 0);
    return rows;
  });

  protected readonly detail = computed<KvItem[] | null>(() => {
    const id = this.selectedId();
    const node = id === null ? null : findNode(DEMO_TREE, id);
    if (node === null) {
      return null;
    }
    return [
      { label: 'name', value: node.name, mono: true },
      { label: 'kind', value: node.children ? 'scope' : 'package' },
      { label: 'node id', value: node.id, mono: true },
      { label: 'docs', value: 'native-federation.com', href: 'https://native-federation.com/' },
    ];
  });

  protected readonly rowVariants: RowVariant[] = [
    {
      caption: 'winner arrow + share',
      name: 'host',
      declared: { kind: 'range', range: '^19.0.0' },
      strict: false,
      arrow: { kind: 'winner', target: '19.2.3', provider: 'host' },
      action: 'share',
      actionNote: 'offers its copy to the version election',
    },
    {
      caption: 'winner arrow + skip + link slot',
      name: 'mfe1',
      declared: { kind: 'range', range: '~19.1.0' },
      strict: false,
      arrow: { kind: 'winner', target: '19.2.3', provider: 'host' },
      action: 'skip',
      actionNote:
        "this participant's copy of the shared dependency is not taken into consideration",
      link: true,
    },
    {
      caption: 'own copy + scope',
      name: 'mfe2',
      declared: { kind: 'range', range: '^18.0.0' },
      strict: false,
      arrow: { kind: 'own' },
      action: 'scope',
      actionNote: 'keeps its own copy inside a package scope',
    },
    {
      caption: 'pinned exact tag + strict',
      name: 'shell',
      declared: { kind: 'pinned', tag: '1.2.3' },
      strict: true,
      arrow: { kind: 'own' },
    },
    {
      caption: 'winner-less honest state',
      name: 'mfe3',
      declared: { kind: 'range', range: '^2.0.0' },
      strict: false,
      arrow: { kind: 'none', reason: 'no unique winner' },
      action: 'skip',
    },
    {
      caption: 'quiet host winner (no arrow)',
      name: '__NF-HOST__',
      host: true,
      declared: { kind: 'range', range: '^21.2.0' },
      strict: false,
      action: 'share',
      actionNote: 'offers this copy to the version election',
    },
  ];

  protected onToggle(toggle: TreeTableToggle): void {
    this.expandedIds.update((ids) => {
      const next = new Set(ids);
      if (toggle.expanded) {
        next.add(toggle.id);
      } else {
        next.delete(toggle.id);
      }
      return next;
    });
  }

  protected onSelect(row: TreeTableRow): void {
    this.selectedId.set(row.id);
  }
}
