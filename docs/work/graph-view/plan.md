# Native Federation DevTools — Graph View Plan

Spec: docs/specs/native-federation-graph-view.md
Branch scope: graph-view (from feature/graph-view, branched off main)
Demo deadline: online conference 2026-08-25 18:00 (~20 min) — Tasks 1–3 are the demo POC path; Task 4 is independent demo cosmetics.

Hard constraints for every task: the graph consumes only `CanonicalResolutionProjection` (never `SnapshotV1`, raw repositories, ingest, resolution algorithms, or `sharedRows`); it derives no new domain facts; every rendered identity is a canonical ID; wording is resolution-honest (declared, mapped, resolves to, selected, not selected, skipped own, anchored, available for loading) and never delivery-claiming (forbidden: loaded, downloaded, fetched, wire cost, byte size, cache hit, executed). No external graph/layout library and no new `projects/` library: pure modules plus one component under `views/graph/`; shared kit pieces are consumed, not preemptively extended. Components keep templateUrl/styleUrl with separate .html/.css files.

The plan is a vertical slice on purpose: Task 1 is a walking skeleton visible in the panel via the `?fixture=` picker, and every later task deepens semantics in a screenshot-reviewable way (the established 7.5/8.6/9.5 review mode of the resolution-model scope).

Stage-2 follow-ups (deliberately NOT in this plan; append as new tasks after the demo): group-by toggle (bundle / share scope axes), layer toggles (Shared/Scoped/Chunks), inspect cards, keyboard focus path, participant color dots in the remote column, panel widening; expose nodes in the graph (expose-join evidence: qualified name + map target, NO chunk edges — the capture carries no chunk↔expose evidence); `mapping-or-exposed` chunk registry key: source-verify the orchestrator write path first, then witness it (lab-app capture preferred, synthetic fixture as fallback) and pin the generic display paths (Import Map chunk-wiring join, Remotes unclaimed fallback) — Graph/Packages stay out per spec §9 rule 7 unless the spec is deliberately amended; kit hygiene: consolidate the participant-hue class ladders (chip `.dot-N`, graph `.hue-N` rect/label) into one global indirection ladder in styles.css (`.nf-hue-N` sets a generic `--nf-participant-color`; consumers bind their own property) — touches the T7.7 token-level jsdom pins, so it needs its own careful task; capture-scoped interaction state: name the `linkedSignal`-on-`store.model` reset idiom as a shared helper (e.g. `captureScopedState` in `shared/store`) and audit every view's writable interaction state for capture-referencing values — Packages' `selectedParticipant` carries the same latent staleness the graph's T3 review round fixed (writable state holding names owned by a replaceable capture needs a declared lifetime; enum-valued preferences like the Packages `conflicts` filter deliberately survive); directed lineage hover trace (drafted as task 3.1, removed before implementation — revisit only after real usage shows the need): the shipped 1-hop trace marks exactly the hovered node's own evidence records, which is a principled boundary; if ever extended, only the chunk→consumer direction earns it (consumers of a borrowed copy are not statically readable anywhere, and the reach is small), while remote→chunks is statically attributed via the `emitter · bundle` cluster labels and is the clutter-prone direction — and hovering the dependency one row over already tells the full story from direct evidence.

> The executing agent may adjust scope and ordering based on more
> up-to-date context discovered during implementation, as long as
> each task still satisfies the sizing rules above.
>
> When a task is finished (DONE or BLOCKED), close it with the
> `/wrap-up N` → `/commit N` pair. `/wrap-up N` writes or extends
> `docs/work/<scope>/task-log/task-{N}-{slug}.md`, where `<scope>`
> is derived from the current git branch, and is safe to run multiple
> times across sessions — it merges. `/commit N` reads that log,
> stages code + summary, and commits them together after showing
> the plan and waiting for confirmation. Optionally run `/review`
> (quick per-task, full before a PR) between wrap-up and commit;
> a second `/wrap-up N` can absorb the review findings.

## Task 1: Walking skeleton — Graph tab renders remotes, copies, and consume edges

### Instructions

