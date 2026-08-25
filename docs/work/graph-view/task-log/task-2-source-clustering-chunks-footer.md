### Task

Graph view deepening: dependency column clustered by the copy's evidenced
source (via the projection-pure shared attribution), a third `Chunks` column
derived exclusively from the copies' bundle claims (qualified stubs instead
of invented files), precomputed `dependency → chunk` references with an
overflow cap, cluster identity hues from the app-wide participant color
assignment, and the divergence-only footer (completeness counts +
`droppedRelationIds`) — preceded by the plan-mandated `GraphNode`
discriminated-union refactor.

### Status

DONE

All seven T2 acceptance criteria are covered by green tests (27 builder + 12
DOM), the full repository suite is green (683), the Remotes suite passes
unmodified, and a live screenshot round over four fixtures confirmed the
three-column mock reading. An external (Codex) review was triaged in-session:
both findings substantiated and fixed (divergence footer for empty captures,
long-tag bounding), two blind spots hardened (cap arithmetic with a consume
edge, high-slot hue pin). A user-requested display fix followed: the host
remote node reads `host` instead of the raw sentinel. The T1
label/tag-overlap open issue is closed constructively: the displayed tag is
bounded by `SUB_LABEL_MAX`, so label + gap + tag can never exceed the node
budget.

### Files Modified

- `projects/devtools-ui/src/app/views/graph/graph-model.ts` (modified) —
  `GraphNode` split into a discriminated union (`GraphNodeBase` +
  `RemoteGraphNode { isHost }` + `DependencyGraphNode { subLabel, isolated,
  subLabelX/Y }` + new `ChunkGraphNode { qualifier, qualifierX/Y }`);
  dependency clustering by `copySourceVmOf` qualifier (source-remote
  clusters, honest buckets `ambiguous source`/`target only`/`unknown`
  pinned last, host cluster first via `RemoteProjection.isHost`); chunk column
  per `(chunkGroupId, file)` through `bundleClaimIds → chunkGroupIds →
  files` with `emitter · bundle` clusters and two-line stubs for
  `source-only`/`ambiguous` claims; `BundleEdgeRef` list with full geometry
  capped at `edges.length + MAX_BUNDLE_EDGES` (4000), overflow in
  `cappedEdges`; `GraphCluster` geometry (`CLUSTER_HEADER 22`,
  `CLUSTER_PAD 10`, `CLUSTER_VGAP 20`, box encloses nodes, label = name +
  count); `GraphBuildOptions.participantColors` (hue = owning remote's
  1-based palette slot, host/buckets forced neutral); completeness
  passthrough + `divergent` flag; tag-aware dependency label budget from
  the DISPLAYED tag, which is itself bounded (`SUB_LABEL_MAX 16`, full tag
  as `subLabelTooltip`) — label + gap + tag ≤ `LABEL_MAX` by construction
  (closes the T1 overlap issue; Codex review fix); host remote node
  renders `host` via `participantDisplay` with the verbatim sentinel as
  tooltip, `id` stays canonical (user-requested).
- `projects/devtools-ui/src/app/views/graph/graph-model.spec.ts`
  (modified) — union-narrowing selectors, extended seed helpers (copy
  source/observed/bundleClaimIds overrides, `bundleClaimOf`,
  `chunkGroupOf`, `observedProviderOf`); 11 new pins: frankenstein
  dependency clusters `host 12 / mermaid 1 / whiteboard 7` with box
  enclosure, frankenstein chunk clusters + 36 references, clean-skip
  emitter-only stub, ambiguous-claim qualification, bucket pinning
  (`zzz-remote` witness proves pinned-not-sorted), hue mapping +
  over-palette neutrality + bucket-named-in-lookup adversarial pin,
  completeness/divergence passthrough, reference-cap overflow (4100-file
  seed with one consume edge — the `edges.length` summand is pinned
  arithmetic, review hardening), tag-aware truncation plus the long-
  prerelease-tag bound (tooltip + invariant assertion), host display
  mapping (label `host`, tooltip `__NF-HOST__`, canonical id); three T1
  pins updated for the new layout (pooling cluster order, collision path,
  three-column geometry pin).
- `projects/devtools-ui/src/app/views/graph/graph.ts` (modified) — injects
  `PARTICIPANT_COLOR_LOOKUP` and passes it through `GraphBuildOptions`;
  imports `RouterLink`; `droppedRelationLine()` footer helper on the
  shared `countClaim` vocabulary.
