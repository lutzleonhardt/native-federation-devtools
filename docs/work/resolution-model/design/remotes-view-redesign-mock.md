# Remotes View Redesign — Frozen Mock (Iteration 1)

Frozen 2026-08-21 after brainstorm (Lutz + Claude). Basis for the
upcoming plan tasks (research + implementation);
the fixture cases below are the acceptance reference. UI strings are the
intended English wording. Data side is done (Task 8, canonical façade) —
this mock is presentation only.

## Principles

Inherited from the Packages mock (design/packages-view-redesign-mock.md):
outcome-centric, deviation-first, a fact renders once, resolution honesty.
Transposed specifics:

- **Zones replace the arrow doctrine.** The detail splits into PROVIDES
  (copies whose evidenced source is this remote — which the remote itself
  also consumes, unless a chip says otherwise) and CONSUMES (bindings that
  resolve to ANOTHER remote's copy). Zone membership IS the resolution
  statement; the `→ own copy` arrow becomes redundant and is removed.
  Unresolvable declarations go to an `unresolved` bucket (never silence).
- **Zones are decided per CLAIM, not per declaration.** A declaration whose
  main claim lands on the own copy while a secondary specifier resolves to
  a foreign source renders in BOTH zones — the foreign claim as a CONSUMES
  row with a `via <specifier>` prefix (T8 round-2 rule: a secondary's
  qualification must never hide).
- **Chunks render once, on the provider side, per bundle.** The CHUNKS
  section stays its own section (NOT nested into provides blocks — six
  copies claiming `browser-angular_core` must not repeat the group six
  times), deduped by bundle, served packages as a muted tail. CONSUMES
  never shows chunks — they belong to the foreign source's page.
- **One vocabulary with Packages.** Outcome words (`skipped own X`,
  `not selected`, `isolated`, `anchored`, `self-filled`, `not mapped`,
  `blocked`, `unknown`, `offered X`), `from` + colored participant chips,
  `.group-label` grammar, colon meta, grounded tooltips — all verbatim
  from the Packages view. Registry actions (share/scope/skip) stay
  registry-evidence-only in tooltips (T8-H4 doctrine); glyph column,
  glyph legend, and visible action chips are removed.

## Zone membership rules

- **PROVIDES:** resolved copies whose source qualifier is
  `exact-target-source` or `explicit-anchor` with this remote as target.
  Qualified attributions (`ambiguous source`, `observed target source`,
  `unknown source`) do NOT create provides blocks — an ambiguous copy
  appears in NO candidate's provides; the remote's own binding onto it
  renders as a CONSUMES row carrying the qualifier chip (matches the
  bundle-claim rule: ambiguous chunks are not attributed).
- **CONSUMES:** claims with a resolved copy whose source is another remote
  (fallback after skip or lost election, `not selected`, anchored
  elsewhere) — plus the relation-only sub-bucket (consumer-copy relations
  without an own resolution claim, T8-H2; wording kept verbatim).
- **UNRESOLVED:** claims without a copy (`not mapped`, `blocked`,
  `unknown`) and candidate-less declarations (`declared`); same bucket
  grammar as the Packages detail.
- **Registry action ≠ zone.** pooling-anchor witnesses skip + anchored →
  own copy: the block sits in PROVIDES with an `anchored` chip; the skip
  action lives only in the registration tooltip.

## List (master)

Row job unchanged: identify + signal state + justify the click.

```
[host]        ⚠  0 exposes · 12 declarations
[whiteboard]     1 expose · 7 declarations
[mermaid]        1 expose · 1 declaration
```

- Counts keep the declare/register vocabulary (`N declarations`,
  `· N private registrations` when > 0).
- `⚠` only when the remote has unresolved declarations (not mapped /
  blocked / unknown / candidate-less); tooltip names the count. Conflict
  involvement stays the package pivot's job — no marker here.
- Boundary note under the list kept verbatim.

## Detail

Section order: identity meta → exposes → provides → consumes →
unresolved → private registrations → chunks → diagnostics footer.
All section headers use the Packages `.group-label` channel; each zone
carries a one-line muted note (the `deps-note` precedent).

### Identity + capabilities meta

```
host
scope URL: ./ · resolved: https://lutzleonhardt.de/frankenstein-meeting-room/
capabilities: dense chunking · dense externals · SRI
```

- Colon meta convention (7.6). Capabilities collapse from a badge section
  to one muted line; each word keeps its grounded tooltip and gains the
  enabling config, e.g. `dense externals — shared participants carry
  their serving bundle (config: <VERIFIED FLAG>)`. Flag names come from
  the research task (source-verified against the public Native Federation
  repo, never guessed) — `(config: …)` strings are PLACEHOLDERS until then.
- Honest empty: `capabilities: none recorded in this capture` (one muted line).

### Happy provider — frankenstein-live, host

```
EXPOSES
  none recorded in this capture

PROVIDES
  copies this remote is the evidenced source of — consumed in place unless a chip says otherwise

  @angular/common   21.2.12   ^21.2.0 STRICT
    FILES  _angular_common.xxxx.js   mapped · SRI ✓
    ↳ /http   21.2.12   ^21.2.0 STRICT · _angular_common_http.xxxx.js  mapped · SRI ✓
  @angular/core     21.2.12   ^21.2.0 STRICT
    FILES  _angular_core.xxxx.js   mapped · SRI ✓
    ↳ /event-dispatch-contract.min.js  21.2.12  ^21.2.0 STRICT · …
    ↳ /primitives/di       21.2.12  ^21.2.0 STRICT · _angular_core_primitives_di.QUc60-Xs6C.js  mapped · SRI ✓
    ↳ /primitives/event-dispatch   …
    ↳ /primitives/signals  …
    ↳ /rxjs-interop        …
  @angular/platform-browser  21.2.12  ^21.2.0 STRICT
    FILES  …
  rxjs      7.8.2   ~7.8.0 STRICT
    FILES  …
    ↳ /operators   7.8.2   ~7.8.0 STRICT · …
  tslib     2.8.1   ^2.3.0 STRICT
    FILES  …

CONSUMES
  nothing from other remotes in this capture

CHUNKS
  code shared between this remote's exposes, plus lazy modules — one row per bundle

  browser-angular_core     5 chunk files    serves @angular/core +5 entries
    chunk-RCIWTGS7.js
    chunk-K6ZMRNMW.js
    chunk-APTZXQMF.js
    chunk-V2SUVJ7R.js
    chunk-2VMXMS7J.js
  browser-angular_common   1 chunk file     serves @angular/common, /http
  browser-rxjs             1 chunk file     serves rxjs, /operators
  browser-angular_platform_browser   source-only (no chunk list recorded)
  browser-tslib                      source-only (no chunk list recorded)
```

- **Provides block head:** package name (link → /packages), resolved tag,
  own declared range + muted STRICT — the head folds the remote's own
  DECLARED BY row into the block. Deviation chips after the head
  (`isolated` + audience, `anchored`, `self-filled`); the norm renders none.
- **Secondaries indent under their parent block** (name-derived parent
  rule from the Packages list — presentational grouping of REAL registry
  keys; NOT the 7.10 `entry` sub-row semantics, which needs entries-map
  evidence and stays exclusive to the Packages list). Sub-rows render
  compact: suffix, tag, range, file inline. Open presentation question:
  compact one-liner vs. full FILES group — decide at screenshot review.
- **Chunks:** one row per bundle claim group (deduped across the copies
  claiming it), muted mono file list (expanded for the primary bundle
  here; whether all lists render expanded or only counts —
  screenshot-review decision). `source-only` / `ambiguous` keep their
  qualified wording and grounded notes verbatim from Task 8.
- **Expose lines adopt the file-line grammar:** qualified name, file,
  `mapped` link, `SRI ✓` / muted `no SRI`.

### Consumer — clean-skip, mfe1

```
PROVIDES
  no copies sourced by this remote in this capture

CONSUMES
  bindings resolving to other remotes' copies — own copies above are consumed in place

  @nf-lab/conflict-lib   >=1.0.0 <3.0.0 · skipped own 1.0.0
      → _nf_lab_conflict_lib.jvcc6K1csg.js   from [mfe2]
```

- The winner arrow keeps the participant-row kit but the provider becomes
  `from` + colored participant chip (7.6 wording, 7.7 colors), clickable
  → Remotes. Chip vocabulary identical to the Packages consumer rows.

### Not selected — co-declared-share, mfe2

```
CONSUMES
  @nf-lab/conflict-lib   >=1.0.0 <3.0.0 · not selected
      → _nf_lab_conflict_lib.JF7uEdSVsN.js   from [mfe1]
```

### Isolated — strict-split, mfe3

```
PROVIDES
  @nf-lab/conflict-lib   1.0.0   ~1.0.0 STRICT   isolated · mapped only for mfe3
    FILES  _nf_lab_conflict_lib.JF7uEdSVsN.js   mapped · no SRI
```

- Disposition word `isolated` + audience chip verbatim from the Packages
  copy head; no `kept own copy` consumer chip (the zone + disposition
  already say it — a fact renders once).

### Honest empty / unresolved — synthetic-multi-version, mfe1

```
PROVIDES
  no copies sourced by this remote in this capture

CONSUMES
  nothing from other remotes in this capture

UNRESOLVED
  @nf-lab/multi-lib   ^1.0.0 · not mapped · offered 1.0.0
```

### Private registrations — scoped fixture

Section renamed `PRIVATE REGISTRATIONS` (matches list summary + domain
note); row anatomy unchanged from Task 8 (name, tag, specifier, state
chip grounded on `mappingState`, resolved file, deviating copy tag).
Chunk carriers stay excluded (canonical `scoped-pseudo-external` rule).

### Relation-only sub-bucket (seed-only today)

Renders inside CONSUMES under its own muted note, wording kept verbatim:
"resolved bindings without an own resolution claim". Source stays the
qualified label — an own-sourced relation would still say so honestly.

### Diagnostics footer

Divergence-only, like Packages (e.g. `unknown states: 1`). Silent otherwise.

## Terminology (old → new)

| today (Remotes) | new | rationale |
|---|---|---|
| `Shared dependencies` section | `provides` / `consumes` / `unresolved` zones | zone = resolution statement |
| `→ own copy` arrow | removed | zone membership says it; arrow was Remotes-only legacy |
| action chips `[share]/[scope]/[skip]` + glyphs + legend | removed | share = silent default; scope → `isolated`, skip → `skipped own X`; action stays in registration tooltips (T8-H4) |
| `(source: mfe2)` arrow provider | `from` + colored participant chip | 7.6 wording, 7.7 colors, cross-link kept |
| `Scoped externals` | `private registrations` | matches list summary + domain notes |
| `Capabilities` section | `capabilities:` meta line with `(config: …)` tooltips | deviation-first; config provenance from research task |
| `h3` section headings | `.group-label` channel | one visual grammar with Packages |

## Decisions

1. Provides folds self-consumption; consumes is strictly foreign-resolving
   bindings; unresolved is its own bucket. Zones decided per claim.
2. Provides requires exact/anchor source evidence; qualified attributions
   render on the consumes side with their qualifier chips — ambiguity
   renders as ambiguity, never as silent provides membership.
3. Chunks: own section, one row per bundle, serves-tail, never nested
   into blocks, never shown under consumes.
4. Full Packages block grammar for parent provides blocks; secondaries as
   indented compact sub-rows (presentation depth = screenshot-review item).
5. All T7/T8 grounded tooltips, claim-state vocabulary, boundary notes,
   and honest-empty wording carry over verbatim unless renamed above.
6. Cross-links kept: package name → /packages, `from` chip → /remotes,
   mapped file → /import-map.

## Implementation notes

- `participant-row` kit: winner/none arrows remain (consumes rows); the
  own-arrow branch loses its last consumer — remove it (and
  `NEGOTIATION_LEGEND` / `ACTION_SYMBOLS` if Remotes was the last user)
  or park in kit-demo only.
- List warn marker needs an unresolved-count per remote in the list VM.
- Capability `(config: …)` strings land ONLY after source verification
  (research task); until then ship without the config suffix.

## Open / deferred

- Secondary sub-row depth (compact vs. full FILES group) — screenshot review.
- Chunk file lists expanded vs. count-only rows — screenshot review.
- Zone counts in the list row (`provides 12 · consumes 0`) instead of
  declaration counts — deliberately NOT now; revisit if counts are missed.
- Scale escape hatches (collapse beyond ~N blocks) — same deferral as
  the Packages mock, wait for a real capture that forces it.

## Task cut (proposal for /plan)

1. **Task 8.5 — capability config provenance (research):** verify in the
   public Native Federation source which config flags produce the three
   capability evidences (dense chunking / dense externals / SRI), across
   the relevant generations (memory: `denseExternals` /
   `convertFlatSharedInfo` both default false; entries spelling since
   v4.5.0); output = the exact `(config: …)` tooltip strings for this
   mock, each with a source reference. No UI change.
2. **Task 8.6 — remotes presentation redesign (implementation):** this
   mock, frozen; fixture cases above as acceptance reference; screenshot
   review + amendment loop like 7.6.

## Task 8.5 amendment (2026-08-21): capability config provenance

Source-verified against the official Native Federation repos (GitHub org
`native-federation`; local read-only checkouts). Versions are per-package:
"core" = `@softarc/native-federation` (verified at tag v4.4.0 — the
version the orchestrator v4.6.0 lockfile resolves), "orchestrator" =
`@softarc/native-federation-orchestrator` (verified at tag v4.6.0).
Every flag name below was read at the cited tag + file path, with the
introducing commit located via `git log -S` and its first release via
`git tag --contains`. No flag name is inferred.

### Final tooltip strings

- **dense chunking** — `the registry records per-bundle chunk lists for
  this remote (config: features.denseChunking: true, default false,
  since core v4.0.0)`
- **dense externals** — `shared participants carry their serving bundle
  (config: features.denseChunking: true, default false, since core
  v4.0.0)`
- **SRI** — `integrity hashes recorded for this remote's files (config:
  features.integrityHashes: true, default false, since core v4.1.2)`

Both dense capabilities citing the SAME flag is deliberate, not a
copy-paste error: `features.denseChunking` is one build feature with two
observable facets (see below). `features.denseExternals` does NOT belong
in either tooltip.

### Source references

**dense chunking** (evidence: projection `shared-chunks` chunk groups
per emitter ← runtime `shared-chunks` repository ← `remoteEntry.json`
`chunks` map):

- Gate + emission: core v4.4.0 `src/lib/core/build/bundle-shared.ts`
  L275–281 — `if (buildOptions.chunks && config.features.denseChunking)`
  exports `{ [bundleName]: chunkFiles }`; same gate for the
  `mapping-or-exposed` group in
  `src/lib/core/build/bundle-exposed-and-mappings.ts` L157–163;
  aggregated into `federationInfo.chunks` in
  `src/lib/core/build/build-for-federation.ts` L79–84 (no further flag).
- Defaults: core v4.4.0 `src/lib/config/with-native-federation.ts` L23
  (`chunks ?? true` — prerequisite, on by default, per-package
  overridable) and L41 (`denseChunking ?? false`).
- Since: released core v4.0.0 (commit `86819a3` "Added 'dense-chunk'
  feature and made it opt-out", then `2663997` "Changed to opt-in …
  bundle-names" — both contained in tag v4.0.0; the v4.0.0 tag's
  `with-native-federation.ts` already defaults it to false).
- Runtime storage (no config): orchestrator v4.6.0
  `src/lib/core/2.app/steps/store-remote-entry.ts` `addSharedChunksToStorage`
  → `src/lib/core/3.adapters/storage/chunk.repository.ts`; storage
  exists since orchestrator 4.0.0-RC3 (commit `defebf7`).

**dense externals** (evidence: canonical participant declarations
carrying a `bundle`):

- The `bundle` field is stamped ONLY under the dense-chunking gate:
  core v4.4.0 `src/lib/core/build/bundle-shared.ts` L275–277 —
  `external.bundle = buildOptions.bundleName` inside
  `if (buildOptions.chunks && config.features.denseChunking)`. No other
  non-test code path in core v4.4.0 assigns `bundle` (repo-wide sweep);
  shared mappings never receive one.
- Since: released core v4.0.0 (commit `2663997`, contained in tag
  v4.0.0; verified in the tag's `bundle-shared.ts` L154–156).
- Explicitly NOT the producer — recorded to prevent the prior
  assumption from resurfacing: `features.denseExternals` (default false,
  since core v4.3.0, commit `71ad9ec`; gate at v4.3.0
  `src/lib/core/build/build-for-federation.ts` L145) only switches the
  `remoteEntry.json` `shared` wire format to dense registrations
  (`entries` maps via `densifyExternals`,
  `src/lib/core/output/densify-externals.ts`) — it preserves an
  existing `bundle` but never creates one. Host-side
  `feature.convertFlatSharedInfo` (orchestrator, default false at
  v4.6.0 `src/lib/core/4.config/mode/mode.config.ts` L29; since
  orchestrator v4.5.0, commit `400503f`; applied in
  `src/lib/core/3.adapters/http/remote-entry-provider.ts` L29–31)
  densifies flat shared info at fetch — likewise bundle-preserving
  only. On the default host path `toDenseSharedInfoFormat`
  (`densify-externals.ts` L72–83) spreads all props including `bundle`,
  so the stamped bundle reaches the runtime registry regardless of host
  config. Orchestrator stores provider `bundle` since 4.0.0-RC3
  (commit `2e01ea9`).

**SRI** (evidence: the remote's recorded integrity map):

- Gate + emission: core v4.4.0
  `src/lib/core/build/build-for-federation.ts` L86–91 —
  `if (config.features.integrityHashes) federationInfo.integrity = …`;
  hash computation equally gated in
  `src/lib/core/build/bundle-shared.ts` L289–291 and
  `src/lib/core/build/bundle-exposed-and-mappings.ts` L166–168.
- Default: core v4.4.0 `src/lib/config/with-native-federation.ts` L43
  (`integrityHashes ?? false`).
- Since: as a `federation.config` feature flag core v4.1.2 (commit
  `b88224b` "Changed SRI option to feature flag" — replaced the builder
  option `fedOptions.integrity`, which had introduced the capability in
  core v4.1.0, commit `0952e1f`). The tooltip says v4.1.2 because that
  is when the cited flag name came to exist.
- Runtime storage (no config): orchestrator v4.6.0
  `src/lib/core/2.app/steps/store-remote-entry.ts` L90–97 —
  `remoteInfoRepo.addOrUpdate(name, { …, ...(integrity ? { integrity } : {}) })`.

### Consequences for this mock

- All three capabilities were derivable from source — no "not derivable
  from source" entry; every capability line ships WITH its
  `(config: …)` suffix.
- Version prefix convention in tooltips: `core v<X>` (the
  `@softarc/native-federation` build package). Orchestrator versions
  never appear in these three tooltips — runtime storage has no config
  and is older than every emitting flag.
- The plan's "angular-architects/native-federation" pointer is stale:
  the source of truth is the `native-federation` GitHub org
  (`native-federation-core`, `orchestrator`).
