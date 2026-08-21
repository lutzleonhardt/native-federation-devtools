### Task

Research-only: source-verify, against the official Native Federation repos, which config options produce the three Remotes capability evidences (dense chunking / dense externals / SRI), and record the final `(config: …)` tooltip strings with concrete source references as a dated amendment in the Remotes redesign mock.

### Status

DONE

All three capabilities were derivable from source — no "not derivable from source" entry was needed; every tooltip ships with its `(config: …)` suffix. Both acceptance criteria are covered by the amendment plus a reproducible `git grep`-at-tag protocol (recorded under Test Evidence).

### Files Modified

- `docs/work/resolution-model/design/remotes-view-redesign-mock.md` (modified) — appended the dated "Task 8.5 amendment (2026-08-21)" section: final tooltip strings for dense chunking / dense externals / SRI, per-capability source references (repo + tag + file + line), the deliberate same-flag explanation for the two dense capabilities, the explicit NOT-the-producer record for `features.denseExternals`/`convertFlatSharedInfo`, and consequences (version-prefix convention `core v<X>`; stale `angular-architects` pointer noted).

NOT part of this task's commit: `docs/work/resolution-model/plan.md` (+4 reference lines) and the new `docs/work/resolution-model/design/pooling-anchor-explainer.md` — a separate, user-requested docs/plan amendment (pooling-anchor ground text for Tasks 8.6/9/10) that lands as its own `plan:`-style commit after `/commit 8.5`. The pre-existing user-owned `.gitignore` hunk stays unstaged as always.

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble + Task 8.5 block only (task isolation).
- Task log 8 (predecessor; capability rules and their canonical grounding) and task log 7.8 via targeted grep (prior double-opt-in provenance in the dense-entries fixture header — treated as CONFIRM candidates, not as verification).
- `projects/devtools-ui/src/app/views/remotes/remotes-detail-vm.ts` (`capabilitiesOf`, L200–227 — unchanged; the three detection rules this task grounds).
- `projects/collector/src/lib/runtime-schema.ts` — raw field names (`shared-chunks` map, provider `bundle`, per-remote `integrity`) to search for the right writers.
- External read-only checkouts under `/home/lutz/projects/nf/` (not committed, not modified): `native-federation-core` (tag v4.4.0; contract, `with-native-federation.ts`, `build-for-federation.ts`, `bundle-shared.ts`, `bundle-exposed-and-mappings.ts`, `densify-externals.ts`, `internal/browser.ts`) and `orchestrator` (tag v4.6.0; `mode.contract.ts`, `mode.config.ts`, `remote-entry-provider.ts`, `store-remote-entry.ts`, `chunk.repository.ts`), plus both repos' git histories (`git log -S`, `git tag --contains`, `git show <tag>:<path>`).

### Key Decisions

- **Local checkouts instead of a fresh clone:** `/home/lutz/projects/nf/` already held the official `native-federation`-org repos; orchestrator v4.6.0's `pnpm-lock.yaml` resolves `@softarc/native-federation@4.4.0`, so core tag v4.4.0 is exactly the released core in play — no network/sandbox bypass was needed. The plan's "angular-architects/native-federation" pointer is stale (org migration); verified against the official org repos.
- **The prior was wrong and the amendment says so explicitly:** the assumed mapping "dense externals ← `features.denseExternals`" does not survive source contact. The participant `bundle` is stamped ONLY under `if (buildOptions.chunks && config.features.denseChunking)` (`bundle-shared.ts:277` @ v4.4.0; repo-wide sweep at the tag shows no other assignment). `features.denseExternals` (since v4.3.0) only switches the remoteEntry.json `shared` wire format to dense registrations (`entries` maps) and preserves-but-never-creates `bundle`; host-side `convertFlatSharedInfo` likewise. Both dense capability tooltips therefore cite `features.denseChunking` — one build feature, two observable facets — and the amendment records the NOT-the-producer evidence to keep the plausible-but-wrong mapping from resurfacing.
- **SRI since-version names the flag, not the capability:** the capability appeared in core v4.1.0 as builder option `fedOptions.integrity` (commit 0952e1f) and became the `federation.config` flag `features.integrityHashes` in v4.1.2 (commit b88224b). The tooltip says "since core v4.1.2" because that is when the cited flag name came to exist; the history is recorded in the amendment.
- **Orchestrator versions stay out of the tooltips:** runtime storage of chunk lists, provider `bundle`, and per-remote integrity is unconditional (no config) and exists since the orchestrator 4.0.0 RCs — older than every emitting flag, so build-side config alone determines the capability. Version prefix convention in tooltips: `core v<X>`.
- **Line numbers cite the tag, not the working tree:** core HEAD is v4.4.0 + 2 doc/test commits and drifts by one line in `with-native-federation.ts`; all cited line numbers were re-pinned via `git show v4.4.0:<path>` / `git grep <flag> v4.4.0`.
- **Memory updated:** `orchestrator-registry-semantics` gained a "Capability-Provenienz ≠ Flag-Naming" bullet pointing at the amendment (witness consequence: dense-capability captures need `denseChunking`; multi-entry registrations need `denseExternals`/`convertFlatSharedInfo` — two different opt-ins).