- `projects/devtools-ui/src/app/views/graph/graph.html` (modified) —
  template switches on `kind` (`@switch`, plan-mandated); cluster boxes
  with `hue-N` class binding rendered before edges/nodes; chunk case with
  qualifier second line; divergence footer (four counts + `[routerLink]`
  to /remotes) and dropped-relations line, both conditionally rendered —
  OUTSIDE the empty split (Codex review fix: a capture can diverge
  without yielding a single node); tag sub-label carries a `<title>` for
  the bounded-tag tooltip.
- `projects/devtools-ui/src/app/views/graph/graph.css` (modified) —
  cluster box/label styles, 8 `hue-N` rules on the
  `--nf-participant-color-N` tokens (stroke + label fill), chunk mono
  labels, dashed stub border, qualifier text, muted footer.
- `projects/devtools-ui/src/app/views/graph/graph.spec.ts` (modified) —
  harness gains `provideRouter([])` + `provideParticipantColors()` (real
  store-backed binding, 7.7 pattern), an `extraProviders` hook, and a
  seeded-store harness (`createSeededView` with a `FederationStore` stub;
  `seededProjection` accepts a `completeness` override) for projections no
  fixture reaches; 7 new DOM tests: three-column reading with cluster
  labels, clean-skip stub + no-extra-paths pin, hue classes matching the
  chip slots, divergence footer + all-zero absence, dropped-relation
  line, footer on an empty-but-divergent seed (review fix), high-slot
  `hue-8` binding via lookup override (review hardening); frankenstein
  remote labels now pin the `host` display; vocabulary sweep extended by
  clean-skip and synthetic-multi-version.

### Files Read (Context Only)

- `docs/work/graph-view/plan.md` — preamble + Task 2 block only (task
  isolation).
- `docs/work/graph-view/task-log/` — `task-1.9` (predecessor: pure
  attribution contract, bucket-mapping hypothesis, open hue decision),
  `task-1` (builder surface, key contract, edge rules, gotchas).
- `docs/work/resolution-model/task-log/` — `task-7.7` (hue honesty rule,
  color-lookup contract, provider TestBed pattern), `task-6`
  (BundleClaim/ChunkGroup/completeness contracts).
- `projects/devtools-ui/src/app/shared/view-conventions.ts` —
  `copySourceVmOf` qualifier ladder (consumed, not modified).
- `projects/devtools-ui/src/app/shared/store/resolution/` —
  `bundle-claims-model.ts`, `projection-model.ts`, `copies-model.ts`,
  `claims-model.ts` (ObservedTargetProvider seed shape),
  `derive-bundle-claims.ts` (verified ambiguous claims carry the candidate
  `sourceRemote` — non-null, so `emitter · bundle` works for stubs).
- `projects/devtools-ui/src/app/shared/kit/participant-colors.ts` +
  `shared/store/participant-colors-provider.ts` — lookup contract and
  renderable-name domain for the hue decision.
- `projects/devtools-ui/src/app/views/import-map/import-map.spec.ts`
  (partial) — `provideRouter([])` harness pattern.
- Ground-truth probe (temporary spec, deleted): copy qualifiers, bundle
  claims, chunk groups, completeness for all 21 fixtures.

### Key Decisions

- **Hue source = the app-wide `PARTICIPANT_COLOR_LOOKUP`, passed through
  `GraphBuildOptions` (user-approved):** a remote's cluster hue equals its
  chip dot slot in every view (frankenstein: mermaid → hue-1, whiteboard →
  hue-2, the exact 7.7 witness slots); the assignment domain (capture-wide
  renderable participants) is filter-independent, so T2-AC-06 stability
  holds by construction. Deviation from the plan's literal "assigned from
  the full unfiltered cluster set": the threshold counts capture
  participants, not clusters — accepted as the more honest reading (a hue
  is an identity claim, so it must be THE identity assignment). The 1.9
  briefing's alternative (pure `assignParticipantColors` over cluster
  names) was rejected: it could color the same remote differently across
  views. `GraphBuildOptions` thereby gains its first real field; the
  builder stays pure (the lookup is an input).
