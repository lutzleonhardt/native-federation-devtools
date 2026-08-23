# Packages View Redesign — Frozen Mock (Iteration 2)

Frozen 2026-08-19 after brainstorm (Lutz + Claude). Basis for the upcoming
plan task; the fixture cases below are the acceptance reference. UI strings
are the intended English wording.

## Principles

- **Outcome-centric:** one block per resolved copy, consumers as rows
  beneath it. The canonical spine is **consumer → copy → chunk**
  (`effectiveConsumerResolutions` → copies → bundle claims). Packages
  pivots this spine on the package; Remotes (Task 8) pivots it on the
  consumer; a later graph view renders all edges (see memory:
  graph-view-goal-auke-inspiration, inspiration: Auke's ParnasSys devtools).
- **Deviation-first:** the happy path renders almost nothing. Default
  qualifiers (exact target source / share-registration / ordinary-shared)
  live in tooltips only. Chips are reserved for deviations: STRICT,
  isolated, skipped, anchored, self-filled, blocked, not mapped, ambiguous,
  unknown tag.
- **A fact renders once.** Negotiation, Resolved copies, Integrity, and
  Chunks sections merge into the copy blocks. No glyph legend, no glyph +
  action-word duplication.
- **Resolution honesty is kept.** Every annotation keeps its grounded
  Task-7 reason-tooltip; unresolved declarations get an explicit bucket,
  never silence. Skip is an annotation on a consumer row, never a section.

## List (master)

The row's job: identify the package + signal state + justify the click.
No participant chips on rows — the participant axis moves to the filter.

```
All (20) · Conflicts (1)      filter: [host] [whiteboard] [mermaid]      global · 20

@excalidraw/excalidraw    0.18.1
react                     18.3.1
  └ /jsx-runtime          18.3.1
  └ /jsx-dev-runtime      18.3.1
mermaid                   11.14.0
@angular/common           21.2.12
  └ /http                 21.2.12
@nf-lab/conflict-lib      ⚠ 2.0.0 · 1.0.0
@nf-lab/multi-lib         no copy
```

- Happy row: name + resolved version only.
- Conflict row: `⚠` + the resolved versions (tooltip: "N resolved
  versions — rule: resolved-tag-multiplicity"); the non-elected version
  stays muted.
- Honest-empty row: `no copy`, muted (tooltip: the `noCopyNoteOf` wording).

### Participant filter

- Status filter (All/Conflicts) and participant filter are separate axes
  and **combine** (Conflicts + `[mfe3]` = conflicts involving mfe3).
- **Single-select:** click = on, click again = off, other chip = switch.
  No multi-select (AND/OR ambiguity); if ever added, it is OR with
  explicit "any of" wording.
- VM concept is `selectedParticipant` — the widget is swappable. Scale
  escape hatch (not built now): beyond ~8–10 participants the chip row
  becomes a typeahead combobox.

## Detail (per package)

### Happy path — frankenstein-live, `@angular/core/primitives/signals`

```
@angular/core/primitives/signals
share scope global · secondary entry of @angular/core

21.2.12 · shared · source [host]
→ _angular_core_primitives_signals.ePwPWbaXlE.js    mapped · SRI ✓
    [host]  ^21.2.0 STRICT
  chunks · browser-angular_core
    chunk-RCIWTGS7.js
    chunk-K6ZMRNMW.js
    chunk-APTZXQMF.js
    chunk-V2SUVJ7R.js
    chunk-2VMXMS7J.js
```

### Skip as row annotation — clean-skip

```
@nf-lab/conflict-lib
share scope global

2.0.0 · shared · source [mfe2]
→ _nf_lab_conflict_lib.jvcc6K1csg.js    mapped · no SRI
    [mfe2]  >=1.0.0 <3.0.0
    [mfe1]  >=1.0.0 <3.0.0 · skipped own 1.0.0
  chunks · browser-shared · source-only (no chunk list recorded)
```

### Conflict = visibly two blocks — strict-split

```
@nf-lab/conflict-lib                         ⚠ 2 resolved versions
share scope global

2.0.0 · shared · source [host]
→ _nf_lab_conflict_lib.jvcc6K1csg.js    mapped · no SRI
    [host]  >=1.0.0 <3.0.0
    [mfe1]  ~1.0.0 · skipped own 1.0.0
  chunks · browser-shared · source-only (no chunk list recorded)

1.0.0 · isolated · source [mfe3] · mapped only for mfe3
→ _nf_lab_conflict_lib.JF7uEdSVsN.js    mapped · no SRI
    [mfe3]  ~1.0.0 STRICT · kept own copy
  chunks · browser-shared · source-only (no chunk list recorded)
```

### Honest empty — synthetic-multi-version (capture without import maps)

```
@nf-lab/multi-lib
share scope global

no resolved copies in this capture

unresolved
    [mfe1]  ^1.0.0 · not mapped · offered 1.0.0
    [mfe2]  ^2.0.0 · not mapped · offered 2.0.0
```

The `unresolved` bucket also receives consumers whose declaration is
not mapped / blocked / unknown while other consumers do resolve.
Note: a _not selected_ declaration is NOT unresolved — in
co-declared-share both consumers resolve to the one copy (2 consumer
resolutions, 1 copy per Task-7 pins), so mfe2 renders as a consumer
row under the block with a `not selected` state chip.

## Decisions

1. **Counters section removed.** The blocks show copies/tags; registrations
   and declarations live in the rows. Safety net: a muted diagnostics
   footer appears only on divergence (e.g. `unknown tags: 1`, offers
   without any consumer).
2. **Chunks are listed when present** (they only exist for `mapped-source`
   claims); muted mono list, no collapse. `source-only`/`ambiguous` keep
   their qualified one-liner.
3. **Integrity section removed** — SRI renders per mapped file line
   (`SRI ✓` / muted `no SRI`), per entrypoint when a copy has several.
4. **Negotiation trace = the row annotations** (range, STRICT, skipped,
   kept own copy, anchored, self-filled, offered X) + their Task-7
   grounded tooltips. No collapsible trace panel for now; add later only
   if it is genuinely missed. Claim-state vocabulary stays verbatim.
5. **Wording:** shared / isolated / kept own copy / skipped own X /
   unresolved / no copy / offered X. Established Task-7 vocabulary
   (anchored, self-filled, blocked, not mapped, ambiguous, unknown tag)
   unchanged.
6. **Cross-links kept:** source chip → Remotes, mapped file → Import Map.

## Open / deferred

- **Scale (Siemens-class captures, ~50 remotes):** consumer rows under a
  block collapse beyond ~N with `+37 more ▸`; chip row → combobox. Not
  built until a real capture forces it.
- **Group-by-source list toggle** (Auke's "Group by Provider"): deferred,
  near the graph-view task; conflicted packages spanning two groups needs
  a decision then.
- **Consumer count in list rows** (`2.0.0 · 3↗`): deliberately omitted;
  revisit only if it is missed during real debugging.
- **Consistent participant colors across views** (from Auke's design):
  candidate for the redesign task or Task 8, decide at planning.

## Task 7.6 amendment (2026-08-19 screenshot review)

Presentation polish on top of the frozen mock — wording/layout deltas
only; VM shapes, claim vocabulary, and grounded tooltips are unchanged.

1. **`source` → `from`.** The copy-block head reads
   `21.2.12 · shared · from [host]` and
   `1.0.0 · skip-registration · from [mfe1]`. The word is template-only
   (`.source-word`); the qualifier vocabulary (exact-target-source,
   ambiguous-source, explicit-anchor) keeps its labels and tooltips.
2. **`DECLARED BY` group label.** Consumer rows sit under an uppercase
   group label; the labels share one indent level under the copy head,
   and only rows inside a group indent. The label renders even for a
   sparse block (single consumer row, no chunk list). The unresolved
   bucket keeps its own `unresolved` heading and appearance.

   ```
   21.2.12 · shared · from [host]
   FILES
     _angular_core_primitives_signals.ePwPWbaXlE.js    mapped · SRI ✓
   DECLARED BY
     [host]  ^21.2.0 STRICT
   CHUNKS
     browser-angular_core
       chunk-RCIWTGS7.js
       …
   ```

3. **`CHUNKS` breaks like `DECLARED BY`.** One CHUNKS label per block
   (not a per-claim inline prefix — multi-claim blocks no longer repeat
   the word); each bundle claim head becomes a row inside the group,
   chunk files indent one level deeper.
4. **`FILES` group label replaces the arrow.** The mapped file lines
   (one per entrypoint — a copy can own several) sit under a FILES
   label like the other groups; the `→` glyph is dropped, since it
   means "resolves to" in the participant-row kit and would carry a
   second meaning here. Head + three labeled groups is the whole block
   grammar.
5. **Detail meta colon.** `share scope: global` — colon between label
   and value; the configured/default tooltips stay verbatim.
6. **Toolbar zones.** All/Conflicts buttons + participant chips form one
   left-hand filter zone with a subtle 1px divider between them; the
   scopes summary is passive info and right-aligns (`margin-left: auto`).
   Filter behavior (single-select, Conflicts ∧ participant) unchanged.
7. **STRICT / pinned scope de-warned.** Configuration facts render
   muted (Packages consumer rows, unresolved rows, detail meta, and the
   kit `.strict-marker` used by Remotes); warning tokens stay reserved
   for actual conflicts and honest-state warnings.

## Task 7.10 amendment (2026-08-20, entrypoint level)

The entrypoint level from the Task 7.8 screenshot review — the tree stays
one row per registry key (leaf semantics unchanged), but dense secondaries
now surface beneath their leaf, and the level vocabulary (registry key /
registration / declaration / copy / entrypoint) is named where the UI
shows it. VM claim vocabulary and all existing visible texts unchanged.

1. **Entrypoint sub-rows.** Under a leaf whose copies carry specifiers
   beyond the registry key (dense secondaries), one indented, muted
   sub-row per specifier: subpath suffix, the tag of its own
   registration, and the annotation word `entry` carrying the grounded
   tooltip ("registered via the entries map of @nf-lab/split-lib@3.1.4 —
   no own registry key in this capture"). Chosen look: muted + annotation
   word; brackets were rejected (they read as syntax, and the annotation
   word gives the tooltip a visible carrier). The association is registry
   EVIDENCE (an own registration's entries map), stronger than the
   name-derived linked glyph — but a sub-row must never look like an own
   registry key: no linked glyph, no versions cell.

   ```
   @nf-lab/dense-lib        1.2.0
     /secondary   1.2.0   entry
   @nf-lab/split-lib  ⚠    3.0.0 · 3.1.4
     /secondary   3.1.4   entry
   ```

2. **Sub-row rules.** Click selects the parent package (existing select
   convention; the sub-row itself never becomes the selection). Excluded
   from the `All (n)` count — that counts registry keys. Follows its
   parent through the Conflicts and participant filters. Specifiers that
   exist as their own registry key ANYWHERE in the capture keep rendering
   as rows (linked glyph), never as sub-rows — the own-key suppression is
   a capture-level check, so a key hidden by the participant filter still
   suppresses its sub-row (the tooltip claims "no own registry key in
   this capture"). A specifier without own-registration entries-map
   evidence makes no claim at all (flat captures grow no sub-rows).

3. **`secondary entrypoint only` head fact.** When a copy's entrypoints
   do NOT contain the package's own specifier, the copy head carries the
   fact chip with a grounded tooltip naming the specifiers actually
   served — fixes the "tag reads as a full-package version" misreading.
   The happy dense block (parent + secondary in one copy) carries none.

4. **Level-vocabulary tooltips (three carriers, tooltip-only).**
   - `All (n)` button: `one row per registry key of the share register`
     (the list has no visible header; the count is exactly the registry-
     key count, so the button is the carrier).
   - Detail-head package name: `registry key in share scope <verbatim>`.
   - `DECLARED BY` group label: "participants that declared this
     dependency and their requirements — the registration itself is the
     version row under the registry key". The label itself stays
     (decision recorded in the task-7.8 log; vocabulary triad
     declare / register / resolve).