### Review Focus

- **Behavior claims:** every `(config: …)` string in the amendment names a flag that verifiably exists at the cited tag+path and gates the emitting code path of exactly that capability evidence; no orchestrator config is required for any of the three; no speculative flag name appears anywhere.
- **Assumptions / choices:** tooltip version prefix `core v<X>` disambiguates the two-package versioning within the plan's `since v<X>` convention; SRI's since-version names the flag's introduction (v4.1.2), not the capability's (v4.1.0) — both recorded; the two dense tooltips deliberately cite the same flag.
- **Scope notes:** no production/UI code changed (research-only per plan); the worktree additionally carries the pooling-anchor explainer + 4 plan reference lines (separate commit, see Files Modified) and the untouched user-owned `.gitignore` hunk.
- **Read next:** the amendment section in `remotes-view-redesign-mock.md` (the deliverable — check tooltip strings against the convention precedent); `bundle-shared.ts:275–281` @ core v4.4.0 (the single gate behind both dense capabilities); the NOT-the-producer paragraph (the load-bearing negative claim).

### Test Evidence

No automated tests (research task; no code changed). Evidence is the reproducible `git grep`-at-tag protocol against the local checkouts (`native-federation-core` = core, `orchestrator`):

```
(core) git grep -n 'features.denseChunking' v4.4.0 -- src/lib/core/build/bundle-shared.ts src/lib/core/build/bundle-exposed-and-mappings.ts
  v4.4.0:src/lib/core/build/bundle-exposed-and-mappings.ts:157:  if (config.chunks && config.features.denseChunking) {
  v4.4.0:src/lib/core/build/bundle-shared.ts:275:  if (buildOptions.chunks && config.features.denseChunking) {
(core) git show v4.4.0:src/lib/config/with-native-federation.ts | grep -n …
  23:  const chunks = config.chunks ?? true;
  41:      denseChunking: config.features?.denseChunking ?? false,
  43:      integrityHashes: config.features?.integrityHashes ?? false,
(core) git show v4.4.0:src/lib/core/build/bundle-shared.ts | grep -n …
  277:      external.bundle = buildOptions.bundleName;
  280:      exportedChunks = { [buildOptions.bundleName]: getChunkFileNames(chunks) };
  289:  const integrity = config.features.integrityHashes
(core) git grep -n 'denseChunking' v4.0.0 -- packages/core/src/lib/…   → default false + gate already at released v4.0.0 (L33/L154)
(core) git grep -n 'features.integrityHashes' v4.4.0 -- src/lib/core/build/build-for-federation.ts → L86
(core) git grep -n 'integrityHashes' v4.1.2 -- packages/core/src/lib/config/with-native-federation.ts → L34 (introducing release)
(core) git grep -n 'features.denseExternals' v4.3.0 -- … → build-for-federation.ts:145, with-native-federation.ts:36 (default false)
(core) git grep -n '\.bundle *=\|bundle:' v4.4.0 -- src (non-spec) → ONLY bundle-shared.ts:277 (stamp) + densify-externals.ts:58 (preserve)
(orch) git grep -n 'convertFlatSharedInfo' v4.6.0 -- … → mode.config.ts:29 (default false), remote-entry-provider.ts:29 (fetch-time densify)
(orch) git grep -n 'addSharedChunksToStorage\|integrity ? { integrity }' v4.6.0 -- src/lib/core/2.app/steps/store-remote-entry.ts → L86/L96/L116 (unconditional storage)
```