- **Host and honest buckets are neutral by rule, not by lookup absence:**
  `clusterHueOf` forces null for host names and bucket clusters even if a
  lookup entry matches textually (adversarial pin: a lookup naming
  `unknown` does not color the bucket) — mirrors the chip template's host
  branch carrying no dot markup.
- **Bucket mapping confirmed as hypothesized (probe-first):**
  `exact-target-source`/`explicit-anchor` → source-remote cluster (the
  qualifier ladder only reaches these for an evidenced source record, so
  `copySourceRemote` is non-null there); `ambiguous-source` → `ambiguous
  source`; `observed-target-source` → `target only` (a scope-prefix
  observation is not an evidenced source); `unknown-source` → `unknown`.
  Probe result: the whole corpus is exact/anchor only — every bucket is
  seed-witnessed.
- **Chunk stubs as two-line chunk nodes (`STUB_NODE_H 40`):** the mandated
  stub wording ("source-only — no registered chunk list") is 38 chars and
  cannot share one 26px line with the bundle name; a second smaller text
  line keeps the node-geometry model (variable heights via the cluster
  cursor) instead of inventing a new render primitive. Ambiguous stubs use
  "ambiguous — no unique source" (the `BundleClaimStatus` doc's own
  vocabulary). Stub identity = `BundleClaimId`; file-node identity =
  `chunkGroupId + file` (newline-joined), both under the `<kind>:<id>` key
  pattern.
- **`MAX_BUNDLE_EDGES` read as the budget on top of consume edges:** the
  plan's "cap … at consume-edge count + 4000 (`MAX_BUNDLE_EDGES`)" is
  implemented as `cap = edges.length + MAX_BUNDLE_EDGES` with
  `MAX_BUNDLE_EDGES = 4000`; overflow is counted (`cappedEdges`), never
  silent, and the cap limits references only — every recorded file still
  renders as a node (pinned with a 4100-file seed). Reference order is the
  deterministic dependency-render order, so the same capture always keeps
  the same references. Stub references are included — the hover trace can
  honestly show a dependency's claim even without registered files.
- **Chunk-cluster ordering mirrors the dependency rule:** host-emitter
  clusters first, then alphabetical by emitter and bundle; a (production-
  unreachable) emitter-less stub cluster falls last and is labeled by the
  bundle alone rather than inventing an emitter name.
- **T1 label-overlap issue addressed with a tag-aware label budget:**
  tagged dependency labels truncate at `LABEL_MAX - tag.length - 2`
  (floored at 12), so a near-limit label never runs under the right-
  aligned tag — verified live on frankenstein
  (`@angular/core/event-dispat…` now clears `21.2.12`).
  Sorting/clustering still use the full label; only display truncates.
  (The Codex review showed this first cut left long tags uncovered — the
  review round below closes it constructively.)
- **Seeded-store DOM harness:** the dropped-relation footer line needs a
  projection no fixture produces; `createSeededView` stubs
  `FederationStore` with `{ model: signal({ resolutionProjection }) }`
  (the component reads nothing else) instead of hand-crafting a raw
  `SnapshotV1` through ingest. The color lookup falls back to the neutral
  kit default there by design.
- **Footer divergence witness found in the corpus:**
  `synthetic-multi-version` carries `unmappedResolutions: 2` (probe
  finding) — the completeness footer has a real fixture DOM witness; only
  the dropped-relation line needs the seeded harness.
- **Screenshot round via a separate headless Chromium:** the webmcp
  profile was held by a LIVE Chromium (mitmproxy on 8080 alive, Codex
  processes running) — per the chromium-webmcp conflict rule it was not
  killed; screenshots came from `chromium --headless` with a throwaway
  profile against the dev server on :4201 (host-4200 is occupied by the
  lab app).

— session 2026-08-24 (Codex review triage + host display)

