### Task

Walking skeleton of the Graph view: pure `buildGraphModel` builder over the
canonical resolution projection (two flat columns Remotes/Dependencies, one
consume edge per `ConsumerCopyRelation`, all geometry in the model), a
primitives-only SVG component under `views/graph/`, route + nav tab
`Graph (preview)`, honest empty states, and the resolution-honest wording
contract pinned as rendered-text assertions.

### Status

DONE

All six T1 acceptance criteria are covered by green focused and
repository-wide tests, plus a live screenshot round through the `?fixture=`
picker across the four AC fixtures and the empty state. An external (Codex)
review was triaged in-session: both findings substantiated and fixed
(kind-qualified node identity with a collision regression, dropped-relation
surfacing) with seed-backed pins. A user-reported tooltip usability issue
(1.5px hover target) was fixed with an invisible wide edge hit-path.

### Files Modified

- `projects/devtools-ui/src/app/views/graph/graph-model.ts` (new) — pure
  builder `(projection, options) → GraphModel`: node derivation (host-first
  remotes, label-fallback-chain dependencies with `resolvedTag` sub-label and
  isolated metadata for `scope-registration`/`private-registration`), one
  edge per relation (solid iff every mapping state is `own-selected` —
  vacuously solid for claim-less relations — else dotted with the distinct
  states verbatim as tooltip), fixed-column geometry from the plan constants
  (`NODE_W 280`, `NODE_H 26`, `NODE_VGAP 6`, `COL_GAP 150`, `MARGIN 24`,
  `HEADER_H 30`, `LABEL_MAX 36`), Bézier path formula, canvas size, `empty`
  flag. Review round: kind-qualified `GraphNode.key`
  (`remote:<id>` / `dependency:<id>`), kind-separated
  `remoteNodeByName`/`dependencyNodeById` edge lookups, and
  `GraphModel.droppedRelationIds` surfacing undrawable relations as data.
  Options parameter reserved (empty) for later tasks.
- `projects/devtools-ui/src/app/views/graph/graph-model.spec.ts` (new) — 15
  DOM-free pins: determinism (double ingest deep-equal), co-declared-share /
  frankenstein-live / pooling-anchor / scoped fixture semantics, disposition→
  isolated mapping, label fallback chain, truncation 35+`…` with full-text
  tooltip, vacuously solid claim-less relation, mixed-state tooltip, exact
  geometry + edge-path pin, empty flag, remotes-without-copies case; review
  regressions: remote-name==copy-ID collision (distinct keys, edge anchors at
  the remote) and ghost-consumer relation (reported via
  `droppedRelationIds`, empty on fixtures).
- `projects/devtools-ui/src/app/views/graph/graph.ts` (new) — `GraphView`
  component (OnPush, templateUrl/styleUrl): injects `FederationStore`,
  `computed` vm with null guard, delegates everything to the builder.
- `projects/devtools-ui/src/app/views/graph/graph.html` (new) — SVG renderer
  drawing precomputed primitives only: column headers, edge groups
  (`g.graph-edge-group` with group-level `<title>` tooltip, invisible wide
  hit-path plus visible 1.5px path with `dotted` class), node groups (rect +
  label + right-aligned sub-label + optional `<title>`), tracked by the
  kind-qualified `node.key` / relation IDs; empty states `Nothing to graph.`
  / `no captured snapshot to render`.
- `projects/devtools-ui/src/app/views/graph/graph.css` (new) — node/edge/
  header styles on the shared `--nf-*` tokens; `host` accent stroke,
  `isolated` dashed stroke, dotted edge dasharray, mono font for dependency
  labels; `graph-edge-hit` (transparent 12px stroke, `pointer-events:
  stroke`) as the edge hover corridor.
- `projects/devtools-ui/src/app/views/graph/graph.spec.ts` (new) — 6 DOM
  tests: T1-AC-01 co-declared-share (1 dependency node, solid + dotted edge,
  `not-selected` tooltip, sub-label, hit-path geometry pin), T1-AC-02
  frankenstein-live one-to-one against its projection, T1-AC-03
  pooling-anchor `anchored` dotted + scoped isolated classes, T1-AC-05
  forbidden-vocabulary sweep over five fixtures (textContent + title/
  aria-label attributes), T1-AC-06 both empty states.
