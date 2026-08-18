### Task

Resolve one deterministic import-map binding at each canonical consumer scope context and package specifier, retain honest outcome/provenance states, and project mapped results one way into the legacy shared-row contract.

### Status

DONE

All five Task 3 acceptance criteria are covered by green focused and repository-wide tests. The final model names the normalized remote `scopeUrl` honestly as `consumerScopeUrl`: it is the lookup context at the remote's scope root, not an observed importer-module URL or evidence of runtime loading.

### Files Modified

- `.gitignore` (modified) — ignores root-local `/.claude/` configuration; the separate pre-existing `/node_modules` to `node_modules/` edit remains user-owned work in the same file.
- `README.md` (modified) — keeps the registry-evidence and effective-resolution Mermaid diagrams together and explains the four binding outcomes plus the consumer-scope evidence boundary.
- `docs/specs/native-federation-resolution-model.md` (modified) — specifies scope-context identity, exact/prefix lookup, terminal blocked outcomes, provenance, downstream mapping/completeness implications, and the non-delivery boundary.
- `docs/work/resolution-model/plan.md` (modified) — aligns Task 3 ACs and later Tasks 4, 6, 9, and 10 with blocked bindings and consumer-scope terminology.
- `docs/work/resolution-model/task-1-domain-model.md` (modified) — removes the duplicate Mermaid model and links to the two maintained diagrams in the root README.
- `projects/devtools-ui/src/app/shared/store/federation-model.ts` (modified) — publishes `effectiveConsumerResolutions` on `FederationModel` and marks row resolution as a compatibility projection.
- `projects/devtools-ui/src/app/shared/store/ingest.ts` (modified) — builds the canonical resolution collection from registry evidence, document-map ground truth, and normalized remote scope URLs before projecting shared rows.
- `projects/devtools-ui/src/app/shared/store/ingest.spec.ts` (modified) — adds corpus-backed and seeded integration coverage for distinct scope contexts, aliases, blocked top-level entries, missing scope/map evidence, native-mode maps, and compatibility projection.
- `projects/devtools-ui/src/app/shared/store/resolution/model.ts` (modified) — adds branded resolution IDs, scope-context fields, map-entry provenance, and the `mapped | unmapped | blocked | unknown` discriminated union.
- `projects/devtools-ui/src/app/shared/store/resolution/resolve-effective-consumer-bindings.ts` (new) — implements the pure consumer-scope binding resolver with scope fallback, exact/prefix matching, terminal block reasons, deterministic grouping, and hostile-key-safe indexing.
- `projects/devtools-ui/src/app/shared/store/resolution/resolve-effective-consumer-bindings.spec.ts` (new) — pins all Task 3 lookup, state, identity, provenance, determinism, and hostile-key contracts.
- `projects/devtools-ui/src/app/shared/store/resolution/shared-rows-compat.ts` (modified) — removes its duplicate lookup and projects only canonical `mapped` results to legacy `EffectiveResolution`; all other states project to `null`.
- `projects/devtools-ui/src/app/views/import-map/import-map-view-model.spec.ts` (modified) — supplies the seeded remote scope evidence now required after removal of the implicit page-URL fallback.

### Files Read (Context Only)

- `projects/devtools-ui/src/app/shared/store/merge-document-maps.ts` — effective-map merge, key/target normalization, hostile-key behavior, and page-base contract.
- `projects/devtools-ui/src/app/shared/store/merge-document-maps.spec.ts` — corpus and seeded merge expectations used to bound the new resolver.
- `projects/devtools-bridge/src/lib/snapshot-v1.ts` — document-map, remote `scopeUrl`, and sanitized snapshot evidence contracts.
- `projects/collector/src/lib/runtime-schema.ts` — import-map target projection and the boundary for values retained by the collector.
- `projects/collector/src/lib/snapshot-mapper.ts` — conversion of projected map records into string-only DTO entries.
- `projects/collector/src/lib/privacy.ts` — URL sanitization behavior relevant to malformed and relative map targets.
- `docs/work/v2/plan.md` — existing project contract that document-map targets are normalized against the page base.
- `package.json` — repository-wide UI, Bridge, collector, and guard test commands.