- Create pure builder modules under
  `projects/devtools-ui/src/app/views/graph/` (suggested split:
  `graph-model.ts` semantics + layout; final file split at the
  implementer's discretion). The builder is a pure function
  `(projection, options) → GraphModel` with all geometry inside;
  the renderer draws primitives only. Deterministic: identical
  inputs produce a deeply equal model.
- Node derivation:
  - one `remote` node per `projection.remotes[]` (label = name;
    `isHost` marks the host);
  - one `dependency` node per `projection.copies[]`, identity =
    `copyId`. Label rule: `sourcePackage` when non-null, else the
    alphabetically first `consumerRegistryPackage` of
    `resolutionContexts`, else the target URL of the first
    entrypoint. Right-aligned sub-label = `resolvedTag` when
    non-null. Dashed-border metadata when `sourceDisposition` is
    `scope-registration` or `private-registration` (isolated/private
    copy); every other disposition renders solid.
  - No chunk nodes, clusters, or filters in this task; render only
    the two populated columns (`Remotes`, `Dependencies`) — the
    chunk column arrives with Task 2.
- Consume edges: exactly one edge per `ConsumerCopyRelation`
  (`consumerRemote → copyId`). Solid when every entry of
  `mappingStates` is `own-selected`; dotted otherwise, with a
  tooltip listing the distinct states verbatim (`fallback`,
  `not-selected`, `anchored`, `self-filled`). Blocked, unknown, and
  unmapped resolutions have no copy and therefore no edge — never
  invent one.
- Layout: fixed columns at
  `x = MARGIN + columnIndex × (NODE_W + COL_GAP)` with constants
  `NODE_W 280`, `NODE_H 26`, `NODE_VGAP 6`, `COL_GAP 150`,
  `MARGIN 24`, `HEADER_H 30`, `LABEL_MAX 36`. Remote column flat,
  host first, then alphabetical. Dependency column flat, sorted by
  label then `copyId`. Labels longer than `LABEL_MAX` truncate to 35
  chars + `…` with the full text as native tooltip. Edge endpoints:
  right-mid of source → left-mid of target; SVG cubic Bézier
  `M x1,y1 C (x1+dx),y1 (x2-dx),y2 x2,y2` with
  `dx = max(24, (x2-x1)/2)`. Canvas width/height computed from
  content; `empty` flag when no nodes exist.
- Component `views/graph/graph.{ts,html,css}` (templateUrl/styleUrl,
  separate files), template VM-only with canonical-ID render
  tracking. Register route + nav tab labeled `Graph (preview)`
  following the existing view registration conventions.
- Empty states: a missing snapshot reuses the panel's existing empty
  handling; a projection with no nodes renders "Nothing to graph."
- Wording contract from the start: resolution-honest vocabulary
  only; the forbidden delivery terms must not appear in any graph UI
  string (pin with a rendered-text assertion).

### Acceptance

- **T1-AC-01** — `co-declared-share` renders one dependency node
  with two consume edges: mfe1 solid, mfe2 dotted with
  `not-selected` among its tooltip states; the node carries the
  resolved tag as sub-label.
- **T1-AC-02** — `frankenstein-live`: the nav shows
  `Graph (preview)`; the view renders one remote node per projection
  remote (host first) and one dependency node per projection copy;
  rendered identities are canonical IDs (remote name, `copyId`,
  relation ID). **Contributes:** XC-01, XC-04.
- **T1-AC-03** — `pooling-anchor` renders its anchored relation
  dotted with `anchored` listed; `scoped` renders its private copies
  with the dashed/isolated metadata.
- **T1-AC-04** — builder determinism: identical projection + options
  produce a deeply equal model (DOM-free spec); labels above 36
  chars truncate with `…` and keep the full text as tooltip.
  **Contributes:** XC-03.
- **T1-AC-05** — forbidden delivery vocabulary is absent from the
  rendered graph DOM across fixtures (rendered-text pin).
  **Contributes:** XC-02.
- **T1-AC-06** — a capture producing no nodes renders "Nothing to
  graph"; a missing snapshot reuses the existing panel empty state.

### Key Locations

- new `projects/devtools-ui/src/app/views/graph/` — `graph-model.ts`
  + spec, `graph.{ts,html,css}` + spec
- `projects/devtools-ui/src/app/app.routes.ts`, shell nav,
  `app.spec.ts`
- read-only: `shared/store/resolution/projection-model.ts`,
  `copies-model.ts`, `claims-model.ts`

### Key Discoveries

- The projection surface is complete for the graph: remotes /
  copies / consumerRelations / chunkGroups / bundleClaims /
  completeness — the graph reads nothing else and derives no new
  domain facts.
- `ConsumerCopyRelation` is keyed `(consumerRemote, copyId)` and
  carries `mappingStates: ClaimMappingState[]`; several specifier
  paths never collapse — the edge aggregates, the tooltip names all
  states.
- A copy proves map resolution, not delivery — edge and tooltip
  wording never claims loading.
- The external challenger's layout/interaction design (three
  columns, Bézier edges, geometry constants) is adopted; its
  semantics (raw-cache resolver, `remotes[0]` provider, delivery
  language) are rejected — the spec records the full verdict.