- `projects/devtools-ui/src/app/app.routes.ts` (modified) — `graph` route
  between `import-map` and `diagnostics`.
- `projects/devtools-ui/src/app/app.html` (modified) — nav tab
  `Graph (preview)` in the same position.
- `projects/devtools-ui/src/app/app.spec.ts` (modified) — nav-label pin
  extended; `/graph` added to the per-route h1 render loop.

### Files Read (Context Only)

- `docs/work/graph-view/plan.md` — preamble and Task 1 block only (task
  isolation).
- `docs/work/resolution-model/task-log/` — `task-6-publish-canonical-projection.md`
  (projection surface, relation semantics), `task-5-materialize-resolved-copies.md`
  (copy contract fields behind the label rule), `task-7.5-packages-presentation-redesign.md`
  (view-model boundary doctrine, view conventions, vitest idioms).
- `docs/resolution-data-model.md` — big picture, view-model boundary, view 5
  (source of the claim-less-relation edge case; read on user hint).
- `projects/devtools-ui/src/app/shared/store/resolution/` —
  `projection-model.ts`, `copies-model.ts`, `claims-model.ts`, `model.ts`
  (type shapes), `index.ts` (barrel surface).
- `projects/devtools-ui/src/app/shared/store/federation-store.ts` — store
  façade (`model()` null contract).
- `projects/devtools-ui/src/app/views/packages/packages.ts` / `.html` /
  `.spec.ts`, `views/remotes/remotes.html`, `views/import-map/import-map.html`
  — component pattern, fixture-driven spec harness, empty-state wording.
- `projects/devtools-ui/src/app/shell/fixture-picker.ts`,
  `projects/devtools-bridge/src/lib/fixtures/index.ts` — `?fixture=` URL
  shape and fixture registry.

### Key Decisions

- The builder consumes only `CanonicalResolutionProjection`
  (`store.model().resolutionProjection`) and derives no domain facts — it
  pivots and lays out per the documented view-model boundary. The `options`
  parameter exists per plan signature but is deliberately empty.
- Claim-less relations (empty `mappingStates`, legitimate per model doc
  view 5) render **solid without tooltip**: the all-`own-selected` rule is
  vacuously true and no deviation evidence exists to qualify. Pinned
  explicitly in `graph-model.spec.ts` so the decision is documented.
