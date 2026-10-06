### Task

Document the Pools tab, the Graph grouping switch and the pooling
derivations in the project-wide docs the share-pools branch had not
touched (README, development notes, resolution data model).

### Status

DONE

Content-only change; no independent review performed. Recorded during
the PR walkthrough of `share-pools` (PR #1) as the one merge blocker.

### Root Cause

The branch's twelve tasks documented their work under
`docs/work/share-pools/` and in `captures/README.md`, but none of them
touched the project-wide docs. `README.md` and `docs/DEVELOPMENT.md`
still listed four tabs, and `docs/resolution-data-model.md` showed a
Derive stage and a projection without pools, although the branch adds
three derivations (`deriveTagPools`, `deriveCopyGroupingFacets`,
`derivePoolFamilies`) and four projection lists. The stacked
`packages-verdicts` branch updates only the Packages wording of the same
files, so the gap existed on both branches.

### Files Modified

- `README.md` (modified) — Pools bullet under "What you get"; Graph bullet
  names the build-files column, the include/exclude filter and the four
  groupings.
- `docs/DEVELOPMENT.md` (modified) — status line lists Pools; Pools
  paragraph in "What it shows" (matrix, verdict kinds, what is rebuilt vs
  read off stored rows); Graph paragraph (filter, expand, groupings);
  fixture list names the pool and dense scenarios; repository layout says
  "manifests" (two lab corpora).
- `docs/resolution-data-model.md` (modified) — big-picture flowchart gains
  the pools node and the Derive text its fifth sub-question; layer table
  gains Tag pools, Grouping facets, Pool families; registry diagram gains
  `SharedExternalRecord.poolName` and `ParticipantDeclaration.poolCause`;
  projection diagram gains the four lists with `TagPool`, `PoolFamily`,
  `CopyGroupingFacets` classes and their order-coupled relations; one
  paragraph states how pools are rebuilt, what is read off the rows and
  which two computations the model makes itself.
- `docs/improvements.md` (new) — improvements register, created by the
  wrap-up's promotion rule with the five Pools/Graph follow-ups from the
  walkthrough.

### Files Read (Context Only)

- `docs/work/share-pools/plan.md`, `task-log/task-{8,9,12}-*.md`,
  `design/pools-explainer-mock.md`
- `shared/store/resolution/{derive-grouping-facets,derive-pool-families,grouping-model,pool-family-model,projection-model}.ts`
- `views/pools/pools-view-model.ts`, `views/graph/graph-grouping.ts`,
  `shared/pool-chip.ts`
- `captures/pool-portfolio/20260930T113012Z.json` (rows and import map
  behind the walkthrough examples)
- `docs/work/packages-verdicts/plan.md` and its `task-7` log (via
  `git show`, stacked branch)
- native-federation.com/docs/v4/orchestrator/pooling (resolution order,
  gate 1 and gate 2 a–c, `poolCause`, "when to pool")

### Key Decisions

- **Model documentation stays in `resolution-data-model.md`:** README gets
  one bullet, DEVELOPMENT one paragraph; the derivation detail (union-find
  membership, serving-build rule, the two own computations) lives only in
  the data-model doc, per the standing rule that model docs are linked,
  not inlined.
- **No sixth class-diagram view:** the pooling facts are documented inside
  view 5 (projection) plus two fields in view 1 (registry), so "five
  views" in both docs stays true and the pipeline order of the diagram is
  unchanged.
- **Lands on `share-pools`, not `main`:** the "chores land on main" rule
  covers work unrelated to the branch; this documents what the branch
  adds and must merge with it. `packages-verdicts` picks it up through
  its next merge of `share-pools` (its README/DEVELOPMENT edits sit in
  the adjacent Packages lines).
- **Walkthrough findings about the Pools view are not fixed here:** they
  are UI changes (legend wording, per-row explanation, fix hints, Graph
  sub-bands), outside a docs chore; promoted to the improvements register.
- **Pooling rule text:** the official pooling docs already state the
  resolution order and both gates verbatim; DEVELOPMENT.md carries the
  compressed form. The corollary that an objector is never redirected and
  never a candidate for others is only implicit upstream; the maintainer
  intends to propose it there.

### Review Focus

- **Behavior claims:** both docs now name five tabs; the data-model doc
  lists every new projection field and derivation; its pooling paragraph
  separates what is rebuilt (membership), what is read off stored rows
  (serving build, `poolCause`) and the two computations the model makes
  itself (`semver` conflict, torn combination).
- **Plan deviations:** No plan (fix lane).
- **Assumptions / choices:** the Graph bullets say "build files", the
  column's name in the UI, where they said "chunks" before.
- **Scope notes:** None beyond the three files.
- **Read next:** `docs/resolution-data-model.md`, paragraph "Pooling facts
  are three sibling lists", against `derive-pool-families.ts`
  (`servingBuildOf`, `statusMatrixOf`, `verdictOf`) — the one place the
  docs restate derivation rules; `docs/DEVELOPMENT.md`, Pools paragraph,
  against the verdict kinds in `pool-family-model.ts`.

### Test Evidence

- Markdown only, no code changed. `npm test` on this branch earlier in the
  session (before the edits, code identical since): UI 615, bridge 112,
  collector 137, guards 76 green.
- Mermaid not rendered locally; the edits add nodes, edges, classes and
  relations in the syntax of the surrounding diagrams only.
- Overlong lines exist only in the layer table and the flowchart, matching
  the existing rows there.
- No temporary probes.

### Open Issues

- Promoted: Pools view explains outcomes only in tooltips (legend wording,
  per-row story, fix hints, Graph pool sub-bands) (→ improvements register)

### Context for Next Task

- `packages-verdicts` must merge `share-pools` after this lands; its own
  projection field `packageVerdicts` and `derivePackageVerdicts` are
  missing from `docs/resolution-data-model.md` the same way and should be
  added on that branch.

### Git State

```
 README.md                     |  9 ++++--
 docs/DEVELOPMENT.md           | 31 +++++++++++++------
 docs/resolution-data-model.md | 71 +++++++++++++++++++++++++++++++++++++++----
 3 files changed, 94 insertions(+), 17 deletions(-)

 M README.md
 M docs/DEVELOPMENT.md
 M docs/resolution-data-model.md
?? docs/assets/store/promo-tile-1400x560.png
?? docs/assets/store/promo-tile-440x280.png
```

### Sessions

- claude-code a813539f-6246-44a3-a9ad-11f039bba1e2 (2026-10-06) — transcript: ~/.claude/projects/-home-lutz-projects-native-federation-devtools/a813539f-6246-44a3-a9ad-11f039bba1e2.jsonl
