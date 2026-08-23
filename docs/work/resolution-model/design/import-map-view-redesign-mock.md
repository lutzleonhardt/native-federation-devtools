# Import Map View Redesign — Mock (Iteration 1)

Drafted 2026-08-23 after brainstorm (Lutz + Claude); freeze pending
review. Basis for a plan amendment (proposed Task 9.5); the fixture
cases below are the acceptance reference. UI strings are the intended
English wording. Data side is done (Task 9, canonical annotations) —
this mock is presentation only.

## Principles

Inherited from the Packages/Remotes mocks: outcome-centric,
deviation-first, a fact renders once, resolution honesty, one
vocabulary. Import-Map-specific:

- **The raw pivot stays.** This view renders the recorded effective map:
  every `(scope, specifier, target)` row exactly once, sections per
  scope in map order. It never re-pivots onto the model — the
  package→copy→chunk narrative belongs to Packages/Remotes/graph. What
  changes is legibility WITHIN the map's own structure.
- **Groups are factored annotations, not zones.** A group head renders
  the resolution annotation its rows share (source chip, bundle,
  qualifier) exactly once; rows beneath keep only their exceptions.
  Unlike the Remotes zones, group membership claims NOTHING beyond what
  each row already said — qualified language moves into the head
  verbatim, it never disappears into membership.
- **Folding is not re-pivoting.** A collapsed group still renders inside
  its scope section, states its count, and expands to every recorded
  row. Folds never cross a scope boundary, and a cross-link selection
  auto-expands its fold. The deep "package → its chunks" expansion
  stays in the Packages view.
- **Type comes from evidence.** A row's kind is derived from its
  canonical joins (expose join / consumer resolutions / chunk-group
  join), never from specifier heuristics (`/./`, `@nf-internal`). A row
  nothing canonical references stays untyped — muted honest absence,
  never a guessed owner.