- Codex review (1 MEDIUM, 1 LOW, 2 hardening blind spots), all verified
  against the code, all accepted and fixed: **(1) MEDIUM, fixed** — the
  divergence footer lived inside the non-empty branch, so a capture that
  diverges without yielding a node (`empty && divergent`, reachable per
  completeness contract: unmapped/unknown resolutions produce no copies,
  consumers can be absent from the remotes repo) rendered only "Nothing to
  graph." — an incomplete capture looked merely blank. Footer moved
  outside the empty split (with rationale comment); seeded DOM regression
  added. No corpus fixture reaches the state (probe), which is why no pin
  had caught it. **(2) LOW, fixed** — the first label-budget cut floored
  at 12 but rendered the tag unbounded, so tags > 22 chars (realistic
  prerelease/build tags) could still collide. Now the DISPLAYED tag is
  bounded by `SUB_LABEL_MAX 16` (full tag as `subLabelTooltip` +
  `<title>`), the budget derives from the displayed tag, and
  `label + 2 + tag ≤ LABEL_MAX` holds by construction — pinned with a
  29-char canary tag and an invariant assertion. **(3) hardening** — the
  cap test seed gained a consume edge: `1 + MAX_BUNDLE_EDGES = 4001` kept
  references / 99 capped pins the `edges.length` summand instead of
  verifying it by inspection. **(4) hardening** — a DOM test overrides
  `PARTICIPANT_COLOR_LOOKUP` with `mermaid → 8` and pins the `hue-8`
  class (plus: no other cluster colored), so the class binding is
  witnessed beyond the corpus slots 1/2.
- **Host display mapping (user-requested):** the host remote node renders
  `host` via `participantDisplay` (chip convention) instead of the raw
  `__NF-HOST__` sentinel; the verbatim name stays reachable as tooltip
  and `id` stays canonical — edges, keys, and lookups are untouched.
  Builder + DOM pins updated/added. In a second round the cluster labels
  followed: the plan block's literal `(host)` form was dropped for plain
  `host` (screenshot review — parentheses were inconsistent with the node
  display and doubled up as `(host) (12)`); ordering semantics ("host
  cluster first") are unchanged, this is a display-only amendment.

### Review Focus

- **Behavior claims:** the chunk column derives exclusively from copies'
  attached bundle claims — a borrowing consumer contributes no chunk
  nodes, `source-only`/`ambiguous` claims render qualified stubs and never
  invented files, and pseudo/`mapping-or-exposed` groups are excluded
  structurally; dependency clusters follow the shared attribution with
  the host cluster first and the three honest buckets named and pinned last (no
  `(unresolved)` collapse); cluster hues are exactly the chip identity
  slots with host/buckets neutral and all-or-nothing above 8; the footer
  renders exactly on divergence — including for a capture that yields no
  nodes (four counts + Remotes link) — and surfaces `droppedRelationIds`
  with resolution-honest wording; label + gap + displayed tag never
  exceed the node's character budget (tag bounded, full tag as tooltip);
  the host node reads `host` while every lookup stays on the canonical
  sentinel.
- **Assumptions / choices:** the hue-domain reading of T2's "full
  unfiltered cluster set" (app-wide assignment, documented above, user-
  approved); `MAX_BUNDLE_EDGES` as budget-on-top; the ambiguous-stub
  wording "ambiguous — no unique source"; stub references included in
  `bundleEdgeRefs`; `SUB_LABEL_MAX 16` as the displayed-tag bound.
- **Scope notes:** all writes stay inside `views/graph/`;
  `shared/view-conventions.ts`, `bundle-claims-model.ts`, and
  `views/remotes/` are read-only (Remotes suite passes unmodified —
  T2-AC-05); the label-budget change alters some near-limit frankenstein
  labels vs. Task 1 (deliberate, pinned).
