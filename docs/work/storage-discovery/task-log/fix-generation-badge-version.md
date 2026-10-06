# Fix: generation badge prefers the reported orchestrator version

### Task
Show the orchestrator version the runtime reports (`runtimeSource.orchestratorVersion`,
orchestrator >= 4.7) on the capture-status badge, and keep the registry-format generation
(`v4` / `v4.5`) as the pre-4.7 fallback.

### Status
DONE. Independent review not performed; the user reviewed the proposal and the resulting
behavior in conversation. UI suite green on the final code (see Test Evidence).

### Root Cause
A visibility gap left by Task 4, not a defect in the data: the descriptor version was captured
into `runtimeSource.orchestratorVersion` but surfaced only in the tooltip of the source badge,
which renders only for non-default sources. On a 4.7 page with default storage, the common
case going forward, the exact version was captured yet invisible, while the generation badge
kept showing the coarser format inference (`v4.5`). Two evidences for one fact, the better
one hidden.

### Files Modified
- `projects/devtools-ui/src/app/shell/capture-status.ts` (modified) — new `generationBadge()`
  picks one evidence: the reported version wins, the format generation is the pre-4.7
  fallback, `unknown` still hides the badge; `CaptureStatusVm.generation` becomes
  `GenerationBadgeVm` (label + tooltip); the version is dropped from the source-badge tooltip.
- `projects/devtools-ui/src/app/shell/capture-status-strip.html` (modified) — binds
  `generation.label` and `generation.tooltip` instead of the fixed title text.
- `projects/devtools-ui/src/app/shell/capture-status.spec.ts` (modified) — expectations on the
  new badge shape; two new cases (reported version wins, also on a page without participants;
  `mixed` hint in the tooltip); source-badge tooltips without the version.

### Files Read (Context Only)
- `projects/devtools-ui/src/app/shared/store/derived-model.ts`, `derivations.ts` —
  `generationBadge` is the format inference from `provenance.generation`; unchanged.
- `projects/collector/src/lib/snapshot-mapper.ts` — `deriveGeneration` (spelling inference) and
  where `runtimeSource.orchestratorVersion` comes from.
- `projects/devtools-bridge/src/lib/snapshot-v1.ts` — `GenerationV1`, `RuntimeSourceV1`.
- `projects/devtools-ui/src/app/shell/capture-status-strip.ts` — VM input, unchanged.
- `projects/devtools-ui/src/app/app.spec.ts` — rendered-badge tests on `v4` / `v4.5` use fixtures
  without a reported version and stay valid.

### Key Decisions
- Precedence lives in the view-model builder, not in the derived model: choosing which
  provenance fact to label is a presentation judgement under the documented view-model
  boundary (`docs/resolution-data-model.md`). `derived.generationBadge` stays the format
  inference with its `generation-aggregate` rule tag.
- One badge, one evidence, never both labels. The version wins because it is the runtime's
  self-report; the format generation is the pre-4.7 inference. The rationale is the doc
  comment on `generationBadge()`.
- `mixed` survives only in the tooltip when the version wins; without a version it stays the
  label as before.
- The version was removed from the source-badge tooltip so it is stated in exactly one place.
- Accepted behavior change: a page with a reported version but no participants
  (`generation: 'unknown'`, e.g. fixture `synthetic-local-storage`) now shows the badge;
  `unknown` used to suppress it unconditionally.
- Type named `GenerationBadgeVm` (suffix like `CaptureStatusVm`) to avoid colliding with
  `GenerationBadge` in `derived-model.ts`.
- Rejected: keep `generation: SnapshotGenerationV1 | null` and add a separate `version` field.
  The precedence would then sit in the template; the builder is the pure, tested place.

### Review Focus
- **Behavior claims:** (1) When the descriptor reports a version, the strip badge shows it with
  the tooltip "reported by the runtime". (2) Without a reported version the badge shows
  `v4` / `v4.5` / `mixed` with the tooltip "inferred from the registry format", and `unknown`
  hides it as before. (3) The source badge tooltip no longer carries the version.
- **Plan deviations:** No plan (fix lane).
- **Assumptions / choices:** tooltip wording; `mixed` only as a tooltip hint; badge visible for
  `unknown` + version.
- **Scope notes:** the source-badge tooltip wording from Task 4 changed intentionally (version
  removed); `app.spec.ts` untouched because its fixtures carry no reported version.
- **Read next:** `generationBadge()` in `capture-status.ts` (the precedence and its comment);
  `capture-status.spec.ts` › "prefers the reported orchestrator version over the inferred
  generation" (both branches incl. the unknown-generation page);
  `capture-status-strip.html` (title binding keeps the link suffix).

### Test Evidence
- `npx ng test devtools-ui --watch=false --include='**/shell/capture-status.spec.ts' --include='**/app.spec.ts'`
  → 2 files, 28 tests passed.
- `npx ng test devtools-ui --watch=false` (final code) → 37 files, 514 tests passed. The graph
  cap-message timeout noted in the Task 1 and Task 4 logs did not occur in this run.
- `prettier --write` on the three touched files only.
- No temporary probes.

### Open Issues
None.

### Context for Next Task
- `CaptureStatusVm.generation` is `GenerationBadgeVm | null` (label + tooltip), no longer the
  closed `SnapshotGenerationV1` union; the template appends the "opens the Native Federation
  site" suffix to the tooltip.
- Gotcha: `generation: 'unknown'` no longer guarantees a hidden badge.
- Idea, not scheduled: a Diagnostics finding when the inferred generation contradicts the
  reported version (e.g. `v4` spelling on a page reporting 4.7.0).

### Git State
```
$ git diff --stat
 .../src/app/shell/capture-status-strip.html        |  4 +-
 .../src/app/shell/capture-status.spec.ts           | 71 +++++++++++++++++++---
 .../devtools-ui/src/app/shell/capture-status.ts    | 40 ++++++++++--
 3 files changed, 99 insertions(+), 16 deletions(-)

$ git status --short
 M projects/devtools-ui/src/app/shell/capture-status-strip.html
 M projects/devtools-ui/src/app/shell/capture-status.spec.ts
 M projects/devtools-ui/src/app/shell/capture-status.ts
?? docs/assets/store/promo-tile-1400x560.png
?? docs/assets/store/promo-tile-440x280.png
```
The two untracked promo tiles are unrelated to this fix.

### Sessions
- claude-code 45166028-6227-45ac-9e93-4b72896a4241 (2026-10-06) — transcript: ~/.claude/projects/-home-lutz-projects-native-federation-devtools/45166028-6227-45ac-9e93-4b72896a4241.jsonl
