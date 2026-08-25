### Task

Store-side amendment task: the `ResolvedCopySource` union variants embed the
remote name of their evidenced source record (`participant` / `ownerRemote`),
copied verbatim at materialization — making the shared copy-source
attribution helpers (`copySourceRemote`/`copySourceDisplay`/`copySourceVmOf`)
pure copy reads with no `CanonicalIndexes` dependency, so source attribution
is readable from `CanonicalResolutionProjection` alone.

### Status

DONE

All four T1.9 acceptance criteria are covered by green tests; the three
consumer view suites (Packages, Remotes, Import Map) pass unmodified, and the
full repository suite is green. An external (Codex) review was triaged
in-session: three findings accepted and fixed (log overclaim reworded,
`rowVersionsOf` dead parameter removed, spec §7 union patched), one
acknowledged and deferred with rationale (isolated helper spec). The plan
amendment that created this task (Task-1.9 insertion + Task-2 rewording) was
committed separately as `d9aa855` before the implementation.

### Files Modified

- `projects/devtools-ui/src/app/shared/store/resolution/copies-model.ts`
  (modified) — `ResolvedCopySource` union widened: `shared-declaration`
  gains `participant: string`, `private-registration` gains
  `ownerRemote: string`; `target-url` stays field-free (absence IS the
  no-evidenced-source statement). Doc comment records the verbatim-copy
  contract and that IDs remain the canonical identity/link anchors.
- `projects/devtools-ui/src/app/shared/store/resolution/materialize-resolved-copies.ts`
  (modified) — the two (only) construction sites embed the names from the
  records already in hand: `declaration.participant` (shared) and
  `privateRegistration.ownerRemote` (private). No fallback path —
  `requireRecord` already guarantees the record exists.
- `projects/devtools-ui/src/app/shared/store/resolution/materialize-resolved-copies.spec.ts`
  (modified) — `sharedDeclarationSource` seed helper returns `participant`
  (flows into the existing deep-equal pins); the scoped-corpus
  private-registration pin extended with
  `ownerRemote: mfe1Registration!.ownerRemote` — both pins now witness
  field == the record the ID resolves to (T1.9-AC-01).
- `projects/devtools-ui/src/app/shared/view-conventions.ts` (modified) —
  `copySourceRemote(copy)`, `copySourceDisplay(copy)`, `copySourceVmOf(copy)`
  drop the `indexes` parameter and read the union fields directly; doc
  comments state the pure-copy-read property (the T7/T8 lift history stays).
- `projects/devtools-ui/src/app/views/packages/packages-row-vm.ts`
  (modified) — call-site mechanics; `mutedNoteOf` and (Codex review fix)
  `rowVersionsOf` lost their now-orphaned `indexes` parameters (callers
  updated).
- `projects/devtools-ui/src/app/views/packages/packages-vm-shared.ts`
  (modified) — call-site mechanics (1 call; re-export untouched).
- `projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts`
  (modified) — call-site mechanics (1 call).
- `projects/devtools-ui/src/app/views/remotes/remotes-detail-vm.ts`
  (modified) — call-site mechanics (3 calls).
- `projects/devtools-ui/src/app/views/import-map/import-map-view-model.ts`
  (modified) — call-site mechanics; `rowSourceOf` lost its now-orphaned
  `indexes` parameter (caller updated).
- `docs/specs/native-federation-resolution-model.md` (modified) — §7
  `CopySource` union updated to the implemented contract (embedded
  `participant`/`ownerRemote` + verbatim-copy prose); the spec is the
  review-triage authority and must not lag the published projection
  (Codex review blind spot).

### Files Read (Context Only)

- `docs/work/graph-view/plan.md` — preamble + Task 2 block (the session
  began as `/start-task 2`; the stale-lift finding there spawned this task).
- `docs/work/graph-view/task-log/task-1-graph-walking-skeleton.md`
  (predecessor) — builder surface, key/id contract, probe-then-pin method.
