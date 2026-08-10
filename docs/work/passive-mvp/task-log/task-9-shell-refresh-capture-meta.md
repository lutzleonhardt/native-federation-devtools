# Task 9: Shell-level refresh and capture metadata

### Task

Consolidated the snapshot actions in the shell: moved the manual refresh
action and the capture meta (page URL, captured-at) from the three view
toolbars into the App shell — driven by the shared root-provided
`SnapshotStore` — and removed the duplicated toolbar block from all three
views. (The task's original second half, per-tab channel-state indicators,
was deferred to the V2 spec by the 2026-08-10 plan amendment; T9-AC-02/03
are N/A.)

### Status

DONE

### Files Modified

Shell (devtools-ui):

- `projects/devtools-ui/src/app/app.ts` (modified) — injects
  `SnapshotStore`; new `refresh()` plus two computeds: `capturing`
  (disables the button mid-capture) and `capture` (capture meta of the
  current snapshot, read from the store directly — channel-agnostic, see
  Key Decisions)
- `projects/devtools-ui/src/app/app.html` (modified) — right-aligned
  `.shell-actions` group in the nav (new `.shell-refresh` button + the
  existing `.shell-export` button); new `.shell-status` row under the nav
  showing `pageUrl` (ellipsis-truncated, full URL as `title`) and
  `capturedAt` whenever a snapshot is captured
- `projects/devtools-ui/src/app/app.css` (modified) — `.shell-export`
  block replaced by `.shell-actions` (flex group, `margin-left: auto`);
  new `.shell-status` styles (muted tokens, border, nowrap + truncation)
- `projects/devtools-ui/src/app/app.spec.ts` (modified) — new
  `SequenceSnapshotProvider` (counts calls, serves listed fixtures in call
  order); three new tests: shell status shows URL + captured-at and the
  refresh button's disabled cycle (T9-AC-01), capture meta stays visible
  for a not-recognized snapshot (honest-state guarantee moved here from
  the view specs), shell refresh re-captures and the routed Remotes view
  renders the second, different snapshot from the same store instance
  (T9-AC-04)

Views (toolbar removal, T9-AC-05):

- `projects/devtools-ui/src/app/views/remotes-exposes.html` (modified) —
  `.view-toolbar` header block replaced by the bare `<h1>`
- `projects/devtools-ui/src/app/views/shared-dependencies.html`
  (modified) — same
- `projects/devtools-ui/src/app/views/import-map.html` (modified) — same
- `projects/devtools-ui/src/app/views/remotes-exposes.ts`,
  `.../shared-dependencies.ts`, `.../import-map.ts` (modified) — the now
  template-unreferenced `refresh()` methods removed; nothing else touched
- `projects/devtools-ui/src/app/views/remotes-exposes.spec.ts`
  (modified) — T3-AC-05 refresh test removed (coverage moved to the shell
  spec); stale AC reference in the provider comment dropped
- `projects/devtools-ui/src/app/views/shared-dependencies.spec.ts`
  (modified) — refresh test and "capture meta visible in not-detected"
  test removed (both moved to the shell spec)
- `projects/devtools-ui/src/app/views/import-map.spec.ts` (modified) —
  refresh test and "capture meta visible in missing state" test removed
  (both moved to the shell spec)

Styles:

- `projects/devtools-ui/src/styles.css` (modified) — orphaned
  `.view-toolbar`, `.view-toolbar h1`, and `.view-meta` blocks removed
  (`.view h1` already existed standalone, so the kept headings stay
  styled)

### Files Read (Context Only)

- `docs/work/passive-mvp/plan.md` — preamble + amended Task 9 block
- Task logs 8 (predecessor: refresh-flow guidance, carried toolbar issue),
  3 (store/toolbar origin, counting-provider recipe), 6 (shell-button
  precedent, `app.spec.ts` stub pattern)
- `projects/devtools-ui/src/app/shared/{snapshot-store,runtime-view-state}.ts`
  — store contract (unchanged) and the capture-meta semantics note
- `projects/devtools-ui/src/app/views/*.{ts,html,spec.ts}`,
  `app.{ts,html,css,spec.ts}`, `app.routes.ts`, `styles.css` — the
  surfaces being changed
- `projects/devtools-bridge/src/lib/fixtures/{frankenstein-production,synthetic-not-recognized}.fixture.ts`
  — capture-meta values for the test assertions

### Key Decisions

- **All three view toolbars removed, not just the Remotes view's:**
  T9-AC-05 literally names only Remotes & Exposes, but the task
  instructions' rationale ("refresh and capture metadata belong to the
  shell, not to a single view") and the open issue carried since task-5
  ("toolbar duplication across the three view templates → Task 9") make
  three-view removal the intent. User approved this reading in the task
  briefing.
