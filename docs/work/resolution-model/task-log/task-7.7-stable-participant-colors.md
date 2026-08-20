### Task

Stable participant identity colors in the shared chip — 8 CVD-validated theme tokens, deterministic sorted-name assignment behind one injected lookup (all-or-nothing above the palette threshold), identity dots on remote chips across Packages/Remotes/Import Map, plus one user-approved in-session amendment: the host chip renders as an inverted neutral badge instead of the planned "standard text color" alignment.

### Status

DONE

All four T7.7 acceptance criteria are covered by green tests; AC-01 carries an approved amendment (inverted host badge, chosen from a rendered variants mock during the 2026-08-20 screenshot review). Visual verification of the dots in the running panel (dark theme) happened via user screenshot; the host badge itself and the light theme are still pending a panel look (see Open Issues).

### Files Modified

- `projects/devtools-ui/src/styles.css` (modified) — 8 participant hue tokens (`--nf-participant-color-1..8`) in `:root` plus both dark blocks (media query + `[data-theme='dark']`); values are the dataviz reference palette, re-validated against the panel's chip surfaces.
- `projects/devtools-ui/src/app/shared/kit/participant-colors.ts` (new) — `PARTICIPANT_PALETTE_SIZE = 8`; pure `assignParticipantColors()` (dedupe → threshold → codepoint sort → 1-based index; empty map above threshold, no recycling path); `PARTICIPANT_COLOR_LOOKUP` token with a permanently neutral default factory (kit derives nothing — kit-boundary guard).
- `projects/devtools-ui/src/app/shared/kit/participant-colors.spec.ts` (new) — determinism/dedupe/order-independence, exact-fill (8 names → 8 distinct slots), threshold (9 names → empty map), neutral token default.
- `projects/devtools-ui/src/app/shared/store/participant-colors-provider.ts` (new) — `provideParticipantColors()`: binds the kit token to a store-backed computed over the capture's RENDERABLE participant names (registry remotes ∪ declaration participants ∪ consumer relations — Codex review fix; host excluded everywhere: no color, no threshold count); registered in app.config.ts and mirrored by view specs.
- `projects/devtools-ui/src/app/shared/store/participant-colors-provider.spec.ts` (new) — frankenstein-live factory tests: capturing → neutral, host-free sorted assignment (`mermaid → 1`, `whiteboard → 2`), declaration-only orphan gets a slot, and the 8-remotes-plus-orphan threshold goes fully neutral.
- `projects/devtools-ui/src/app/app.config.ts` (modified) — registers `provideParticipantColors()`.
- `projects/devtools-ui/src/app/shared/kit/participant-chip.ts` (modified) — injects the lookup; `colorIndex` computed (null for host or unassigned names); doc comment reflects dot + badge semantics.
- `projects/devtools-ui/src/app/shared/kit/participant-chip.html` (modified) — identity-dot span before the remote name inside a hand-packed, `<!-- prettier-ignore -->`-protected line (chip textContent must equal the verbatim name); host branch carries no dot markup at all.
- `projects/devtools-ui/src/app/shared/kit/participant-chip.css` (modified) — `.dot` geometry + 8 `.dot-N` rules (longhand `background-color`, jsdom); `.chip-host` → inverted neutral badge (muted fill, bg-token text, transparent border, mono font) keeping dotted underline/`cursor: help`/tooltip; hover-accent rules untouched.
- `projects/devtools-ui/src/app/shared/kit/participant-chip.spec.ts` (modified) — lookup stub in the harness; new pins: dot presence/position/token background for an assigned remote, no dot without assignment, host never dots even with a forced lookup entry, amended AC-01 badge pins (fontFamily equality with remotes, `background-color`/`color` token pins, `cursor: help`).
- `projects/devtools-ui/src/app/views/packages/packages.spec.ts` (modified) — dot pins in the participant-filter test (mfe1 → `dot-1`, mfe2 → `dot-2`, host toggle dot-free), on the pooling-anchor detail chip (mfe1 → `dot-1`, identical to its toolbar chip), and a frankenstein-live cross-view witness (mermaid → `dot-1`, whiteboard → `dot-2` — the exact slots remotes.spec/import-map.spec pin; Codex blind-spot fix); `provideParticipantColors()` added to the TestBed.
- `projects/devtools-ui/src/app/views/remotes/remotes.spec.ts` (modified) — dot pins on the live tree rows (mermaid → `dot-1`, whiteboard → `dot-2`, host chip dot-free); provider added.
- `projects/devtools-ui/src/app/views/import-map/import-map.spec.ts` (modified) — dot pin on the served-by whiteboard chip (`dot-2`, identical slot to Packages/Remotes) and dot-free owner host chip; provider added.

