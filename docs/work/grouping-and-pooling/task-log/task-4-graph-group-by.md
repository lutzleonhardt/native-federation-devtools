### Task

Group-by switch on the Graph's dependency column — Provider (the existing
evidenced-source clustering, default), Share scope, Pool, Bundle — keyed
only by the projection's `copyGroupingFacets` (Task 3).

### Status

DONE

All three acceptance criteria pinned. UI 538, bridge 93, collector 82,
guards 68 green; spec typecheck clean; Prettier clean. Verified live in
headless Chromium against the dev server (`pool-tag-anchored` under
Provider and Pool, `dense-chunking-only` under Bundle), no console
errors.

### Files Modified

- `views/graph/graph-types.ts` — `GROUP_BY_OPTIONS` / `GroupBy`,
  `GraphBuildOptions.groupBy`, `GraphCluster.tooltip`.
- `views/graph/graph-grouping.ts` (new) — `groupDependencies` for the
  three non-provider axes: cluster key, label, tooltip, order.
- `views/graph/graph-model.ts` — provider branch unchanged (plus
  `tooltip: null`); other axes lay out `groupDependencies` clusters.
- `views/graph/graph.{ts,html,css}` — `groupBy` signal, toolbar button
  group (`aria-pressed`, hint titles), cluster `<title>` tooltip.
- Specs: `graph-model.spec.ts` (new group-by block), `graph.spec.ts`
  (toolbar switch + vocabulary under every grouping).

### Key Decisions

- **Non-provider clusters are neutral:** participant hues are identity
  claims about a remote; a scope, pool or bundle cluster owns none. This
  drops par-ticle's "dependency cluster takes its bundle's hue" rule —
  our chunk clusters are hued by emitter, not bundle, so there is no
  bundle palette to match. Revealed bundle edges under these groupings
  are neutral too.
- **Labels:** `default share scope` (tooltip names `__GLOBAL__`), named
  scopes verbatim, `strict` pinned last; `pool <name>` (+ ` · <scope>`
  off the default scope) with tooltip `formed by: <remote> "<tag>", …`
  and a "nothing to coordinate" line for single-remote pools; bundle
  names joined by ` + `. Buckets: `(private)`, `(no share scope
  evidenced)`, `(not pooled)`, `(no bundle)`, always last.
- **Group-by is a plain `signal`, not `linkedSignal`:** it names no
  capture value, so it survives capture replacement like the Packages
  `conflicts` filter.
- **Separate `graph-group-by-label` class:** reusing
  `graph-toolbar-line` broke an existing pin that reads the first
  toolbar line.

### Review Focus

- **Behavior claims:** node, edge and bundle-ref sets are identical under
  every grouping (only cluster membership and y positions change);
  Provider output equals the pre-task default.
- **Read next:** `graph-grouping.ts`; the group-by block in
  `graph-model.spec.ts`.

### Test Evidence

- `ng test devtools-ui --include '**/views/graph/*.spec.ts'` — 58/58.
- Full suites as under Status.
- Live: `ng serve devtools-ui --port 4210`, Playwright Chromium
  screenshots of `?fixture=pool-tag-anchored#/graph` (Provider: host +
  mfe1 hued clusters; Pool: one neutral `pool @nf-lab/ui-core (3)`
  cluster including the host's ui-core@2.0.0 — pool membership is per
  package) and `?fixture=dense-chunking-only#/graph` under Bundle
  (`browser-shared (2)`, `(no bundle) (1)`).

### Acceptance Coverage

- **T4-AC-01 — passed:** per-grouping cluster labels over
  `frankenstein-live`, `scoped`, `strict-scope`, `pool-tag-coherent`,
  `dense-chunking-only`; pool tooltip; neutral hues; determinism.
- **T4-AC-02 — passed:** node keys, edge IDs and bundle-ref keys equal
  across all four groupings on four fixtures; DOM node labels unchanged
  after switching.
- **T4-AC-03 — passed:** forbidden-vocabulary check over the rendered
  DOM (including SVG `<title>` tooltips) after each grouping switch.

### Open Issues

- Share-scope grouping still has no real named-scope witness (see
  Task 3 log).
- Task 7 adds `?group=` / `?select=` deep links; the switch is not yet
  URL-addressable.

### Context for Next Task

- Task 5 (pool chips) can reuse `TagPool` from the projection; Task 7's
  "explain" link belongs on the pool cluster header built here
  (`dependencies:pool:<poolId>` cluster keys).

### Git State

- Branch `grouping-and-pooling`, committed as `task-4`.