- Sorting uses locale-independent codepoint comparison (not
  `localeCompare`) — determinism over collation; dependency order is full
  label, then `copyId` tiebreak (pinned via pooling-anchor's equal labels).
- All text geometry (label baselines, right-aligned sub-label anchors,
  header baselines) lives in the model so the template stays strictly
  primitives-only; only visual styling (colors, dasharray, fonts) is CSS.
- Ground truth first (Task-7 method): a temporary probe spec dumped
  projections and models for six fixtures before any pin was written
  (vitest swallows console output in run mode — the probe reported via a
  deliberate throw); all pins passed on their first run. Probe deleted.
- Nav placement between Import Map and Diagnostics — Task 4 removes the
  Diagnostics tab, leaving Graph last.
- Empty-state wording reuses the panel conventions verbatim: vm-null →
  `no captured snapshot to render` (same as Remotes), empty model →
  `Nothing to graph.` (task wording).

— session 2026-08-24 (Codex review + tooltip hit-path round)

- Review finding "shared node.id namespace" (MEDIUM) ACCEPTED: remote names
  are arbitrary capture strings and may textually equal a copy ID; fixed via
  kind-separated lookup maps plus the `key` render identity —
  `GraphNode.id` stays the canonical ID per T1-AC-02, `key` exists only for
  uniqueness across kinds. Pinned with a synthetic collision seed.
- Review finding "silent endpoint skip" (LOW) ACCEPTED in the surfacing
  variant, assert variant REJECTED: task-6 documents that a resolution
  consumer can be absent from the remotes repo (declaration evidence vs.
  remotes repository do not fully overlap), so an upstream-invariant
  assertion would throw on honest captures. Dropped relations are now data
  (`droppedRelationIds`), pinned synthetic (reported) and on fixtures
  (empty); UI surface added to the plan as a Task-2 footer amendment.
- User-reported tooltip usability ACCEPTED: native SVG tooltips existed and
  were namespace-correct (verified via a temporary DOM probe) but were
  practically untriggerable — frankenstein has zero dotted edges (all
  `own-selected`, tooltip-less by deviation-first design) and the 1.5px
  stroke was the only hit target. Fixed with a per-edge group carrying the
  tooltip plus an invisible 12px hit-path; discoverability (legend/hint
  line) deliberately stays with Task 3's toolbar per plan.
- Review blind spots dispositioned: a11y beyond `role="img"` → stage-2
  follow-up (keyboard-focus catalog); task-log/plan Markdown not
  Prettier-clean → docs are deliberately outside the format gate, no action.
- Plan amendments written in-session (committed separately, not with this
  task): Task-2 first move = `GraphNode` discriminated-union refactor
  (base + remote/dependency, chunk joins as third member; template
  `@switch`); Task-2 divergence footer additionally surfaces
  `droppedRelationIds` with T2-AC-07 extended accordingly.

### Review Focus

- **Behavior claims:** every rendered identity chains to a canonical ID —
  one remote node per projection remote (host first), one dependency node
  per copy, exactly one edge per drawable `ConsumerCopyRelation` with
  undrawable ones surfaced in `droppedRelationIds` (never silently
  dropped, never synthesized); an edge is solid iff every mapping state is
  `own-selected` (vacuously for claim-less relations) and otherwise dotted
  with the distinct states verbatim; render keys are kind-qualified, so a
  remote named like a copy ID cannot merge, corrupt an edge, or duplicate
  track keys; the forbidden delivery vocabulary cannot appear in the
  rendered DOM (swept across five fixtures).
- **Assumptions / choices:** vacuous-solid for claim-less relations;
  dropped-relation surfacing instead of an upstream assert (rejected with
  rationale); codepoint ordering instead of locale collation; the label/tag
  overlap at near-LABEL_MAX labels is accepted as a consequence of the
  adopted constants (see Open Issues).
- **Scope notes:** `app.spec.ts` nav/route pins extended (T8-AC-01 pins now
  include the fifth tab); `docs/work/graph-view/plan.md` carries two
  in-session Task-2 amendments (union refactor, dropped-relations footer)
  that are deliberately NOT part of the Task-1 commit; no store, ingest, or
  projection change anywhere.
- **Read next:** the edge-derivation loop and kind-separated lookups in
  `buildGraphModel` (`graph-model.ts`) — collision safety and
  `droppedRelationIds` contract; the two review-regression tests in
  `graph-model.spec.ts` — they pin exactly the review findings; the edge
  group in `graph.html` + `.graph-edge-hit` in `graph.css` — tooltip
  hit-path mechanics.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/graph/*.spec.ts' --include 'projects/devtools-ui/src/app/app.spec.ts' --watch=false`
  — passed on an intermediate state: 3 files / 30 tests (13 builder, 6 DOM,
  11 app shell incl. the extended nav/route pins).
- `npm test` — passed: 37 UI files / 460 tests, 3 Bridge files / 77 tests,
  6 collector files / 75 tests, 4 guard files / 50 tests (662 total). Only
  the existing odd-numbered Node 25 non-LTS warning.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit`
  — passed with no diagnostics.
- `./node_modules/.bin/prettier --check` — passed on all new `views/graph/`
  files and the three modified app files; `git diff --check` — passed.
- Ground-truth probe (temporary spec, deleted): dumped remotes / copies /
  relations / model for co-declared-share, pooling-anchor, scoped,
  frankenstein-live, synthetic-empty-page, synthetic-multi-version; every
  subsequent pin matched on first run.
- Live screenshot round (dev server on :4200 started outside the sandbox,
  shared webmcp-Chromium via chrome-devtools MCP): co-declared-share
  (host-first, mfe1 solid, mfe2 dotted, sub-label `1.0.0`), pooling-anchor
  (2 solid / 3 dotted incl. both `anchored`), scoped (both private copies
  dashed), frankenstein-live (23 nodes / 20 edges), synthetic-empty-page
  (`Nothing to graph.`). Session note: the webmcp profile was held by a
  stale Chromium from 2026-08-20 (dead Codex sandbox proxy); terminated via
  SIGTERM per the chromium-webmcp conflict procedure before the round.

— session 2026-08-24 (Codex review + tooltip hit-path round)

- Focused suite after the review fixes and the hit-path fix: 3 files / 32
  tests passed (15 builder incl. the two new regressions; DOM suite gained
  the hit-path geometry pin).
- `npm test` re-run on the final code state: 664 total (462 UI / 77 Bridge /
  75 collector / 50 guards), all passed.
- `tsc --noEmit`, Prettier (`views/graph/`), `git diff --check` — passed on
  the final state.
- Tooltip namespace probe (temporary spec, deleted): rendered `<title>`
  elements verified in the SVG namespace with correct parents — the
  usability issue was hit-target size and tooltip sparsity, not a rendering
  bug; frankenstein-live has 0 dotted edges and exactly 2 truncated-label
  node tooltips by design.

### Acceptance Coverage

- **T1-AC-01 — passed:** builder test "renders co-declared-share as one copy
  with a solid and a dotted consume edge" + DOM test "renders
  co-declared-share with one copy, a solid and a dotted edge"
  (`not-selected` tooltip, sub-label `1.0.0`).
- **T1-AC-02 — passed:** `app.spec.ts` nav pin shows `Graph (preview)`;
  builder + DOM tests "maps frankenstein-live one-to-one onto canonical
  identities" / "renders frankenstein-live one-to-one against its
  projection" (host first, node-per-remote, node-per-copy, canonical
  remote-name/`copyId`/relation-ID identities). Contributes: XC-01, XC-04.
- **T1-AC-03 — passed:** pooling-anchor `anchored` relations dotted with
  `anchored` listed (builder + DOM); scoped private copies isolated/dashed
  (builder + DOM); synthetic disposition matrix pins solid for every other
  disposition.
- **T1-AC-04 — passed:** determinism via two independent ingests deep-equal
  (co-declared-share and frankenstein-live); truncation test pins 35+`…`
  with full text as tooltip and null tooltip below the limit.
  Contributes: XC-03.
- **T1-AC-05 — passed:** DOM sweep "keeps delivery-claiming vocabulary out
  of the rendered graph" over five fixtures (textContent plus title/
  aria-label attributes) against
  `loaded|downloaded|fetched|executed|wire cost|byte size|cache hit`.
  Contributes: XC-02.
- **T1-AC-06 — passed:** DOM test "renders the two empty states honestly" —
  synthetic-empty-page renders `Nothing to graph.` without an SVG; a
  rejected capture renders the panel's existing
  `no captured snapshot to render`.

### Open Issues

- Cosmetic: labels near the 36-char limit overlap the right-aligned tag
  sub-label inside the 280px node (seen live on frankenstein's
  `@angular/core/event-dispatch-contract`). Inherent to the adopted
  constants (NODE_W 280 / LABEL_MAX 36, mono ≈ 260px); no AC violation.
  Recheck during Task 2's dependency-column restyle (→ Task 2).
- `droppedRelationIds` has no UI surface yet — the divergence footer
  renders it per the in-session plan amendment (→ Task 2).
- Tooltip discoverability: tooltips are deviation-first-sparse and native
  (~1s delay); the planned toolbar hint line and hover trace make hovering
  a first-class interaction (→ Task 3). Revisit a visible state label on
  dotted edges only if the demo rehearsal still reads as hidden.
- A11y: the SVG exposes only a generic `role="img"` label; semantic access
  to individual nodes/edge states is a recorded stage-2 follow-up.
- The dev server from the review rounds may still be running on :4200
  (background, outside the sandbox) — kill manually when done reviewing.

### Context for Next Task

- Builder surface: `buildGraphModel(projection, options?) → GraphModel` in
  `views/graph/graph-model.ts`; exported constants `NODE_W/NODE_H/NODE_VGAP/
  COL_GAP/MARGIN/HEADER_H/LABEL_MAX`. `GraphModel = { columns, nodes, edges,
  droppedRelationIds, width, height, empty }`; `GraphColumn.key` is
  `'remotes' | 'dependencies'`.
- Task 2's plan-mandated first move: refactor `GraphNode` into a
  discriminated union on `kind` (shared `GraphNodeBase` + `RemoteGraphNode
  { isHost }` + `DependencyGraphNode { subLabel, isolated, subLabelX/Y }`)
  BEFORE adding the chunk kind; template switches on `kind`; the
  one-component preamble constraint stays.
- `GraphNode.key` (`<kind>:<id>`) is the render/track identity; `id` stays
  the canonical ID. Every new node kind must follow this pattern — bare IDs
  are not unique across kinds (remote names are arbitrary capture strings).
- Edge rule to preserve: solid iff all states `own-selected` (vacuously for
  empty `mappingStates`); tooltip lists distinct states verbatim; never
  invent an edge or node beyond the projection collections; undrawable
  relations go to `droppedRelationIds` (Task-2 footer renders them, see
  amended T2-AC-07).
- Edges render as `g.graph-edge-group` (group-level tooltip + invisible
  12px `graph-edge-hit` + visible path) — keep the hit-path when Task 3
  adds hover handling; it is the hover corridor.
- Gotchas: vitest (not jasmine) — `expect.objectContaining`; Prettier must
  run before the check gate; codepoint sort everywhere; the probe-then-pin
  method works — probe output via deliberate throw, since vitest hides
  console.log and the browser bundle has no `node:fs`.
- Live-review workflow: `ng serve` must run outside the sandbox (own network
  namespace); Chromium auto-launches via chrome-devtools MCP tools; URL
  shape `http://localhost:4200/?fixture=<id>#/graph`. If "browser already
  running" appears, follow the chromium-webmcp skill conflict procedure
  (bypass-pgrep; note the profile path itself contains
  `chrome-devtools-mcp`, so don't filter it away when grepping) — and if a
  live Chromium holds the profile while the user is browsing, do not kill
  it; diagnose in the vitest DOM harness instead.
- `docs/work/graph-view/plan.md` carries two uncommitted Task-2 amendments
  (union refactor, dropped-relations footer) — commit them separately as
  `plan: task-2 amendments (node union, dropped-relations footer)` after
  `/commit 1`.
- `/commit 1` must stage the six new `views/graph/` files, the three
  modified app files (`app.routes.ts`, `app.html`, `app.spec.ts`), and this
  log — and must NOT stage `docs/work/graph-view/plan.md`.

### Git State

`git diff --stat`

```text
 docs/work/graph-view/plan.md               | 20 +++++++++++++++++++-
 projects/devtools-ui/src/app/app.html      |  1 +
 projects/devtools-ui/src/app/app.routes.ts |  2 ++
 projects/devtools-ui/src/app/app.spec.ts   | 11 ++++++-----
 4 files changed, 28 insertions(+), 6 deletions(-)
```

`git status --short`

```text
 M docs/work/graph-view/plan.md
 M projects/devtools-ui/src/app/app.html
 M projects/devtools-ui/src/app/app.routes.ts
 M projects/devtools-ui/src/app/app.spec.ts
?? docs/work/graph-view/task-log/
?? projects/devtools-ui/src/app/views/graph/
```

### Sessions

- claude-code 2a26bdfb-2881-4447-b543-81b4bddfd9a1 (2026-08-24) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-native-federation-devtools/2a26bdfb-2881-4447-b543-81b4bddfd9a1.jsonl
