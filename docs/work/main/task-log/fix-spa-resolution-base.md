# fix: SPA-navigated captures resolve against the parse-time base, not pageUrl

### Task
Fix the graph/resolution breakdown on SPA-navigated captures (playground
`/checkout/cart`): recover the import-map parse-time document base from the
shim's effective map and use it for all load-time-relative URL resolution
instead of `capture.pageUrl`.

### Status
DONE

### Root Cause
The panel resolved every load-time-relative capture value — relative
import-map targets (`./_angular_common.<hash>.js`) and the host's
`scopeUrl: "./"` — against `capture.pageUrl`. Those values were actually
resolved by the loader (es-module-shims) and the NF runtime **at map parse /
init time**, against the then-current document base. `history.pushState`
moves `pageUrl` away from that base without changing any registry data.

Trigger mechanics (user-witnessed, code-confirmed): the panel only captures
on open and on the Refresh button (`app.ts` → `FederationStore.refresh()`);
there is no navigation listener. So the SPA navigation itself changed
nothing (stale snapshot stayed on screen) — the Refresh click produced a new
snapshot whose `runtime`/`channels`/`importMaps` sections were byte-identical
to the explore capture, differing only in `capturedAt` and `pageUrl`.

Why explore looked fine and checkout broke:
- `new URL('./x.js', '…/playground/explore')` → `…/playground/x.js` —
  correct **by luck** (no trailing slash drops the last segment).
- `new URL('./x.js', '…/playground/checkout/cart')` → `…/playground/checkout/x.js`
  — wrong, and the host's `./` scope resolves to `/playground/checkout/`,
  which textually equals `@tractor-store/checkout`'s scopeUrl. Host and
  checkout candidates collide on identical URLs → every share degrades to
  ambiguous target-URL copies (12 copies, 24 ambiguous source claims on the
  real export; one copy per entry file, hence `@angular/core` ×6).

### Files Modified
- `projects/devtools-ui/src/app/shared/store/merge-document-maps.ts` (modified) —
  new `ResolutionBase` type and `deriveResolutionBase()`: recovers the
  parse-time base from a (relative doc-tag target, shim-resolved absolute
  target) pair, verified by re-resolution; `isUrlLikeSpecifier` extracted.
  Review hardening: only WINNING entries (later tag wins) act as oracles,
  and the candidate must satisfy ALL oracle pairs (consensus) or the
  recovery falls back to `pageUrl`.
- `projects/devtools-ui/src/app/shared/store/ingest.ts` (modified) — derives
  the base once and threads it into `mergeDocumentMaps`, `resolvedScopeUrl`,
  `normalizeRegistryEvidence`, consumer bindings, and `allFilesMapped`;
  docstring rule added.
- `projects/devtools-ui/src/app/shared/store/resolution/normalize-registry-evidence.ts`
  (modified) — `NormalizeRegistryEvidenceOptions.resolutionBase`; candidate
  URLs resolve owner scopes against it; evidence ref honestly points at
  `importMaps.effective` when the base was recovered from the shim map.
- `projects/devtools-ui/src/app/shared/store/resolution/resolve-effective-consumer-bindings.ts`
  (modified) — context field renamed `pageUrl` → `resolutionBaseUrl`
  (internal params → `baseUrl`) so the name states what the value is.
- `projects/devtools-ui/src/app/shared/store/resolution/index.ts` (modified) —
  exports `NormalizeRegistryEvidenceOptions`.
- `projects/devtools-ui/src/app/shared/store/merge-document-maps.spec.ts`
  (modified) — 4 `deriveResolutionBase` specs (recovery, fallbacks,
  unverifiable-entry skip).
- `projects/devtools-ui/src/app/shared/store/ingest.spec.ts` (modified) —
  seeded SPA-navigation miniature (fails without the fix — verified by
  temporarily neutralizing it) plus acceptance test over the real
  `exported-playground-checkout` fixture (12 uniquely sourced copies, zero
  completeness counters).
- `projects/devtools-bridge/src/lib/fixtures/exported-playground-checkout.fixture.ts`
  (new) — verbatim SnapshotV1 panel export of the live playground checkout
  page (2026-08-25, sha256 of source JSON in the banner); frozen regression
  witness, never hand-edited.