- `docs/work/resolution-model/task-log/` — `task-8.6` (origin of the zone
  grammar; confirmed the T7→T8 helper lift), `task-7.7` (hue honesty rule,
  color-lookup contract), `task-6` (BundleClaim/ChunkGroup/completeness
  contracts, projection read-surface doctrine).
- `projects/devtools-ui/src/app/shared/view-conventions.ts` — full
  attribution-ladder body (verified `indexes` was used ONLY for the name
  lookup before deciding the fix).
- `projects/devtools-ui/src/app/shared/store/resolution/copies-model.ts`,
  `materialize-resolved-copies.ts` — union shape and construction-site
  feasibility check (evidence already indexed there).
- Call-site regions of the five view VM files (partial reads).

### Key Decisions

- **Origin (session finding during `/start-task 2`):** the Task-2 plan
  wording still mandated lifting `copySourceRemote`/`copySourceVmOf` out of
  `views/remotes/remotes-detail-vm.ts` — but that lift already happened with
  the second consumer (T8); the helpers live in `shared/view-conventions.ts`
  with three consuming views. The one remaining impurity was the source
  record ID → remote-name join through `CanonicalIndexes` (registryEvidence).
  Lutz chose fixing the model over the briefing's options-injection
  workaround; Task 1.9 was inserted via plan amendment (committed separately
  as `d9aa855`, includes the Task-2 rewording to "consume, not lift").
- **Union enrichment over a flat nullable `sourceRemote` field:** the name
  sits inside its evidence variant next to the ID it mirrors; `target-url`
  simply has no name field, so "no evidenced source" stays expressed by the
  union shape instead of a second null convention.
- **No new degree of freedom (construction invariant):** the name is copied
  verbatim from the record the ID references at the single production
  construction site (`sourceFacts` in the materializer). The type enforces
  the field's PRESENCE, not its equality with the record — the guarantee is
  this central construction invariant, witnessed by the materializer spec
  pins (wording corrected per Codex review; originally overclaimed as
  "structurally impossible").
- **Signature simplification over overloads:** the three helpers drop
  `indexes` outright; the seven call sites were updated mechanically, and
  the three thereby-orphaned `indexes` parameters (`mutedNoteOf` and
  `rowVersionsOf` in packages-row-vm, `rowSourceOf` in
  import-map-view-model) were removed with their callers. The
  `rowVersionsOf` orphan — created one level up by the `mutedNoteOf`
  cleanup — was initially missed and surfaced by the Codex review; the
  chain was then verified to end there (`noCopyNoteOf` genuinely needs
  `indexes` via `groupHasMappedClaim`).
- **No new test cases — pins tightened:** total test count is unchanged
  (664); the two touched deep-equal sites in the materializer spec are
  exactly the AC-01 witnesses.

— session 2026-08-24 (Codex review triage)

- Codex review (2 LOW hotspots, 2 blind spots), all four verified against
  the code: **(1) accepted (doc)** — "structurally impossible" overclaimed
  type-level enforcement; reworded to the construction-invariant guarantee
  (bullet above). **(2) accepted, fixed** — `rowVersionsOf` kept a dead
  `indexes` parameter the `mutedNoteOf` cleanup had orphaned one level up;
  removed with its caller and the chain verified complete. **(3) accepted,
  fixed** — spec §7 `CopySource` still showed the name-less union; patched
  to the implemented contract with verbatim-copy prose (the spec is the
  triage authority — task-6 precedent — and must not lag).
  `docs/resolution-data-model.md` was cross-checked on top: it renders
  `ResolvedCopySource` opaquely (type name only, relations as
  "source-record identity" edges) and needs no change. **(4) acknowledged,
  deferred** — no isolated contract spec for the three helpers: the
  signature is compiler-enforced across app + spec builds, all five
  qualifier branches are seed/fixture-witnessed through the three view
  suites, and Task 2's graph-builder specs pin `copySourceVmOf` output
  directly again (bucket mapping); a dedicated `view-conventions` spec
  stays a kit-hygiene candidate (8.6 "acknowledged, deferred" pattern).

### Review Focus

