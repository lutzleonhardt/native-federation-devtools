### Task

Enforce the single-truth cutover: delete the last temporary compatibility layer (`sharedRows`/`SharedParticipantRow`, `derivations.ts`, `derived-model.ts`, `shared-rows-compat.ts`, `store.derived()`, the ingest's `allFilesMapped` legacy chunk/scoped-package rows), move the shell's generation badge onto `model.provenance.generation`, and lock the boundary with two new guards — a view-model boundary guard (canonical types + Store façade only) and a resolution-vocabulary guard (no delivery/cost wording) — each with seeded failing cases; the full check chain (corpus validator, fixture drift, `npm test`, extension build, panel bundle) stays green.

### Status

DONE

All three Task-11 acceptance criteria (T11-AC-01, -05, -06) are covered by green tests; T11-AC-02/03/04 moved to Task 11.5 by the 2026-08-26 plan amendment (decided with Lutz at task start, written into `plan.md` before implementation). The Codex quick review (same day) was answered in a second round: bridge allow-list instead of deny-list, dynamic imports, a `raw-snapshot-access` rule (with `app.ts` moved onto `model.provenance`), a string-aware tokenizer, `shell/` + `app.html` in the vocabulary scope, and the responsibility map of the deleted derivations suite (below); the AST rewrite was rejected. Ready for `/commit 11`.

### Files Modified

- `docs/work/resolution-model/plan.md` (modified) — plan amendment 2026-08-26: preamble note "Task 11 split", slimmed Task-11 block (dependency line corrected — Task 10 is deferred, the graph view is covered retroactively; source-verified deletion inventory; AC numbering keeps its gaps), new Task 11.5 block (T11.5-AC-01..03 = former T11-AC-02..04, spec files only over the existing 13 fixtures, break-point DOM → 11.6).
- `guards/source-text.ts` (new) — shared scanner helpers: `splitSourceLayers`, a single-pass tokenizer (states code / line comment / block comment / single / double / template literal, escape-aware) that returns two line-stable layers — `code` (comments blanked, strings intact, so import specifiers stay readable) and `strings` (only string literals) — plus HTML-comment stripping and `lineOf`. Replaced the first round's regex heuristics (`stripComments` + `stringLiteralsOnly`) after the Codex finding that a string like `'/* loaded */'` was blanked as a comment.
- `guards/view-model-boundary.ts` (new) — T11-AC-01 scanner: bridge imports outside the ALLOW-list `BRIDGE_ALLOWED_SYMBOLS` (`ChannelStateV1, ChannelsV1, SnapshotGenerationV1, GenerationV1, FIXTURES, FixtureId, PRIMARY_FIXTURE_ID, fixtureIdFromQuery, NF_HOST` — a new raw type is denied by default; type imports count), `store/ingest`, `store/derivations|derived-model`, deep imports into `store/resolution/<module>`, VALUE imports from the `resolution` barrel (type imports stay allowed), dynamic `import('…')` of the same modules, `raw-snapshot-access` (`.snapshot` of the capture state — `state().snapshot.runtime`, `state.snapshot.capture` — with a negative look-ahead for Angular's `ActivatedRoute.snapshot.<queryParamMap|data|…>`), and the retired identifiers (`SharedParticipantRow|sharedRows|DerivedFederation|deriveFederation|projectSharedRows|SharedRowFacts`, `.derived()`); multi-line import statements parsed, comments ignored.
- `guards/view-model-boundary.spec.ts` (new) — tree scan over production `.ts` under `views/`, `shell/`, `shared/view-conventions.ts`, `app.ts` (specs excluded — they build models through the ingest on purpose; >20 files pinned) plus one negative test per rule — incl. `CaptureMetaV1`/`ServedFileV1`/`SNAPSHOT_PROVIDER` (denied by the allow-list), three dynamic imports, raw access through `state.snapshot.capture` / `state().snapshot` vs. router `snapshot.queryParamMap`/`snapshot.data` (not flagged) — and an allow-list test (canonical vocabulary, Store façade, the allowed bridge symbols, `state().status`, `model.provenance`, URLs containing `store/ingest`).
- `guards/resolution-vocabulary.ts` (new) — T11-AC-05 scanner: `served by|loaded|delivered|downloaded|fetched|executed|wire cost|byte size|cache hit` (case-insensitive, word-bounded); templates scanned as rendered text minus HTML comments, sources in the tokenizer's `strings` layer only (doctrine comments that NAME the words stay legal; comment-LOOKING strings are flagged).
- `guards/resolution-vocabulary.spec.ts` (new) — tree scan over `views/**` and `shell/**` (`.html` + non-spec `.ts`), `shared/kit/**`, `shared/view-conventions.ts`, `app.html` (>25 files pinned); negative tests for template text, attributes, string/template literals; tokenizer edge pins (`'/* loaded */'` and `"// served by"` flagged; a comment apostrophe does not swallow the next string; a regex literal ending in `\//` is no comment start; block comments never leak); comment/identifier/HTML-comment non-hits.
- `projects/devtools-ui/src/app/shared/store/derivations.ts` (deleted) — legacy `deriveFederation` (providers, arrows, chunk ladder, badges, conflicts).
- `projects/devtools-ui/src/app/shared/store/derivations.spec.ts` (deleted) — its T7-era pins; the XC-02 spelling-equivalence pin is canonically covered by `normalize-registry-evidence.spec.ts` ("normalizes v4 and v4.5 spellings uniformly"), nothing ported.
- `projects/devtools-ui/src/app/shared/store/derived-model.ts` (deleted) — `DerivedFederation`, `SharedRowFacts`, and the rule-tagged legacy types.
- `projects/devtools-ui/src/app/shared/store/resolution/shared-rows-compat.ts` (deleted) — the one-way `projectSharedRows` adapter from Task 1.
- `projects/devtools-ui/src/app/shared/store/resolution/index.ts` (modified) — compatibility export removed; header no longer lists the outbound legacy projection.
- `projects/devtools-ui/src/app/shared/store/federation-model.ts` (modified) — `EffectiveResolution`, `SharedParticipantRow`, `ScopedPackageRow`, `ChunkOrigin`, `ChunkGroup` and the fields `sharedRows`, `scopedPackages`, `chunkGroups` removed (the latter two had no consumer outside the store — every view reads `resolutionProjection.chunkGroups`); unused `GenerationV1`/`ServedFileV1` imports dropped; header describes the canonical pipeline.
- `projects/devtools-ui/src/app/shared/store/federation-store.ts` (modified) — `derived` computed and its imports removed; docblock rewritten for the surviving three layers (state → model → vm).
- `projects/devtools-ui/src/app/shared/store/ingest.ts` (modified) — `projectSharedRows`, `allFilesMapped`, `collectTargets`/`mapTargets`, `CHUNK_PSEUDO_PACKAGE_PREFIX`, and the legacy scoped-package/chunk-group loops removed; header rules restated canonically (registry read once into evidence, raw order retained, chunk groups via `deriveChunkGroups`, entrypoint candidates carry the spellings).
- `projects/devtools-ui/src/app/shared/store/ingest.spec.ts` (modified) — every legacy pin re-read against canonical surfaces: participant order via `participantDeclarations`; clean-skip as registrations/declarations/resolutions; strict-split and the seeded five-version case pin RAW registration order (the legacy store-side semver sort died with the cutover); frankenstein via `registryEvidence` counts + all 20 resolutions mapped with integrity; chunk union via `resolutionProjection.chunkGroups` (non-dense 7 pseudo-external groups ↔ 7 `privateRegistrations`, frankenstein host bundles sorted by name, `mapping-or-exposed` absent); `scoped` via `privateRegistrations`; runtime-less snapshot via empty evidence/projection; mixed generations and the neither-spelling declaration via declarations/entrypoint candidates; three `sharedRows[0].resolution` null lines dropped (the canonical status assertions already stood).
- `projects/devtools-ui/src/app/shared/store/federation-store.spec.ts` (modified) — `derived` pins removed; memoization/error/capturing pins re-stated on `model` with `provenance.generation` (`v4` live, `v4.5` lab).
- `projects/devtools-ui/src/app/app.ts` (modified) — capture identity (page URL, captured-at) read from `model.provenance` instead of `state.snapshot.capture` — the one raw-snapshot access in guard scope (Codex blind spot); `model` is null exactly while capturing or on error, so behavior is unchanged (`app.spec.ts` pins the identity line).
- `projects/devtools-ui/src/app/shell/capture-status-strip.ts` (modified) — the only surviving non-view consumer of `store.derived()`: generation now read from `model.provenance.generation` (identical value — `derivations.ts` had copied exactly that field).
- `projects/devtools-ui/src/app/shell/capture-status.spec.ts` (modified) — `deriveFederation` import gone; captured source built through the real ingest only.
- `projects/devtools-ui/src/app/shared/store/resolution/build-canonical-projection.spec.ts` (modified) — barrel export pin without `projectSharedRows`; shape-pin title says "legacy row surface".
- `projects/devtools-ui/src/app/shared/store/resolution/projection-model.ts` (modified) — doc comment no longer names the compatibility `sharedRows`.
- `projects/devtools-ui/src/app/shared/view-conventions.ts` (modified) — `STRICT_SCOPE` comment no longer refers to derivations.
- `docs/resolution-data-model.md` (modified) — `SharedParticipantRow` removed from the layer table, the view-2 class diagram and its two relations, and the prose (model carries no compatibility row projection); view-5 wording "any legacy row surface".
- `docs/DEVELOPMENT.md` (modified) — `guards/` table row lists the boundary and vocabulary guards; one sentence in the data-model section names both guards as the enforcement of the façade-only rule and the resolution-only wording; repo-layout row for `docs/tech-debt-backlog.md` (the `/cs` ledger).
- `docs/tech-debt-backlog.md` (new) — CodeScene change-gate ledger written by `/cs` (separate session, 2026-08-26): the eight "grazed / pre-existing" findings of this diff (`ingest.ts` `joinExpose`/`ingestSnapshot`, four `build-canonical-projection.spec.ts` helper/test sizes, `view-conventions.ts` `copySourceVmOf`), all pre-existing and deferred; the gate itself cleared (17 files scanned, 13 scored, 7.95–10.0, no blockers) — see Key Decisions.

NOT part of this task: the historical mentions of the legacy names in `docs/work/v2/plan.md`, the spec (`docs/specs/native-federation-resolution-model.md`, which explicitly allows a temporary projection), the graph-view plan/spec, and `docs/work/resolution-model/task-1-domain-model.md` (design record) — records, not live documentation.

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble (incl. the 2026-08-23 amendment) + Task 11 block only (task isolation).
- Task logs 9.5 (effective predecessor — Task 10 has no log; "cutover list unchanged from T9"), 9 (the cutover inventory: `chunk-map-join.ts` already gone), 6 (grep only: raw-free projection shape pin, deferred folder restructure), 7.7 (grep only: `kit-boundary` guard as the scanner + negative-test pattern), 1 (grep only: `shared-rows-compat` declared a temporary outbound adapter from day one).
- `guards/kit-boundary.ts` + spec, `guards/bridge-boundary.ts`, `guards/export-privacy.spec.ts`, `vitest.guards.config.mts` — guard conventions.
- `projects/devtools-bridge/src/lib/fixtures/index.ts`, `captures/manifest.json`, `projects/collector/src/lib/fixture-drift.spec.ts` — the fixture set (13 corpus-derived: 12 lab + `frankenstein-live`; plan said 12).
- `resolution/model.ts`, `projection-model.ts`, `bundle-claims-model.ts`, `copies-model.ts`, `derive-chunk-groups.spec.ts`, `normalize-registry-evidence.spec.ts` — canonical shapes and existing pins behind the re-pins.
- `projects/devtools-bridge/src/lib/fixtures/{clean-skip,strict-split,co-declared-share}.fixture.ts` — raw registration order for the order-retaining pins.
- All production view/shell sources (import surface survey: no raw/algorithm import anywhere, every barrel import type-only) and the bridge's `*V1` type inventory (the raw-symbol list of the guard).

### Key Decisions

- **Task split before implementation (plan amendment, Lutz):** the original block bundled two independently reviewable commits — "remove the old door and lock the new one" (this task) vs. "recount independently" (Task 11.5: oracle + cross-view contract + DOM). Precedent 7.5/8.5; the DOM coverage is the pre-agreed break-point (→ 11.6) if 11.5 outgrows one commit. AC numbering keeps its gaps (T11-AC-01/05/06) for traceability.
- **Legacy `chunkGroups`/`scopedPackages` on `FederationModel` deleted with the row layer** — default agreed at briefing (a): both were consumer-less after Tasks 7–9 (`rg` over `projects/`: only the ingest and its spec), so keeping them would have preserved a second, participant-based chunk derivation (`allFilesMapped`) next to the canonical one.
- **Guard scope and rules are precise, not blanket:** shell files legitimately import `ChannelsV1`/`FIXTURES`/`fixtureIdFromQuery` from the bridge, so the rule forbids the raw DTO/repository symbols (`SnapshotV1`, `RuntimeRepositoriesV1`, `ExternalScopesV1`, …, incl. namespace imports) rather than the module; barrel imports are allowed when type-only (every view already does exactly that), forbidden as value imports (the algorithms). Specs are excluded — they build models through the ingest by design.
- **Vocabulary guard reads what a file SAYS:** templates as rendered text (HTML comments stripped), sources in string literals only (comments stripped with a URL-safe `//` rule). The two existing hits in the tree were doctrine comments ("never … executed") — legal; a blanket grep would have flagged them. `uses` deliberately NOT in the list (default (b) at briefing: too generic for a guard; the Remotes doctrine keeps it as a spec-level wording rule).
- **Guards run BEFORE the deletion** and found the real offender (`capture-status-strip.ts:28 — .derived()`) — the only non-view consumer, unmentioned in every task log. The fix is a one-line source swap (`model.provenance.generation`; `derivations.ts:81` had copied that field verbatim).
- **Seeded failing cases twice:** as negative unit tests on strings (one per rule) AND as real tree seeds — a forbidden ingest import appended to `views/graph/graph-types.ts` and a `served by` span appended to `views/packages/packages.html`; both turned the guard red with `file:line`, both reverted (`git status` clean, 63/63 again).
- **Re-pins read the canonical surface, not a re-sorted copy:** the legacy store sorted rows (semver desc, action); canonical registrations retain raw order (`model.ts`: "registrations retain their raw order") and views sort — so strict-split and the seeded five-version case now PIN raw order instead of the sort. `@nf-internal/` pseudo-externals stay `privateRegistrations` (7 in non-dense; `packageMeasures` lists them too) — "chunks never count as packages" is a view-level rule via the chunk groups, pinned at ingest level as "every private pseudo-registration ↔ one canonical chunk group".
- **No porting from `derivations.spec.ts`:** the only cross-cutting pin there (XC-02 spelling equivalence) is canonically covered by `normalize-registry-evidence.spec.ts`; the rest were T7 pins of deleted rules.
- **Prettier only on touched files:** a `prettier --write guards/*.ts` + markdown pass reformatted four pre-existing guard files and reflowed `DEVELOPMENT.md`/`plan.md` (table alignment, an old amendment paragraph) — reverted via `git checkout`, content edits re-applied by hand (memory saved: never prettier globs or markdown here).
- **Docs kept honest:** `resolution-data-model.md` is the maintained model documentation (memory: linked, not inline) — its `SharedParticipantRow` class, relations, table row, and prose were removed rather than left as stale truth; historical plan/spec/design-note mentions stay as records.

— session 2026-08-26 (Codex quick-review round)

- **Bridge rule flipped to an allow-list** (Codex MEDIUM): the deny-list was hand-maintained (own Open Issue) and missed `ServedFileV1`/`CaptureMetaV1`. The allow-list is exactly what the tree needs (`ChannelStateV1`, `ChannelsV1`, `SnapshotGenerationV1`, `GenerationV1`, the fixture-picker helpers, `NF_HOST`) — every other bridge export, incl. `SNAPSHOT_PROVIDER`, is denied by default; extending it is a deliberate edit in the guard.
- **Dynamic imports covered, AST rewrite rejected:** `import('…')` of the same modules is now a violation (cheap regex branch); a TypeScript-AST scanner was rejected — the three pre-existing guards are regex scanners (house style), and the real-tree seeds prove the practical cases.
- **`raw-snapshot-access` rule + `app.ts` on provenance** (Codex blind spot): `FederationStore.state()` stays a public façade surface (capture lifecycle; the export service legitimately serializes `state.snapshot` — outside guard scope), but scoped files may not reach `.snapshot.<capture|runtime|importMaps|channels|errors|schemaVersion>` through it. The only real access was `app.ts:37` (`state.snapshot.capture` for the header) — now `model.provenance` (same values, same null-window) rather than a guard exception.
- **Tokenizer instead of heuristics** (Codex LOW): `splitSourceLayers` replaces comment-stripping-then-string-isolation; the two failure modes of the first round (comment-looking strings blanked; `//` inside strings guessed by a URL rule) are pinned. Accepted limits documented in the file (template `${…}` nesting, regex literals via the escaped-slash rule).
- **Vocabulary scope = boundary scope + templates** (Codex MEDIUM): `shell/` and `app.html` added — the capture-status strip and the header are panel UI; the tree was already clean, the shell seed proves the guard fires there.
- **Deleted `derivations.spec.ts` — responsibility map instead of assertion-by-assertion port** (Codex blind spot). Each legacy describe block's responsibility has a canonical owner with its own spec (keyword-verified via `rg`): provider derivation incl. ambiguous/unattributable (T7-AC-01/02) → `attribute-observed-target-providers.spec` + `compare-sources.spec`; resolution arrows / fallback (T7-AC-03) → `resolve-effective-consumer-bindings.spec` + `derive-declaration-claims.spec`; secondary-entry parent linking (T7-AC-04) → `normalize-registry-evidence.spec` (entrypoint candidates) + `derive-registry-serving-slots.spec`; capability badges dense/SRI/generation (T7-AC-05) → `remotes-view-model.spec` (Task 8.5 provenance) + `capture-status.spec`; chunk-attribution ladder (T7-AC-06) → `derive-chunk-groups.spec` + `derive-bundle-claims.spec`; strict-scope semantics / conflicts (T7-AC-07) → `aggregate-package-measures.spec` + `packages-view-model.spec`; provenance tags (T7-AC-08) → `provenance: EvidenceProvenance` on every canonical record (normalize/claims/copies specs pin the evidence paths); generation equivalence (XC-02) → `normalize-registry-evidence.spec` ("normalizes v4 and v4.5 spellings uniformly"). Nothing ported: the legacy rules themselves (winner election, arrows, rule tags) no longer exist.

— session 2026-08-26 (CodeScene change gate, separate session)

- **Gate cleared, five current-work findings accepted, one deferred:** `splitSourceLayers` (cc 32, six-state switch) stays as one function — the switch IS the tokenizer's transition table and every edge is pinned; restructuring is the job of the day regex-literal support is added (Open Issue). `moduleViolation` (cc 10) and `findBoundaryViolations` keep their explicit branches — they read as the policy matrix a reviewer checks. `ingestSnapshot` went from cc 16 to 9 with the cutover (file score 8.60 → 9.24); the residue is linear pipeline wiring, not branching.
- **Topf B committed as a ledger, not fixed:** all eight items pre-date this task. Two have a natural trigger: `copySourceVmOf` (cc 12) is the shared source ladder that the T9 log already marked for a possible harmonization (`unattributable` re-qualified locally in the Import-Map VM) — restructure then; the `build-canonical-projection.spec.ts` seed helper duplicates the seeded-snapshot builders of `ingest.spec.ts`/resolution specs — a shared seed module under `shared/testing/` is a by-product candidate of Task 11.5 if its contract spec needs seeds anyway. `joinExpose` (two nested map loops) is not worth a task.

### Review Focus

- **Behavior claims:** (1) no production view, shell, convention, or app-root source imports a bridge export outside the allow-list (statically or dynamically), the ingest, the deleted derivations, or a resolution algorithm (deep or value import), reaches the raw snapshot through `state().snapshot`, or references the retired row surface — enforced by `guards/view-model-boundary.spec.ts`, which fails on seeded imports, a seeded dynamic import, and a seeded raw access; (2) no view, shell, kit, or app-root template and no UI string literal claims delivery or cost — enforced by `guards/resolution-vocabulary.spec.ts`, which fails on seeded wording in a view and in the shell; (3) the model exposes exactly `provenance, channels, mapMode, effectiveMap, registryEvidence, effectiveConsumerResolutions, resolutionProjection, remotes, importMapEntries` — every legacy field is gone, the capture-status strip renders the same generation badge from provenance.
- **Assumptions / choices:** Task 11 runs without Task 10 (2026-08-23 amendment; Diagnostics placeholder pinned in `app.spec.ts`); the corpus-derived fixture set is the drift guard's `derivedIds` (13, not 12); `uses` excluded from the vocabulary list; the bridge allow-list is deliberately minimal (extending it is a guard edit, not a maintenance chore); `FederationStore.state()` stays public for the capture lifecycle and the export path — only `.snapshot.*` access is forbidden in scope; the tokenizer's documented limits (template `${…}` nesting, regex-literal heuristic) are accepted for a guard; legacy `chunkGroups`/`scopedPackages` deleted as consumer-less.
- **Scope notes:** `app.ts` touched (raw access → provenance; same rendered header); `docs/resolution-data-model.md` and `docs/DEVELOPMENT.md` updated (live documentation of the deleted surface); `plan.md` carries the amendment (may be committed with the task or as a separate `plan:` commit per the `6ae6f5a` precedent — Lutz's call); nothing visual changed, no browser round.
- **Read next:** `guards/source-text.ts` (`splitSourceLayers`: the six tokenizer states and the escaped-slash `//` rule decide every false positive/negative of both guards) — then `guards/view-model-boundary.ts` (`BRIDGE_ALLOWED_SYMBOLS`, the type-only vs. value distinction on the barrel in `moduleViolation`, and the `RAW_SNAPSHOT_ACCESS` negative look-ahead that keeps Angular's router snapshot legal) — then the chunk-union block in `ingest.spec.ts` (the one re-pin whose canonical reading differs from the legacy claim).

### Test Evidence

- `npm run test:guards` — 6 files / 63 tests green on the final state (4 pre-existing files + 2 new). Before the cutover the boundary tree scan was red with exactly one real offender: `projects/devtools-ui/src/app/shell/capture-status-strip.ts:28 — legacy-participant-surface: .derived()`.
- **Seeded tree failures (T11-AC-01/05):** `graph-types.ts` + `import { ingestSnapshot } from '../../shared/store/ingest'` → `guards/view-model-boundary.spec.ts` red: `views/graph/graph-types.ts:232 — ingest-import`; `packages.html` + `<span class="seed">served by the host</span>` → `guards/resolution-vocabulary.spec.ts` red: `views/packages/packages.html:136 — "served by"`. Both seeds reverted; `git status` clean; guards 63/63.
- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/shared/store/ingest.spec.ts' --watch=false` — 26/26 (the re-pinned suite; the first canonical reading of the non-dense chunk test was wrong twice — `privateRegistrations` retained, `packageMeasures` lists pseudo-externals — and fixed against the canonical output, documented above).
- `npm test` — full suite green on the final state: 36 UI files / 483 tests, 3 bridge files / 79, 6 collector files / 75 (incl. `fixture-drift.spec.ts`), 4→6 guard files / 63.
- `node scripts/validate-lab-corpus.mjs` — `corpus valid: 12 captures + 2 live phases, runId 20260816T182544Z`.
- `npm run build:extension` — application bundle complete, `Extension bundle check passed (2 JS, 2 HTML files scanned)`; `npm run check:panel-bundle` — passed.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — no diagnostics (the spec tsconfig is not standalone-runnable — pre-existing `rootDir` setup; `ng test` compiles the specs).
- `prettier --check` on every changed TS file clean; `git diff --check` clean.
- **Repo sweep (T11-AC-01):** `rg 'SharedParticipantRow|sharedRows|store\.derived|DerivedFederation|deriveFederation|derived-model|projectSharedRows|allFilesMapped|scopedPackages|ScopedPackageRow' projects/ docs/ README.md` — zero hits in `projects/` outside the guards' own negative-test strings; in `docs/` only the historical records listed under Files Modified (NOT part of this task).

— session 2026-08-26 (Codex quick-review round)

- `npm run test:guards` — 6 files / 66 tests green (new: allow-list, dynamic-import, raw-access, tokenizer-edge pins); the tree scans were green on the first run after the round, i.e. `app.ts` on provenance is clean and the `raw-snapshot-access` look-ahead produces no false positive on the four router-`snapshot` uses in the views.
- **Seeded tree failures, second set:** `capture-status-strip.html` + `<span class="seed">bundle loaded from cache</span>` → `guards/resolution-vocabulary.spec.ts` red: `shell/capture-status-strip.html:33 — "loaded"`; `app.ts` + a helper reading `s.snapshot.runtime` from `store.state()` → `guards/view-model-boundary.spec.ts` red: `app.ts:47 — raw-snapshot-access`; `graph-types.ts` + `import('../../shared/store/resolution/materialize-resolved-copies')` → red: `views/graph/graph-types.ts:232 — resolution-algorithm-import: deep import`. All three reverted; `git status` clean for the seeded files; guards 66/66.
- `npm test` — full suite green on the final state: 36 UI files / 483 tests (incl. `app.spec.ts` header pins on the provenance-backed identity), 3 bridge files / 79, 6 collector files / 75, 6 guard files / 66.
- `npm run build:extension` + `npm run check:panel-bundle` — passed again (`2 JS, 2 HTML files scanned`).
- `prettier --check` on the five guard files and `app.ts` clean; `git diff --check` clean.

### Acceptance Coverage

- **T11-AC-01 — passed:** `guards/view-model-boundary.spec.ts` — tree scan zero offenders (>20 production files), one negative test per rule (bridge allow-list incl. `CaptureMetaV1`/`ServedFileV1`, ingest, legacy derivations, deep/value/dynamic algorithm imports, raw snapshot access, retired identifiers), real-tree seeds made the guard fail three ways (ingest import and dynamic deep import in `graph-types.ts`, raw access in `app.ts`); repo sweep clean. Contributes: XC-01.
- **T11-AC-05 — passed:** `guards/resolution-vocabulary.spec.ts` — tree scan zero offenders over views/shell/kit/conventions/app root (templates + string literals, >25 files), negative tests for template text/attributes/literals and the tokenizer edges, real-tree seeds made the guard fail in a view (`served by` in `packages.html`) and in the shell (`loaded` in `capture-status-strip.html`). Contributes: XC-06.
- **T11-AC-06 — passed:** corpus validator valid, `fixture-drift.spec.ts` green inside `npm test` (483/79/75/66 after the review round), `npm run build:extension` and `npm run check:panel-bundle` passed; the raw-free projection boundary stays pinned by `build-canonical-projection.spec.ts` (shape pin + barrel export pin, now without `projectSharedRows`). Contributes: XC-04, XC-05.
- **T11-AC-02, T11-AC-03, T11-AC-04 — N/A:** moved to Task 11.5 as T11.5-AC-01..03 by the 2026-08-26 plan amendment (IDs kept visible here for traceability).

### Open Issues

- The bridge ALLOW-list (`BRIDGE_ALLOWED_SYMBOLS`) is deliberately minimal; when the shell legitimately needs another bridge export (e.g. a new channel type), extend the list in the guard together with the change — a new raw type needs nothing (denied by default). Resolved this round: the former hand-maintained deny-list.
- Tokenizer limits (documented in `source-text.ts`): a backtick nested inside a template-literal `${…}` ends the literal early; regex literals are recognised only through the escaped-slash rule — both acceptable for a guard, revisit only if a real false negative shows up.
- `ScopedPackageRow`/`scopedPackages` are gone from the model; the true scoped packages of the `scoped` fixture surface only as `privateRegistrations` — if a view ever needs the raw `entries` map of a scoped package, it comes from `entrypointCandidates`, not from a resurrected row.
- Historical documents still name the legacy surfaces (v2 plan, resolution-model spec §"sharedRows MAY exist", Task-1 design notes, graph-view plan/spec) — records by design, untouched.
- Task 11.5 inherits the cardinality questions of the witness oracle (e.g. whether `co-declared-share`'s "1 registration, 2 declarations" is package-scoped) — probe-first, and a mismatch with the plan is a finding, not a reason to adjust.

### Context for Next Task

- **Task 11.5 starts on a clean single truth:** `FederationModel` = `provenance, channels, mapMode, effectiveMap, registryEvidence, effectiveConsumerResolutions, resolutionProjection, remotes, importMapEntries`. The oracle and the cross-view contract read `registryEvidence` (sharedExternals / versionRegistrations / participantDeclarations / privateRegistrations / entrypointCandidates), `effectiveConsumerResolutions` (status `mapped|unmapped|blocked|unknown`), and `resolutionProjection` (remotes, copies, consumerRelations, chunkGroups, bundleClaims, declarationResolutionClaims, registryServingSlotClaims, observedTargetProviders, sourceComparisons, packageMeasures, completeness).
- **Fixture set for the contract:** reuse the drift guard's definition — `Object.keys(FIXTURES)` minus `synthetic-`/`exported-` → 13 ids (12 lab scenarios + `frankenstein-live`).
- **Canonical facts the re-pins established (useful oracle anchors):** clean-skip = 1 shared external, 2 registrations (`2.0.0 share` mfe2, `1.0.0 skip` mfe1), both consumer resolutions mapped to the mfe2 copy; strict-split raw order `2.0.0 share __NF-HOST__ · 1.0.0 skip mfe1 · 1.0.0 scope mfe3`; frankenstein = 20 shared externals / 20 registrations / 20 declarations / 20 mapped resolutions with integrity, 29 map entries (22 global + 7 scoped), host chunk groups `browser-angular_common(1) · browser-angular_core(5) · browser-rxjs(1)`; non-dense = 7 `@nf-internal/` private registrations ↔ 7 pseudo-external chunk groups (emitter mfe3), 14 shared externals; scoped = 0 shared externals, 2 private registrations (`mfe1 1.0.0`, `mfe2 2.0.0`), 0 chunk groups.
- **Guards protect Task 10 (Diagnostics) too:** a Diagnostics view model must import types from the barrel and the Store façade only; forbidden imports and forbidden wording fail `npm run test:guards` with `file:line`.
- **Gotchas:** the spec tsconfig is not standalone-runnable (`rootDir`), use `ng test`; `ng test --include` needs the full `projects/devtools-ui/...` path; `prettier --write` only on the files you changed (globs/markdown reformat pre-existing files); `npm test` stops at the first failing project (`&&` chain) — bridge/collector/guards only run once the UI suite is green; marker-based spec edits after prettier need re-reading (line wrapping moves anchors).
- **Guard rules for Task 10/11.5 authors in one line:** bridge imports only from the allow-list; barrel imports `import type`; never `state().snapshot.*` (use `model.provenance`/`model.*`); UI strings say declared/mapped/resolves to/selected — never loaded/fetched/served by.
- `/commit 11` must stage 25 paths: 5 new `guards/` files (`source-text.ts`, `view-model-boundary.ts` + spec, `resolution-vocabulary.ts` + spec), 4 deletions (`shared/store/derivations.ts`, `derivations.spec.ts`, `derived-model.ts`, `resolution/shared-rows-compat.ts`), 11 modified sources/specs (`app.ts`, `shared/store/*`, `shared/store/resolution/*`, `shell/*`, `shared/view-conventions.ts`), `docs/DEVELOPMENT.md`, `docs/resolution-data-model.md`, `docs/tech-debt-backlog.md` (new), `docs/work/resolution-model/plan.md` (amendment — or a separate `plan:` commit first), and this log.

### Git State

`git diff --stat`

```text
 docs/DEVELOPMENT.md                                |   7 +-
 docs/resolution-data-model.md                      |  18 +-
 docs/work/resolution-model/plan.md                 |  98 +++-
 projects/devtools-ui/src/app/app.ts                |  17 +-
 .../src/app/shared/store/derivations.spec.ts       | 557 ---------------------
 .../src/app/shared/store/derivations.ts            | 366 --------------
 .../src/app/shared/store/derived-model.ts          | 193 -------
 .../src/app/shared/store/federation-model.ts       |  86 +---
 .../src/app/shared/store/federation-store.spec.ts  |  20 +-
 .../src/app/shared/store/federation-store.ts       |  30 +-
 .../src/app/shared/store/ingest.spec.ts            | 285 ++++++-----
 .../devtools-ui/src/app/shared/store/ingest.ts     | 110 +---
 .../resolution/build-canonical-projection.spec.ts  |   3 +-
 .../src/app/shared/store/resolution/index.ts       |   4 +-
 .../shared/store/resolution/projection-model.ts    |   6 +-
 .../shared/store/resolution/shared-rows-compat.ts  | 151 ------
 .../devtools-ui/src/app/shared/view-conventions.ts |   2 +-
 .../src/app/shell/capture-status-strip.ts          |  10 +-
 .../src/app/shell/capture-status.spec.ts           |   8 +-
 19 files changed, 318 insertions(+), 1653 deletions(-)
```

`git status --short`

```text
 M docs/DEVELOPMENT.md
 M docs/resolution-data-model.md
 M docs/work/resolution-model/plan.md
 M projects/devtools-ui/src/app/app.ts
 D projects/devtools-ui/src/app/shared/store/derivations.spec.ts
 D projects/devtools-ui/src/app/shared/store/derivations.ts
 D projects/devtools-ui/src/app/shared/store/derived-model.ts
 M projects/devtools-ui/src/app/shared/store/federation-model.ts
 M projects/devtools-ui/src/app/shared/store/federation-store.spec.ts
 M projects/devtools-ui/src/app/shared/store/federation-store.ts
 M projects/devtools-ui/src/app/shared/store/ingest.spec.ts
 M projects/devtools-ui/src/app/shared/store/ingest.ts
 M projects/devtools-ui/src/app/shared/store/resolution/build-canonical-projection.spec.ts
 M projects/devtools-ui/src/app/shared/store/resolution/index.ts
 M projects/devtools-ui/src/app/shared/store/resolution/projection-model.ts
 D projects/devtools-ui/src/app/shared/store/resolution/shared-rows-compat.ts
 M projects/devtools-ui/src/app/shared/view-conventions.ts
 M projects/devtools-ui/src/app/shell/capture-status-strip.ts
 M projects/devtools-ui/src/app/shell/capture-status.spec.ts
?? docs/tech-debt-backlog.md
?? docs/work/resolution-model/task-log/task-11-single-truth-cutover.md
?? guards/resolution-vocabulary.spec.ts
?? guards/resolution-vocabulary.ts
?? guards/source-text.ts
?? guards/view-model-boundary.spec.ts
?? guards/view-model-boundary.ts
```

### Sessions

- claude-code e005eed4-1466-4853-bb8a-3d2618a7b04c (2026-08-26) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-native-federation-devtools/e005eed4-1466-4853-bb8a-3d2618a7b04c.jsonl