- **Order is free — but the new order is a contract.** Import-map order
  carries no resolution semantics (imports are keyed lookups, longest
  prefix wins; scopes rank by URL specificity, per the HTML Standard's
  resolution algorithm) — grouping and reordering within a section are
  legitimate presentation. Export JSON keeps the artifact verbatim.
  This DELIBERATELY amends the Task-9 order contract ("preserving map
  order", T9-AC-05): the flat-order pin is replaced by the explicit
  order invariant below, never silently weakened — the amendment is
  part of the Task 9.5 plan entry.

## Row-kind derivation rules

Evidence joins already on the Task-9 row VM; precedence decides the
grouping home only — annotations never drop from a row:

1. **expose** — the ingest expose join names this target
   (`row.exposes`). Renders in the `EXPOSES` group; the per-row tail
   keeps remote chip + `expose <module>`.
2. **chunk** — a recorded chunk group's file resolves to this target
   (`row.chunks`). Renders in the collapsed `CHUNK WIRING` group. Wins
   over package evidence: in v4.5-generation captures the chunk entries
   carry pseudo-external registrations (witnessed: non-dense) — the
   canonical `scoped-pseudo-external` rule already treats those as
   wiring artifacts (they are excluded from Remotes private
   registrations), so the wiring home follows that precedent. The
   claims still render on the expanded rows (quiet norms apply as
   everywhere).
3. **package** — remaining rows with ≥ 1 effective consumer resolution.
   Renders in an annotation-signature group (below).
4. **untyped** — no canonical reference. Renders in the muted
   `UNREFERENCED` tail group.

Expose ∧ resolution is unwitnessed across all fixtures (probe below);
the branch is cheap to seed, so Task 9.5 seeds it: pin that the expose
home wins, the resolution annotations stay rendered on the row, and
the `expose <module>` word stays visible.

## Order invariant (amends the T9-AC-05 order clause)

The rendered triples are a DETERMINISTIC PERMUTATION of the recorded
`importMapEntries`, defined by:

1. Sections keep map first-appearance order (GLOBAL first, then scopes)
   — unchanged from Task 9.
2. Within a section, homes render in the fixed order
   `EXPOSES` → signature groups → ungrouped rows → `CHUNK WIRING` →
   `UNREFERENCED`.
3. Signature groups order by the map position of their first row; rows
   keep map order within every home.

The AC-02 sweep changes from sequence equality to multiset equality
(rendered triples ≡ recorded entries, duplicates impossible) plus a
separate pin of exactly this permutation function. No other ordering
freedom exists — two renders of one capture are always identical.

## Probe results (2026-08-23, all fixtures)

Temporary probe over `buildImportMapVm` for every fixture (deleted
after; method identical to the Task-9 probes):

- Kinds are disjoint in every fixture except non-dense, where the seven
  `@nf-internal/*` scope rows carry chunk joins AND quiet
  pseudo-external claims (the rule-2 case).
- `UNTYPED` occurs only in synthetic-hostile (2), synthetic-missing-
  channel (2), synthetic-not-recognized (1). Every row of every real
  capture is typed — `UNREFERENCED` is a rare, muted tail, not a main
  surface.
- Grouping pays: frankenstein-live GLOBAL factors 20 package rows into
  7 signature groups (whiteboard, mermaid, host × 5 bundles); non-dense
  GLOBAL collapses 14 package rows into ONE group (`from [mfe3]`).
  Witnessed scope sections hold at most 1 package row + the chunk
  wiring — scope sections need no signature groups.

## Section anatomy

```
<section head>   GLOBAL IMPORTS · 22 entries            (or scope URL · scope of [chip] · N entries)
  EXPOSES · 2 · SRI ✓                                   (kind group, when present)
    <row> <row>
  from [chip] · <bundle> [· source-only] · N entries · SRI ✓     (one per annotation signature)
    <row> <row> …
  <ungrouped rows>                                      (package rows without a signature home; see below)
  CHUNK WIRING · 7 entries · <bundles ≤3, +N more> · SRI ✓  ▸    (collapsed by default)
  UNREFERENCED · 2 entries                              (muted tail, when present)
```

- **Section heads strengthen** (the 8.6 header channel: bold, full text
  color): scope label, owner chip(s) verbatim from Task 9, count. The
  count carries the contract tooltip: "one row per recorded (scope,
  specifier, target) entry, grouped by its resolution evidence —
  recorded map order carries no resolution semantics; Export JSON
  preserves the artifact verbatim. Sources stay qualified; nothing
  claims requests or execution."
- **Table headers are dropped.** The four-column grid dies; a row is
  `specifier   target [· SRI mark] [exception tail]`. Specifier keeps
  its `/packages?select=` link, target keeps the display/tooltip pair
  and the foreign-origin honesty (absolute URL stands out).
- **Signature groups (GLOBAL only).** Group key = exactly the rendered
  head facts, nothing else: the set of `(remoteSelect, host, qualifier)`
  over the row's sources plus the set of `(label, status, select)` over
  its bundles. Copy IDs, bundle-claim IDs, resolved tags, and note
  strings are EXCLUDED — several copies of one source share a group
  (expected, never a split), and two rows differing in any keyed fact
  never merge. Head tooltips are fixed factoring strings per qualifier/
  status (the doctrine sentence, no per-copy tags); per-copy detail
  (resolved tag, provenance IDs) stays on the row VMs for the
  referential-integrity sweep and reaches the user via the specifier's
  /packages cross-link. Qualified signatures form groups too — the head
  carries the qualified language (`unattributable · 1 entry`); it never
  vanishes into membership.
- **Ungrouped rows.** Two populations share the `ungrouped` home,
  keeping today's full per-row annotation channel: (a) GLOBAL package
  rows with an empty signature (no copy — blocked, claims-only), and
  (b) EVERY package row of a scope section (witnessed max: 1 per scope;
  the quiet norms and the `overrides global` marker render here).
  Groups order by first appearance in map order; rows keep map order
  within every home (see the order invariant).
