# Task 7: Port the framework-free passive collector core

### Task

Ported and trimmed the framework-free `collector` library from the private
research repo (fixed passive probe, defensive reads, schema allowlist, URL
sanitization, capped errors), added the new `SHIM_MAP_PROBE_SOURCE` as the
isolated exception for `importShim.getImportMap()`, a mapper to `SnapshotV1`,
and the full safety-test suite — followed by a user-driven YAGNI pass, a
readability pass, and a HIGH-severity privacy fix (relative-URL query leak)
found in review.

### Status

DONE

### Files Modified

New — collector library (`projects/collector/`):

- `src/lib/passive-probe.ts` (new) — `PASSIVE_PROBE_SOURCE`: the fixed,
  strictly passive probe expression (descriptor-reads only, inline caps,
  structured errors). Trimmed vs. reference: `__NF_REGISTRY__` summary,
  `importShim.version` read, per-remote `integrity`, provider `bundle`,
  in-page `isSri`, and the union/number schema branches removed. One
  deliberate semantic change: `importMaps: null` on inventory failure vs
  `[]` on success (lets the mapper distinguish "unreadable" from "zero
  maps observed")
- `src/lib/shim-map-probe.ts` (new) — `SHIM_MAP_PROBE_SOURCE`: second fixed
  source containing the one sanctioned page-function call
  (`importShim.getImportMap()`), gated on the main probe's presence
  summary, try/catch-wrapped, output capped inline
- `src/lib/snapshot-mapper.ts` (new) — `mapProbeResult(rawProbe,
  rawShimMap, {capturedAt})` → `SnapshotV1`: treats both probe results as
  untrusted, re-projects host-side through the schema allowlist, applies
  honest-state channel rules (mirroring `derive-fixture.mjs` semantics),
  reduces document maps to counts (raw text never enters the DTO)
- `src/lib/constants.ts` (new) — `DEFAULT_LIMITS` (trimmed to used caps),
  `COLLECTOR_VERSION = 'nf-devtools-collector/1'`
- `src/lib/errors.ts` (new) — capped structured errors +
  `projectCollectionError` for re-projecting untrusted error objects
- `src/lib/safe.ts` (new) — descriptor-level read routines; header
  documents the precise passivity guarantee and the deliberate in-page/host
  duplication (a fixed eval expression cannot import)
- `src/lib/privacy.ts` (new) — `sanitizeUrl` (userinfo/query/fragment
  stripped; absolute, protocol-relative, and relative branches), `isValidSri`
- `src/lib/runtime-schema.ts` (new) — `REPOSITORY_SCHEMAS` +
  `EFFECTIVE_IMPORT_MAP_SCHEMA` + `projectSchema`; `file` fields are
  `url`-typed (relative URLs, query/fragment stripped — leak fix)
- `src/public-api.ts` (new) — deliberately minimal: the two probe sources,
  `mapProbeResult` + `CaptureContext`, `COLLECTOR_VERSION`; everything else
  is lib-internal
- `src/testing/fixture-pages.ts` (new) — vm-sandbox fixture pages: the
  frankenstein page (seeded from the checked-in capture — no private-repo
  dependency), a hostile page (schema-field getters, counting proxy traps,
  storage-access proxy, throwing `getImportMap`, sentinel global),
  descriptor-level state digests (sha256, getter-safe)
- `src/lib/probe-source.spec.ts` (new) — T7-AC-01: both sources fixed
  literals (single template literal per file, no `${`), forbidden-token
  lists (main probe keeps `getImportMap` forbidden; shim source allows
  exactly that one call)
- `src/lib/passivity-harness.spec.ts` (new) — T7-AC-02: digests
  byte-identical before/after on frankenstein + hostile pages, all
  getter/loader/storage counters 0, `getImportMap` exactly 1×, detached
  results
- `src/lib/edge-cases.spec.ts` (new) — T7-AC-03: cyclic, accessor-backed
  (incl. accessor global), throwing proxies (incl. global itself),
  oversized (strings/arrays/keys/map inventory/shim map), malformed —
  never throws, always JSON-serializable
- `src/lib/snapshot-mapper.spec.ts` (new) — T7-AC-04/05/06: not-recognized
  without raw copy, URL sanitization incl. all four review-finding leak
  paths + bare-specifier pin, frankenstein pipeline ≡ derived fixture,
  degenerate inputs
- `tsconfig.lib.json` (new) — noEmit typecheck config (tsc runs inside
  `npm run test:collector` — the lib's only type gate, vitest/esbuild does
  not typecheck)

New — workspace root:

- `vitest.collector.config.mts` (new) — node-environment vitest run for
  the collector specs (the passivity harness needs `node:vm`)

Modified:

- `guards/privacy-scan.ts` (modified) — LEAK FIX second layer: relative
  URL-shaped strings (`/`, `./`, `../`) are now checked for query/fragment
  (previously only `https?://` values — same blind spot as the mapper had)
- `guards/privacy-scan.spec.ts` (modified) — poisoned fixture now also
  carries a relative query/fragment leak; both new violation messages
  asserted
- `tsconfig.json` (modified) — path mapping `collector` →
  `projects/collector/src/public-api.ts` (source, like the bridge);
  reference for the new tsconfig.lib.json
- `package.json` (modified) — `test:collector` (tsc + vitest), wired into
  `test` between bridge and guards

### Files Read (Context Only)

- `docs/work/passive-mvp/plan.md` — preamble + Task 7 block
- `docs/work/passive-mvp/task-log/task-6-snapshot-json-export.md` —
  predecessor (export ≡ DTO, hostile fixture, open issue "privacy guard's
  real measuring point arrives with live collector output")
- `docs/work/passive-mvp/task-log/task-2-snapshot-dto-fixtures.md` — DTO
  contract, honest-state rules, guards layout
- `docs/work/passive-mvp/task-log/task-1-scaffold-extension-shell.md` —
  workspace layout, node-vitest precedent, boundary rule
- Research repo (read-only, sanctioned by plan):
  `packages/collector/src/{passive-probe,safe,runtime-schema,privacy,errors,constants}.js`,
  `tests/collector/passive-probe.test.mjs` (the safety tests to port; they
  live outside the collector package)
- `captures/frankenstein/production-04-remote-interaction.json` — channel
  shapes for sandbox reconstruction and mapper equivalence
- `scripts/derive-fixture.mjs` — the channel-state and projection semantics
  the mapper must reproduce
- `projects/devtools-bridge/src/lib/snapshot-v1.ts`, `guards/privacy-scan.ts`,
  `vitest.guards.config.mts`, `projects/devtools-bridge/tsconfig.*.json`

### Key Decisions

- **Two fixed sources instead of one (user-approved):** the reference
  probe's own static test forbids `getImportMap` — calling it executes
  page code — but the plan and `SnapshotV1.importMaps.effective` require
  the shim-reported merged map (passively unreachable: it lives only in
  es-module-shims' internal state). Resolution: the main probe stays
  provably 100 % passive (ported forbidden-token list unchanged, incl.
  `getImportMap`), and the one sanctioned call lives in its own gated,
  contained fixed source. Rejected: inlining the call in the main probe
  (would force weakening the ported static test).
- **Precise passivity wording (user discussion):** the enforceable
  guarantee is "descriptor-level reads only, no getter invocation, no
  writes, every access contained" — NOT "no page code ever runs": proxies
  are undetectable and their traps observe descriptor reads; a hostile
  `getImportMap` can do anything when called. Documented in safe.ts,
  passive-probe.ts, shim-map-probe.ts headers; the harness asserts
  unchanged state, not trap silence.
- **Host-side double projection kept deliberately:** probe output crossed
  the eval boundary and is attacker-shaped on a hostile page (a page can
  even patch `Object.getOwnPropertyDescriptor` before the probe runs), so
  the mapper re-projects everything through the schema allowlist. In the
  quality discussion this was identified as the most negotiable layer
  under the real threat model; kept per user's Option-1 decision.
- **Complexity assessment (user-driven):** the high cyclomatic complexity
  is concentrated, essential boundary complexity (defensive reads at the
  trust boundary keep views/DTO consumers free of defensive code —
  parse-don't-validate). The passivity requirement is grounded in the
  probe running in the main world of *arbitrary* pages with DevTools open,
  not only own NF apps, plus the shareable-export privacy story. Rejected
  alternatives: "trusting collector" descope (would be a spec change —
  XC-01, T7-AC-01/02/04 fall), clean-code decomposition of the probe/
  interpreters (would trade auditability for metric cosmetics).
- **YAGNI pass (user-driven):** cut dead reference baggage — `resolveLimits`
  override-clamping (never configured), `sanitizeOrigin`, `finiteNumber`,
  schema nodes `number`/`union`, host limit `maxImportMapTextBytes`; cut
  collect-then-discard fields the DTO deliberately omits (per-remote
  `integrity` — 29 hash entries crossing the eval boundary for nothing —
  provider `bundle`, `importShim.version`); public API trimmed to the
  Task-8 surface. Git history keeps the ported versions; doc comments say
  "re-add when a view needs it".
- **HIGH review finding fixed (relative-URL query leak, T7-AC-05/XC-02):**
  `sanitizeMaybeUrl` only caught `https?://` and `//` keys — relative
  keys (`/…`, `./…`, `../…`) and `string`-typed `file` fields passed
  query strings into the snapshot, and the privacy guard had the same
  `https?://`-only blind spot (defense-in-depth broken at the same point
  twice). Fix: relative URL-shaped keys sanitized; `file` schema-typed as
  `url` (semantically relative URLs — sanitized even without path
  prefix); guard extended to relative strings. Nuance pinned by test:
  bare specifiers (`foo?x`) are names, not URLs — nothing stripped.
- **Probe strings stay inline template literals (user discussion):**
  runtime file-loading would be async + asset-pipeline-dependent and
  weaken the audit story; bundler text-imports fail Angular's
  extension-based loader mapping. The upgrade path, if probe editing
  becomes real (Phase 2): `passive-probe.source.js` + manual embed script
  (derive-fixture pattern) + drift-guard test. Deferred per YAGNI.
- **Tests run in node, not jsdom:** the harness evaluates the sources in
  `node:vm` sandboxes — the same trust-boundary shape as the real
  DevTools eval. `test:collector` runs `tsc --noEmit` first (only type
  gate for this lib).
- **Fixture pages are self-contained:** frankenstein sandbox is rebuilt
  from the checked-in capture (no `/home/lutz/nf-insghts` dependency —
  consistent with the Task-2 corpus decision).

### Review Focus

- **Behavior claims:**
  - Evaluating `PASSIVE_PROBE_SOURCE` leaves any page byte-identical
    (digest-proven incl. hostile pages) and never invokes a getter or page
    function; `SHIM_MAP_PROBE_SOURCE` makes exactly one call
    (`importShim.getImportMap()`), contained on throw.
  - `mapProbeResult` over the frankenstein fixture page reproduces the
    checked-in fixture's `channels`/`runtime`/`importMaps` exactly and
    emits zero errors; unknown shapes yield `not-recognized` with no raw
    copy.
  - No URL in mapper output carries userinfo, query, or fragment —
    including relative specifiers, scope keys, and `file` fields; bare
    specifiers are never mutilated.
- **Assumptions / choices:** two-source design for the getImportMap
  exception (user-approved); `importShim` channel `not-recognized` when the
  shim probe was not run or returned garbage; `pageUrl: ''` + error when
  page metadata is unreadable; probe `importMaps: null` vs `[]` semantic;
  scope keys of externals sanitized (stricter than `derive-fixture.mjs`).
- **Scope notes:** `guards/privacy-scan.ts` + spec changed (leak fix second
  layer) — outside the task's key locations but same AC (XC-02);
  `package.json`/`tsconfig.json` wiring; no angular.json entry (collector
  is not an Angular project; consumed via path mapping).
- **Read next:**
  - `projects/collector/src/lib/shim-map-probe.ts` — the one sanctioned
    exception; check you agree with gating + containment
  - `projects/collector/src/lib/snapshot-mapper.ts` — channel-state rules
    and `sanitizeMaybeUrl` (the fixed leak surface)
  - `projects/collector/src/lib/passivity-harness.spec.ts` — whether the
    hostile page matches your threat model

### Test Evidence

Implementation session 2026-08-09:

- `CI=true npm test` → devtools-ui 61/61, devtools-bridge 42/42,
  collector 27/27 (4 spec files; incl. tsc typecheck), guards 18/18
  (incl. new relative-URL violation classes). All green after each of:
  initial port, YAGNI pass, leak fix + readability pass.
- `npm run build:extension` → AOT production build + bundle check green
  (collector not bundled yet; boundary guard confirms no `chrome.*` in it).
- **Negative tests of the static guard:** planted `localStorage.setItem`
  in the probe source → spec fails naming the token; planted `${…}`
  interpolation → fixedness spec fails; both restored → green.
- **Leak-fix verification:** all four review repro paths asserted fixed
  (import specifier `/a.js?token=…`, scope key `/app/?q=…`, scope-inner
  `./b?y=…`, `exposes[].file` `./entry.js?v=…`, plus external-remote
  `file` without path prefix); serialized snapshot searched for all leak
  markers; `scanForPrivacyViolations` green on mapper output, and the
  strengthened guard's poisoned test flags both new violation classes.
- **Pre-verified before the guard change:** checked-in capture and all 8
  fixtures contain no relative-URL-with-query strings (no false
  positives), and real `file` values are bare filenames (schema `url`
  change cannot alter fixture equality).

### Acceptance Coverage

- **T7-AC-01** — passed (→ XC-01): `probe-source.spec.ts` — both sources
  single fixed literals, no interpolation, forbidden-token lists (main
  probe: reference list verbatim incl. `getImportMap` + additions);
  negative-tested with planted violations.
- **T7-AC-02** — passed (→ XC-01): `passivity-harness.spec.ts` — sha256
  digests of sentinel globals, DOM import maps, and storage byte-identical
  before/after both probes on frankenstein and hostile pages; all counters
  0 except exactly one `getImportMap` call.
- **T7-AC-03** — passed: `edge-cases.spec.ts` — cyclic, accessor-backed,
  proxied, oversized, malformed → bounded data or structured errors; every
  probe run JSON-round-trips; no throw ever escapes.
- **T7-AC-04** — passed (→ XC-02): `snapshot-mapper.spec.ts` — unrecognized
  shape → `not-recognized` with reason; string-search proves no raw copy in
  probe output or snapshot.
- **T7-AC-05** — passed (→ XC-02): `snapshot-mapper.spec.ts` — all URLs
  sanitized incl. the four review-finding leak paths; verified with the
  repo privacy scan; guard hardened for the same class.
- **T7-AC-06** — passed: `snapshot-mapper.spec.ts` — frankenstein page →
  probes → mapper deep-equals the derived fixture's evidence layers;
  lossless JSON round-trip; typed `SnapshotV1` return.

### Open Issues

- Export privacy guard's real measuring point still arrives with live
  capture (→ Task 8, carried from task-6): wire `guards/export-privacy` /
  the privacy scan against real collector output once the bridge exists.
- A hostile `getImportMap` that never returns hangs the eval on the page
  side — timeout handling belongs to the bridge (→ Task 8).
- Fixtures still ship in the production bundle via `FixtureSnapshotProvider`
  (→ Task 8, carried from task-6).
- Deferred by YAGNI: probe-source authoring as real `.source.js` file +
  embed script + drift guard — adopt when the first real probe edit lands
  (Phase 2).
- Toolbar duplication across view templates unchanged (→ Task 9, carried).

### Context for Next Task

- **Collector API for the bridge (import from `collector`):**
  `PASSIVE_PROBE_SOURCE: string`, `SHIM_MAP_PROBE_SOURCE: string`,
  `mapProbeResult(rawProbe: unknown, rawShimMap: unknown, { capturedAt }):
  SnapshotV1`, `COLLECTOR_VERSION`. Nothing else is public.
- **Validated for Task 8:** evaluating the two fixed sources against a page
  and mapping yields a conforming, sanitized `SnapshotV1`; passivity and
  bounded-output guarantees are proven at harness level. The bridge only
  wires the DevTools eval and swaps the DI provider.
- **Intended eval flow:** evaluate `PASSIVE_PROBE_SOURCE`; only if its
  `globals.importShim` reports `present: true, descriptor: 'data'`,
  evaluate `SHIM_MAP_PROBE_SOURCE`; pass both raw results to
  `mapProbeResult` (pass `null` for the shim result when skipped — the
  mapper emits the honest channel state). Supply `capturedAt` from the
  bridge (no clock access in the collector).
- **Both eval results are untrusted by design** — feed them to the mapper
  verbatim; do not pre-validate or pre-shape them in the bridge.
- **Add a timeout** around the shim eval (hostile/never-returning
  `getImportMap`); on timeout call the mapper with `null`.
- **Beware the bundle check:** `check-panel-bundle.mjs` fails on the
  literal `eval(` in panel JS — the DevTools eval call in the bridge
  (`inspectedWindow.eval`) contains that substring; the check may need a
  refinement in Task 8.
- **Gotcha:** nothing under `projects/` may mention `chrome.` + identifier,
  even in comments (boundary guard scans everything outside bridge/
  extension) — collector comments say "DevTools eval" deliberately.
- **Testing:** `npm run test:collector` = tsc typecheck + vitest (node
  env). The vm-sandbox pattern in `src/testing/fixture-pages.ts` is the
  template for bridge-side probe tests.

### Git State

`git diff --stat`:

```
 guards/privacy-scan.spec.ts |  3 +++
 guards/privacy-scan.ts      | 10 +++++++++-
 package.json                |  3 ++-
 tsconfig.json               |  6 +++++-
 4 files changed, 19 insertions(+), 3 deletions(-)
```

`git status --short`:

```
 M guards/privacy-scan.spec.ts
 M guards/privacy-scan.ts
 M package.json
 M tsconfig.json
?? .claude/
?? projects/collector/
?? vitest.collector.config.mts
```

(`.claude/` is session tooling, not part of this task's commit scope.)