Introducing releases via `git log --reverse -S<flag>` + `git tag --contains | sort -V | head -1`: `denseChunking` → v4.0.0 (86819a3 opt-out, 2663997 opt-in, both in tag v4.0.0); `denseExternals` → v4.3.0 (71ad9ec "Dense externals format for remoteEntry.json"); `integrityHashes` → v4.1.2 (b88224b, replacing `fedOptions.integrity` from v4.1.0/0952e1f); `convertFlatSharedInfo` → orchestrator v4.5.0 (400503f "Support for core v4.3.0"). Orchestrator storage intros: shared-chunks defebf7, provider `bundle` 2e01ea9 (both 4.0.0-RC3).

Full protocol also archived this session at `scratchpad/task-8.5-ac02-grep-protocol.md` (session-local; this log is the durable record).

### Acceptance Coverage

- **T8.5-AC-01 — passed:** the amendment lists, for each of dense chunking / dense externals / SRI, a final tooltip string with exact flag name, default, and since-version plus concrete source references (repo + tag + file path + line); the "not derivable from source" branch was not needed for any capability.
- **T8.5-AC-02 — passed:** every `(config: …)` claim reproduces via `git grep <flag> <tag> -- <path>` at the cited location (protocol above); the exclusivity sweep additionally proves no uncited producer exists for the `bundle` field.

### Open Issues

- The plan text's "angular-architects/native-federation on GitHub" pointer is stale (repos live in the `native-federation` org) — noted in the amendment; a plan wording touch-up can ride along with any future plan amendment, not worth its own edit.
- Both dense capabilities citing one flag means the Remotes UI will show two capability words that toggle together; if Task 8.6's screenshot review finds that confusing, merging them into one capability word would be a presentation decision for its amendment loop (canonical detection rules stay as they are).

### Context for Next Task

- **Task 8.6 may treat the `(config: …)` strings as final** — no further research needed; copy them verbatim from the amendment's "Final tooltip strings" list. The existing `capabilitiesOf` notes in `remotes-detail-vm.ts` are the tooltip bodies; the amendment adds only the config suffixes.
- **Provenance in one line:** dense chunking AND dense externals ← `features.denseChunking: true` (default false, since core v4.0.0; dense chunking additionally requires `chunks` not disabled, default true); SRI ← `features.integrityHashes: true` (default false, since core v4.1.2). `features.denseExternals` und `feature.convertFlatSharedInfo` betreffen nur das dense Registrierungs-Format (entries maps), nie das `bundle`-Feld.
- **For a future dense lab capture** (7.8 open item): build with `features.denseChunking: true` to witness the dense capabilities; `features.denseExternals: true` for multi-entry registrations — two independent opt-ins.
- The separate pooling-anchor explainer (`design/pooling-anchor-explainer.md`, referenced from Tasks 8.6/9/10 as of the follow-up plan commit) is unrelated to this task's ACs but shares the same source-verification method and checkout provenance.
- `/commit 8.5` stages exactly `docs/work/resolution-model/design/remotes-view-redesign-mock.md` plus this log — NOT `plan.md`, NOT the explainer (they form the follow-up `plan:` commit), and NOT the user-owned `.gitignore` hunk.

### Git State

`git diff --stat`

```text
 .gitignore                                         |   2 +-
 .../design/remotes-view-redesign-mock.md           | 114 +++++++++++++++++++++
 docs/work/resolution-model/plan.md                 |   4 +
 3 files changed, 119 insertions(+), 1 deletion(-)
```

`git status --short`

```text
 M .gitignore
 M docs/work/resolution-model/design/remotes-view-redesign-mock.md
 M docs/work/resolution-model/plan.md
?? docs/work/resolution-model/design/pooling-anchor-explainer.md
```