- **SRI hoists — no row loses its state.** Uniform within a group → the
  head says `SRI ✓` (or muted `no SRI`); mixed → the head says nothing
  and rows mark themselves (`SRI ✓` / muted `no SRI` after the target).
  Every row that does NOT render under an SRI-bearing head — ungrouped
  rows in both populations — always carries its own mark. Completeness
  rule: each row's integrity state is readable from exactly one place,
  its head or itself; the dedicated column is gone.
- **Chunk fold.** `CHUNK WIRING` renders collapsed: count + up to three
  distinct bundle/group labels (`+N more`), SRI hoist, disclosure
  affordance. Expanded rows keep their full per-row channel (emitter
  chip + group label; pseudo-external claims under their quiet norms).
  Head tooltip: "import-map entries wiring internal chunk specifiers —
  the delivery wiring of the recorded bundles; the chunk evidence
  itself lives on the Remotes page." Selection (cross-link `select`,
  `/./`-tolerant) auto-expands. The disclosure is a real `<button>`
  with `aria-expanded`, keyboard-operable; collapsed rows are not in
  the DOM (the VM stays complete — counts and the AC-02 sweep run on
  the VM), expanded rendering and the auto-expansion are DOM-pinned.
- **`overrides global` marker.** A scope-section row whose specifier
  also has a GLOBAL entry with a different target carries a muted
  `overrides global` word; tooltip: "a global entry maps this specifier
  to a different target — for modules resolved under this scope URL,
  this entry takes precedence (rule: scope-precedence)". Map-structural
  evidence only (importMapEntries vs importMapEntries) — no resolution
  or execution claim. Witnessed: pooling-anchor. Same-target global
  duplicates carry no marker.
- **`UNREFERENCED`.** Muted rows; head tooltip: "no canonical evidence
  references these entries — no consumer resolution, no expose, no
  chunk group; the map records them, nothing explains them (honest
  absence, never a guessed owner)."

## Fixture cases

### frankenstein-live — GLOBAL IMPORTS (mass repetition dissolves)

```
GLOBAL IMPORTS · 22 entries

EXPOSES · 2 · SRI ✓
  whiteboard/./Bootstrap    whiteboard/Bootstrap-7COJRA5I.js     [whiteboard] expose ./Bootstrap
  mermaid/./Bootstrap       mermaid/Bootstrap-BBNZEAEH.js        [mermaid] expose ./Bootstrap

from [whiteboard] · 7 entries · SRI ✓
  @excalidraw/excalidraw    whiteboard/_excalidraw_excalidraw.0MlOv2WvQj.js
  react                     whiteboard/react.QYXZqQxJ1j.js
  react/jsx-runtime         whiteboard/react_jsx_runtime.RDhwXXoxCg.js
  react/jsx-dev-runtime     whiteboard/react_jsx_dev_runtime.UsMOGvdsKw.js
  react-dom                 whiteboard/react_dom.6SKyvL_ZIW.js
  react-dom/client          whiteboard/react_dom_client.lVKcx-4-HL.js
  react-dom/profiling       whiteboard/react_dom_profiling.wPFH8wjIJf.js

from [mermaid] · 1 entry · SRI ✓
  mermaid                   mermaid/mermaid.fMI3T940QA.js

from [host] · browser-angular_common · 2 entries · SRI ✓
  @angular/common           _angular_common.Ucn2BmyRM1.js
  @angular/common/http      _angular_common_http.XnycUwbhpt.js

from [host] · browser-angular_platform_browser · source-only · 1 entry · SRI ✓
  @angular/platform-browser _angular_platform_browser.lAyP2N3Pw8.js

from [host] · browser-rxjs · 2 entries · SRI ✓
  rxjs                      rxjs.IJzVNeB5rY.js
  rxjs/operators            rxjs_operators.gdYSvUruih.js

from [host] · browser-tslib · source-only · 1 entry · SRI ✓
  tslib                     tslib.s6WVYyl__v.js

from [host] · browser-angular_core · 6 entries · SRI ✓
  @angular/core             _angular_core.RHjtWEkOzP.js
  @angular/core/event-dispatch-contract.min.js
                            _angular_core_event_dispatch_contract_min_js.JotK85OfcE.js
  @angular/core/primitives/di
                            _angular_core_primitives_di.QUc60-Xs6C.js
  @angular/core/primitives/event-dispatch
                            _angular_core_primitives_event_dispatch.1A9qBws3LP.js
  @angular/core/primitives/signals
                            _angular_core_primitives_signals.ePwPWbaXlE.js
  @angular/core/rxjs-interop
                            _angular_core_rxjs_interop.YqevhcoUQy.js
```