- **Behavior claims:** source attribution renders byte-identically in
  Packages, Remotes, and Import Map (their spec suites pass unmodified);
  the embedded name always equals the record its ID resolves to (single
  construction site + deep-equal pins); the whole qualifier ladder
  (`copySourceVmOf`) reads only the copy — no registry-evidence lookup
  remains anywhere in source attribution.
- **Assumptions / choices:** union enrichment instead of a flat nullable
  field (documented above); removing the three orphaned `indexes`
  parameters counted as call-site mechanics, not scope creep; the missing
  isolated helper spec is an accepted, documented deferral.
- **Scope notes:** the plan amendment (Task-1.9 block + Task-2 rewording)
  is deliberately NOT part of this task's commit — it landed as `d9aa855`.
  The spec §7 patch (`docs/specs/native-federation-resolution-model.md`)
  IS part of this task (review fix — contract doc follows the contract).
  No graph code and no projection top-level shape change anywhere.
- **Read next:** `ResolvedCopySource` + doc comment in `copies-model.ts`
  (the new contract); the `sourceFacts` construction sites in
  `materialize-resolved-copies.ts` (verbatim-copy claim); simplified
  `copySourceRemote`/`copySourceVmOf` in `shared/view-conventions.ts`
  (confirm nothing else needed `indexes`).

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/shared/store/**/*.spec.ts' --watch=false`
  — 16 files / 156 tests green. The first run surfaced exactly the two
  expected pin sites: one compile error (seed helper missing `participant`)
  and one failing deep-equal (private pin missing `ownerRemote`) — both are
  now the AC-01 witnesses; no other store pin moved.
- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/views/packages/*.spec.ts' --include 'projects/devtools-ui/src/app/views/remotes/*.spec.ts' --include 'projects/devtools-ui/src/app/views/import-map/*.spec.ts' --watch=false`
  — 6 files / 193 tests green with UNMODIFIED spec files (T1.9-AC-03).
- `npm test` — full suite green: 37 UI files / 462 tests, 3 bridge files /
  77 tests, 6 collector files / 75 tests, 4 guard files / 50 tests
  (664 total; count unchanged vs. Task 1 — pins tightened, none added).
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit`
  — no diagnostics (ran clean immediately after the call-site edits; the
  esbuild spec compile caught the seed-helper gap instead).
- `prettier --check` on all nine changed files — clean; `git diff --check`
  — clean.
- Grep witness (T1.9-AC-02): no `copySourceRemote(|copySourceVmOf(|copySourceDisplay(`
  call site passes `indexes` anywhere under `src/app`.

— session 2026-08-24 (Codex review triage)

- After the review fixes (`rowVersionsOf` cleanup, spec §7 patch): full
  suite re-run green — 462 UI / 77 bridge / 75 collector / 50 guards
  (664, count unchanged); `tsc --noEmit` no diagnostics; `prettier --check`
  clean on the changed file; `git diff --check` clean; grep confirms
  `rowVersionsOf(group)` is the only remaining form.
- Triage verification evidence: `rowVersionsOf` body read (uses `indexes`
  nowhere); `noCopyNoteOf` body read (uses it via `groupHasMappedClaim` —
  chain ends); spec grep shows §7 held the single stale occurrence of the
  union; model-doc grep/read confirmed the opaque rendering.

### Acceptance Coverage

- **T1.9-AC-01 — passed:** materializer spec pins prove field == resolved
  record for both variants — `sharedDeclarationSource` embeds the
  record-matched `participant` into the existing source deep-equals;
  the scoped-corpus pin asserts `ownerRemote: mfe1Registration!.ownerRemote`.
- **T1.9-AC-02 — passed:** all three helpers accept only the copy (enforced
  by tsc across app + spec builds); grep confirms no indexes-passing call
  site remains.
- **T1.9-AC-03 — passed:** Packages, Remotes, and Import Map suites pass
  unmodified (6 files / 193 tests). Contributes: XC-01.
- **T1.9-AC-04 — passed:** full repository suite green (664); the projection
  top-level shape pin in `build-canonical-projection.spec.ts` ran unchanged
  and green (the union widens inside `copies`, no new collection).

### Open Issues

- Deferred (Codex blind spot, accepted): no isolated contract spec for
  `copySourceRemote`/`copySourceDisplay`/`copySourceVmOf` — coverage is
  compiler-enforced signatures plus seed/fixture witnesses through three
  view suites; a dedicated `view-conventions` spec remains a kit-hygiene
  candidate for a later task.
- (The Task-2 hue-assignment decision is next-task context, not a 1.9
  issue.)

### Context for Next Task

- **The projection-purity Task 2 builds on is now real:**
  `copySourceRemote(copy)`, `copySourceDisplay(copy)`, and
  `copySourceVmOf(copy)` are pure copy reads — the graph builder can call
  them directly on `projection.copies`. The Task-2 briefing's
  options-injection workaround is obsolete; `GraphBuildOptions` stays
  reserved/empty.
- **Bucket-mapping working assumption for Task 2** (verify probe-first):
  qualifier `exact-target-source`/`explicit-anchor` → source-remote cluster;
  `ambiguous-source` → `ambiguous source`; `observed-target-source`
  (disposition `target-only`, scope-prefix observation is not an evidenced
  source) → `target only`; `unknown-source` → `unknown`.
- **Open decision carried into Task 2:** hue-assignment domain.
  Recommendation on the table: hue key = owning remote (source remote /
  emitter) via the kit's `assignParticipantColors` + existing
  `--nf-participant-color-N` tokens; `(host)` and honest buckets neutral
  (T7.7 identity doctrine); all-or-nothing threshold at 8.
- **Type-enforced invariant:** any new `ResolvedCopySource` construction
  site MUST embed the name — the union makes forgetting it a compile error.
- `/commit 1.9` must stage the ten modified files (3× `resolution/`,
  `view-conventions.ts`, 5× view VMs, spec §7 patch) plus this log — the
  plan amendment is already committed (`d9aa855`), nothing else may ride
  along.

### Git State

`git diff --stat`

```text
 docs/specs/native-federation-resolution-model.md   |  9 +++++--
 .../app/shared/store/resolution/copies-model.ts    | 10 ++++++--
 .../resolution/materialize-resolved-copies.spec.ts |  3 ++-
 .../resolution/materialize-resolved-copies.ts      | 12 ++++++++--
 .../devtools-ui/src/app/shared/view-conventions.ts | 28 +++++++++-------------
 .../app/views/import-map/import-map-view-model.ts  |  6 ++---
 .../src/app/views/packages/packages-detail-vm.ts   |  2 +-
 .../src/app/views/packages/packages-row-vm.ts      | 10 ++++----
 .../src/app/views/packages/packages-vm-shared.ts   |  2 +-
 .../src/app/views/remotes/remotes-detail-vm.ts     |  6 ++---
 10 files changed, 51 insertions(+), 37 deletions(-)
```

`git status --short`

```text
 M docs/specs/native-federation-resolution-model.md
 M projects/devtools-ui/src/app/shared/store/resolution/copies-model.ts
 M projects/devtools-ui/src/app/shared/store/resolution/materialize-resolved-copies.spec.ts
 M projects/devtools-ui/src/app/shared/store/resolution/materialize-resolved-copies.ts
 M projects/devtools-ui/src/app/shared/view-conventions.ts
 M projects/devtools-ui/src/app/views/import-map/import-map-view-model.ts
 M projects/devtools-ui/src/app/views/packages/packages-detail-vm.ts
 M projects/devtools-ui/src/app/views/packages/packages-row-vm.ts
 M projects/devtools-ui/src/app/views/packages/packages-vm-shared.ts
 M projects/devtools-ui/src/app/views/remotes/remotes-detail-vm.ts
?? docs/work/graph-view/task-log/task-1.9-projection-pure-copy-source.md
```

### Sessions

- claude-code 508e3d25-0612-4b47-bafb-956812f0159d (2026-08-24) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-native-federation-devtools/508e3d25-0612-4b47-bafb-956812f0159d.jsonl
