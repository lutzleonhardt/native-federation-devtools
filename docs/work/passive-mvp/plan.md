# Native Federation DevTools — Passive MVP Plan (Phase 1)

Spec: docs/specs/native-federation-devtools.md

Branch scope: passive-mvp

Scope: Phase 1 of the product handoff — the passive capture path only:
three views (Remotes & Exposes, Shared Dependencies outcome-only, Import
Map) plus JSON export. Development is fixture-first: the UI is built
against real sanitized captures and the live Chrome binding lands last.
Phase 2 (recording reload, remote-entry claims, transport evidence, the
Evidence view, and micro-spikes A–C) is out of scope for this plan.

Agreed decisions: current stable Angular (AOT production build, zoneless,
signals, standalone components, no Material, no state library); Manifest
V3 DevTools extension with minimal permissions; only the devtools-bridge
library may reference `chrome.*` APIs; the collector core is ported and
trimmed — not rebuilt — from the private research repository
`/home/lutz/nf-insghts/native-federation-devtools` (`packages/collector`);
fixtures derive from its capture corpus
`captures/raw/frankenstein/20260724T134007Z/`. `SnapshotV1` is a small
versioned DTO that grows per view — no universal snapshot schema.

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

## Task 1: Scaffold the Angular workspace and MV3 extension shell

### Instructions

Create an Angular CLI workspace (npm) on the current stable Angular with
an application `devtools-ui`: zoneless, signals-first, standalone
components, AOT production build. No Angular Material, no state library.
Add an MIT `LICENSE`.

Build the extension shell: `extension/manifest.json` with
`"manifest_version": 3`, a `devtools_page`, and no permissions beyond
what a DevTools page requires (start with none). The `devtools_page`
loads a small plain-JavaScript `devtools.js` (kept outside the Angular
build) that registers one DevTools panel via
`chrome.devtools.panels.create`; the panel page hosts the built Angular
app. Add an npm script `build:extension` that assembles a
Chrome-loadable `dist/extension/` from the manifest, the devtools
bootstrap, and the Angular browser production build.

MV3 CSP forbids `eval` and `new Function` in extension pages: Angular
JIT would violate it, so the panel must use the AOT production build.

Theme support from the start: define all panel colors as CSS custom
properties with dark and light values. At panel bootstrap apply the
DevTools theme (`chrome.devtools.panels.themeName`, passed from the
devtools bootstrap); in dev mode (`ng serve`) fall back to
`prefers-color-scheme`.

The Angular app renders a static shell with navigation placeholders for
the three Phase-1 views: Remotes & Exposes, Shared Dependencies, Import
Map. The app must not reference `chrome.*` APIs.

### Acceptance

- **T1-AC-01** — `ng serve` runs devtools-ui as a normal web app in a
  plain browser (no `chrome.*` present); the shell with the three view
  placeholders renders.
- **T1-AC-02** — `npm run build:extension` produces `dist/extension/`
  that Chrome loads as an unpacked MV3 extension; opening DevTools shows
  the panel rendering the Angular app with no CSP violations.
- **T1-AC-03** — An automated check over the built panel bundle finds no
  `\beval\(` or `new Function(` occurrences and no zone.js inclusion.
- **T1-AC-04** — Panel colors come from CSS custom properties; the
  DevTools theme is applied at bootstrap and dev mode falls back to
  `prefers-color-scheme`.

### Key Locations