Every claim here is a quiet single own-selected (probe) — the rows say
nothing; the heads say everything once. The `source-only` qualifier
that used to wrap awkwardly in the 15-rem column now sits stable in its
group head.

### frankenstein-live — host scope (chunk fold)

```
https://lutzleonhardt.de/frankenstein-meeting-room/ · scope of [host] · 7 entries

CHUNK WIRING · 7 entries · browser-angular_core, browser-angular_common, browser-rxjs · SRI ✓   ▸
```

Expanded:

```
CHUNK WIRING · 7 entries · SRI ✓   ▾
  @nf-internal/chunk-WW26EZ22   chunk-WW26EZ22.js    [host] browser-angular_common
  @nf-internal/chunk-PAMKM67I   chunk-PAMKM67I.js    [host] browser-rxjs
  @nf-internal/chunk-RCIWTGS7   chunk-RCIWTGS7.js    [host] browser-angular_core
  @nf-internal/chunk-K6ZMRNMW   chunk-K6ZMRNMW.js    [host] browser-angular_core
  @nf-internal/chunk-APTZXQMF   chunk-APTZXQMF.js    [host] browser-angular_core
  @nf-internal/chunk-V2SUVJ7R   chunk-V2SUVJ7R.js    [host] browser-angular_core
  @nf-internal/chunk-2VMXMS7J   chunk-2VMXMS7J.js    [host] browser-angular_core
```

### non-dense — one-group global, v4.5 pseudo-externals stay wiring

```
GLOBAL IMPORTS · 15 entries

EXPOSES · 1 · no SRI
  mfe3/./Component          mfe3/Component-KYAYWGQO.js           [mfe3] expose ./Component

from [mfe3] · 14 entries · no SRI
  @nf-lab/conflict-lib      mfe3/_nf_lab_conflict_lib.JF7uEdSVsN.js
  @angular/common           mfe3/_angular_common.2lRkWlIXsD.js
  …(12 more, map order)
```

```
http://localhost:4300/mfe3/ · scope of [mfe3] · 7 entries

CHUNK WIRING · 7 entries · 7 chunk groups · no SRI   ▸
```

The seven wiring rows carry quiet pseudo-external claims (source and
claim both restate the owner) — expanded they render bare
specifier + target + emitter annotation; nothing speaks, correctly.

### pooling-anchor — multi-claim row, anchors visible, scope precedence

```
GLOBAL IMPORTS · 4 entries

EXPOSES · 2 · no SRI
  mfe1/./Component          mfe1/Component-RJXV7SVT.js           [mfe1] expose ./Component
  mfe2/./Component          mfe2/Component-52VOYNCY.js           [mfe2] expose ./Component

from [host] · browser-shared · source-only · 1 entry · no SRI
  @nf-lab/conflict-lib      _nf_lab_conflict_lib.jvcc6K1csg.js

from [mfe1] · browser-shared · source-only · 1 entry · no SRI
  @nf-lab/conflict-lib/extra
                            mfe1/_nf_lab_conflict_lib_extra.GWjTDmPaoo.js
                            [mfe1] selected · [mfe2] not selected
```