- `projects/devtools-bridge/src/lib/fixtures/index.ts` (modified) — registers
  the fixture; documents the new `exported-` provenance class.
- `projects/collector/src/lib/fixture-drift.spec.ts` (modified) — drift guard
  excludes `exported-` fixtures (no lab-lossless envelope to re-derive from).
- `guards/privacy-scan.ts` (modified) — integrity-map KEYS are resource URLs:
  URL rules (userinfo/query/fragment) apply to them, the forbidden-key rule
  does not (fixes the `mfe-header-<hash>.js` false positive). Review
  hardening: the exemption is cleared at array boundaries too.
- `guards/privacy-scan.spec.ts` (modified) — pins the integrity-key rule in
  both directions (filename passes, query-string key and structural
  `headers` key still flagged).
- `projects/devtools-ui/src/app/shared/store/resolution/*.spec.ts`
  (7 specs, modified) — mechanical rename to `resolutionBaseUrl` at the
  bindings-context call sites.
- `docs/specs/native-federation-resolution-model.md` (modified) — §4.2 now
  defines the resolution base (recovery rule, fallback, playground evidence).

### Files Read (Context Only)
- `captures/playground-{explore,checkout}/nf-snapshot-*.json` — the two user
  exports; deep-diff proved them byte-identical except `capturedAt`/`pageUrl`.
- `projects/devtools-ui/src/app/views/graph/graph-model.ts`, `graph-types.ts` —
  ruled out the graph layer (pure over the projection).
- `projects/devtools-ui/src/app/shared/store/federation-store.ts`, `app.ts` —
  capture lifecycle; confirmed refresh-only capture, no navigation listener.
- `projects/devtools-ui/src/app/shared/store/resolution/{copies-model,projection-model,model}.ts` —
  copy/evidence shapes for the probe and tests.
- `projects/collector/src/lib/shim-map-probe.ts`,
  `projects/devtools-bridge/src/lib/snapshot-v1.ts` — where
  `importMaps.effective` comes from and what it guarantees.
- `scripts/derive-fixtures.{mjs,ts}`, `captures/README.md` — fixture pipeline
  and corpus policy (why the export cannot go through the corpus deriver).

### Key Decisions
— session 2026-08-25
- **Recover a base, don't swap the ground truth.** Considered using the shim's
  `importMaps.effective` directly as the effective map; rejected — document
  tags stay the merge ground truth (existing design), the shim map is the
  cross-check that additionally pins the one fact SPA navigation destroys.
  The shim map can be truncated by probe limits and is absent in native mode.
- **Verification over arithmetic.** A base candidate (absolute target minus
  relative suffix) counts only if re-resolving reproduces the shim value
  exactly; `../` targets are skipped rather than reasoned about.
- **One base for all tags** — a tag appended after navigation parses against
  a different base; per-tag bases are not modeled (corpus shows one tag per
  page). Documented in the function docstring as a known approximation.
- **Honest naming and evidence.** Bindings context field renamed to
  `resolutionBaseUrl`; candidate-URL evidence refs point at
  `importMaps.effective` when the base was recovered (not `capture.pageUrl`).
- **New `exported-` fixture class** (verbatim panel exports, frozen evidence)
  instead of mislabeling the capture `synthetic-` or forcing it into the
  lossless-envelope pipeline; drift guard excludes the class explicitly.
- **Privacy-guard rule, not allowlist.** The `mfe-header-<hash>.js` hit was
  fixed structurally (integrity-map keys are URL data) instead of a one-off
  `allowedKeys` entry — keys still get the URL rules applied.
- **Native mode stays a documented gap**: no browser API exposes the parsed
  map, so SPA-navigated native captures keep the `pageUrl` fallback.

— session 2026-08-25 (Codex review follow-up)
- **Shadowed entries never act as oracles.** Codex found (and I reproduced)
  that pairing a shadowed relative entry with the shim's final target can
  "verify" a foreign base (CDN repro). Fix mirrors the merge semantics the
  shim map results from: winning entry per specifier (later tag wins) only.