- **Shell reads `store.state()` directly, not through a view-state
  helper:** the shell is channel-agnostic — meta shows whenever a
  captured snapshot exists, including not-detected/missing channel
  states. This keeps the `runtimeViewState` doc's guarantee ("which page
  was captured when is evidence even when nothing was found") and avoids
  coupling the shell to the runtime channel's branching.
- **The honest-state meta guarantee moved with the meta:** two view specs
  asserted "capture meta stays visible in the not-detected/missing
  state". Deleted there, re-established as a shell test
  (not-recognized fixture → `.shell-status` still shows the page URL) —
  the guarantee survives the relocation instead of silently vanishing.
- **Meta in a slim `.shell-status` row under the nav, not inside the nav
  row:** DevTools panels get narrow; 3 links + 2 buttons + a long page
  URL in one row would crowd. The status row truncates the URL with
  ellipsis and exposes the full value as a tooltip. Pure CSS — easy to
  restyle when the V2 shell (new tab set) lands.
- **`SnapshotStore` untouched:** as the plan predicted, no API change —
  the shell consumes the existing `state()`/`refresh()` surface. Views
  now have no reference to `refresh()` at all; the store's root-provided
  single instance is what makes the shell button update the active view.
- **T9-AC-04 tested through the real router:** the shell spec navigates
  (`Router.navigateByUrl('/remotes')`) so the Remotes view renders inside
  the App shell via the router outlet, then asserts call count 1→2 and
  that the table content switches to the second fixture's remotes —
  proving "same store instance" observably rather than by identity
  assertion. Per-test providers land via `TestBed.overrideProvider`
  after the suite-level `configureTestingModule`.

### Review Focus

- **Behavior claims:**
  - The shell shows the captured page URL and captured-at for every
    captured snapshot — including not-detected — and shows nothing while
    capturing; the refresh button is disabled exactly while capturing.
  - Clicking the shell refresh re-invokes `captureSnapshot()` through
    the DI token and the active routed view re-renders from the same
    store instance (proven with a two-fixture sequence provider).
  - The three views render identically to Task 3–5 minus the toolbar:
    honest-state branching, tables, and observations are untouched
    (view specs unchanged except the five moved tests).
- **Assumptions / choices:** three-view toolbar removal under the
  "consolidate" reading (user-approved); shell meta from `store.state()`
  directly instead of a view-state helper; status-row layout (second row
  with truncation) chosen without a spec mandate.
- **Scope notes:** `styles.css` lost the orphaned toolbar/meta styles
  (cleanup forced by the removal, no visual change to kept elements);
  the two other views' specs changed too — a consequence of the
  three-view reading, not silent drift.
- **Read next:**
  - `projects/devtools-ui/src/app/app.spec.ts`
    (`SequenceSnapshotProvider` + the T9-AC-04 test) — the router-based
    same-store proof is the core new test shape
  - `projects/devtools-ui/src/app/app.ts` — whether reading
    `store.state()` directly in the shell (bypassing view-state helpers)
    convinces you as the channel-agnostic reading
  - `projects/devtools-ui/src/app/app.html` — nav/status layout for the
    narrow-panel case

### Test Evidence

Session 2026-08-10:

- `CI=true npm test` → devtools-ui 59/59 (61 − 5 moved view tests + 3 new
  shell tests), devtools-bridge 48/48, collector 31/31, guards 18/18.
- `npm run build:extension` → AOT production build + bundle check green
  (278 kB raw / 73 kB transfer, 2 JS + 2 HTML scanned).
- Headless Chromium smoke against `ng serve --port 4300`
  (`--headless --dump-dom --virtual-time-budget=8000`):
  - default URL (primary fixture): `.shell-status` present with
    `frankenstein-meeting-room` URL and `2026-07-24T13:50:22.812Z`;
    4 `<tr>` (header + 3 rows); **zero** `view-toolbar`/`view-meta`
    occurrences in the DOM.
  - `?fixture=synthetic-not-recognized`: not-detected state rendered
    *and* `.shell-status` still shows
    `synthetic-fixture.example/not-recognized/`.
- Env gotcha (new): a sandboxed background `ng serve` binds its port
  only inside the sandbox — the host-side curl/Chromium gets connection
  refused (`ss` shows nothing listening). Start the dev server with
  sandbox disabled for smoke runs. Also: piping the serve command
  through `head` kills it via SIGPIPE once the pipe closes.

### Acceptance Coverage

- **T9-AC-01** — passed: `app.spec.ts` "shows page URL and captured-at
  in the shell status once captured" (plus the disabled-cycle assertions
  and the not-recognized meta test); headless smoke confirms in a real
  browser. (Amended AC: the tab-indicator half is deferred to V2.)
- **T9-AC-02** — N/A: per-tab unavailable/partial indicators deferred to
  the V2 shell design (plan amendment 2026-08-10).