### Key Decisions

- `EffectiveConsumerResolution` is keyed once per `(scopeContextKey, specifier)`. Equal normalized remote scope URLs collapse remote aliases into one binding with a sorted `consumerRemotes` list; missing scopes retain deterministic per-consumer sentinels so unrelated unknown contexts never merge.
- The public model uses `consumerScopeUrl`, `scopeContextKey`, and `missing-consumer-scope`. The HTML-algorithm-like helpers retain the internal parameter name `importerUrl` because they evaluate one supplied URL; the public scope URL is explicitly not an observed importer-module URL.
- Missing remote scope evidence never falls back to `capture.pageUrl`. It produces `unknown`, preserving the distinction from a known map/scope context with no applicable binding (`unmapped`).
- `blocked` is a separate terminal outcome for a matching unusable entry. It retains exact scope/key/target/match provenance plus one closed reason: invalid target URL, missing prefix-target slash, invalid prefix expansion, or prefix backtracking. It never falls through to a less-specific scope or top-level entry.
- `unmapped` remains the concise status name; “no applicable import-map binding” is its explanatory wording. The longer `no_importmap_binding` alternative was rejected as redundant and inconsistent with the status vocabulary.
- This model resolves import-map bindings only. It deliberately does not include the browser's final URL-like-specifier fallback, so a URL-like specifier with no matching map entry remains `unmapped` here.
- Document tags are the effective-map ground truth; the captured shim effective map is only a cross-check. An empty shim map in native mode therefore does not erase native document-map bindings.
- Shared rows remain a one-way compatibility projection for existing views. Registry fields still come from canonical evidence, while only a canonical `mapped` outcome supplies the legacy `{ targetUrl, hasIntegrity }`; `unmapped`, `blocked`, and `unknown` project to `null` without erasing their canonical records.
- Scope enumeration, matching, normalization, and assembly remain small pure helpers. Exact matches beat prefixes, longest valid prefixes win, matching scopes fall through after key misses, and own-property/structural encoding prevents prototype or delimiter collisions.
- A full module-edge resolver keyed by actual JavaScript importer URLs was considered and rejected as a Task 3 plan deviation. Modules under more-specific import-map scopes or outside the remote scope may resolve differently; proving those edges would require JavaScript/build-graph analysis or runtime evidence.
- Design rule for the eager/lazy split: the materialized `effectiveConsumerResolutions` collection is nothing more than the image of the pure resolver over the registry claims — every entry stems from a declaration, every field is function-derived, and the list is byte-identically reproducible from the snapshot. Eager materialization at ingest is valid exactly as long as the resolution domain equals that closed claims set; the pure lookup helpers stay module-private until another caller needs a different context.
- A consumer-centric transitive chunk derivation was identified and deferred: when a consumer's `mapped` binding targets a file under another remote's scope, that file's bundle chunks would resolve from the target's context too — a second-order application of the same pure resolver (first-stage `targetUrl` becomes the next lookup context, joined with witnessed `shared-chunks` bundle claims, honoring the `source-only`/no-chunk-list outcome). No new evidence is required, but no view needs the consumer attribution yet; today's chunk area (`chunk-map-join.ts`) answers the owner-centric question (which map entry serves which chunk file). If a view ever needs it, it belongs in the lazy derivation layer, not in ingest.
- The resolution diagrams are maintained together in `README.md`; the Task 1 design note retains detailed registry invariants without duplicating a stale diagram.

### Review Focus