NOT part of this task: the pre-existing user-owned `.gitignore` hunk (must stay unstaged). `participant-row.spec.ts` was touched mid-session (lookup stub) and fully reverted once the neutral kit default made it unnecessary — net zero diff.

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — preamble + Task 7.7 block only (task isolation).
- `docs/work/resolution-model/task-log/task-7.6-packages-presentation-polish.md` (predecessor) — jsdom testing lessons (token-level pins, no `var()` in shorthands) and the deferred host-chip question; grep hits of `task-7.5`/`task-7` logs (participant-filter origin, kit shared with Remotes — no color prework anywhere).
- `guards/kit-boundary.spec.ts` + `guards/kit-boundary.ts` — the enforced rule that reshaped the lookup architecture (see Key Decisions).
- `shared/store/federation-store.ts`, `federation-model.ts`, `ingest.ts` — `model.remotes` shape (`isHost`, host sentinel is a registry entry) and capture lifecycle for the provider test.
- `devtools-bridge` fixtures (registry keys of `frankenstein-live`, `pooling-anchor`, `strict-split`, …) — expected slot assignments for the view pins.
- `views/*/​*.html` chip call sites and `app.config.ts` — verification that no template changes were needed and where the binding belongs.
- dataviz skill (`references/palette.md`, `scripts/validate_palette.js`) — palette source and validation harness.

### Key Decisions

