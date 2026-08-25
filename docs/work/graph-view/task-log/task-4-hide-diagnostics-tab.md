### Task

Presentation-only nav change: the Diagnostics entry is removed from the
panel navigation while the placeholder route stays reachable by direct
URL (no redirect); the existing app/shell pins are extended in place and
source comments record that the tab returns when resolution-model
Task 10 (canonical Diagnostics) lands.

### Status

DONE

The single acceptance criterion (T4-AC-01) is covered by the two adjusted
`app.spec.ts` pins (12/12 green), the full repository suite is green
(697, unchanged total vs. Task 3), and a live headless-browser round
verified both facts against the running dev server: the nav renders
exactly four tabs and the `#/diagnostics` deep link still renders the
honest placeholder.

### Files Modified

- `projects/devtools-ui/src/app/app.html` (modified) — Diagnostics `<a>`
  removed from the shell nav; template comment at the removal site notes
  the tab returns with resolution-model Task 10 and points at the
  deferral record (`docs/work/resolution-model/plan.md`, "Plan amendment
  (2026-08-23): demo resequencing").
- `projects/devtools-ui/src/app/app.routes.ts` (modified) — route code
  untouched; two-line comment on the `diagnostics` route (hidden from
  nav until resolution-model Task 10, stays reachable by direct URL, no
  redirect).
- `projects/devtools-ui/src/app/app.spec.ts` (modified) — nav pin
  `renders the V2 tab set` now expects
  `['Packages', 'Remotes', 'Import Map', 'Graph (preview)']` (comment
  extended to T8-AC-01 + T4-AC-01); the existing `/diagnostics` direct
  navigation in the placeholder test is re-dedicated as the T4-AC-01
  reachability pin via comment — its assertion code is unchanged.

### Files Read (Context Only)

- `docs/work/graph-view/plan.md` — preamble + Task 4 block only (task
  isolation).
- `docs/work/graph-view/task-log/` — `task-3` (predecessor: confirms
  Task 4 independence, names the exact files and pins; plan-hygiene item
  already done — amendment committed as a1177a7), `task-1` (only other
  relevant log: last touched all three Task-4 files and recorded the nav
  placement decision "Task 4 removes the Diagnostics tab, leaving Graph
  last"). Task-1.9/2 logs judged not relevant (pure model semantics).
- `docs/work/resolution-model/plan.md` — grep-verified only: the
  referenced deferral heading "Plan amendment (2026-08-23): demo
  resequencing" exists (line 27); not read beyond that.
- `projects/devtools-ui/src/app/views/placeholder.ts` — confirms the
  route target renders title from route data ("honest stand-in").
- `projects/devtools-ui/src/app/app.config.ts` — `withHashLocation()`
  (explains the deep-link URL shape, see Test Evidence gotcha).
- `projects/devtools-ui/src/app/shell/capture-status.ts` /
  `capture-status-strip.html` — risk check: the strip can render a
  `Diagnostics` entry, a plain text label without a link (out of scope,
  see Open Issues).

### Key Decisions

- **Route code untouched, comment only:** "hide" is implemented purely
  in `app.html`; `app.routes.ts` keeps the identical route object (no
  redirect, no guard), so deep links behave exactly as before.
- **Return-note placement:** template comment at the removal site in
  `app.html` (primary), one-line comment on the route, and the extended
  spec comments — no separate doc; the deferral rationale lives where it
  already is (`docs/work/resolution-model/plan.md`, existence verified).
- **Existing test re-dedicated instead of a new one:** the placeholder
  test already navigated to `/diagnostics` and asserted the placeholder;
  per the task's "extend pins in place rather than layering duplicates"
  it now carries the T4-AC-01 comment instead of a duplicate test.
- **Capture-status strip left untouched (user decision):** the strip's
  `StripTab` type and indicator entries still include `Diagnostics` (a
  text label, not a link — `capture-status-strip.html` renders
  `{{ entry.tab }}` in a span). The task block is explicitly nav-only;
  surfaced during briefing, user confirmed "Strip-Eintrag bleibt
  unangetastet". Recorded as an Open Issue for stage-2/Task 10.

### Review Focus

- **Behavior claims:** the shell nav renders exactly
  `Packages · Remotes · Import Map · Graph (preview)` (no Diagnostics);
  navigating to the diagnostics route directly still renders the honest
  placeholder (`h1 Diagnostics` + "view not implemented yet"); route
  configuration is byte-identical in behavior — no redirect was added.
- **Assumptions / choices:** comment placement (template + route line +
  spec, no extra doc); re-dedicating the existing direct-navigation
  assertion as the T4-AC-01 pin instead of adding a duplicate test;
  strip `Diagnostics` label deliberately out of scope (user-confirmed).
- **Scope notes:** only the three app-shell files changed; no
  `views/` file touched. The capture-status strip can still surface the
  word `Diagnostics` as an indicator label naming a now-hidden tab —
  intentional, see Open Issues.
- **Read next:** `app.spec.ts` — the two adjusted pins (`renders the V2
  tab set`, placeholder test) are the entire behavioral contract;
  `app.html` — removal site + return-note comment (wording check).

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/app.spec.ts' --watch=false`
  — 12/12 green on the final state.
- `npm test` — full suite green: 37 UI files / 495 tests, 3 bridge / 77,
  6 collector / 75, 4 guards / 50 (697 total, unchanged vs. Task 3 — no
  test added, one expectation shrunk in place).
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit`
  — no diagnostics; `prettier --check` clean on all three files;
  `git diff --check` clean.
- Live round (dev server :4201 still running from Task 3, headless
  Chromium with a throwaway profile in the job tmp dir — the shared
  webmcp profile stayed untouched): `--dump-dom` shows exactly the four
  nav labels; `#/diagnostics` renders `h1 Diagnostics` + "view not
  implemented yet"; two screenshots (default view, deep link) delivered
  in-session.
- **Gotcha found live:** path-based `http://localhost:4201/diagnostics`
  renders Packages — not a bug: the panel uses `withHashLocation()`, so
  the real deep link is `#/diagnostics` (path URLs fall back to the
  empty-path redirect). The in-app router (and the spec's
  `navigateByUrl('/diagnostics')`) are unaffected.
- Sandbox note: `curl localhost:4201` returns 000 inside the sandbox
  (no allowed hosts) — retry outside the sandbox before suspecting a
  dead dev server.

### Acceptance Coverage

- **T4-AC-01 — passed:** `app.spec.ts` `renders the V2 tab set` (label
  array without Diagnostics, all other tabs including `Graph (preview)`
  present) + the re-dedicated `/diagnostics` direct navigation in
  `defaults to /packages and renders honest placeholders on the open
  tabs` (placeholder still renders); confirmed live via headless
  browser + screenshots.

### Open Issues

- Capture-status strip still names `Diagnostics` as an indicator label
  (`StripTab` in `shell/capture-status.ts`) — a text label pointing at a
  now-hidden tab. Deliberately untouched (task is nav-only,
  user-confirmed); revisit when resolution-model Task 10 restores the
  tab, or fold into a stage-2 wording pass.
- Dev server may still be running on :4201 (outside the sandbox) —
  useful for today's demo, kill manually afterwards (carried over from
  Task 3).

### Context for Next Task

- **This was the last planned task of the graph-view scope** — what
  follows are stage-2 items (plan preamble) or resolution-model work.
- **Validated baseline:** V2 nav = Packages, Remotes, Import Map,
  Graph (preview); the diagnostics route stays deep-link-reachable
  (`#/diagnostics` — the panel uses hash routing via
  `withHashLocation()`; path-based `/diagnostics` does NOT reach it in
  a real browser).
- **Restoring the tab (resolution-model Task 10):** re-add the `<a>` in
  `app.html` (removal site is marked with the return-note comment),
  extend the nav-pin label array, move the `/diagnostics` navigation
  back into the placeholder loop (or point it at the real view), and
  drop the route-line comment in `app.routes.ts`. The strip's
  `Diagnostics` entries then become consistent again.
- **Gotchas:** the sandbox blocks localhost network probes (curl 000);
  the shared webmcp Chromium profile may be held by a live session —
  headless Chromium with a throwaway `--user-data-dir` in the job tmp
  dir is the safe verification path.

### Git State

`git diff --stat`

```text
 projects/devtools-ui/src/app/app.html      |  5 ++++-
 projects/devtools-ui/src/app/app.routes.ts |  2 ++
 projects/devtools-ui/src/app/app.spec.ts   | 10 +++++++---
 3 files changed, 13 insertions(+), 4 deletions(-)
```

`git status --short`

```text
 M projects/devtools-ui/src/app/app.html
 M projects/devtools-ui/src/app/app.routes.ts
 M projects/devtools-ui/src/app/app.spec.ts
```

### Sessions

- claude-code 6726f5dc-ba15-4666-a613-9f088df1dd40 (2026-08-25) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-native-federation-devtools/6726f5dc-ba15-4666-a613-9f088df1dd40.jsonl
