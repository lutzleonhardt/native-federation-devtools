### Task

Graph view interaction layer: hover = transient trace (the hovered node plus
its undirected 1-hop neighbors stay at full opacity, everything else dims,
and the hovered node's precomputed bundle-edge references render as a
colored overlay), click on a remote = consumer filter (OR over a copy's
consume relations, applied inside the pure builder; the remote column always
renders completely and chunk attribution ignores the selection), plus the
toolbar (hint line ↔ `filtering by N remotes` + Clear, cap message only
when `cappedEdges > 0`). View state is exactly
`{ selectedRemotes, hovered }`, both reset per capture — everything else
derives per change.

### Status

DONE

All five T3 acceptance criteria are covered by green tests (34 builder + 19
DOM after the review round), the full repository suite is green (697), the
Remotes suite passes unmodified, and two live browser rounds verified the
four interaction states plus the refresh-reset scenario. An external
(Codex) review was triaged in-session: its MEDIUM (interaction state
outlives the capture) was substantiated, its practical severity corrected
(unreachable from today's surfaces — the fixture picker full-reloads; only
an in-place recapture with changed content reaches it), and fixed with the
user-chosen reset semantics via `linkedSignal`. Two user-driven design
rounds followed: the drafted Task 3.1 (directed lineage trace) was removed
from the plan before implementation with its disposition recorded as a
stage-2 note, and the host node's accent border was dropped (collided with
the selection frame). `hoveredRefs` was renamed to `hoveredBundleEdges`
(user naming review).

### Files Modified