- **Consensus over first-verified-wins.** A candidate base must re-resolve
  EVERY oracle pair (including `../` pairs that cannot source a candidate);
  one refuted pair → `pageUrl` fallback. This also contains the
  one-base-for-all-tags approximation: diverging per-tag parse bases now
  refuse recovery instead of trusting whichever entry comes first.
- **Guard exemption is boundary-scoped.** `keysAreUrls` leaked through
  arrays (`integrity: [{ headers: … }]` passed unflagged — reproduced);
  arrays now clear the flag like objects do.

### Review Focus
- **Behavior claims:**
  - Ingesting the real checkout export now yields the same clean projection
    as the explore export: 12 copies, all `share-registration`, zero
    ambiguous source claims (was 12 ambiguous target-URL copies before).
  - On a never-navigated page the derived base equals `pageUrl` — behavior
    unchanged (all 495 pre-existing tests pass untouched except the
    mechanical context-field rename).
  - Chunk filenames containing forbidden words inside `integrity` maps no
    longer trip the privacy guard; URL rules still apply to those keys.
- **Assumptions / choices:** shim `getImportMap()` keeps bare specifier keys
  verbatim (matches the captured data); one parse base per capture; first
  verified doc-order entry wins.
- **Scope notes:** privacy-guard semantics change (`guards/privacy-scan.ts`)
  and the drift-guard exclusion are deliberate collateral scope — both were
  hard prerequisites for checking in the fixture. Spec §4.2 amended.
- **Read next:**
  - `merge-document-maps.ts` → `deriveResolutionBase` — the entire new
    mechanism lives here; check the verification loop and skip conditions.
  - `normalize-registry-evidence.ts` → `constructCandidateUrl` — evidence-ref
    switch and base threading.
  - `guards/privacy-scan.ts` object branch — the `keysAreUrls` descent must
    not leak beyond an integrity map's direct children.

### Test Evidence
— session 2026-08-25
- Empirical root-cause proof: esbuild-bundled probe ran the real
  `ingestSnapshot` over both exports — explore: 12 clean copies / 0 ambiguous;
  checkout (pre-fix): 12 ambiguous target-URL copies, 24 ambiguous source
  claims; checkout (post-fix): identical clean projection to explore.
- Regression pinning: with the fix neutralized (`baseUrl = pageUrl`), the new
  seeded ingest spec fails; with the fix it passes.
- Suites all green: `ng test devtools-ui` 502/502, `ng test devtools-bridge`
  79/79, `npm run test:collector` 75/75, `npm run test:guards` 54/54.
  (Guards count is file-dependent: the capture privacy scan parameterizes
  one test per JSON under `captures/` — 54 while both playground exports
  existed; deleting the explore export dropped it to 53.)
- `npm run build:extension` — bundle check passed, extension reassembled at
  `dist/extension` for live retesting.

— session 2026-08-25 (Codex review follow-up)
- Both review findings reproduced red-first as specs, then fixed:
  `merge-document-maps.spec.ts` (shadowed-oracle CDN repro, conflicting-bases
  fallback) and `privacy-scan.spec.ts` (array-boundary leak).
- Suites re-run green: devtools-ui 504/504, guards 54/54 (53 file-dependent
  baseline + the new array-boundary test), devtools-bridge 79/79, collector
  75/75; `npm run build:extension` bundle check passed.

### Open Issues
- Native mode + SPA navigation + refresh remains unresolvable from a passive
  capture (documented fallback). Candidate future evidence channels, each
  with trade-offs: resource-timing entries (actual fetched URLs; privacy
  surface), `import.meta.resolve` via injected module (breaks passivity),
  extension-side navigation tracking (`chrome.devtools.network.onNavigated`;
  misses pre-open loads).
- `captures/playground-checkout/` still sits untracked in the repo (the
  explore export is already deleted; its empty directory remains). The
  fixture is a verified verbatim copy, so deleting the raw dir loses
  nothing; keeping it under `captures/` sits uneasily with the README's
  lab-only policy. User decision pending — must not be blindly staged by
  `/commit fix`.
- Per-tag parse bases (dynamically appended maps after navigation) are still
  not modeled, but the consensus rule now degrades that case to the honest
  `pageUrl` fallback instead of a wrong base — revisit only if a real
  capture demonstrates the shape.