## Task 1.9: Copy source carries its evidenced remote

**Dependency:** none within this scope (store-side amendment,
2026-08-24; ordered before Task 2, which consumes the
projection-pure helpers). This task writes no graph code — the
preamble's graph shape rules are not exercised here.

### Instructions

- Motivation (session finding): the copy-source attribution all
  views share (`copySourceRemote`/`copySourceDisplay`/
  `copySourceVmOf` in `shared/view-conventions.ts`) is
  projection-pure EXCEPT for one join — resolving the source
  record ID to its remote name through `CanonicalIndexes`
  (registryEvidence). Embedding that one evidenced fact into the
  copy makes the whole attribution ladder readable from
  `CanonicalResolutionProjection` alone — the purity the graph
  preamble promises. The IDs stay: they remain the canonical
  identity/link anchors; only the name rides along.
- Widen the `ResolvedCopySource` union
  (`shared/store/resolution/copies-model.ts`):
  `shared-declaration` gains `participant: string`,
  `private-registration` gains `ownerRemote: string`;
  `target-url` stays field-free — the absence of the name field IS
  the no-evidenced-source statement, no nullable field.
- `materializeResolvedCopies` copies the name verbatim from the
  record its ID references (the evidence is already indexed at
  this single construction site). No derivation, no fallback — a
  source record without its owner name cannot exist upstream.
- Simplify `copySourceRemote(copy)`, `copySourceDisplay(copy)`,
  and `copySourceVmOf(copy)` to pure copy reads — drop the
  `indexes` parameter — and update the mechanical call sites:
  `views/packages/packages-row-vm.ts`,
  `views/packages/packages-vm-shared.ts` (call + re-export),
  `views/packages/packages-detail-vm.ts`,
  `views/remotes/remotes-detail-vm.ts` (3 calls),
  `views/import-map/import-map-view-model.ts`. View behavior
  stays byte-identical.
- Update copy-shape pins for the widened union wherever a
  deep-equal touches `copy.source`
  (`materialize-resolved-copies.spec.ts`,
  `build-canonical-projection.spec.ts`, `ingest.spec.ts`, …).

### Acceptance

- **T1.9-AC-01** — materializer pins prove the embedded name
  equals the record the ID resolves to, for both enriched
  variants (shared-declaration `participant` and
  private-registration `ownerRemote` witnesses).
- **T1.9-AC-02** — `copySourceRemote`/`copySourceDisplay`/
  `copySourceVmOf` accept only the copy; no caller passes
  `CanonicalIndexes` for source attribution anymore.
- **T1.9-AC-03** — the Packages, Remotes, and Import Map spec
  suites pass unmodified (call-site mechanics only; behavior
  byte-identical). **Contributes:** XC-01.
- **T1.9-AC-04** — full repository suite green; the projection
  top-level shape pin is unchanged (the union widens inside
  `copies`, no new collection appears).

### Key Locations

- `shared/store/resolution/copies-model.ts`,
  `materialize-resolved-copies.ts` + spec
- `shared/view-conventions.ts` (helper simplification)
- mechanical call sites: `views/packages/packages-row-vm.ts`,
  `views/packages/packages-vm-shared.ts`,
  `views/packages/packages-detail-vm.ts`,
  `views/remotes/remotes-detail-vm.ts`,
  `views/import-map/import-map-view-model.ts`

### Key Discoveries

- The lift the original Task-2 wording still assumed pending
  already happened with the second consumer (T8): the helpers
  live in `shared/view-conventions.ts`, consumed by Packages,
  Remotes, and Import Map.
- `indexes` is used by the attribution helpers exclusively for
  the name lookup; every other input of the qualifier ladder
  (`sourceDisposition`, `effectiveRoles`,
  `observedTargetProviders`, `registryServingSlotClaims`) is
  already copy-embedded.
- `materializeResolvedCopies` already receives and indexes
  `CanonicalRegistryEvidence` — the name is available at the
  single construction site.

## Task 2: Source clustering, chunk column, and honest footer

**Dependency:** Tasks 1 and 1.9.

### Instructions

- First move (model refactor, before any new node kind): split
  `GraphNode` into a discriminated union on the existing `kind` —
  a shared `GraphNodeBase` (id, key, label, tooltip, geometry) plus
  `RemoteGraphNode { isHost }` and `DependencyGraphNode { subLabel,
  isolated, subLabelX/Y }` — so the new `chunk` kind joins as a
  third union member instead of widening a flat interface with
  forced defaults. The template switches on `kind` (`@switch`);
  the one-component constraint from the preamble stays — dedicated
  subcomponents only via a separate preamble amendment.