- `projects/devtools-ui/src/app/views/graph/graph-types.ts` (modified) —
  `GraphBuildOptions.selectedRemotes?: ReadonlySet<string>` (documented OR
  filter semantics incl. selection-independent capture honesty);
  `BundleEdgeRef.colorIndex: number | null` (hue slot of the claiming
  dependency's cluster for the hover reveal).
- `projects/devtools-ui/src/app/views/graph/graph-model.ts` (modified) —
  consumer-filter step ahead of clustering (`copyKept`: empty selection =
  no filter, else OR over the copy's consume relations); consume-edge loop
  rewritten so `droppedRelationIds` stays selection-independent (endpoint
  existence checked against the projection, filter-removed relations are
  never "dropped"); `dependencyHueByCopyId` stamp so every bundle-edge
  reference carries its source cluster's `colorIndex`; new exported
  `graphAdjacencyOf(model)` — undirected adjacency over consume edges AND
  bundle references, keyed by render keys, derived once per model.
- `projects/devtools-ui/src/app/views/graph/graph-element-factories.ts`
  (modified) — new `nodeKeyOf(kind, id)` centralizing the `<kind>:<id>`
  render-key rule (used by `nodeBaseAt` and the adjacency/edge-dim key
  construction).
- `projects/devtools-ui/src/app/views/graph/graph.ts` (modified) —
  interaction state as two `linkedSignal`s on `store.model` (reset per
  capture — review fix); derived layers: `adjacency` (once per model),
  `traced` (hovered + neighbors, null without hover), `hoveredBundleEdges`
  (the hovered node's references — renamed from `hoveredRefs` after user
  naming review); template helpers `nodeDimmed`/`edgeDimmed`; handlers
  `setHovered`/`toggleRemote`/`clearSelection`; toolbar lines via the
  shared `countClaim` vocabulary (`filterLine`, `cappedLine`).
- `projects/devtools-ui/src/app/views/graph/graph.html` (modified) —
  toolbar above the scroll area (hint line ↔ filter line + Clear
  `nf-button`, conditional cap message); `(mouseleave)` on the svg clears
  the hover; per-node `(mouseenter)`/`(mouseleave)` + `dim` class
  bindings on all three node kinds; `(click)` + `selected` class on remote
  nodes; `dim` on consume-edge groups; bundle-edge overlay `@for` over
  `hoveredBundleEdges()` rendered between edges and nodes.
- `projects/devtools-ui/src/app/views/graph/graph.css` (modified) —
  toolbar styles; dim opacities (nodes 0.2, foreign consume edges 0.07)
  with 120ms transitions; `.graph-bundle-edge` (0.75, pointer-events
  none) + 8 `hue-N` stroke rules; remote cursor pointer; `selected` fill
  (`color-mix` accent 18%) + heavier accent stroke; host accent border
  REMOVED (user review: collided with the selection frame; other views
  don't color the host either — the `host` class stays as semantic
  marker).
- `projects/devtools-ui/src/app/views/graph/graph-model.spec.ts`
  (modified) — 7 new builder pins: empty selection == no options
  (deep-equal), co-declared OR keep + unselected-edge drop (cluster label
  stays `mfe1`), clean-skip chunk-attribution-under-selection (T3-AC-02
  seed truth: mfe1 is the borrower), frankenstein multi-select union
  (8 copies, honest empty chunk column, hue slots stable under filter),
  selection-independent `droppedRelationIds` (ghost reported in every
  filter state, filter-removed relation never reported), ref `colorIndex`
  stamping (colored source cluster vs. forced-neutral host cluster), and a
  `graphAdjacencyOf` describe (undirected: dependency ↔ consumers +
  chunk; consumer-less host has no entry).
- `projects/devtools-ui/src/app/views/graph/graph.spec.ts` (modified) —
  harness split `createViewFixture` (returns fixture + element; old
  `createView` delegates), `FixtureSnapshotProvider.id` now mutable,
  seeded helpers extended (`seededCopy` claim ids, `seededClaim`,
  `seededChunkGroup`, projection Pick + `chunkGroups`/`bundleClaims`),
  `nodeByLabel` selector + `TOOLBAR_HINT` constant; 7 new DOM tests:
  hover trace on `@angular/core` (5 revealed bundle edges, host lit,
  others dimmed, leave restores — T3-AC-01), hover multiset invariance
  (nodes + consume-edge `d` multiset identical before/during/after —
  T3-AC-05), clean-skip borrower-selected (chunk stub stays although the
  emitter is unselected — T3-AC-02), multi-select union + Clear restore
  (T3-AC-03), toolbar state switch (T3-AC-04), seeded cap message
  (`99 additional bundle links hidden…` — T3-AC-04), and the
  cross-capture reset regression (select + hover, provider switches
  fixture, `store.refresh()` → hint line, no `.selected`, no `.dim` —
  Codex review fix).

### Files Read (Context Only)

- `docs/work/graph-view/plan.md` — preamble + Task 3 block only (task
  isolation); later amended in-session (see Scope notes).
- `docs/work/graph-view/task-log/` — `task-2` (predecessor: model surface
  `bundleEdgeRefs`/`cappedEdges`/cluster contract, seeded harness, label
  and host-display gotchas), `task-1` (edge hover corridor
  `g.graph-edge-group` + `graph-edge-hit`, vitest idioms, probe-then-pin
  method). `task-1.9` was judged not relevant (attribution semantics fully
  absorbed by Task 2).
- `projects/devtools-ui/src/app/shared/store/federation-store.ts` —
  `refresh()` mechanics for the review triage (model null → replaced,
  component survives).
- `projects/devtools-ui/src/app/shell/fixture-picker.ts` — verified the
  fixture switch performs a full reload (`location.assign`), which bounds
  the review finding's reachability.
- `projects/devtools-ui/src/app/shared/view-conventions.ts` (`countClaim`),
  `projects/devtools-ui/src/styles.css` (`nf-button`, color tokens),
  `projects/devtools-ui/src/app/views/packages/packages.html` (toolbar
  button precedent).
- Ground-truth probe (temporary spec, deleted; throw-method): clean-skip
  consumers/borrower identity, frankenstein consumers-per-copy and
  refs-per-dependency (`@angular/core` = 5 refs), multi-select union = 8.

### Key Decisions

- **Selection filters inside the pure builder**
  (`GraphBuildOptions.selectedRemotes`), hover does not touch the model:
  the vm computed depends on the selection signal (rebuild per toggle),
  while hover is emphasis-only — class flips plus an overlay `@for` over
  precomputed references. T3-AC-05's "identical node/edge multiset" is
  read as nodes + consume edges with the bundle overlay as the
  AC-01-mandated exception (user-approved); the pinned invariants are the
  DOM multiset and that hover never rebuilds the vm.
- **`droppedRelationIds` is selection-independent (capture honesty is not
  a filter state):** endpoint existence is checked against the
  projection's remotes/copies, not the filtered node set; a relation
  removed by the filter is "filtered", never "dropped". Pinned with a
  ghost + filter seed.
- **Adjacency is a two-layer derivation:** exported pure
  `graphAdjacencyOf` builds the undirected map once per model (memoized
  computed), the per-hover work is a Set lookup plus a reference filter —
  no per-hover model work, no stored derived state.
- **Interaction state resets per capture via `linkedSignal` (review fix,
  user-chosen over two alternatives):** Codex suggested clear-or-reconcile;
  my first proposal was derivational intersection (effective selection =
  raw ∩ current remotes). The user chose plain reset semantics — simpler
  and more honest ("view state is per capture", uniform with the
  fixture picker's reload). `linkedSignal` on `store.model` makes the
  reset declarative and glitch-free (resets on read, no stale frame),
  unlike an effect-based `resetAll()` which runs after CD and would flash
  the ghost state; destroy/recreate of the component was rejected as
  non-idiomatic (router), too coarse (nukes capture-independent
  preferences like the Packages `conflicts` enum filter), and wasteful.
- **Toolbar wording pluralized via `countClaim`** (user-approved over the
  plan's literal `remote(s)`): `filtering by 1 remote` /
  `filtering by 2 remotes`; cap message
  `N additional bundle link(s) hidden to keep the graph responsive.`
- **Host is clickable/selectable like any remote** (user-approved — the
  plan makes no exception).
- **Host accent border removed (user review):** the blue host stroke was
  visually too close to the blue selection frame; other views render the
  host without color (chip convention). The `host` class binding stays as
  the semantic/test hook; identity is carried by the `host` label and
  first position.
- **Task 3.1 (directed lineage trace) drafted, then removed before
  implementation (user decision after design discussion):** the shipped
  1-hop trace marks exactly the hovered node's own evidence records — a
  principled boundary, not a truncation. Key insights recorded in the
  plan's stage-2 list: only the chunk→consumer direction would add
  statically-unreadable information (borrowed-copy consumers) at bounded
  cost, while remote→chunks is statically attributed via
  `emitter · bundle` cluster labels and is the clutter-prone direction;
  naive transitive closure would flood the connected component
  (co-consumers). Revisit only after real usage shows the need.
- **`hoveredRefs` → `hoveredBundleEdges` (user naming review):** the
  component-side name now says what is rendered (bundle edges, matching
  the `graph-bundle-edge` class and AC-01 wording) and whose (the hovered
  node's); the model side deliberately keeps `BundleEdgeRef` /
  `bundleEdgeRefs` — there "ref" documents "computed with geometry but
  not rendered as a standing edge".

— session 2026-08-25 (live rounds + environment)

- The webmcp Chromium profile was held by a LIVE session (mitmproxy
  proxy); per the conflict rule it was not touched. Screenshots and
  interaction checks ran in a separate headless Chromium driven over raw
  CDP (Node global WebSocket, script in the job tmp dir) — this also
  enabled hover/click dispatch, which plain `--screenshot` cannot do.
- The long-running dev server on :4201 had a stale compile-error overlay
  (its watcher had built an intermediate edit state and missed the final
  rebuild); a `touch` on `graph-model.ts` cured it — worth remembering
  before suspecting real compile errors.

### Review Focus

- **Behavior claims:** with a non-empty selection a copy renders iff at
  least one of its consume relations names a selected remote (OR), consume
  edges from unselected remotes drop, the remote column always renders
  completely, and chunk attribution ignores the selection (the emitter is
  not the consumer — clean-skip's mfe2-emitted stub stays with only the
  borrower mfe1 selected); hovering emphasizes exactly the node's own
  evidence (undirected 1-hop over consume edges + bundle references) and
  reveals exactly the hovered node's bundle edges, colored by the source
  cluster, while the vm and the rendered node/consume-edge multiset stay
  identical; `droppedRelationIds` and the divergence footer read the same
  in every filter state; selection and hover reset on every new capture.
- **Assumptions / choices:** the AC-05 multiset reading (bundle overlay =
  AC-01 exception, user-approved); reset-per-capture over
  selection-reconciliation (user-chosen); `countClaim` pluralization over
  the plan's literal `remote(s)`; host clickable; hover trace covers only
  retained references when the cap bites — the toolbar cap message is the
  honest disclosure (deliberately documented instead of a dedicated
  capped-hover test).
- **Scope notes:** all code writes stay inside `views/graph/`;
  `docs/work/graph-view/plan.md` carries in-session amendments (two
  stage-2 entries: capture-scoped interaction state idiom + lineage-trace
  disposition; the drafted Task 3.1 block was added and removed again) —
  the plan must NOT be staged with this task, it commits separately;
  Packages' `selectedParticipant` shares the latent staleness class the
  reset fix addresses here — recorded as a stage-2 audit, deliberately not
  touched in this task.
- **Read next:** the consumer-filter block + consume-edge loop in
  `graph-model.ts` — the OR rule and the selection-independent
  `droppedRelationIds` split are the honesty-critical surfaces; the
  `linkedSignal` declarations + derivation chain (`adjacency` → `traced`
  → `hoveredBundleEdges`) in `graph.ts` — the reset-per-capture contract
  and the no-per-hover-derivation claim; the cross-capture reset test in
  `graph.spec.ts` — it encodes the review finding's exact scenario.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/graph/*.spec.ts' --watch=false`
  — 2 files / 53 tests green on the final state (34 builder incl. the
  `graphAdjacencyOf` describe, 19 DOM). The 13 Task-3 pins written before
  the review round passed on their first run (probe-then-pin); the reset
  regression joined during the review round.
- `npm test` — full suite green on the final state: 37 UI files / 495
  tests, 3 bridge / 77, 6 collector / 75, 4 guards / 50 (697 total; +14
  vs. Task 2).
- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/remotes/*.spec.ts' --watch=false`
  — 55 tests green with unmodified spec files.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit`
  — no diagnostics; `prettier --check` clean on all `views/graph/` files;
  `git diff --check` clean. (plan.md is prettier-warn — docs are
  deliberately outside the format gate, T1 precedent.)
- Ground-truth probe (temporary spec, deleted): clean-skip = one
  mfe2-sourced copy consumed by mfe1+mfe2 (borrower mfe1, host consumes
  nothing — the dim witness), frankenstein = one consumer per copy
  (host 12 / mermaid 1 / whiteboard 7), `@angular/core` carries 5 refs,
  mermaid+whiteboard union = 8 copies with zero bundle claims.
- Live round 1 (dev server :4201, headless Chromium via raw CDP —
  screenshots delivered in-session): frankenstein default (hint line),
  hover `@angular/core` (5 neutral bundle edges — host cluster is
  hue-free by rule — others dimmed, one consume edge lit),
  mermaid+whiteboard filter (`filtering by 2 remotes` + Clear, complete
  remote column, honestly empty chunk column), clean-skip borrower
  selected (stub + dotted borrowed edge stay, emitter unselected).
- Live round 2 (after the review fix): filter active → Refresh button →
  hint line restored, zero selected nodes, capture's full dependency set —
  the in-place reset works in the real browser. A final headless shot
  confirmed the host node renders without the accent border.

### Acceptance Coverage

- **T3-AC-01 — passed:** DOM "reveals the hovered dependency bundle edges
  and dims the untraced rest" (5 overlay paths, host lit,
  mermaid/whiteboard + 19 deps + 4 chunks dimmed, 1 of 20 edge groups
  lit, leave restores) + builder adjacency describe; live hover
  screenshot.
- **T3-AC-02 — passed:** builder "keeps clean-skip chunk evidence when
  only the borrowing consumer is selected" + DOM "keeps the borrowed copy
  and its chunks when only the borrower is selected" (cluster labels
  `mfe2 (1)` / `mfe2 · browser-shared (1)` pinned with mfe1 selected —
  the DOM-pinned chunk-attribution rule).
- **T3-AC-03 — passed:** builder co-declared OR pin + frankenstein union
  pin (8 copies, complete remote column) and DOM multi-select + Clear
  restore test; remote column pinned complete in every filter state.
- **T3-AC-04 — passed:** DOM toolbar state switch (hint ↔
  `filtering by 1 remote` + Clear) and seeded cap test
  (`99 additional bundle links hidden to keep the graph responsive.`,
  absent on uncapped fixtures).
- **T3-AC-05 — passed (contributes XC-03):** DOM multiset invariance
  (node labels + consume-edge `d` multisets identical before/during/after
  hover, overlay gone after leave); hover is structurally incapable of
  rebuilding the vm (not a builder input). Vocabulary sweep covers the
  toolbar texts via the existing fixture loop.

### Open Issues

- Packages' `selectedParticipant` shares the capture-referencing staleness
  class fixed here — stage-2 audit + `captureScopedState` idiom recorded
  in the plan preamble (→ stage-2).
- Directed lineage trace disposition recorded as stage-2 note (drafted
  Task 3.1, removed before implementation — revisit after real usage).
- A11y remains the recorded stage-2 follow-up (generic `role="img"`;
  keyboard focus path explicitly deferred by the task block).
- Dev server may still be running on :4201 (outside the sandbox) — useful
  for the demo today, kill manually afterwards.

### Context for Next Task

- **Task 4 is independent** (nav-only: hide the Diagnostics tab) and
  touches `app.html`/`app.routes.ts`/`app.spec.ts`, not `views/graph/`.
  Graph nav pin context: `app.spec.ts` asserts the tab list including
  `Graph (preview)` and renders `/graph` in the per-route h1 loop.
- **Graph interaction surface (for any later graph task):** view state is
  exactly `selectedRemotes: linkedSignal<ReadonlySet<string>>` +
  `hovered: linkedSignal<string | null>` (render key), both resetting per
  capture via `store.model` as source — new capture-referencing writable
  state must follow this idiom (or the planned `captureScopedState`
  helper). Derivation chain: `vm` (builder, selection input) →
  `adjacency` (per model) → `traced`/`hoveredBundleEdges` (per hover).
  `nodeKeyOf(kind, id)` is the shared key rule — never build
  `<kind>:<id>` strings by hand.
- **Builder contract:** `GraphBuildOptions.selectedRemotes` filters copies
  (OR over consumers), never remotes, never `droppedRelationIds`/
  completeness; `BundleEdgeRef.colorIndex` carries the source cluster hue
  (null = neutral, host/buckets forced neutral upstream).
- **Plan hygiene:** `/commit 3` must stage the eight `views/graph/` files
  plus this log and must NOT stage `docs/work/graph-view/plan.md` — the
  plan amendment (stage-2 additions; 3.1 add+remove nets out to the two
  new stage-2 entries) commits separately as its own `plan:` commit
  before `/start-task 4`.
- **Gotchas:** jsdom `mouseenter`/`mouseleave` don't bubble — dispatch
  directly on the bound `g` element; `createViewFixture` returns
  `{ fixture, el }` for interaction tests (old `createView` unchanged);
  the seeded cap DOM test renders 4100 chunk nodes and stays fast —
  don't shrink it prophylactically; the dev-server watcher can serve a
  stale error overlay after rapid multi-file edits (touch a file to force
  a rebuild) — vitest/tsc are the source of truth.

### Git State

`git diff --stat`

```text
 docs/work/graph-view/plan.md                       |   2 +-
 .../src/app/views/graph/graph-element-factories.ts |  10 +-
 .../src/app/views/graph/graph-model.spec.ts        | 166 ++++++++++++++-
 .../devtools-ui/src/app/views/graph/graph-model.ts |  78 ++++++-
 .../devtools-ui/src/app/views/graph/graph-types.ts |  16 ++
 projects/devtools-ui/src/app/views/graph/graph.css |  80 ++++++-
 .../devtools-ui/src/app/views/graph/graph.html     |  54 ++++-
 .../devtools-ui/src/app/views/graph/graph.spec.ts  | 237 ++++++++++++++++++++-
 projects/devtools-ui/src/app/views/graph/graph.ts  |  95 ++++++++-
 9 files changed, 711 insertions(+), 27 deletions(-)
```

`git status --short`

```text
 M docs/work/graph-view/plan.md
 M projects/devtools-ui/src/app/views/graph/graph-element-factories.ts
 M projects/devtools-ui/src/app/views/graph/graph-model.spec.ts
 M projects/devtools-ui/src/app/views/graph/graph-model.ts
 M projects/devtools-ui/src/app/views/graph/graph-types.ts
 M projects/devtools-ui/src/app/views/graph/graph.css
 M projects/devtools-ui/src/app/views/graph/graph.html
 M projects/devtools-ui/src/app/views/graph/graph.spec.ts
 M projects/devtools-ui/src/app/views/graph/graph.ts
```

### Sessions

- claude-code 10ad8dbb-8aa3-4f50-bb7d-40ea7092ff6e (2026-08-25) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-native-federation-devtools/10ad8dbb-8aa3-4f50-bb7d-40ea7092ff6e.jsonl