- **Read next:** `dependencyClusterOf` + `clusterHueOf` in
  `graph-model.ts` — the bucket mapping and the forced-neutral rule are
  the honesty-critical surfaces; the chunk-collection loop
  (`collectChunkNode` callers) — verify the mapped-vs-stub branch and the
  dedup sets; the footer block in `graph.html` — confirm it sits outside
  the empty split and inside the vm-non-null branch (the review's MEDIUM);
  `createSeededView` in `graph.spec.ts` — the store-stub pattern is new
  and worth a deliberate look.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/graph/*.spec.ts' --watch=false`
  — 2 files / 36 tests green on the final state (26 builder, 10 DOM). All
  new ground-truth pins (frankenstein cluster counts, 36 references,
  clean-skip stub) passed on their first run — probe-then-pin method.
- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/remotes/*.spec.ts' --watch=false`
  — 2 files / 55 tests green with UNMODIFIED spec files (T2-AC-05).
- `npm test` — full suite green on the final state: 37 UI files / 478
  tests, 3 bridge files / 77 tests, 6 collector files / 75 tests, 4 guard
  files / 50 tests (680 total; +16 vs. Task 1.9).
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit`
  — no diagnostics; `prettier --check` clean on all six files (after one
  `--write` round on graph-model.ts/graph.css); `git diff --check` clean.
- Ground-truth probe (temporary spec, deleted; throw-method): full
  copy/claim/group/completeness dump for 5 fixtures plus a
  qualifier/status/completeness sweep over all 21 — established the
  frankenstein breakdown (12/1/7 clusters, 3 mapped groups + 2 source-only
  stubs, 36 refs), clean-skip (single mfe2-sourced copy), the all-
  exact/anchor corpus, and `synthetic-multi-version` as the only divergent
  fixture (2 unmapped).
- Live screenshot round (dev server on :4201 outside the sandbox, separate
  headless Chromium with throwaway profile): frankenstein-live (three-
  column mock reading, hues mermaid-blue/whiteboard-orange, host neutral,
  stubs qualified), clean-skip (emitter stub, dotted skip edge),
  pooling-anchor (host cluster first, two honest stubs under `mfe1 ·
  browser-shared (2)`), synthetic-multi-version (footer `0 unknown · 2
  unmapped · 0 blocked · 0 ambiguous — details in the Remotes view`),
  co-declared-share. A first frankenstein shot still showed the T1 label
  overlap; re-shot green after the label-budget fix. Screenshots delivered
  in-session.

— session 2026-08-24 (Codex review triage + host display)

- Focused graph suites after the four review fixes and the host display
  mapping: 2 files / 39 tests green (27 builder, 12 DOM; +4 vs. the
  pre-review state).
- `npm test` re-run on the final code state: 481 UI / 77 bridge / 75
  collector / 50 guards (683 total, +3 vs. pre-review).
- `tsc --noEmit` no diagnostics; `prettier --check` clean on all six
  files; `git diff --check` clean — all re-run after each fix round.

### Acceptance Coverage

- **T2-AC-01 — passed:** builder pins "clusters frankenstein-live
  dependencies by evidenced source with host first" (12/1/7, box
  enclosure) and "derives frankenstein-live chunk clusters as emitter ·
  bundle" (5 clusters, 9 nodes, 36 refs); DOM pin "renders
  frankenstein-live as three clustered columns"; live screenshot.
  Contributes: XC-04.
- **T2-AC-02 — passed:** builder + DOM clean-skip pins — chunk evidence
  only under `mfe2 · browser-shared`, the borrowing consumer contributes
  no chunk nodes while its consume edge remains.
- **T2-AC-03 — passed:** clean-skip stub pins (qualified wording, no
  fabricated files, rendered-path count = consume edges only) plus the
  synthetic ambiguous-claim pin (qualifier visible, no chunk attribution,
  per-candidate clusters). Contributes: XC-02.
- **T2-AC-04 — passed:** seeded four-copy pin — `zzz-remote` cluster
  first, then `ambiguous source`, `target only`, `unknown` pinned last
  (order proves pinning, not sorting); no `(unresolved)` anywhere.
- **T2-AC-05 — passed:** Remotes suite green unmodified (55 tests);
  `git status` shows all writes inside `views/graph/`. Contributes: XC-01.
- **T2-AC-06 — passed:** builder pins (deep-equal under identical
  lookup, over-palette-size fully neutral via real
  `assignParticipantColors` overflow, host + bucket forced-neutral
  adversarial pins) and DOM pins matching mermaid/whiteboard to the chip
  slots hue-1/hue-2 with all six host clusters hue-free, plus the
  high-slot `hue-8` binding via lookup override (review hardening).
  Contributes: XC-03.
- **T2-AC-07 — passed:** DOM pins — `synthetic-multi-version` renders the
  four-count line with the /remotes link, `co-declared-share` renders no
  footer, the seeded ghost-consumer projection renders exactly
  `1 relation not drawn — consumer not among the capture's remotes`, and
  an empty-but-divergent seed renders the footer next to `Nothing to
  graph.` (review fix — divergence gates the footer, node count does
  not); builder completeness/divergence passthrough pin; every corpus
  fixture has empty `droppedRelationIds` (T1 pin still green).

### Open Issues

- Bundle-edge references and `cappedEdges` have no render surface yet —
  Task 3's hover trace draws the hovered node's references (→ Task 3).
- Tooltip discoverability (native, deviation-first-sparse) unchanged from
  T1 — the planned toolbar hint line lands with Task 3 (→ Task 3).
- A11y remains the recorded stage-2 follow-up (generic `role="img"` only).
- The dev server from the screenshot round may still be running on :4201
  (background, outside the sandbox) — kill manually when done reviewing.

### Context for Next Task

- **Model surface for the hover trace (Task 3):** `GraphModel` now carries
  `clusters: GraphCluster[]`, `bundleEdgeRefs: BundleEdgeRef[]` (`{ key,
  dependencyKey, chunkKey, path }`, keys are node render keys), and
  `cappedEdges: number`. Refs are precomputed with full Bézier geometry —
  hover rendering is pure filtering by `dependencyKey`/`chunkKey`, no new
  derivation. The edge hover corridor (`g.graph-edge-group` +
  `.graph-edge-hit`) from T1 is untouched and remains the hit surface.
- **Node union:** `GraphNode = RemoteGraphNode | DependencyGraphNode |
  ChunkGraphNode` discriminated on `kind`; template switches per `@switch`;
  specs narrow via `remoteNodesOf`/`dependencyNodesOf`/`chunkNodesOf`
  selectors. Any new kind joins the union and the `<kind>:<id>` key rule.
- **Cluster contract:** `GraphCluster.key` is kind-qualified
  (`dependencies:source:<name>` / `dependencies:bucket:<label>` /
  `chunks:<JSON [emitter, bundle]>`); `colorIndex` is the 1-based
  `--nf-participant-color-N` slot or null (neutral). Hues arrive through
  `GraphBuildOptions.participantColors` — the component passes the
  injected `PARTICIPANT_COLOR_LOOKUP`; graph DOM specs need
  `provideParticipantColors()` in the TestBed (7.7 pattern) for hue pins.
- **Seeded-store harness:** `createSeededView(projection)` in
  `graph.spec.ts` renders the component over an arbitrary projection via a
  `FederationStore` stub — use it for footer/edge cases no fixture
  reaches; the fixture harness stays the default.
- **Label budget gotcha:** tagged dependency labels truncate earlier than
  `LABEL_MAX` (`LABEL_MAX - displayed tag - 2`), and the tag itself is
  bounded by `SUB_LABEL_MAX` (full tag in `subLabelTooltip`) — pins that
  assert exact labels near the limit must account for both.
- **Host display gotcha:** the host remote node's `label` is `host`
  (display form), its `id`/`key` stay `__NF-HOST__` /
  `remote:__NF-HOST__` — DOM pins read `host`, builder lookups stay on
  the sentinel.
- **Live-review workflow:** dev server on :4201 (host-4200 belongs to the
  lab app); if the webmcp Chromium is held by a live session (check
  bypass-pgrep + whether the 8080 mitmproxy is alive before assuming
  stale), fall back to `chromium --headless` with a throwaway profile —
  URL shape `http://localhost:4201/?fixture=<id>#/graph`.
- `/commit 2` must stage the six modified `views/graph/` files plus this
  log — nothing else changed anywhere.

### Git State

`git diff --stat`

```text
 .../src/app/views/graph/graph-model.spec.ts        | 412 +++++++++++++-
 .../devtools-ui/src/app/views/graph/graph-model.ts | 599 ++++++++++++++++++---
 projects/devtools-ui/src/app/views/graph/graph.css |  92 ++++
 .../devtools-ui/src/app/views/graph/graph.html     | 137 ++++-
 .../devtools-ui/src/app/views/graph/graph.spec.ts  | 270 +++++++++-
 projects/devtools-ui/src/app/views/graph/graph.ts  |  23 +-
 6 files changed, 1410 insertions(+), 123 deletions(-)
```

`git status --short`

```text
 M projects/devtools-ui/src/app/views/graph/graph-model.spec.ts
 M projects/devtools-ui/src/app/views/graph/graph-model.ts
 M projects/devtools-ui/src/app/views/graph/graph.css
 M projects/devtools-ui/src/app/views/graph/graph.html
 M projects/devtools-ui/src/app/views/graph/graph.spec.ts
 M projects/devtools-ui/src/app/views/graph/graph.ts
```

### Sessions

- claude-code 3f4a9078-5784-4fe7-8c67-0f5662462b7f (2026-08-24) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-native-federation-devtools/3f4a9078-5784-4fe7-8c67-0f5662462b7f.jsonl