- **T9-AC-03** — N/A: warning-tone indicators deferred to the V2 shell
  design (plan amendment 2026-08-10).
- **T9-AC-04** — passed: `app.spec.ts` "refresh re-captures and updates
  the active view through the shared store" — counting sequence provider
  (calls 1→2), routed Remotes view switches from the primary fixture's
  remotes to the collision fixture's, shell meta follows.
- **T9-AC-05** — passed: all three view templates carry no
  refresh/meta toolbar (DOM-verified: zero `view-toolbar`/`view-meta`);
  the Task-3/4/5 component tests are green with only the five moved
  tests removed — honest-state rendering untouched.

### Open Issues

- The new shell layout has only been verified headless — check the
  status row and button group once in the real Chrome DevTools panel at
  narrow width (next manual e2e or with the V2 shell work).
- The Task-3 `partial` badge primitive still has no consumer; its first
  real use case (the import-map channel aggregate) moved to V2 with the
  indicators (plan Key Discoveries, carried).
- Probe-source authoring as real `.source.js` + embed script + drift
  guard: deferred YAGNI, adopt on the first real probe edit (Phase 2,
  carried from task-7/8).

### Context for Next Task

- **Phase-1 plan is complete with this task** — Tasks 1–9 are DONE; what
  follows is the V2 proposal (`docs/specs/native-federation-devtools-v2.md`)
  with its new tab set and one-store architecture.
- **Shell contract for V2:** `App` owns refresh + capture meta via the
  root-provided `SnapshotStore` (`state()`, `refresh()` — unchanged API).
  Views have no snapshot actions left; they render purely from their
  view-state helpers. Nav-level channel signaling (the deferred
  indicators) is unspecified in V2 input — design it there.
- **Shell test recipe** (`app.spec.ts`): suite-level
  `configureTestingModule` with a stub provider + per-test
  `TestBed.overrideProvider(SNAPSHOT_PROVIDER, { useValue: … })`;
  `SequenceSnapshotProvider` serves different fixtures per call for
  update-propagation tests; render a routed view through the shell with
  `Router.navigateByUrl(...)` + the existing `settle()` helper.
- **Selectors:** `.shell-refresh`, `.shell-export` (buttons in
  `.shell-actions`), `.shell-status` with `.shell-status-url` /
  `.shell-status-time` — used by tests, keep stable or adjust specs.
- **Env gotchas:** background dev servers must run sandbox-disabled to be
  reachable from host-side curl/Chromium (and don't pipe them through
  `head` — SIGPIPE kills them); dev server binds IPv6 (`localhost`), port
  4300 convention; `?fixture=<id>` must be present at load time.

### Git State

`git diff --stat`:

```
 projects/devtools-ui/src/app/app.css               | 24 ++++++-
 projects/devtools-ui/src/app/app.html              | 35 +++++++---
 projects/devtools-ui/src/app/app.spec.ts           | 75 +++++++++++++++++++++-
 projects/devtools-ui/src/app/app.ts                | 20 +++++-
 projects/devtools-ui/src/app/views/import-map.html | 15 +----
 .../devtools-ui/src/app/views/import-map.spec.ts   | 23 -------
 projects/devtools-ui/src/app/views/import-map.ts   |  4 --
 .../devtools-ui/src/app/views/remotes-exposes.html | 15 +----
 .../src/app/views/remotes-exposes.spec.ts          | 17 +----
 .../devtools-ui/src/app/views/remotes-exposes.ts   |  4 --
 .../src/app/views/shared-dependencies.html         | 15 +----
 .../src/app/views/shared-dependencies.spec.ts      | 24 -------
 .../src/app/views/shared-dependencies.ts           |  4 --
 projects/devtools-ui/src/styles.css                | 16 -----
 14 files changed, 146 insertions(+), 145 deletions(-)
```

`git status --short`:

```
 M projects/devtools-ui/src/app/app.css
 M projects/devtools-ui/src/app/app.html
 M projects/devtools-ui/src/app/app.spec.ts
 M projects/devtools-ui/src/app/app.ts
 M projects/devtools-ui/src/app/views/import-map.html
 M projects/devtools-ui/src/app/views/import-map.spec.ts
 M projects/devtools-ui/src/app/views/import-map.ts
 M projects/devtools-ui/src/app/views/remotes-exposes.html
 M projects/devtools-ui/src/app/views/remotes-exposes.spec.ts
 M projects/devtools-ui/src/app/views/remotes-exposes.ts
 M projects/devtools-ui/src/app/views/shared-dependencies.html
 M projects/devtools-ui/src/app/views/shared-dependencies.spec.ts
 M projects/devtools-ui/src/app/views/shared-dependencies.ts
 M projects/devtools-ui/src/styles.css
?? .claude/
```

(`.claude/` is session tooling, not part of this task's commit scope.)
