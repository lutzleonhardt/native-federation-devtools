### Task

Add the package-verdicts layer (`derivePackageVerdicts`,
`CanonicalResolutionProjection.packageScopeVerdicts`) to the resolution
data-model documentation, which task 7 of this branch left out.

### Status

DONE

Content-only change; no independent review performed. Done right after
merging `share-pools` (`4c2ee79`), whose docs commit added the pooling
layers to the same document.

### Root Cause

Task 7 ("README, development notes and Packages screenshots") updated the
Packages wording in `README.md` and `docs/DEVELOPMENT.md` but not
`docs/resolution-data-model.md`, so the maintained model doc showed a
Derive stage and a projection without the branch's new derivation and
field. The same omission had just been fixed for the pooling layers on
`share-pools` (`docs-pools-tab`), which made it visible here.

### Files Modified

- `docs/resolution-data-model.md` (modified) — big-picture flowchart gains
  the verdicts node and the Derive text its sixth sub-question; layer
  table gains Package verdicts; view 5 lists `packageScopeVerdicts` with
  `PackageScopeVerdicts`, `VersionVerdict` and `DeclarationVerdictRecord`
  classes and their relations; one paragraph states what is read off the
  row action, that the `semver` range check is the only computation
  (`reuses-shared` vs `out-of-range`), and how `merged`, `torn` and
  `unknown` arise.

### Files Read (Context Only)

- `docs/work/packages-verdicts/plan.md` (stored-data table), task-7 log
- `shared/store/resolution/{verdict-model,derive-package-verdicts,projection-model,build-canonical-projection}.ts`,
  `shared/store/ingest.ts` (the branch's diff against `share-pools`)

### Key Decisions

- **Same placement as the pooling layers:** documented inside view 5 plus
  the big picture and the layer table, no sixth class-diagram view, so
  "five views" stays true in both docs.
- **Wording follows the plan's evidence table:** every verdict is tied to
  the stored row action; the doc names the range check as the one
  computation, mirroring the pooling paragraph above it, so a reader sees
  the same rule in both places.
- **Fix lane on this branch, not a task-7 amendment:** task 7 is committed
  (`e8e5628`); the single-commit rule is kept by closing the gap as its own
  item.

### Review Focus

- **Behavior claims:** the data-model doc now names every projection field
  the branch publishes; its verdict paragraph states which verdicts are
  read and which one is computed.
- **Plan deviations:** No plan (fix lane).
- **Assumptions / choices:** the diagram shows three of the verdict-model
  classes (`PackageScopeVerdicts`, `VersionVerdict`,
  `DeclarationVerdictRecord`); `VersionBuild`, `TornEntrypoint` and the
  file records are named in prose only.
- **Scope notes:** None beyond the one file.
- **Read next:** `docs/resolution-data-model.md`, paragraph "Package
  verdicts restate the resolver's own decisions", against the verdict
  doc comments in `verdict-model.ts` (`DeclarationVerdict`,
  `VersionStatus`).

### Test Evidence

- Markdown only, no code changed; the branch's suites were green at task 7
  (UI 638, bridge 105, collector 102, guards 81) and the merge of
  `share-pools` touched docs only.
- Mermaid not rendered locally; the edits add nodes, classes and
  relations in the syntax of the surrounding diagrams.
- No temporary probes.

### Open Issues

None.

### Git State

```
 docs/resolution-data-model.md | 59 ++++++++++++++++++++++++++++++++++++++-----
 1 file changed, 53 insertions(+), 6 deletions(-)

 M docs/resolution-data-model.md
?? docs/assets/store/promo-tile-1400x560.png
?? docs/assets/store/promo-tile-440x280.png
```

### Sessions

- claude-code a813539f-6246-44a3-a9ad-11f039bba1e2 (2026-10-06) — transcript: ~/.claude/projects/-home-lutz-projects-native-federation-devtools/a813539f-6246-44a3-a9ad-11f039bba1e2.jsonl