- Cluster the dependency column by the copy's evidenced source:
  - Consume the shared copy-source attribution
    (`copySourceRemote`/`copySourceVmOf` in
    `shared/view-conventions.ts`, projection-pure since Task 1.9)
    — re-use, not re-derivation; `views/remotes/` is not touched
    and its specs pass unmodified.
  - Cluster order: `(host)` first (via `RemoteProjection.isHost`),
    other source remotes alphabetical, then the honest buckets
    `ambiguous source`, `target only`, `unknown` pinned last —
    never collapsed into one `(unresolved)` bucket.
  - Cluster geometry: `CLUSTER_HEADER 22`, `CLUSTER_PAD 10`,
    `CLUSTER_VGAP 20`; the cluster box encloses its nodes; the
    label carries cluster name + node count.
- Chunk column (third column, title `Chunks`): one `chunk` node per
  `(chunkGroupId, file)` reachable through a copy's
  `bundleClaimIds → BundleClaim.chunkGroupIds →
  ChunkGroupProjection.files`; chunk clusters are always
  `emitter · bundle`; equal filenames from different emitters stay
  distinct nodes and never merge.
- Bundle-edge references (`dependency → chunk`) are computed into
  the model but rendered only for the hovered node (Task 3). Cap
  the reference count at consume-edge count + 4000
  (`MAX_BUNDLE_EDGES`); count overflow into `cappedEdges`.
- BundleClaim honesty: `mapped-source` claims list their files
  unqualified; `source-only` renders a qualified stub in the chunk
  column (bundle name + "source-only — no registered chunk list")
  without invented files; `ambiguous` keeps its qualifier visible.
- Divergence-only footer: render `projection.completeness.total`
  (unknown / unmapped / blocked / ambiguous) as one muted line
  linking to the Remotes view, only when any count is non-zero.
  The footer additionally surfaces the graph model's
  `droppedRelationIds` (Task-1 contract: relations whose consumer
  remote has no rendered node) as
  `N relation(s) not drawn — consumer not among the capture's
  remotes`, only when non-empty; wording stays resolution-honest
  and no node is invented for them.
- Cluster hues: assigned from the full unfiltered cluster set so
  they stay stable under later filtering; above the palette size
  every cluster renders neutral — no hue recycling (the T7.7
  honesty rule). The remote column stays neutral.

### Acceptance

- **T2-AC-01** — `frankenstein-live`: dependency clusters render
  `(host)` first with cluster boxes and counts; the chunk column
  renders the host's chunk groups under `emitter · bundle` heads —
  the three-column mock reading. **Contributes:** XC-04.
- **T2-AC-02** — `clean-skip`: the shared copy's chunks cluster
  under the emitting source remote; the borrowing consumer
  contributes no chunk nodes.
- **T2-AC-03** — a `source-only` bundle claim renders the qualified
  stub and no fabricated files; `ambiguous` claims keep their
  qualifier. **Contributes:** XC-02.
- **T2-AC-04** — ambiguous-source / target-only / unknown seeds
  cluster into their named honest buckets pinned last (seeded
  projection input; no `(unresolved)` collapse).
- **T2-AC-05** — Remotes specs pass unmodified; the graph
  consumes the shared attribution helper without touching
  `views/remotes/`. **Contributes:** XC-01.
- **T2-AC-06** — cluster hues are identical across renders of one
  capture; above the palette size all clusters render neutral (no
  recycling code path). **Contributes:** XC-03.
- **T2-AC-07** — the completeness footer renders only on divergence
  with the four counts; an all-zero capture renders no footer. A
  seeded projection with a consumer-less relation renders the
  dropped-relation line with its count; every corpus fixture
  renders none.

### Key Locations

- `views/graph/graph-model.ts` + spec, `graph.{ts,html,css}` + spec
- read-only: `shared/view-conventions.ts` (consume the
  projection-pure `copySourceVmOf`)
- read-only: `shared/store/resolution/bundle-claims-model.ts`

### Key Discoveries

- Chunk evidence follows the selected source path (`BundleClaim`),
  never every participant with a bundle — the chunk column derives
  exclusively from copies' claims, so pseudo/`mapping-or-exposed`
  groups are excluded structurally, not by filter.
- `ChunkGroupProjection` is already per `(emitterRemote, bundle)`.
- The T7.5 lift already happened with the second consumer (T8);
  Task 1.9 made the attribution projection-pure — the graph is a
  plain consumer, no lift remains.

## Task 3: Hover trace and click-to-filter

**Dependency:** Task 2.

### Instructions