- **Behavior claims:** A known consumer scope and map produce exactly one deterministic `mapped`, `unmapped`, or terminal `blocked` binding per package; missing map/scope evidence produces `unknown` without a page fallback; aliases at one normalized scope share one resolution while distinct scope roots remain distinct.
- **Assumptions / choices:** `consumerScopeUrl` is the normalized remote scope root used as a lookup context, not an observed importer-module URL. Binding lookup intentionally excludes the browser's final URL fallback. Document tags, not an empty native-mode shim map, define the effective map.
- **Scope notes:** README/Task-1 Mermaid consolidation was requested during Task 3. Plan/spec edits also carry `blocked` into later tasks. `/.claude/` ignore is requested hygiene. The other `.gitignore` hunk changing `/node_modules` to `node_modules/` predates Task 3 and must not be attributed or staged without separate confirmation.
- **Read next:** `resolveEffectiveConsumerBindings` and `resolveEffectiveMapMatch` in `resolve-effective-consumer-bindings.ts` — verify grouping and terminal scope/exact/prefix behavior; `EffectiveConsumerResolution` in `model.ts` — verify state-specific fields and scope-context naming; `projectEffectiveResolution` in `shared-rows-compat.ts` — verify the lossy compatibility boundary cannot become a second resolver.

### Test Evidence

- `npm test` — passed on the final code state: 25 UI files / 254 tests, 3 Bridge files / 74 tests, 6 collector files / 75 tests, and 4 guard files / 49 tests (452 tests total). Only the existing odd-numbered Node 25 non-LTS warning was emitted.
- `./node_modules/.bin/ng test devtools-ui --watch=false` — passed after the final consumer-scope rename: 25 files / 254 tests.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — passed with no diagnostics.
- `./node_modules/.bin/prettier --check` on the changed resolver/model/specification/plan files — passed. The root README's newly added model section matches Prettier output; unrelated pre-existing README formatting remains untouched.
- `git diff --check` — passed.
- `git check-ignore -v .claude .claude/settings.local.json` — both paths match the new root-specific `/.claude/` rule.
- Independent read-only H1 review found no error in the terminal blocked path, provenance/reason retention, scope fallback, or compatibility projection. It recorded only the separate collector boundary for discarded null/non-string targets.
- Manual diff review confirmed that the final naming pass changed public scope-context vocabulary and deterministic ID tags only; the spec-like lookup helpers keep `importerUrl`, and no old field, reason, or sentinel literal remains.

### Acceptance Coverage

- **T3-AC-01 — passed:** `resolveEffectiveConsumerBindings — import-map lookup` / “applies exact/prefix precedence and falls through scopes from specific to top-level” pins exact-over-prefix, longest prefix, prefix suffixing, scope boundary/applicability, less-specific and top-level fallback, plus terminal invalid exact/prefix/backtracking traps. Contributes to XC-01 and XC-02.
- **T3-AC-02 — passed:** `resolveEffectiveConsumerBindings — honest states` distinguishes missing map and consumer scope from a true miss, forbids page fallback, preserves URL-like map misses as `unmapped`, and the integration specs pin unavailable document-map evidence plus a top-level `blocked` result. Contributes to XC-02 and XC-06.
- **T3-AC-03 — passed:** `resolveEffectiveConsumerBindings — consumer identity` and the `co-declared-share`/alias ingest specs prove one resolution for aliases at one normalized scope context and two resolutions for distinct remote scope roots. Contributes to XC-03.
- **T3-AC-04 — passed:** `resolveEffectiveConsumerBindings — provenance and determinism` proves the exact contributing entry, integrity flag, stable structural IDs, and byte-stable ordering; blocked unit/integration cases also retain deciding entry provenance and closed reasons. Contributes to XC-02.
- **T3-AC-05 — passed:** `resolveEffectiveConsumerBindings — hostile keys` proves own-property-only lookup and collision-free structural identity for `__proto__`, constructor-like, pipe-bearing, and delimiter-collision inputs. Contributes to XC-02 and XC-04.

### Open Issues

