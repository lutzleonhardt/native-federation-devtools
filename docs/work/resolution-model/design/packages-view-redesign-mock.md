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
Note: a *not selected* declaration is NOT unresolved — in
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
