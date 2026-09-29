# Native Federation DevTools — Dependency Grouping & Federation Feature Coverage Plan

Branch scope: grouping-and-pooling (from main)
Upstream verified against: orchestrator `ccd98f4` (2026-09-28), native-federation-core `28a037d` (2026-09-23), docs `native-federation.com/docs/v4` (pooling, core/artifacts).
Prior art: `topicusonderwijs/par-ticle-mfe-devtools` `0d051b6` — `src/tag-picker/tabs/federation-graph.ts` (`GroupBy = 'bundle' | 'shareScope' | 'provider'`, provider sub-clustered `provider → pool`).

Goal: (a) a group-by switch on the dependency column — **Provider** (today's fixed clustering), **Share scope**, **Pool**, **Bundle** — and (b) close the remaining gaps in how the devtool presents denseExternals, denseChunking, pooling and share scopes. Pooling gets its own conditional **Pools** tab (tables, not a graph) that explains membership and outcomes, cross-linked with the Graph's Pool grouping.

Hard constraints (inherited from docs/work/graph-view/plan.md, unchanged): the graph consumes only `CanonicalResolutionProjection`; views derive no domain facts; every rendered identity is a canonical ID; wording is resolution-honest and never delivery-claiming. The collector stays passive — it reads the four `__NATIVE_FEDERATION__` repositories and nothing else, so every new fact must be traceable to a stored field.

What the runtime actually persists (source-verified, governs every task below):

| Feature | Persisted evidence | Not persisted |
|---|---|---|
| shareScope | registry key `sharedExternals[scope][package]` (`__GLOBAL__`, named, `strict`) | — |
| denseChunking | `bundle` on each participant (`bundle-shared.ts:283`, `bundle-exposed-and-mappings.ts:160`) + per-bundle chunk lists | the build flag itself |
| denseExternals | only indirectly: an `entries` map with >1 specifier; the orchestrator normalizes every registration to `entries` (`version.contract.ts`), and host-side `feature.convertFlatSharedInfo` produces the identical shape | the build flag; flat-vs-dense wire shape |
| pooling (explicit tags) | raw `pool` tag per participant (`store-remote-entry.ts:170`); pooling's outcome written back into the same records by `rebuildMember` (`pool-shared-externals.ts`): row actions and `servedBy` | the island cause (incompatible / uncovered / torn — only logged, `pool-shared-externals.ts:335–496`) |

Pooling scope: **explicit `pool` tags only.** Auto-pooling (`feature.useAutoExternalPooling`, npm-scope families) is out of scope: the flag is not persisted, so its pools cannot be rebuilt from storage. A `servedBy` or family-wide `scope` pattern outside every tag pool keeps its existing per-binding presentation and gets no pool attribution.

Why tag pools are derivable: the orchestrator does not persist pools — it recomputes them from storage on every init (`buildPools(sharedExternals[scope], useAutoExternalPooling)`, `pool-graph.ts`). With only tag edges, that computation is a pure function of the stored records, so a tag pool is exact when auto-pooling is off. With it on, auto edges can merge a tag pool into a larger family; the tag pool is then a correct subset, never a wrong grouping.

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

## Task 1: Correct the dense capability badges

### Instructions

- Today the "dense externals" capability fires on `bundle !== null`
  (`remotes-detail-vm.ts:329`, `derivations.ts:293`) — but `bundle` is
  produced by `features.denseChunking`, so the badge misattributes a
  second denseChunking facet to denseExternals.
- Fold the `bundle` facet into the single **dense chunking**
  capability (either facet present → badge; note names both facets and
  `features.denseChunking`).
- Replace the dense externals capability with a **multi-entry
  registrations** capability: fires when any registration this remote
  participates in carries an `entries` map with more than one
  specifier. Note must name both producers (`features.denseExternals`
  build-side, `feature.convertFlatSharedInfo` host-side) and claim
  neither.
- Rename `RemoteBadges.denseExternals` / rule `participant-bundle`
  accordingly; update T8.5 provenance text where it is quoted.

### Acceptance

- **T1-AC-01** — `pooling-anchor` / any fixture with `bundle` but only
  single-entry maps shows dense chunking and no multi-entry badge.
- **T1-AC-02** — `synthetic-dense-entries` shows the multi-entry badge
  on the remote owning `@nf-lab/dense-lib`, citing both producer flags.
- **T1-AC-03** — `non-dense` shows neither badge.

### Key Locations

- `views/remotes/remotes-detail-vm.ts` (`capabilitiesOf`),
  `shared/store/derivations.ts` (`deriveBadges`), `derived-model.ts`
- `docs/work/resolution-model/task-log/task-8.5-capability-config-provenance.md` (read-only; amend in the task log)

## Task 2: Witness captures for dense and pooling variants

### Instructions

- Add lab scenarios (playground `nf/playground`, `lab/v2-scenarios`)
  and capture them with `scripts/lab-capture-dump.js`:
  - `dense-chunking-only`, `dense-externals-only`, `dense-both`;
  - `pool-tag-coherent` — two remotes tag `react`/`react-dom` with
    `pool: "react"`, compatible versions, one build serves both;
  - `pool-tag-islanded` — same tags, one remote's `react-dom` resolves
    `scope` (gate 1), so its whole family stays scoped;
  - `pool-tag-anchored` — three remotes, tags on one family, where
    the global mapping would tear one consumer, so pooling writes a
    `servedBy` anchor (extends the existing `pooling-anchor` witness
    with explicit tags);
  - `pool-tag-orphan` — a single tagged external that joins nothing
    (the orchestrator's "likely a typo" case).
- Derive SnapshotV1 fixtures via `scripts/derive-fixtures.mjs`; replace
  `synthetic-dense-entries` as the multi-entry witness where the
  real capture covers it (keep the synthetic split-lib case).
- Record in the task log which upstream fields each capture exhibits.
  All pool scenarios run with `useAutoExternalPooling: false`.

### Acceptance

- **T2-AC-01** — each capture passes the collector schemas and
  `fixture-drift.spec.ts`.
- **T2-AC-02** — `captures/manifest.json` pins the playground and
  orchestrator commits per scenario.

### Key Locations

- `captures/`, `scripts/lab-capture-dump.js`, `scripts/derive-fixtures.mjs`,
  `projects/devtools-bridge/src/lib/fixtures/`

## Task 3: Publish grouping facets on the canonical projection

### Instructions

- The graph may read only the projection, which today exposes the
  provider (source remote) but not share scope, pool tag or bundle as
  copy-level facts. Add a `groupingFacets` field to
  `ResolvedDependencyCopy` (or a sibling projection list keyed by
  `copyId`), derived in the resolution pipeline, not in views:
  - `shareScope`: scope of the evidenced source registration; `null`
    for private (scoped-externals) copies.
  - `poolId`: the tag pool the copy's source member belongs to (Task 3a),
    or `null`.
  - `bundles`: sorted distinct bundle names from the copy's bundle claims.
- Tag pools (3a), derived in the pipeline per share scope, mirroring
  `groupByMembership` with tag edges only:
  - edge `package → (remote, tag)` for every participant carrying a
    trimmed non-empty `pool` tag — remote-local, so two remotes'
    identical tag strings join only through a shared member;
  - edge `entrypoint → owning package` when both are declared
    (`owningPackage`: `@a/b/c` → `@a/b`, `rxjs/operators` → `rxjs`);
  - a component is a pool when it holds ≥2 members across ≥2 remotes;
    pool ID = alphabetically smallest member (the orchestrator's name);
  - the `strict` scope is never pooled;
  - a tagged member whose component stays singleton is published as an
    orphan tag (the orchestrator's typo warning).
  Publish `tagPools: { id, shareScope, members, tags: {remote, tag}[] }[]`
  and `orphanTags` on the projection.

### Acceptance

- **T3-AC-01** — `scoped` / `strict-scope` / `scope-isolation` publish
  the expected scope per copy; private copies publish `null`.
- **T3-AC-02** — `pool-tag-coherent` publishes one pool `react`
  (members `react`, `react-dom`); both family copies carry its ID;
  `pool-tag-orphan` publishes no pool and one orphan tag; `strict-scope`
  publishes none.
- **T3-AC-03** — projection determinism spec still holds.
- **T3-AC-04** — membership spec pins the union rules on hand-built
  records: remote-local tags, entrypoint-follows-package, the 2×2
  threshold, reload-stable naming.

### Key Locations

- `shared/store/resolution/copies-model.ts`, `materialize-resolved-copies.ts`,
  `build-canonical-projection.ts` (+ specs)

## Task 4: Group-by switch in the Graph view

### Instructions

- Add `GroupBy = 'provider' | 'shareScope' | 'pool' | 'bundle'`; the
  builder takes it as an option, default `provider` (today's
  `dependencyClusterOf`, unchanged).
- Cluster key rules (all from Task 3 facets):
  - `shareScope`: scope name; `__GLOBAL__` first, `strict` last, private
    copies in a `(private)` bucket.
  - `pool`: the tag pool ID, tooltip listing each remote's declared
    tag; `(not pooled)` bucket for copies outside every tag pool.
  - `bundle`: bundle name; `(no bundle)` bucket. Dependency clusters
    reuse the chunk-column bundle hue so a copy and its chunk cluster
    match (par-ticle's colour rule).
  - Honest buckets (`ambiguous source`, `target only`, `unknown`) keep
    their meaning only under `provider`.
- Segmented switch above the canvas using the existing kit; the choice
  is an enum preference (survives capture replacement, like the
  Packages `conflicts` filter).
- Hover trace and click-to-filter (Task 3 of graph-view) keep working
  across every grouping.

### Acceptance

- **T4-AC-01** — builder spec per grouping over `frankenstein-live`,
  `scoped`, `pool-tag-coherent`, `dense-chunking-only`; deterministic.
- **T4-AC-02** — switching grouping re-clusters without changing the
  node or edge set (same canonical IDs).
- **T4-AC-03** — forbidden-vocabulary rendered-text pin extended to
  the new labels.

### Key Locations

- `views/graph/graph-model.ts`, `graph-element-factories.ts`,
  `graph-types.ts`, `graph.{ts,html,css}` (+ specs)

## Task 5: Surface pool tags in Packages and Remotes

### Instructions

- Show a `pool: <tag>` chip beside the existing scope chip on
  participant rows in Package detail and Remote detail, tooltip
  "explicit pool tag declared by this remote (config: `pool` on the
  shared external)". Absent tag → no chip. An orphan tag renders the
  chip with a warning note: "no other external joined this pool —
  likely a typo or a missing sibling".
- Where `servedBy` notes already exist, add the pool tag the anchored
  declaration carries, if any.

### Acceptance

- **T5-AC-01** — `pool-tag-coherent` shows the chip on both family
  members for both remotes; `pool-tag-orphan` shows the warning chip.

### Key Locations

- `views/packages/packages-detail-vm.ts`, `package-detail.html`,
  `views/remotes/remotes-detail-vm.ts`, `remote-detail.html`

## Task 6: Pools tab

### Instructions

- First write the presentation contract
  `docs/work/grouping-and-pooling/design/pools-explainer-mock.md`
  (style of `docs/work/resolution-model/design/*-mock.md`) and get it
  reviewed before building. It fixes the wording and layout below,
  worked through on `pooling-anchor` plus the Task 2 pool captures.
- Derive per tag pool (Task 3a) in the pipeline and publish on the
  projection:
  - **tag matrix**: member × remote cells — `tagged <tag> @ <tag
    version>`, `declared @ <tag version>` (no tag), or `not declared`;
  - **serving build** per `(consumer, member)`, read off the stored row:
    `share` → itself when `remotes[0]` else `remotes[0]`; `skip`
    without `servedBy` → the `share` row's `remotes[0]`; `skip` with
    `servedBy: X` → X; `servedBy` naming the consumer itself → its own
    build (it is an anchor); `scope` → its own build;
  - **consumer outcome**: `one build` (every member from a single build,
    nothing written — the healthy path), `redirected` (≥1 `servedBy`
    onto another build), `used by others` (named as someone else's
    `servedBy`), `own copy of everything` (every member it consumes sits
    in a `scope` row — the `rebuildMember` island shape); the host is
    always `one build` ("host is never redirected");
  - **unshared member**: no `share` row and ≥2 `scope` consumers (the
    orchestrator's "scoped-only" warning condition);
  - **coherence**: per non-host consumer, whether its resolved
    `specifier → tag` combination is shipped by some single build
    (`entries` + tags; same contract as `findTornRemotes`). Pooling
    guarantees this — a failure is shown as a finding, not hidden. For
    a redirected consumer, name the combination the shared versions
    would have produced (the one reason we can state from evidence);
  - **membership notes**, only when the rule changed the result:
    different tags forming one pool (name the linking package), one tag
    string forming separate pools, an untagged entrypoint following its
    package, a tag that forms no pool (orphan);
  - **formed by**: the distinct tags that formed the pool (the pool ID
    is a member name, not necessarily a tag the user wrote);
  - a record with `dirty: true` marks the pool as pending re-election
    and suppresses outcome wording.
- New view `views/pools/pools.{ts,html,css}` and route `/pools`,
  `?select=<scope>|<poolId>` per the cross-link convention in
  `app.routes.ts`. Nav tab `Pools` renders only when the capture holds
  at least one tag pool or orphan tag; the route stays reachable by
  URL and shows "No pool tags in this capture." otherwise.
- Layout per pool, top to bottom: header (pool ID, share scope when not
  `__GLOBAL__`, member/remote counts, formed by), tag matrix, one
  outcome sentence per remote, membership notes. One definition line
  heads the view: "A pool is a set of packages that must come from
  the same build. Remotes opt packages in with a `pool` tag; the
  orchestrator then makes sure each remote gets all of them from one
  build." — linking `docs/v4/orchestrator/pooling`. Footnote, only when
  an untagged remote takes part: "a tag pulls a package into the pool;
  every remote using that package takes part."
- Present outcomes, never causes: the island cause (incompatible /
  uncovered / torn) is not stored and is not inferred; show the
  consumer's `requiredVersion` next to the shared tag as plain inputs.

### Acceptance

- **T6-AC-01** — `pooling-anchor` renders pool `@nf-lab/conflict-lib`,
  formed by `family`: matrix host `2.0.0`/—, mfe1 tagged both at
  `1.0.0`, mfe2 declared both at `1.0.0`; outcomes host one build,
  mfe1 used by others, mfe2 redirected to mfe1 naming the mixed
  combination `conflict-lib@2.0.0 + extra@1.0.0`; untagged-remote
  footnote present.
- **T6-AC-02** — `pool-tag-islanded`: the islanded remote shows
  `own copy of everything` with every member scoped; others one build.
- **T6-AC-03** — `pool-tag-coherent`: every consumer one build; no
  membership notes.
- **T6-AC-04** — `pool-tag-orphan`: no pool, orphan note; nav tab shown.
- **T6-AC-05** — hand-built records: torn combination renders the
  coherence finding; `dirty` renders pending; the two-tags-one-pool and
  one-tag-two-pools notes render with the linking package named.
- **T6-AC-06** — captures without pool tags: no nav tab; `/pools`
  renders the empty line.
- **T6-AC-07** — forbidden-vocabulary rendered-text pin covers the view.

### Key Locations

- new `views/pools/`, `app.routes.ts`, `app.html` (nav), `app.spec.ts`
- `shared/store/resolution/` (derivation in the pipeline, published via
  the projection)
- new `docs/work/grouping-and-pooling/design/pools-explainer-mock.md`
- read-only upstream: `pool-graph.ts`, `pool-shared-externals.ts`
  (`rebuildMember`, `findTornRemotes`, `warnIfScopedOnly`)

## Task 7: Cross-link Pools and Graph

### Instructions

- Graph reads `?group=<provider|shareScope|pool|bundle>` and
  `?select=<id>` on entry; under `group=pool`, `select=<scope>|<poolId>`
  applies the existing click-to-filter to that pool's cluster. The
  query param seeds the enum preference; it does not overwrite it
  afterwards.
- Pools: each pool header links "show in Graph" →
  `/graph?group=pool&select=<scope>|<poolId>`.
- Graph: under Pool grouping, a pool cluster header links "explain" →
  `/pools?select=<scope>|<poolId>`; the `(not pooled)` bucket has no
  link. The cluster tooltip reuses the Pools "formed by" line.
- Packages / Remotes: the Task 5 pool chip links to the pool it belongs
  to (orphan chips link to the orphan note).

### Acceptance

- **T7-AC-01** — `pooling-anchor`: Pools → Graph lands on Pool grouping
  with the pool filtered; the cluster's "explain" link returns to the
  same pool selected.
- **T7-AC-02** — a Package-detail pool chip navigates to its pool.
- **T7-AC-03** — a stale or unknown `select` falls back to no selection
  without error.

### Key Locations

- `views/graph/graph.{ts,html}`, `views/pools/`, `views/packages/`,
  `views/remotes/`

## Out of scope

- Auto-pooling (`useAutoExternalPooling`): membership, confirmed-vs-potential
  auto-pools, and any upstream request to persist the flag.
- Island causes: not persisted; would require re-running the
  orchestrator's version and coverage gates.
- A pooling-specific graph renderer: membership reads better as the
  Pools tag matrix, and serving relations already render in the Graph
  under Pool grouping.
- par-ticle's Shared/Scoped/Chunks layer toggles and inspect cards
  (already listed as graph-view stage-2 follow-ups).
- Grouping in the Packages list (can reuse Task 3 facets later).