- Null/non-string import-map targets are removed by collector sanitization before `EffectiveMap` construction, so the resolver cannot retain their key/provenance and sees them as absent. Representing them as `blocked` would require an additive collector/DTO/effective-map evidence change; this is not a Task 3 resolver blocker and has no assigned follow-up task.
- The pre-existing `allFilesMapped` chunk join in `ingest.ts` still falls back from a missing owning-remote scope to `pageUrl`. The same fallback pattern exists in `chunk-map-join.ts` (page base when the owning remote is not in the registry). Both are a different join from consumer binding resolution and were intentionally left outside Task 3; no follow-up task is assigned yet.
- No blocking product or acceptance issues remain.

### Context for Next Task

- `resolveEffectiveConsumerBindings(evidence, { pageUrl, mapAvailable, effectiveMap, consumerScopeUrlByRemote })` is the sole canonical consumer-scope binding entry point. Its result is one `EffectiveConsumerResolution` per structural scope-context/specifier key.
- Public result fields are `scopeContextKey`, `consumerScopeUrl`, `specifier`, and sorted `consumerRemotes`. The four-state union adds `targetUrl`/`hasIntegrity`/`mapEntry` for `mapped`, retained `mapEntry`/`blockedReason` for `blocked`, and `unknownReasons` for `unknown`.
- `consumerScopeUrl` is the normalized `remote.scopeUrl` evaluated at the scope root. It must not be described as an observed JavaScript importer or proof of a request, download, evaluation, or use; modules under more-specific scopes or outside the remote scope may differ.
- Task 4 must derive declaration claims from canonical resolutions, never rerun import-map lookup. A `blocked` result has no target/source attribution, is a distinct mapping state, and must never enter global-skip self-fill as though it were `unmapped`.
- `projectSharedRows` requires the complete resolution collection and throws on missing/duplicate consumer+specifier coverage. It intentionally projects only `mapped`; existing views still consume the legacy nullable row field until later tasks migrate them.
- Resolution IDs intentionally changed before the first Task 3 commit: present scopes use the `scope-context` tag and missing contexts use `missing-scope-context`. No test goldens pin the retired tag literals.
- `/commit 3` must treat `.gitignore` specially: stage the requested `/.claude/` hunk, but do not silently include the pre-existing `node_modules/` hunk without user confirmation.

### Git State

`git diff --stat`

```text
 .gitignore                                         |   5 +-
 README.md                                          | 194 ++++++++++++++
 docs/specs/native-federation-resolution-model.md   | 176 ++++++++-----
 docs/work/resolution-model/plan.md                 |  39 +--
 docs/work/resolution-model/task-1-domain-model.md  |  65 +----
 .../src/app/shared/store/federation-model.ts       |  20 +-
 .../src/app/shared/store/ingest.spec.ts            | 279 ++++++++++++++++++++-
 .../devtools-ui/src/app/shared/store/ingest.ts     |  11 +-
 .../src/app/shared/store/resolution/model.ts       |  79 ++++++
 .../shared/store/resolution/shared-rows-compat.ts  |  94 ++++---
 .../views/import-map/import-map-view-model.spec.ts |   5 +-
 11 files changed, 769 insertions(+), 198 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M README.md
 M docs/specs/native-federation-resolution-model.md
 M docs/work/resolution-model/plan.md
 M docs/work/resolution-model/task-1-domain-model.md
 M projects/devtools-ui/src/app/shared/store/federation-model.ts
 M projects/devtools-ui/src/app/shared/store/ingest.spec.ts
 M projects/devtools-ui/src/app/shared/store/ingest.ts
 M projects/devtools-ui/src/app/shared/store/resolution/model.ts
 M projects/devtools-ui/src/app/shared/store/resolution/shared-rows-compat.ts
 M projects/devtools-ui/src/app/views/import-map/import-map-view-model.spec.ts
?? docs/work/resolution-model/task-log/task-3-effective-consumer-bindings.md
?? projects/devtools-ui/src/app/shared/store/resolution/resolve-effective-consumer-bindings.spec.ts
?? projects/devtools-ui/src/app/shared/store/resolution/resolve-effective-consumer-bindings.ts
```