- **Palette = the dataviz-skill reference set, re-validated in situ:** 8 categorical hues with separate light/dark steps, run through the skill's validator against the panel's actual chip surfaces (`#f1f3f4` light, `#292a2d` dark) — all hard gates pass in both modes. The contrast WARN on some hues is mitigated by design: the verbatim name always sits beside the dot, so identity never rides on color alone.
- **Kit-boundary guard reshaped the architecture (planned design was invalid):** the briefing's store-backed token factory inside `shared/kit/` failed `guards/kit-boundary.spec.ts` (T9-AC-04, scans kit specs too). Final shape: neutral-by-default token in the kit, `provideParticipantColors()` on the store side, registered in `app.config.ts` and mirrored verbatim in the three view specs (which therefore test the real binding, not a stub). Accepted consequence: forgotten wiring degrades silently to neutral chips — countered by the provider spec, the view dot pins, and the app.config registration.
- **All-or-nothing threshold, palette size 8 (user-approved over alternatives):** partial coloring ("first 8") was rejected — an alphabetical cutoff reads as significance, churns on remote addition, and is illegible at the UI; 10 hues rejected because 6px dots in two themes exhaust CVD-safe distinguishability around 8. Threshold = palette length by construction; raising it later is one constant + N tokens.
- **1-based indexing and codepoint sort:** indexes match the token numbering (`dot-3` ↔ `--nf-participant-color-3`); explicit codepoint comparator instead of `localeCompare` keeps the assignment machine-independent.
- **Real dot span over `::before`, longhand over shorthand:** a real `.dot` element gives honest DOM evidence and a computed-style token pin (`backgroundColor === 'var(--nf-participant-color-N)'`); `background-color` is written longhand because jsdom drops shorthands containing `var()` (7.6 lesson, now load-bearing again).
- **`<!-- prettier-ignore -->` on the remote-chip line:** Prettier's multi-line HTML re-format injects whitespace text nodes into the chip, breaking the exact `textContent === name` pins here and in 7.5/7.6 view specs. The hand-packed line with a rationale comment is the smallest stable fix; the existing exact pins double as regression guards.
- **Codex review triage (2026-08-20, pre-commit), four findings + two blind spots:** **(1) fixed (HIGH, confirmed)** — the provider derived colors from `model.remotes` only, but chips also render declaration participants and consumer-relation names (`involvedParticipantsOf`, `packages-vm-shared.ts`; the `missing-remote` ingest case): a declaration-only participant stayed dotless and did not count against the threshold ("8 colored + 1 orphan" would have violated AC-03's full neutrality). Fix: `renderableRemoteNames()` = registry remotes ∪ `registryEvidence.participantDeclarations` ∪ `resolutionProjection.consumerRelations`, host deleted once; two new provider tests (orphan gets a slot; 8+1 → fully neutral). **(2) resolved by process** — the AC-01 host-badge amendment was flagged as undocumented; the review ran before this wrap-up existed — this log records approval, alternatives, and the amended pins (7.6 precedent: amendments live in the log/mock, plan blocks stay). **(3) acknowledged, deferred to the pending visual check** — several dot hues sit below 3:1 against the chip surface (the palette validator's own WARN, accepted with the name-beside-dot mitigation per the relief rule); Codex's hairline-ring suggestion is noted for the panel session — tuning 6px marks blind is guesswork. **(4) already handled** — the `.gitignore` hunk was excluded in the commit plan before the review arrived. **Blind spot fixed** — no single name was pinned across all three views (Packages pinned mfe1/mfe2, the others whiteboard); a frankenstein-live witness pin in packages.spec now proves mermaid → `dot-1` / whiteboard → `dot-2` in all three views on the same fixture. **Blind spot acknowledged** — the host-chip hover accent stays untestable in jsdom (documented under AC-01).
- **Host chip amendment (2026-08-20 screenshot review, supersedes the plan block's AC-01 wording):** the user asked for a colored host treatment; variants were compared in a rendered two-theme mock. Chosen: inverted neutral badge (`background-color: var(--nf-color-text-muted)`, `color: var(--nf-color-bg)`, transparent border). Rejected: accent background (accent already encodes selection + link-hover — the host would look permanently selected), hollow ring marker (approved fallback, weaker than the badge), any palette hue (an identity claim the host must not make). Dotted underline + verbatim tooltip + hover accent survive unchanged.

### Review Focus

- **Behavior claims:** identical remote name → identical `dot-N` slot in Packages (toolbar + detail), Remotes, and Import Map, driven by one root-provided sorted-name lookup; above 8 remotes every chip renders neutral (empty assignment, no recycling code path); the host chip renders as an inverted neutral badge, keeps tooltip/underline/hover affordances, and never carries a dot regardless of lookup content.
- **Assumptions / choices:** AC-01 is satisfied in amended form (badge instead of "standard text color") per explicit user approval; palette values live only in styles.css while assignment logic knows just a size constant; view specs duplicate the app.config binding on purpose (they pin the real provider, and TestBed does not read app.config).
- **Scope notes:** `app.config.ts` and two new `shared/store/` files sit outside the kit surface named by the plan block — forced by the kit-boundary guard; `participant-row.spec.ts` was modified and fully reverted (net zero); the `.gitignore` hunk is NOT part of this task and must not be staged.
- **Read next:** `shared/store/participant-colors-provider.ts` — `renderableRemoteNames()` is the review-critical surface (domain completeness = the honesty of both AC-02 and AC-03); `shared/kit/participant-colors.ts` — the threshold/sort invariants and the neutral-default rationale; `shared/kit/participant-chip.html` — the prettier-ignore rationale comment guarding the textContent contract.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include 'projects/devtools-ui/src/app/shared/kit/participant-*.spec.ts' --include 'projects/devtools-ui/src/app/shared/store/participant-colors-provider.spec.ts' --include 'projects/devtools-ui/src/app/views/packages/packages.spec.ts' --include 'projects/devtools-ui/src/app/views/remotes/remotes.spec.ts' --include 'projects/devtools-ui/src/app/views/import-map/import-map.spec.ts' --watch=false` — passed on the final code state: 7 files / 55 tests.
- `npm test` — passed on the final code state (after the Codex review fixes): 36 UI files / 359 tests (+11 vs. Task 7.6), 3 bridge files / 74 tests, 6 collector files / 75 tests, 4 guard files / 49 tests.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — no diagnostics.
- `prettier --check` on all changed files and `git diff --check` — clean.
- Palette validation: `node scripts/validate_palette.js` (dataviz skill) for the light set vs `#f1f3f4` and the dark set vs `#292a2d` — all hard gates PASS both modes (worst adjacent CVD ΔE 9.1 light / 8.4 dark); contrast WARNs accepted with the name-beside-dot mitigation.
- Two intermediate red runs, both architectural signals: the kit-boundary guard rejected the store import in kit (fix: provider split), and Prettier's template re-format broke exact textContent pins (fix: prettier-ignore) — both documented in Key Decisions.
- Visual verification (user screenshot, dark theme, frankenstein-live): filter-zone chips render dots (whiteboard/mermaid) — pre-badge state; badge + light theme pending (Open Issues).

### Acceptance Coverage

- **T7.7-AC-01 — passed (amended):** the approved host-badge amendment supersedes the AC's "standard text color" wording. Pins: host/remote `fontFamily` equality (mono), `backgroundColor === var(--nf-color-text-muted)`, `color === var(--nf-color-bg)`, `cursor: help`, verbatim `title`; dotted underline and `:host-context(a:hover)` accent are CSS-review/visual (jsdom cannot exercise hover).
- **T7.7-AC-02 — passed:** pure-function determinism tests; provider spec pins the host-free sorted assignment over the full renderable-name domain (registry remotes ∪ declarations ∪ relations, incl. the declaration-only orphan case); chip spec pins dot position + token background; view specs pin identical slots for the same names — the frankenstein-live witness proves `mermaid → dot-1` / `whiteboard → dot-2` in Packages, Remotes, AND Import Map against the real store-backed binding.
- **T7.7-AC-03 — passed:** 9 names → empty map (pure test); provider-level 8-registry-remotes-plus-orphan-declaration → fully neutral (review fix); chip renders no dot without an assignment; no recycling/hash code path exists (threshold returns the empty map before any indexing).
- **T7.7-AC-04 — passed:** host chip renders no dot even when the lookup carries an entry for its name (template's host branch has no dot markup); the provider additionally excludes the host from assignment and threshold count.

### Open Issues

- **Plan amendment pending (directly after this commit, user-approved 2026-08-20):** (a) new Task 7.9 — declaration-outcome evidence tooltips on the DECLARED BY outcome tags (`skipped own` / `not selected` / `kept own copy`), naming the loser's own registered file, capture-relative wording, file claimed only when the registry evidence carries it; (b) Task 10 block extension — finding category "own copies not selected in this capture" (info-level, composition-relative — NOT "dead weight": the unselected copy is the price of standalone deployability and can win under a different composition; per-skip tile alternative rejected: blocks are reserved for resolved copies); (c) Task 12 checklist addition — judge master-list scanability, candidate: per-row dot strip reusing this task's lookup.
- Visual panel verification of the host badge (both themes) and the link-hover accent on chips — jsdom cannot cover these. Same session: judge the low-contrast dot hues (light slots 2–5, dark slot 6 sit below 3:1 on the chip surface) and decide on Codex's hairline-ring suggestion.
- The pre-existing `.gitignore` hunk remains in the worktree and must be excluded from Task 7.7 staging (user-owned).

### Context for Next Task

- **Color-lookup contract (stable for Task 8 and the future graph view):** `PARTICIPANT_COLOR_LOOKUP: InjectionToken<Signal<ReadonlyMap<string, number>>>` in `shared/kit/participant-colors.ts`; 1-based values map to `--nf-participant-color-N` tokens and `.dot-N` classes. The kit default is permanently neutral; the store binding is `provideParticipantColors()` (`shared/store/participant-colors-provider.ts`), registered in `app.config.ts`. Any view that renders chips gets colors automatically in the app; any NEW view spec that wants dot pins must add `provideParticipantColors()` to its TestBed providers (pattern in all three migrated view specs).
- **Task 8 (Remotes pivot) inherits for free:** remotes.html already renders `nf-participant-chip` — dots and the host badge arrive without template work; the existing dot pins in remotes.spec.ts are the regression guard while the view is rebuilt.
- **jsdom testing rules (accumulating):** computed styles return unresolved `var()` strings → pin at token level; never put `var()` inside a CSS shorthand a pin must read (longhand `background-color` here); the chip template line is prettier-ignore-protected — do not "clean it up", the exact `textContent === name` pins across three view specs depend on it.
- **Palette change protocol:** hue values live only in styles.css (three blocks, kept in sync); count changes must touch `PARTICIPANT_PALETTE_SIZE`, the `.dot-N` rules, and the token blocks together — the threshold follows the constant automatically.
- `/commit 7.7` must stage 13 repo files (9 modified: `styles.css`, `app.config.ts`, 4× `participant-chip.*`, 3× view specs; 4 new: `participant-colors.{ts,spec.ts}`, `participant-colors-provider.{ts,spec.ts}`) plus this log — and must NOT stage the pre-existing `.gitignore` hunk.

### Git State

`git diff --stat`

```text
 .gitignore                                         |  2 +-
 projects/devtools-ui/src/app/app.config.ts         |  3 +
 .../src/app/shared/kit/participant-chip.css        | 55 ++++++++++++++++++-
 .../src/app/shared/kit/participant-chip.html       |  6 +-
 .../src/app/shared/kit/participant-chip.spec.ts    | 64 ++++++++++++++++++++--
 .../src/app/shared/kit/participant-chip.ts         | 19 +++++--
 .../src/app/views/import-map/import-map.spec.ts    | 17 +++++-
 .../src/app/views/packages/packages.spec.ts        | 23 ++++++++
 .../src/app/views/remotes/remotes.spec.ts          | 21 ++++++-
 projects/devtools-ui/src/styles.css                | 34 ++++++++++++
 10 files changed, 227 insertions(+), 17 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M projects/devtools-ui/src/app/app.config.ts
 M projects/devtools-ui/src/app/shared/kit/participant-chip.css
 M projects/devtools-ui/src/app/shared/kit/participant-chip.html
 M projects/devtools-ui/src/app/shared/kit/participant-chip.spec.ts
 M projects/devtools-ui/src/app/shared/kit/participant-chip.ts
 M projects/devtools-ui/src/app/views/import-map/import-map.spec.ts
 M projects/devtools-ui/src/app/views/packages/packages.spec.ts
 M projects/devtools-ui/src/app/views/remotes/remotes.spec.ts
 M projects/devtools-ui/src/styles.css
?? projects/devtools-ui/src/app/shared/kit/participant-colors.spec.ts
?? projects/devtools-ui/src/app/shared/kit/participant-colors.ts
?? projects/devtools-ui/src/app/shared/store/participant-colors-provider.spec.ts
?? projects/devtools-ui/src/app/shared/store/participant-colors-provider.ts
```