- View state is exactly
  `{ selectedRemotes: Set<string>, hovered: string | null }`;
  everything else derives per change (derive, don't store).
- Hover = trace (transient): the hovered node plus
  undirected-adjacent nodes (adjacency from ALL edges including
  bundle references) stay at full opacity; other nodes dim to ~0.2;
  consume edges not touching the hovered node dim to ~0.07; bundle
  edges render only for the hovered node (opacity 0.75), colored by
  the source dependency's cluster. Leaving the graph area clears
  `hovered`. Hover never changes model contents — emphasis only.
- Clicking a remote node toggles it in `selectedRemotes`; selected
  remotes render with distinct fill + heavier stroke. Filter
  semantics: with a non-empty selection a dependency is kept when at
  least one of its consume relations names a selected remote (OR);
  consume edges from unselected remotes drop; the remote column
  always renders completely; **chunk attribution ignores the
  selection** — the emitter is not the consumer.
- Toolbar: with a selection `filtering by N remote(s)` + a Clear
  action; otherwise the hint line `click remotes to filter · hover
  to trace · dashed node = isolated copy · dotted edge = borrowed`.
  When `cappedEdges > 0` show `N additional bundle links hidden to
  keep the graph responsive.`
- Keyboard focus is a recorded stage-2 follow-up, not this task.

### Acceptance

- **T3-AC-01** — hovering a dependency node reveals exactly its
  bundle edges and keeps its consumer remotes + chunk nodes at full
  opacity while others dim; leaving restores everything.
- **T3-AC-02** — `clean-skip` with only the borrowing consumer
  selected keeps the shared copy (OR over consumers) **and its
  chunks stay rendered although the emitting source remote is
  unselected** (DOM-pinned chunk-attribution rule).
- **T3-AC-03** — multi-select is OR: two selected remotes keep the
  union of their copies; the remote column renders completely in
  every filter state; Clear restores the unfiltered view.
- **T3-AC-04** — toolbar states switch hint line ↔
  `filtering by N remote(s)`; the cap message appears only when
  `cappedEdges > 0`.
- **T3-AC-05** — hover changes emphasis only: the rendered
  node/edge multiset is identical before, during, and after hover.
  **Contributes:** XC-03.

### Key Locations

- `views/graph/graph.{ts,html,css}` + `graph.spec.ts`
- `views/graph/graph-model.ts` (selection input) + spec

### Key Discoveries

- Adjacency is undirected on purpose: hovering a dependency lights
  both its consuming remotes and its chunks.
- The chunk-attribution-under-selection rule is the highest-value
  regression case (adopted from the challenger's test priorities):
  filtering chunks on the provider would hide exactly the
  interesting borrowed-copy case.

## Task 4: Hide the Diagnostics tab

**Dependency:** none.

### Instructions

- Presentation-only: remove the Diagnostics entry from the panel
  nav; the placeholder route stays reachable by direct URL (deep
  links keep working; no redirect).
- Adjust existing app/shell pins that assert the tab's presence;
  extend pins in place rather than layering duplicates.
- Note in a spec/template comment that the tab returns when
  resolution-model Task 10 (canonical Diagnostics) lands; the
  deferral decision is recorded in
  `docs/work/resolution-model/plan.md` ("Plan amendment
  (2026-08-23): demo resequencing").

### Acceptance

- **T4-AC-01** — the panel nav renders no Diagnostics tab while all
  other tabs stay (including `Graph (preview)` once Task 1 lands);
  navigating to the diagnostics route directly still renders the
  placeholder.

### Key Locations

- shell nav template/component, `app.routes.ts`, `app.spec.ts`

## Cross-Cutting Acceptance

- **XC-01** — The graph consumes only
  `CanonicalResolutionProjection` and derives no new domain facts:
  no imports of `SnapshotV1`, raw repositories, ingest, resolution
  algorithms, or `sharedRows`; the lifted copy-source helper is
  shared re-use, not re-derivation. **Touches:** T1, T2.
- **XC-02** — No forbidden delivery vocabulary (loaded, downloaded,
  fetched, wire cost, byte size, cache hit, executed) in any graph
  UI string; the view passes the resolution-model Task-11 wording
  guard unmodified when that guard lands. **Touches:** T1, T2, T3.
- **XC-03** — Determinism: identical projection + view state produce
  an identical graph model and DOM; cluster hues never shift under
  filtering or hover. **Touches:** T1, T2, T3.
- **XC-04** — Every rendered identity is a canonical ID (remote
  name, `copyId`, relation ID, `chunkGroupId` + file), keeping
  future cross-view links possible. **Touches:** T1, T2.