- `package.json`, `angular.json`, workspace config
- `projects/devtools-ui/` (or the CLI's chosen app layout)
- `extension/manifest.json`, `extension/devtools.html`,
  `extension/devtools.js`, panel host page
- `scripts/` build-extension script
- `LICENSE`

### Key Discoveries

- The `devtools_page` is loaded whenever DevTools opens; the panel page
  is an ordinary HTML page on the extension origin.
- `chrome.devtools.panels.themeName` exposes the active DevTools theme.
- A working minimal manifest/panel wiring exists in `apps/devtools-probe`
  of the private research repo
  `/home/lutz/nf-insghts/native-federation-devtools` — read-only
  reference, not a template.

## Task 2: Snapshot DTO v1, provider interface, and real-capture fixtures

### Instructions

Create the `devtools-bridge` library — the only place in the workspace
allowed to reference `chrome.*` APIs (it uses none yet; the live provider
arrives in Task 8).

Define `SnapshotV1`: plain JSON-serializable TypeScript types with
`schemaVersion: 1`, containing capture metadata (sanitized page URL,
timestamp, capture mode `passive`, collector version), per-channel
availability (`available` | `unavailable` with reason |
`not-recognized`), the runtime resolver projection (the four
repositories `remotes`, `scoped-externals`, `shared-externals`,
`shared-chunks` — projected fields only, never raw page data), the
effective import maps (specifier → target, scopes, integrity presence),
and structured collection errors. Keep the evidence layers structurally
separate: runtime outcome and import-map resolution must not be merged
into one interpreted structure. Include only fields the three Phase-1
views need — the DTO grows per view.

Define `SnapshotProvider` (`captureSnapshot(): Promise<SnapshotV1>`) and
implement `FixtureSnapshotProvider` for dev mode; wire DI so `ng serve`
uses it.

Derive the primary fixture from the real production capture corpus in
`/home/lutz/nf-insghts/native-federation-devtools/captures/raw/frankenstein/20260724T134007Z/`
(host plus remotes including `whiteboard`, the react 18.3.1 share
example, the 22-import shim map with one scope and 29 integrity
entries), copying only the minimal projected data. Add clearly-labeled
synthetic fixture variants for UI states: missing channel,
not-recognized shape, empty page.

Add two automated guards: a privacy scan over all checked-in fixtures
(no URL userinfo/query/fragment; no cookie, header, body, credential, or
business-data fields) and a bridge-boundary check that fails when any
file outside devtools-bridge (and the plain-JS extension bootstrap)
references `chrome.`.

### Acceptance

- **T2-AC-01** — `SnapshotV1` is versioned and JSON-serializable; a
  serialize → parse → deep-equal round-trip test passes; runtime-outcome
  and import-map layers are structurally separate.
- **T2-AC-02** — The primary fixture derives from the real Frankenstein
  production capture; synthetic variants exist for missing-channel,
  not-recognized, and empty-page states and are labeled synthetic.
- **T2-AC-03** — The automated privacy scan passes over all fixtures and
  fails on a deliberately poisoned fixture in its own test. Contributes
  to XC-02.
- **T2-AC-04** — The boundary check fails on a `chrome.` reference
  outside devtools-bridge (proven by test) and passes on the tree.
  Contributes to XC-03.

### Key Locations

- devtools-bridge library project (snapshot types, provider interface,
  fixture provider)
- fixtures directory
- vitest setup, privacy-scan and boundary-check tests
- devtools-ui DI configuration

### Key Discoveries

- The page global `__NATIVE_FEDERATION__` exposes exactly four
  repositories: `remotes`, `scoped-externals`, `shared-externals`,
  `shared-chunks` (Orchestrator 4.1.1 — the only demonstrated shape).
- Demonstrated example for fixture content: the `whiteboard` remote
  declares shared `react` 18.3.1 (required `^18.3.1`, singleton, strict,
  out-file `react.QYXZqQxJ1j.js`); `shared-externals` (global scope)
  holds react 18.3.1 with action `share`, sole provider `whiteboard`;
  the effective map targets react at `…/whiteboard/react.QYXZqQxJ1j.js`.
- Missing evidence is always an explicit availability state with a
  reason — never an invented default.

## Task 3: Remotes & Exposes view and honest-state primitives

### Instructions

Build the first real view against `SnapshotProvider`: per remote — name,
scope URL, and expose keys — as a dense, DevTools-style, theme-aware
table/list.

Identity rule: an expose is identified by the pair (remote name, expose
key). Distinct remotes can expose the same key or retain a colliding
module name; render collisions as separate entries attributed to each
remote — never merged and never keyed by expose key alone.

Create the shared honest-state primitives used by all views: *missing*
(evidence channel unavailable or not captured — show the reason),
*partial* (captured but coverage-limited), *ambiguous* (an association
the evidence cannot prove), plus the global "no Native Federation
detected / not recognized" empty state. Views never invent data.

Add a manual refresh action that re-invokes `captureSnapshot()` through
the provider. Cover with fixture-driven component tests: normal render,
collision, missing channel, not-recognized.

### Acceptance

- **T3-AC-01** — With the primary fixture, each remote renders with
  name, scope URL, and its expose keys.
- **T3-AC-02** — A synthetic collision fixture (two remotes exposing the
  same key) renders separate entries attributed to each remote.
- **T3-AC-03** — A fixture without recognized Native Federation renders
  the explicit not-detected state with reason; no rows are invented.
  Contributes to XC-04.
- **T3-AC-04** — The honest-state primitives are shared components with
  distinct renderings for missing/partial/ambiguous, covered by
  component tests. Contributes to XC-04.
- **T3-AC-05** — Refresh requests a new snapshot through
  `SnapshotProvider` (verified with a counting fixture provider).

### Key Locations

- devtools-ui: remotes view components and tests
- shared honest-state primitive components

### Key Discoveries

- The identity pair rule comes from demonstrated evidence: distinct
  remotes can expose the same key or retain a colliding module name.
- The UI is deliberately utilitarian: dense tables in DevTools style,
  no Material, dark/light via the CSS custom properties from Task 1.

## Task 4: Shared Dependencies view (resolver outcome only)

### Instructions

Render, per shared package and scope from the runtime projection: the
selected version tag, the resolver action (`share` | `scope` | `skip`),
the providing remote, and each participant's declared version
requirement.

Claims — what each participant's remote entry actually declared — are
Phase 2 recording material: render the claims aspect as *missing* with
the reason that it requires the recording reload (Phase 2). The view is
honest that it shows the outcome, not the claims behind it.

Competing versions: no duplicate-version scenario was demonstrated in
research, so when a package carries multiple version tags, render them
as unresolved uncertainty (*ambiguous*, all versions visible) — never an
interpreted winner. Do not display the resolver `cached` flag in
Phase 1: it is resolver bookkeeping, not browser-cache evidence, and
omitting it avoids the misreading.

Cover with component tests: the react example, a synthetic
multi-version fixture, and the claims-missing state.

### Acceptance

- **T4-AC-01** — With the primary fixture, `react` renders: global
  scope, selected version 18.3.1, action `share`, provider `whiteboard`,
  and the participants' declared requirements.
- **T4-AC-02** — A synthetic fixture with two version tags for one
  package renders as unresolved uncertainty with both versions visible
  and no winner chosen. Contributes to XC-04.
- **T4-AC-03** — The claims aspect renders as missing with an
  explanatory reason; nothing implies claims were observed. Contributes
  to XC-04.

### Key Locations

- devtools-ui: shared-dependencies view components and tests
- devtools-bridge: small `SnapshotV1` extension if per-participant
  requirements need additional projected fields

### Key Discoveries

- Resolver actions are exactly `share`, `scope`, `skip`.
- The repositories record per-participant version requirements alongside
  the selected version and provider.
- The `cached` flag proves nothing about browser caching, download,
  execution, or mounting — hence omitted.

## Task 5: Import Map view

### Instructions

Render the effective import-map layer: global imports (specifier →
effective target), scopes grouped beneath, and an integrity-presence
indicator per entry. Add a short caption stating what this layer proves:
resolution only — an import-mapped file is not necessarily requested,
and a requested file is not proof of execution.

A snapshot without an import-map channel renders the *missing* state
with its reason. Cover with component tests against the primary fixture
and a missing-map fixture.

### Acceptance

- **T5-AC-01** — The primary fixture renders its 22 global imports with
  effective targets, the single scope grouped, and integrity presence
  per entry.
- **T5-AC-02** — A fixture without an import-map channel renders the
  missing state with reason. Contributes to XC-04.

### Key Locations

- devtools-ui: import-map view components and tests

### Key Discoveries

- The demonstrated page had exactly one shim import map with 22 global
  imports, one scope, and 29 integrity entries — the fixture mirrors it.
- The layer proves resolution only; the caption guards against
  over-reading.

## Task 6: Snapshot JSON export

### Instructions

Add an export action that downloads the current `SnapshotV1` as a JSON
file — the export *is* the DTO; there is no separate export schema.
Availability states and collection errors are included so gaps stay
visible in the exported file. Name the file from the sanitized page host
plus a timestamp. Use a Blob + anchor download, which works in extension
pages; the feature operates purely on the DTO, so it works identically
in dev (fixture) and later extension mode.

Add an automated privacy test: serialized exports of the primary fixture
and of a hostile/synthetic fixture must contain no cookies, headers,
credentials, request or response bodies, or business data, and all URLs
must be free of userinfo, query, and fragment.

### Acceptance

- **T6-AC-01** — The exported file parses and deep-equals the in-memory
  `SnapshotV1`, including `schemaVersion`, availability states, and
  errors.
- **T6-AC-02** — The automated privacy scan over exported JSON (primary
  and hostile fixtures) finds no forbidden material. Contributes to
  XC-02.

### Key Locations

- devtools-ui: export service/component and tests

### Key Discoveries

- Exports exist to be shared (bug reports, tickets); privacy must hold
  structurally, not by user care.

## Task 7: Port the framework-free passive collector core

### Instructions

Create a framework-free TypeScript `collector` library (no Angular
imports; the probe source itself stays plain, self-contained JS). Port
and trim from the private research repo
`/home/lutz/nf-insghts/native-federation-devtools/packages/collector/src`
(read-only reference): the fixed `PASSIVE_PROBE_SOURCE` eval string
(`passive-probe.js`), defensive read routines (`safe.js`), the
repository schema allowlist (`runtime-schema.js`), URL sanitization
(`privacy.js`), and the error structure with caps (`errors.js`,
`constants.js`). Trim to Phase-1 needs: page metadata, the four
`__NATIVE_FEDERATION__` repositories, DOM import maps
(`script[type="importmap"]` and `importmap-shim`), and
`importShim.getImportMap()` where present. Do not port the HAR,
artifact, recording, session, or generic normalize/export modules.

The probe source is deliberately a single fixed expression, never
assembled from page-derived strings. It reads data properties via
property descriptors (never invoking getters or proxies), applies inline
caps (string length, array items, object keys, total entries), collects
structured per-field errors instead of throwing, and returns a
JSON-serializable result. The schema allowlist copies only recognized
Orchestrator-shape fields; an unrecognized shape yields an explicit
not-recognized availability state with no raw data copied. URL
sanitization strips userinfo, query, and fragment.

Add a mapper from probe output to `SnapshotV1` (consumed by the bridge
in Task 8). Port the safety tests: a static test on the probe source (no
page-state writes, no interpolation), a passivity harness (evaluate the
probe against fixture pages including hostile ones — sentinel globals,
DOM import maps, and storage digests unchanged before/after), and
edge-case tests (cyclic, throwing getters, proxies, oversized,
malformed).

### Acceptance

- **T7-AC-01** — The probe source is one fixed string; an automated test
  verifies no page-derived interpolation and no write operations
  targeting page state. Contributes to XC-01.
- **T7-AC-02** — The passivity harness shows sentinel globals, DOM
  import maps, and storage digests byte-identical before and after probe
  evaluation, including on hostile pages. Contributes to XC-01.
- **T7-AC-03** — Cyclic, accessor-backed, proxied, oversized, and
  malformed values produce bounded data or structured collection errors;
  the capture as a whole never throws.
- **T7-AC-04** — An unrecognized `__NATIVE_FEDERATION__` shape yields a
  not-recognized availability state and no raw copy of unrecognized
  data. Contributes to XC-02.
- **T7-AC-05** — All URLs in mapper output are stripped of userinfo,
  query, and fragment. Contributes to XC-02.
- **T7-AC-06** — Mapper output for a Frankenstein-like fixture page
  validates as `SnapshotV1` (round-trip against the DTO types).

### Key Locations

- collector library project and tests
- reference: `/home/lutz/nf-insghts/native-federation-devtools/packages/collector/src`

### Key Discoveries

- `inspectedWindow.eval` runs the probe in the inspected page's main
  world with console-equivalent power; read-only is enforced by the
  fixed source plus tests, not by the browser.
- Reading getters or proxies executes page code — descriptor-based data
  reads are what keep passivity true.
- Reference sizes to port and trim: passive-probe.js 337 lines, safe.js
  171, runtime-schema.js 199, privacy.js 125, errors.js 100,
  constants.js 51. The generic normalize/export/artifacts/session
  modules are prototype scaffolding — do not port them.

## Task 8: Live Chrome bridge and end-to-end verification

### Instructions

Implement `ChromeSnapshotProvider` in devtools-bridge: invoke the
collector's fixed probe source via
`chrome.devtools.inspectedWindow.eval()`, map the result through the
collector mapper into `SnapshotV1`, and translate eval failures
(exceptionInfo, unavailable inspected window) into availability states.
Extension mode uses `ChromeSnapshotProvider`; `ng serve` keeps
`FixtureSnapshotProvider` (environment-based DI). Capture stays
manual-refresh only; navigation handling is deferred beyond Phase 1.

Unit-test with a mocked `chrome.devtools` global: eval success, eval
exception, missing global.

Verify end-to-end against the unchanged Frankenstein production build
(served locally from
`/home/lutz/projects/FrankensteinMeetingRoom/dist/deploy` — read-only
reference): the real panel's passive snapshot shows the host, both
remotes, the react 18.3.1 `share` outcome, and the effective import map;
spot-check page digests via the console before/after capture; record the
steps and result in the task log.

### Acceptance

- **T8-AC-01** — With mocked chrome APIs: successful eval yields a
  `SnapshotV1`; exceptionInfo and unavailable inspected window yield
  availability states, never a crash.
- **T8-AC-02** — The boundary check still passes: `chrome.` references
  exist only in devtools-bridge and the plain-JS extension bootstrap.
  Contributes to XC-03.
- **T8-AC-03** — Manual E2E against the unchanged Frankenstein
  production build shows host, both remotes, the react share outcome,
  and the import map, with before/after page digests unchanged; recorded
  in the task log. Contributes to XC-01.
- **T8-AC-04** — An export from the real panel passes the same privacy
  scan as the fixtures. Contributes to XC-02.

### Key Locations

- devtools-bridge: `ChromeSnapshotProvider`, DI configuration, tests
- Frankenstein reference: `/home/lutz/projects/FrankensteinMeetingRoom`
  (read-only; serve `dist/deploy` unchanged)

### Key Discoveries

- Content scripts share the DOM but not page globals;
  `inspectedWindow.eval` is the only channel to `__NATIVE_FEDERATION__`.
- A post-load passive snapshot carries no network evidence — that is
  expected; transport evidence belongs to Phase 2 recording.

## Task 9: Shell-level refresh and capture metadata

> **Amended 2026-08-10** (original block in git history): the per-tab
> channel-state indicators are deferred — their channel↔tab mapping was
> defined over the V1 tab triple, which the V2 proposal
> (`docs/specs/native-federation-devtools-v2.md`) replaces with a new
> tab set (Packages · Remotes · Import Map · Diagnostics). Building the
> mapping, aggregate semantics, and shell tests against the outgoing
> tabs would be immediate redesign mass; view-level honest states (T3–T5,
> XC-04) carry the honesty guarantee meanwhile. The indicator intent —
> nav-level channel state with the honest visual vocabulary (unavailable
> as muted off-dot, not an error; not-recognized in warning tone;
> capturing claims no state; reasons verbatim as tooltips) — moves into
> the V2 spec input, where nav-level channel signaling is currently
> unspecified. This task keeps the V2-compatible half: shell-level
> refresh and capture-metadata consolidation, which the V2
> one-store architecture requires anyway.

### Instructions

Consolidate the snapshot actions in the shell: one snapshot feeds all
views, so refresh and capture metadata belong to the shell, not to a
single view.

Move the manual refresh action and the capture meta (page URL,
captured-at) from the Remotes & Exposes view toolbar into the shell.
Refresh keeps re-invoking `captureSnapshot()` through the
`SNAPSHOT_PROVIDER` token via the shared root-provided `SnapshotStore`
(from Task 3) — shell and views must share the same store instance so a
refresh updates the active view.

Cover with fixture-driven component tests through the App shell,
including a counting provider for the moved refresh action.

### Acceptance

- **T9-AC-01** — With the primary fixture, the shell shows page URL and
  captured-at. (Amended: the tab-indicator half is deferred to V2.)
- **T9-AC-02** — N/A (amended 2026-08-10): per-tab unavailable/partial
  indicators deferred to the V2 shell design.
- **T9-AC-03** — N/A (amended 2026-08-10): warning-tone indicators
  deferred to the V2 shell design.
- **T9-AC-04** — Shell refresh re-invokes `captureSnapshot()` (verified
  with a counting fixture provider) and updates the active view from the
  same store instance.
- **T9-AC-05** — The Remotes & Exposes view no longer carries its own
  refresh/meta toolbar; its honest-state rendering is unchanged and its
  Task-3 component tests stay green (adjusted only for the moved
  toolbar).

### Key Locations

- devtools-ui shell: `app.ts`, `app.html`, `app.css` (refresh, meta)
- `projects/devtools-ui/src/app/shared/snapshot-store.ts` (shared
  instance; no API change expected)
- `projects/devtools-ui/src/app/views/remotes-exposes.*` (toolbar
  removal)

### Key Discoveries

- Preserved for the V2 spec input (deferred with the indicators):
  `synthetic-missing-channel` and `synthetic-empty-page` carry the
  identical `nativeFederationGlobals` state — the difference (one
  document import map vs. zero) only lives in import-map evidence, and
  nav-level channel state is the at-a-glance way to surface it without
  any view interpreting foreign channels.
- The Task-3 `partial` primitive still has no consumer; its first real
  use case (the import-map channel aggregate) moves to V2.

## Cross-Cutting Acceptance

- **XC-01** — Passive capture never mutates the inspected page: no
  global, DOM, or storage writes, no Federation loader calls, no
  navigation — proven jointly by the collector safety tests and the E2E
  digest check. **Touches:** T7, T8.
- **XC-02** — Fixtures, snapshots, and exports never contain cookies,
  headers, credentials, request/response bodies, or business data; all
  URLs are stripped of userinfo, query, and fragment. **Touches:** T2,
  T6, T7, T8.
- **XC-03** — No file outside the devtools-bridge library (and the
  plain-JS extension bootstrap) references `chrome.*` APIs, enforced by
  an automated check from Task 2 onward. **Touches:** T2, T8.
- **XC-04** — Every view renders missing/partial/ambiguous or
  not-recognized states instead of invented data; unknown is never
  converted into false certainty. **Touches:** T3, T4, T5. (T9's
  indicator contribution removed by the 2026-08-10 amendment — deferred
  to V2.)