```
http://localhost:4300/mfe1/ · scope of [mfe1] · 1 entry
  @nf-lab/conflict-lib      mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js · no SRI
                            [mfe1] explicit anchor · [mfe1] anchored ·
                            browser-shared · source-only · overrides global

http://localhost:4300/mfe2/ · scope of [mfe2] · 1 entry
  @nf-lab/conflict-lib      mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js · no SRI
                            [mfe1] explicit anchor · [mfe2] anchored ·
                            browser-shared · source-only · overrides global
```

The T9 doctrine holds: the self-anchor stays visible in mfe1's own
scope (non-exact qualifiers always speak); the multi-claim `/extra` row
keeps both claim chips (multiplicity stays visible). New: both scope
rows carry `overrides global` — the global election maps the host copy,
these scopes take precedence for their consumers.

### scoped / strict-scope — quiet override sections (unchanged calm)

```
http://localhost:4300/mfe1/ · scope of [mfe1] · 1 entry
  @nf-lab/conflict-lib      mfe1/_nf_lab_conflict_lib.JF7uEdSVsN.js · no SRI   browser-shared · source-only
```

Owner-restating exact source and single own-selected claim stay quiet
(Task-9 norms verbatim); no `overrides global` — no global entry for
the specifier exists in these captures. strict-scope renders the same
shape with its two scopes.

### synthetic-hostile — untyped tail, mixed SRI

```
GLOBAL IMPORTS · 2 entries

UNREFERENCED · 2 entries
  sneaky-lib                https://synthetic-fixture.example/hostile/sneaky-lib.js       SRI ✓
  https://synthetic-fixture.example/hostile/deep/path%20segment/admin
                            https://synthetic-fixture.example/hostile/admin-console/component-admin.js   no SRI
```

Mixed integrity → the head hoists nothing, rows mark themselves.
Foreign-origin targets keep their absolute URLs (honest signal).

### Seeded honest outcomes (seed harness, not fixture-witnessed)

```
unattributable · 1 entry · no SRI
  cdn-lib                   https://cdn.example/lib.js

ambiguous source · 1 entry · no SRI
  dup-lib                   libs/dup-lib.js

(ungrouped — empty signature)
  blocked-lib               libs/blocked-lib.js · no SRI    [mfe1] blocked · blocked
```

Qualified signatures form heads carrying the qualified language;
blocked rows have no copy, hence no signature — they render ungrouped
with today's per-row channel and their own SRI mark. The
shared-scope-URL owner seed keeps its two-chip section head verbatim.

## Terminology (old → new)

| today (Import Map)                  | new                                                     | rationale                                                             |
| ----------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| 4-column table, `resolution` column | group heads + per-row exception tail                    | a fact renders once; repetition was the noise                         |
| `SRI` column                        | group-head hoist; per-row mark when mixed or ungrouped  | deviation-first; every row keeps exactly one readable state           |
| per-section table headers           | dropped; contract moves to the section-count tooltip    | headers outweighed 1-row sections                                     |
| map-order flat rows                 | evidence groups under the explicit order invariant      | order carries no resolution semantics; Export JSON keeps the artifact |
| bare `expose` word                  | `expose <module>`                                       | the recorded module name becomes visible (was tooltip-only)           |
| — (new)                             | `EXPOSES` / `CHUNK WIRING` / `UNREFERENCED` group kinds | evidence-derived row kinds, named where grouped                       |
| — (new)                             | `overrides global` marker                               | scope-precedence is a map-structural fact worth naming                |

`EXPOSES` deliberately matches the Remotes section word (same
evidence); `CHUNK WIRING` deliberately does NOT reuse `CHUNKS` — the
Remotes section shows chunk evidence, this group shows map entries
wiring chunk specifiers.

## Decisions

1. **Kind precedence expose > chunk > package**, deciding the grouping
   home only; annotations never drop from a row. Chunk-over-package
   follows the canonical `scoped-pseudo-external` precedent.