### Context for Next Task
- `deriveResolutionBase(tags, shimEffective, pageUrl): ResolutionBase` in
  `merge-document-maps.ts`; `ResolutionBase = { url, source:
  'shim-effective-map' | 'page-url' }`. Ingest derives it once — any new
  resolution site must take the threaded base, never `capture.pageUrl`.
- The dev panel can load the live-data fixture via
  `?fixture=exported-playground-checkout` (4 remotes, 12 packages) — useful
  for the graph-view demo.
- Gotcha: `pageUrl` is still correct for identity/provenance uses
  (`snapshotIdentity`, `provenance.pageUrl`) — only URL *resolution* moved
  to the recovered base.

### Git State
```
$ git diff --stat (tail)
 docs/specs/native-federation-resolution-model.md   |  15 ++-
 guards/privacy-scan.spec.ts                        |  34 ++++++
 guards/privacy-scan.ts                             |  35 ++++--
 projects/collector/src/lib/fixture-drift.spec.ts   |   7 +-
 projects/devtools-bridge/src/lib/fixtures/index.ts |   6 +-
 .../src/app/shared/store/ingest.spec.ts            | 122 +++++++++++++++++++++
 .../devtools-ui/src/app/shared/store/ingest.ts     |  36 ++++--
 .../app/shared/store/merge-document-maps.spec.ts   | 133 ++++++++++++++++-
 .../src/app/shared/store/merge-document-maps.ts    | 125 ++++++++++++++++-
 .../resolution/aggregate-package-measures.spec.ts  |   2 +-
 .../attribute-observed-target-providers.spec.ts    |   2 +-
 .../resolution/build-canonical-projection.spec.ts  |   2 +-
 .../store/resolution/derive-bundle-claims.spec.ts  |   2 +-
 .../resolution/derive-declaration-claims.spec.ts   |   2 +-
 .../src/app/shared/store/resolution/index.ts       |   5 +-
 .../resolution/materialize-resolved-copies.spec.ts |   2 +-
 .../resolution/normalize-registry-evidence.ts      |  44 +++++---
 .../resolve-effective-consumer-bindings.spec.ts    |  22 ++--
 .../resolve-effective-consumer-bindings.ts         |  29 +++--
 19 files changed, 554 insertions(+), 71 deletions(-)

$ git status --short
 M docs/specs/native-federation-resolution-model.md
 M guards/privacy-scan.spec.ts
 M guards/privacy-scan.ts
 M projects/collector/src/lib/fixture-drift.spec.ts
 M projects/devtools-bridge/src/lib/fixtures/index.ts
 M projects/devtools-ui/src/app/shared/store/ingest.spec.ts
 M projects/devtools-ui/src/app/shared/store/ingest.ts
 M projects/devtools-ui/src/app/shared/store/merge-document-maps.spec.ts
 M projects/devtools-ui/src/app/shared/store/merge-document-maps.ts
 M projects/devtools-ui/src/app/shared/store/resolution/aggregate-package-measures.spec.ts
 M projects/devtools-ui/src/app/shared/store/resolution/attribute-observed-target-providers.spec.ts
 M projects/devtools-ui/src/app/shared/store/resolution/build-canonical-projection.spec.ts
 M projects/devtools-ui/src/app/shared/store/resolution/derive-bundle-claims.spec.ts
 M projects/devtools-ui/src/app/shared/store/resolution/derive-declaration-claims.spec.ts
 M projects/devtools-ui/src/app/shared/store/resolution/index.ts
 M projects/devtools-ui/src/app/shared/store/resolution/materialize-resolved-copies.spec.ts
 M projects/devtools-ui/src/app/shared/store/resolution/normalize-registry-evidence.ts
 M projects/devtools-ui/src/app/shared/store/resolution/resolve-effective-consumer-bindings.spec.ts
 M projects/devtools-ui/src/app/shared/store/resolution/resolve-effective-consumer-bindings.ts
?? captures/playground-checkout/
?? docs/work/main/
?? projects/devtools-bridge/src/lib/fixtures/exported-playground-checkout.fixture.ts
```

### Sessions
- claude-code 429959b9-8f1d-407f-8492-1b1037b1c621 (2026-08-25) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-native-federation-devtools/429959b9-8f1d-407f-8492-1b1037b1c621.jsonl