2. **Signature groups render in GLOBAL only**; scope sections keep the
   per-row grammar (witnessed max 1 package row) plus the chunk fold.
   Groups always render head + rows, singletons included (consistency
   over economy — mermaid, source-only singletons).
3. **Qualified signatures group with the qualifier in the head**; a
   group is factored annotation, not attribution — explicitly NOT the
   Remotes provides-zone rule, which decides membership semantics.
4. **Chunk wiring collapses by default**; count + bundle summary always
   visible; selection auto-expands; fold state is caller-owned UI state.
5. **`overrides global` from map-structural evidence only** (same
   specifier, differing global target); no resolution/execution claim;
   absent for same-target duplicates.
6. **All Task-9 quiet norms, wording contracts, and grounded tooltips
   carry over verbatim** (no `served by`, no `loaded`, only
   `mapped-source` unqualified, capture-relative phrasing, honesty
   caption, empty states, `/./`-tolerant select). Unmapped/unknown stay
   honest absence in this view (H1 decision unchanged; aggregation is
   Task 10).
7. **Cross-links kept:** specifier → /packages, chips/bundles/chunk
   labels → /remotes; sibling views keep linking into /import-map and
   the selected row highlight carries over.
8. **Resolved tags leave this view's tooltips.** The signature head
   tooltip is a fixed factoring string; the per-copy resolved tag
   (today a tooltip suffix) is reachable via the specifier's /packages
   cross-link, where the copy block owns it. Qualifiers never leave the
   visible surface — only this supplementary tag detail relocates.
   Flagged for review: if the tag is missed during real debugging, the
   fallback is a per-row hover carrier, not a head split.

## Implementation notes

- VM grows a grouping layer per section:
  `ImportMapSectionVm.groups: ImportMapGroupVm[]` with
  `kind: 'exposes' | 'signature' | 'ungrouped' | 'chunk-wiring' | 'unreferenced'`.
  Row VMs gain exactly ONE field — `overridesGlobal: boolean` (with its
  fixed note) — and are otherwise unchanged inside. The signature key
  derives from the existing `sources`/`bundles` row VMs per the
  equality spec above — no new canonical surface, no new joins.
- Fold + selection: expansion state is caller-owned UI state (the
  Task-9 purity rule stands); the builder marks the group containing
  the selected row so the component can auto-expand.
- `overrides global`: computed inside `buildImportMapVm` from
  `model.importMapEntries` alone (global entry with same specifier,
  different target).
- SRI hoist = uniform `hasIntegrity` across a group's rows.
- CSS: the fixed 4-column `table-layout` dies with the table headers;
  rows become a two-column grid (specifier | target + tail) under
  hanging group heads. The `.cell-attr` wrap workaround
  (`overflow-wrap: anywhere`, Task-9 screenshot fix) becomes moot —
  group heads don't truncate, tails hold short exception words. The
  annotation channels (`.row-qualifier`, `.row-claim`, `.row-bundle`,
  `.row-expose`, `.row-blocked`) and the 8.6 header channel reuse
  verbatim.
- The Task-9 spec pins to carry: AC-02 sweep as multiset equality over
  all groups incl. folded rows, plus the new permutation pin (order
  invariant); referential-integrity sweep; SRI completeness pin (every
  row's state readable from head or row, never neither);
  select/caption/empty pins; wording sweep. New DOM pins: fold
  collapsed/expanded rendering, `aria-expanded` + keyboard operation,
  selection auto-expansion with `/./` tolerance; new seed: expose ∧
  resolution overlap (home + retained annotations + visible module).

## Open / deferred

- **Per-row kind word** (muted `package`/`chunk` tail analog to
  `expose ./Bootstrap`): deliberately not drawn — the group head names
  the kind. Revisit at screenshot review if row-level scanning misses it.
- **Emitter chip inside the chunk fold when it restates the section
  owner** (frankenstein: `[host]` seven times) — candidate for a quiet
  norm; screenshot review.
- **Signature groups in scope sections** — escape hatch if a real
  capture ever shows a large scope section; not built now.
- **Sticky section nav / jump links** for many-scope captures —
  deferred until a real capture forces it (same deferral as the
  siblings' scale hatches).
- **Visible unresolved/unmapped channel** — stays Task-10 diagnostics
  territory (Task-9 H1 decision).

## Task cut (proposal for /plan)

1. **Task 9.5 — import-map presentation redesign (implementation):**
   this mock, frozen after review; fixture cases above as acceptance
   reference; probe matrix as grounding for the kind rules; screenshot
   review + amendment loop like 7.6/8.6. No separate research task —
   the kind-derivation probe ran during mock authoring and its results
   are recorded here. The plan entry MUST carry the explicit
   acceptance amendment: the Task-9 "preserving map order" instruction
   and the T9-AC-05 order clause are superseded by the order invariant
   of this mock (sequence-equality pin → multiset + permutation pins);
   its AC set covers the order invariant, SRI completeness, the fold
   DOM/a11y contract, the signature-equality pins, and the
   expose ∧ resolution seed.

   **Landed 2026-08-23:** Task 9.5 is in `plan.md` (between Task 9 and
   Task 10) with the supersession instruction and T9.5-AC-01…05;
   XC-01/02/03/06 touch lists gained T9.5. Direction confirmed by
   Lutz: the view optimizes for display and usefulness — the plan/ACs
   follow the design, not the other way around.

## Codex review round (2026-08-23, pre-freeze)

External Codex review of Iteration 1 — five findings + three blind
spots, triaged and folded into the sections above; none silently
dropped:

- **R1 (HIGH, order contract) — confirmed, fixed:** the mock's
  regrouping conflicted with the plan's "preserving map order" and the
  sequence-equality AC-02 pin. Fixed with the explicit "Order
  invariant" section (deterministic permutation, multiset + permutation
  pins) and the mandatory acceptance amendment in the task cut.
- **R2 (MEDIUM, homeless scope rows / row-VM claim) — confirmed,
  fixed:** `bare` renamed and widened to the `ungrouped` home with two
  defined populations (empty-signature GLOBAL rows, all scope package
  rows); "row VMs unchanged" corrected to "gain exactly
  `overridesGlobal`".
- **R3 (MEDIUM, SRI disappearance) — confirmed, fixed:** completeness
  rule added (every row's state readable from head or row); ungrouped
  rows always self-mark; fixture cases and the blocked seed updated.
- **R4 (MEDIUM, signature underspecified) — confirmed, fixed:** exact
  equality fields specified (source `(remoteSelect, host, qualifier)`
  set + bundle `(label, status, select)` set; IDs/tags/notes excluded);
  head tooltips fixed strings; resolved-tag relocation recorded as
  Decision 8 with its review flag.
- **R5 (LOW, .gitignore) — resolved as documented:** the hunk is the
  pre-existing user-owned edit tracked since Task 6 ("must stay
  unstaged", every task log since); it is outside Task 9.5 scope and
  ships in no task staging. Whether to commit it separately is Lutz's
  call.
- **Blind spots — accepted:** the missing formal plan entry is by
  design (mock precedes /plan, like 7.5/8.6) — the task cut now names
  the AC obligations; the expose ∧ resolution branch is seeded in 9.5
  instead of deferred; the fold DOM/a11y contract
  (button, `aria-expanded`, keyboard, auto-expand incl. `/./`) is now
  part of the anatomy and the pin list.

## Amendment — screenshot review round 1 (2026-08-23, Lutz + Claude)

Panel review of the implemented view (frankenstein-live, localhost dev
server). Three items agreed and implemented; iteration-1 text above
stays untouched.

1. **`PACKAGES` home label.** The package home was the only anonymous
   home (EXPOSES / CHUNK WIRING / UNREFERENCED are named). It now
   carries one `PACKAGES` label above its FIRST group, spanning
   signature groups AND ungrouped package rows — the count is the whole
   home (`PACKAGES · 20 entries`), so blocked/claims-only rows are
   covered and the structure never lies. Renders in scope sections too
   (consistency over economy — same rule as singleton signature groups;
   revisit if the 1-row scope sections read as noise). Tooltip grounds
   the kind derivation (`precedence: expose > chunk > package`). No SRI
   hoist on the home label — its groups hoist individually. VM:
   `ImportMapGroupVm.packagesHead` on the home's first group
   (presentation field, no new joins).
2. **`from` stays; `provided from` rejected.** "provides/provided" is
   Remotes ZONE vocabulary (copy-driven, offer-vs-resolution boundary) —
   reusing it for resolution attribution would dilute both meanings, and
   "provided" asserts delivery, which this view never claims (it would
   break on qualified heads: "provided from · unattributable"). The bare
   `from [chip]` is the established cross-view source-word grammar; the
   missing noun now comes from the `PACKAGES` home label above
   (`PACKAGES … from [whiteboard]` reads as a sentence).
3. **Hard section separation.** The scope boundary read like just
   another group boundary. Following sections now open with breathing
   room plus a fine `border-top` rule (`.map-section + .map-section`).
   No new vocabulary; sticky section nav stays deferred.

Indentation grammar with the home label: `PACKAGES` flush, signature
heads / ungrouped rows one step in, their rows one step deeper —
EXPOSES/CHUNK WIRING/UNREFERENCED keep the flat one-step anatomy (the
extra level is real structure, not styling).

Also revisited this round: "have we drifted too far from the import
map?" — verdict NO, on the strength of the raw-pivot anchors (multiset
sweep, scope sections ≙ `imports`/`scopes`, specifier→target rows,
Export JSON verbatim); the display's organizing principle is evidence,
deliberately. Watch items if it ever stolpers in real debugging: the
lost visual map order and the collapsed fold hiding recorded entries.

## Amendment — screenshot review round 2 (2026-08-23, Lutz + Claude)

4. **Signature groups are NOT foldable — density absorbs the vertical
   cost.** Question raised: fold the `from` groups collapsed by default,
   like `CHUNK WIRING`? Rejected: the chunk fold is the justified
   exception (hash-named wiring specifiers with no per-row reading
   value), not a precedent — in the package home the specifiers ARE the
   content, and "which specifiers are mapped" is this view's core
   question. Default-collapsed groups would leave the raw pivot
   invisible in the ground state (exactly the "too far from the import
   map" line) and break free scanning/Ctrl+F. Decided: keep every row
   visible, increase density instead (row padding 0.26rem → 0.14rem,
   line-height 1.35, group margin tightened). **Deferred scale hatch:**
   collapsible signature groups (default expanded) — build only when a
   real capture produces a GLOBAL section that forces it, same deferral
   discipline as sticky section nav.

## Amendment — screenshot review round 3 (2026-08-23, Lutz + Claude)

5. **Fold summary counts instead of listing.** The collapsed
   `CHUNK WIRING` head no longer lists bundle labels (they dominated the
   head, restate themselves on every expanded row, and already appear in
   the PACKAGES signature heads). New grammar:
   `CHUNK WIRING · 7 entries in 3 bundles · SRI ✓ ▸` — "in N bundles"
   chosen over "N entries / N bundles" (reads as a sentence; the slash
   is foreign to the middot grammar). The bundle names stay one hover
   away on the tip'd summary segment, dominant bundle first (row-count
   order, first appearance breaking ties — the old visible order).
   Pseudo-package folds say `in N chunk groups` with no tooltip (the
   names would restate the expanded specifiers — a tip must add
   something, the 8.6 `serves` rule). VM: `bundleSummary` carries the
   compact label, new `bundleSummaryNote` the hover list.
