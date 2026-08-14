# V2 Shape Validation — lab lossless corpus vs. source-derived assumptions

Validates the registry/import-map shapes the V2 spec (§2/§3) derived from
orchestrator source `8e5e0b3` against reality. Two evidence sources:

- Rows 1–11: the **lab lossless capture corpus**
  (`captures/<scenario>/`, run `20260811T095850Z`, envelope
  `lab-lossless-capture/1`, 10 scenarios, orchestrator 4.6.0 @
  `8e5e0b3`, playground commits pinned in `captures/manifest.json`).
- Rows 12–16 (Task 3): the **frankenstein-live captures**
  (`captures/frankenstein-live/`, two phases, same envelope) — the
  publicly deployed frankenstein meeting room
  (<https://lutzleonhardt.de/frankenstein-meeting-room/>), running the
  **released** orchestrator generation (best-known:
  `@softarc/native-federation-orchestrator ^4.0.0`, see
  `captures/frankenstein-live/provenance.json`). Real Angular/React/
  Svelte sharing at scale; deployment-dependent, sha256-pinned.

Every capture is the unmodified result of evaluating
`scripts/lab-capture-dump.js` in the page;
`scripts/validate-lab-corpus.mjs` re-checks hashes, envelope structure,
and the losslessness evidence cited below (lab and live predicates).

Verdicts: **confirmed** (observed exactly as assumed) / **deviates**
(observed shape differs — with capture cite) / **not exercised** (the
corpus produces no evidence either way).

Citation form: `<scenario>/<runstamp>.json` + JSON path, all paths
relative to `$.channels.nativeFederationGlobals.data.namespace` unless
prefixed `$.` (envelope root). Live cites use
`frankenstein-live/<runstamp>-<phase>.json`.

> Historical naming (Task 6.5): what this document calls the "dev"
> generation was relabeled `'v4.5'` — `8e5e0b3` is the released v4.6.0,
> the `entries` spelling shipped in v4.5.0 (`a424249`).

**Generation caveat for rows 12–16:** the deployed app runs the released
v4 orchestrator line, not the lab's dev commit `8e5e0b3`. One shape is
generation-discriminating (participants: `file` string in v4 vs
`entries` map in dev — row 14); where a row's verdict depends on the
generation, it says so.

## Row 1 — `SharedVersion` row model — **deviates (participant fields)**

Assumed: rows `{ tag, host, action, remotes }` with participant fields
`requiredVersion`, `strictVersion`, `bundle`, `entries`, `servedBy`,
`cached`.

Observed:

- **Row level confirmed exactly**: all 18 version rows across the corpus
  have precisely the key set `{ tag, host, action, remotes }`
  (`clean-skip/20260811T090637Z.json`,
  `shared-externals.__GLOBAL__["@nf-lab/conflict-lib"].versions[*]`).
- **Participant level deviates**:
  - `servedBy` appears **nowhere** in the corpus (grep over all 10
    captures), and neither does `pool`. Observed participant key set:
    `{ name, requiredVersion, strictVersion, bundle, cached, entries }`
    (17 of 18 participants), and **without `bundle`** for the non-dense
    participant (`non-dense/20260811T095326Z.json`,
    `shared-externals.__GLOBAL__["@angular/core"].versions[0].remotes[0]`).
  - `name` is part of the participant (not in the assumed list).
- Package entries are wrapped: `shared-externals[scope][pkg] =
  { dirty, versions }` — `dirty` lives at the package-entry level, not on
  rows.

## Row 2 — one row per `(tag, action)`, loser survives with full participant list — **confirmed**

`strict-split/20260811T094623Z.json`
(`shared-externals.__GLOBAL__["@nf-lab/conflict-lib"].versions`) holds
three rows for one package: `(2.0.0, share)`, `(1.0.0, skip)`,
`(1.0.0, scope)` — same tag twice with different actions, each with its
own participant list. The losing declaration keeps everything:
`clean-skip/20260811T090637Z.json` `…versions[1]` is
`{tag: "1.0.0", action: "skip", host: false, remotes: [{name: "mfe1",
bundle, strictVersion, cached: false, requiredVersion, entries}]}`.

## Row 3 — strict split: `skip` + `scope` rows of the same tag — **confirmed**

Same cite as row 2: tag `1.0.0` splits into `skip` `[mfe1]` (winner's
range covers it → redirected) and `scope` `[mfe3]` (strict → own copy),
while the DOM map carries the matching `./mfe3/` scope entry
(`strict-split/…json`, `$.channels.domImportMaps.data.maps[0].map.scopes`).

## Row 4 — `ScopedVersion` shape `{ tag, bundle?, entries }` — **confirmed, including the optionality**

- With `bundle`: `scoped/20260811T095215Z.json`
  (`scoped-externals.mfe1["@nf-lab/conflict-lib"]` =
  `{tag: "1.0.0", bundle: "browser-shared", entries: {...}}`).
- Without `bundle`: `non-dense/20260811T095326Z.json`
  (`scoped-externals.mfe3["@nf-internal/chunk-G4MQRHIT"]` =
  `{tag: "0.0.0", entries: {...}}`).
- Structural note for the collector delta: nesting is
  `scoped-externals[remoteName][pkg] → ScopedVersion` (single object — no
  `versions` array, no `dirty`, no negotiation fields). The V1 collector
  schema forcing this repository through the shared-externals schema is
  definitively wrong.
- Lazy in both directions: `scoped` has **no** `shared-externals` key at
  all, conflict scenarios have no `scoped-externals` key
  (`$.channels.nativeFederationGlobals.data.namespaceKeys`).

## Row 5 — `shared-chunks` per processed remote; winner-only bundle mapping — **deviates + not exercised**

- Registration per processed remote (incl. host, incl. late dynamic
  joiners): confirmed in 9/10 scenarios — every remote in the `remotes`
  repository also has a `shared-chunks[remote]` entry with the literal
  `"mapping-or-exposed"` key (`dynamic-init-native/…json`,
  `shared-chunks` — `mfe2` appended after its dynamic join).
- **Deviates for non-dense remotes**: `non-dense/20260811T095326Z.json`
  has `shared-chunks = {"__NF-HOST__": …}` only — **`mfe3` is missing
  entirely**, its chunks are registered as `@nf-internal/chunk-*`
  `ScopedVersion` rows under `scoped-externals.mfe3` instead. "Written
  per processed remote regardless of outcome" does not hold for remotes
  built with non-dense externals.
- Winner-only bundle mapping: **not exercised** — every
  `mapping-or-exposed` list in the corpus is empty (minimal sharing
  produces no shared chunks). The only populated `shared-chunks` evidence
  remains the frankenstein capture, which is allowlist-projected. This is
  the corpus's main residual unknown → see consequences.

## Row 6 — version rows sorted newest-first — **confirmed**

Semver-descending regardless of arrival order or negotiation outcome:
`dynamic-init-native/20260811T095456Z.json` lists `2.0.0 (skip)` before
`1.0.0 (share)` although 1.0.0 arrived first **and won**
(`…versions[0].tag = "2.0.0"`, `versions[0].action = "skip"`). Same-tag
tie order (`skip` before `scope`, `strict-split/…json`) has a single data
point — do not rely on it.

## Row 7 — `dirty: true` in committed state after dynamic override — **not exercised**

`dynamic-override/20260811T095734Z.json`
(`shared-externals.__GLOBAL__["@nf-lab/conflict-lib"].dirty = false`)
— the committed post-ready state after an override re-init is clean; the
Task-1 CDP session observed `dirty: true` only transiently during
eviction. Consequence: a passive post-ready capture will practically
never see `dirty: true`; nothing in V2 should depend on catching it live.

## Row 8 — n+1 map tags; document-order merge vs `getImportMap()` (open question H) — **answered**

Tag counts confirmed: both `dynamic-init-*` scenarios end with exactly
**2** tags of exactly the mode's type (`$.channels.domImportMaps.data`),
`dynamic-override` ends with **1** (override replaces). Zero tags of the
other mode's type in all 10 captures — the tag type is the mode
discriminator.

**Merge rule** (verified: applying this to the two DOM tags of
`dynamic-init-shim/20260811T095614Z.json` reproduces
`importShim.getImportMap()` **exactly**, for `imports` and `integrity`):

```
mergeDocumentMaps(tags, pageBaseUrl):
  eff = { imports: {}, scopes: {}, integrity: {} }
  for tag in document order, keeping only tags of the active mode's type:
    map = JSON.parse(tag.text)
    for (specifier, target) in map.imports:
      eff.imports[specifier] = resolveUrl(target, pageBaseUrl)   // later tag wins [*]
    for (scopePrefix, scopeImports) in map.scopes:
      for (specifier, target) in scopeImports:
        eff.scopes[scopePrefix][specifier] = resolveUrl(target, pageBaseUrl)
    for (url, hash) in map.integrity:
      eff.integrity[resolveUrl(url, pageBaseUrl)] = hash
  return eff
```

The essential, non-obvious part is the **URL normalization**: the shim's
effective map stores targets and integrity *keys* resolved against the
page base (`./mfe1/x.js` → `http://localhost:4300/mfe1/x.js`); a naive
text-level merge does not match without it.

Caveats, stated honestly:

- `[*]` The collision branch (same specifier in two tags) is **not
  exercised** — dynamic joiners defer to committed winners, so appended
  maps only ever add new specifiers. "Later tag wins" follows
  es-module-shims' merge semantics and is adopted as the rule, flagged
  as not corpus-proven.
- Scope-prefix key normalization is not exercised (scopes are empty in
  the shim scenarios; the native scenarios keep relative prefixes in the
  DOM tags).
- **Mode matters**: in native mode `getImportMap()` returns
  `{imports: {}, scopes: {}, integrity: {}}` in every capture — the
  polyfill never ingests native `importmap` tags on a capable browser.
  The store MUST compute the merge itself in native mode; in shim mode
  `getImportMap()` can serve as a cross-check. An empty shim map means
  "shim uninvolved", never "no map".

## Row 9 — provider derivation via most-specific path prefix (open question G) — **confirmed for the corpus**

All scopes in the corpus are same-origin path prefixes (`./mfe1/`,
`./mfe2/`, `./mfe3/`). For every mapped file in all 10 captures the
most-specific (longest) matching `scopeUrl` from the `remotes` repository
is unique: the host's `scopeUrl: "./"` prefix-matches everything, but
every remote-served file also matches its remote's longer `./mfeN/`
prefix, and no two remote prefixes overlap. Scope-key → file uniqueness
verified mechanically per capture (e.g. `scoped/20260811T095215Z.json`:
`./mfe1/` and `./mfe2/` each claim exactly their own conflict-lib copy).
Not exercised: nested remote prefixes (a remote served under another
remote's path) — no scenario produces them.

## Row 10 — self-fill entries from the loser's copy — **confirmed at map level; mechanism deviates**

`self-fill/20260811T095850Z.json`,
`$.channels.domImportMaps.data.maps[0].map.imports`:
`"@nf-lab/conflict-lib" → ./mfe2/…` (winner's copy) beside
`"@nf-lab/conflict-lib/extra" → ./mfe1/…` (loser's own copy), top-level,
no scopes. But the registry mechanism is NOT the spec's assumed
`selfFillUncovered` tear: the secondary is its **own external** with a
sole-declarer share row
(`shared-externals.__GLOBAL__["@nf-lab/conflict-lib/extra"].versions[0]`
= `{tag: "1.0.0", action: "share", remotes: [mfe1]}`). The uncovered-entry
path in `generate-import-map.ts` was not exercised (likely
dense-externals-dependent). The spec's self-fill rendering assumption
must be re-based on "secondary entry point as own external".

## Row 11 — `entries`/`bundle` with dense externals; absent in non-dense — **deviates (favorably)**

Dense: every participant carries both (`clean-skip/…json`, row 1 cite).
Non-dense: only **`bundle`** is absent — **`entries` survives** with the
per-package served file
(`non-dense/20260811T095326Z.json`,
`shared-externals.__GLOBAL__["@angular/core"].versions[0].remotes[0]
.entries = {"@angular/core": "_angular_core.X3ivyfrWNn.js"}`, matching
the DOM map's `./mfe3/_angular_core.X3ivyfrWNn.js`). The assumption
"attribution genuinely lost in non-dense" is wrong for orchestrator
4.6.0: file-level attribution is intact; only the bundle grouping is
lost.

## Row 12 — populated `shared-chunks` value shape; winner-only bundle mapping — **shape confirmed; winner-only not exercised**

First populated lossless evidence, closing row 5's residual unknown:

- **Value shape confirmed** — `remote → bundleName → fileName[]`:
  `frankenstein-live/20260811T115536Z-01-initial.json`,
  `shared-chunks.__NF-HOST__` =
  `{"browser-angular_common": ["chunk-WW26EZ22.js"], "browser-rxjs":
  ["chunk-PAMKM67I.js"], "browser-angular_core": [5 chunk files],
  "mapping-or-exposed": []}`. Bundle names are the Angular builder's
  `browser-<mangled-package>` groups; file lists are plain hashed
  filenames (no paths). The research-schema reading holds at lossless
  fidelity.
- **Mapping side confirmed for winners**: all 7 listed chunk files
  appear in the effective map under scope `./` as
  `@nf-internal/chunk-<name>` specifiers (without `.js` — same naming
  pattern as the lab's chunk pseudo-externals)
  (`$.channels.domImportMaps.data.maps[0].map.scopes["./"]`); verified
  mechanically 7/7, encoded as a validator predicate.
- **`mapping-or-exposed` is empty here too** — consistently empty across
  all lab scenarios AND the real deployment. Its contents vs. exposes
  and lazy chunks: not exercised anywhere; nothing may depend on it.
- **Winner-only aspect not exercised**: the deployment has no losing
  copies at all (every shared package is single-version with exactly one
  participant), so "losers' chunks present in the registry but absent
  from the effective map" cannot be observed — explicitly: no losing
  copies exist whose chunks could appear unmapped. This remains
  research-schema reading only, now accepted as a bounded residual (a
  conflicting real deployment with bundle-bearing copies would be
  needed, and none is available).
- Only the **host** has a `shared-chunks` entry — `whiteboard` and
  `mermaid` (esbuild-built, no bundle grouping) are missing entirely,
  mirroring row 5's non-dense finding in the released generation.

## Row 13 — `servedBy`/`pool` under real sharing — **confirmed absent**

`frankenstein-live/…-01-initial.json`, `shared-externals.__GLOBAL__`:
20 real packages (Angular 21.2.12 host singletons, React 18.3.1 and
Excalidraw via `whiteboard`, mermaid 11.14.0 via `mermaid`), 20
participants — `servedBy` and `pool` appear **nowhere** (deep key scan;
validator predicate). Combined with row 1 (absent in all 10 lab
captures of the dev generation): the fields exist in neither observed
generation under any observed sharing. The drop decision is final.

## Row 14 — multi-key `entries` maps / real secondary entry points — **deviates (generation-discriminating shape)**

The single most consequential Task-3 finding:

- **Released v4 participants carry `file` (single string), no `entries`
  map at all** (`shared-externals.__GLOBAL__["@angular/common"]
  .versions[0].remotes[0].file = "_angular_common.Ucn2BmyRM1.js"`).
  Observed participant key sets:
  `{name, file, requiredVersion, strictVersion, cached, bundle?}` —
  exactly the lab's key sets with `entries` replaced by `file`. The
  participant shape **discriminates the orchestrator generation**: dev
  `8e5e0b3` = `entries` map (rows 1/11), released v4 = `file` string.
- **Secondary entry points are their own top-level package keys**, at
  scale: `@angular/common/http`, `rxjs/operators`, `react/jsx-runtime`,
  `react-dom/client`, `@angular/core/primitives/di|event-dispatch|
  signals`, `@angular/core/rxjs-interop`, even the file-shaped
  `@angular/core/event-dispatch-contract.min.js` — each with its own
  share row and its own import-map entry. This is the lab row-10
  "secondary as own external" pattern confirmed with real packages;
  `selfFillUncovered` was observed in **neither** generation.
- **Multi-key `entries` maps: not exercised anywhere** — v4 has no
  `entries` field, and every dev-generation `entries` map in the lab
  corpus is single-key. The multi-key case remains hypothetical; the
  collector schema must allow it (it is a map) but nothing may require
  it.

## Row 15 — per-remote `integrity` at scale; effective-map integrity keys — **confirmed**

- Per-remote `integrity` populated for **all three** remotes:
  `remotes.whiteboard.integrity` (8 files), `remotes.mermaid.integrity`
  (2), `remotes.__NF-HOST__.integrity` (19) — all values sha384 SRI
  (`frankenstein-live/…-01-initial.json`).
- **Effective-map integrity confirmed as resolved-absolute-URL keys**:
  the DOM tag's 29 relative integrity keys (`./whiteboard/react.….js`)
  resolve against the page base to exactly the shim map's 29 absolute
  keys — verified mechanically for `imports`, `scopes` AND `integrity`
  (row 8's URL-normalization rule holds live; first corpus evidence
  covering **scopes** resolution, which the lab left unexercised).
- The effective map's integrity block equals the union of the
  per-remote `integrity` maps (29 = 8 + 2 + 19, every entry accounted
  for) — the registry and the map carry the same hashes, keyed by
  filename vs. resolved URL.

## Row 16 — provider derivation uniqueness with the real remote set — **confirmed within the same bounds as row 9**

Real scope set `./whiteboard/`, `./mermaid/`, host `./`
(`frankenstein-live/…-01-initial.json`, `remotes`): for every shared
package the providing participant is unique (20/20 single-participant),
and the effective map target equals `scopeUrl + participant.file` for
all 20 — longest-prefix provider derivation reproduces the deployment
exactly (validator predicate: single-provider). Hashed filenames are
additionally globally unique across the map. Bounds unchanged from row
9: same-origin path-prefix scopes, no nested prefixes, and — new bound —
a conflict-free single-version deployment; multi-participant provider
choice is exercised only in the lab corpus (dev generation).

## Additional durable observations — frankenstein-live (Task 3)

- **The deployed app performs no dynamic post-init `initRemoteEntry`**:
  exactly one `importmap-shim` tag in both phases; all three
  `remoteEntry.json` fetches happen during startup
  (`federation.manifest.json`-driven init). The planned "phase 2 after
  dynamic init" is therefore a post-interaction phase instead — and it
  proves **registry stability under remote module loading**: selecting a
  meeting loads the whiteboard (React/Excalidraw) and mermaid (Svelte)
  bundles, yet namespace, DOM tags, and shim map stay byte-identical
  across phases (`…-01-initial.json` vs `…-02-post-interaction.json`;
  validator-enforced identity).
- **`scoped-externals` is present but empty (`{}`)** in the v4
  deployment — lab "lazy" (absent key) and live "empty object" are two
  spellings of zero entries; consumers must treat both alike. Chunk
  data lives exclusively in `shared-chunks` + the map's `./` scope here.
- Exposes map to `<remoteName>/<moduleName>` specifiers by naive join:
  `whiteboard/./Bootstrap → ./whiteboard/Bootstrap-7COJRA5I.js`
  (`$.channels.domImportMaps.data.maps[0].map.imports`) — views must
  expect the literal `/./` infix.
- `importShim.version = "2.8.0"` (real es-module-shims dependency;
  the lab's bundled polyfill exposed `null`) — presence of a version
  string is deployment-dependent, never required.
- `remoteEntry.json` (out-of-band session observation, not part of the
  captured channels): shape `{name, shared[], exposes[], chunks,
  integrity}` with `singleton`/`strictVersion` flags per shared entry —
  `singleton` exists **only** there, the runtime registry never records
  it; `federation.manifest.json` carries SRI integrity for the
  `remoteEntry.json` files themselves.

## Additional durable observations — lab corpus (rows 1–11)

- Host participates as remote `__NF-HOST__` (`scopeUrl: "./"`), its rows
  carry `host: true` (`strict-split/…json`, `…versions[0]`).
- `strict` share scope: `requiredVersion` is pinned to the exact tag at
  store time — config ranges are lost (`strict-scope/20260811T095035Z.json`,
  both rows: `requiredVersion` `"2.0.0"` / `"1.0.0"`). The scope key
  `strict` appeared **without** a `__GLOBAL__` sibling (single shared
  package, all declarations strict).
- Incumbent wins against newer versions: the `dynamic-init-*` captures
  record `1.0.0 share cached:true` vs `2.0.0 skip cached:false`. This is
  a scenario observation, not a universal provider rule.
- Integrity: per-remote `integrity` maps (fileName → sha384) exist on
  `remotes` entries only in the integrity scenario, empty `{}` for the
  bare host (`dynamic-init-shim/…json`, `remotes.mfe1.integrity`); the
  shim's effective map holds the same hashes keyed by absolute URL.
- `importShim` exists in **both** modes (`present: true`, all captures);
  `importShim.version` is not exposed by the bundled polyfill
  (`null` everywhere).
- Co-declared same version (corpus addendum 2026-08-13): two remotes
  declaring the SAME tag produce **one** version row (`action: 'share'`)
  with both participants in `remotes` — the corpus's only multi-declarer
  row (`co-declared-share/20260813T151211Z.json`). Exactly one
  participant carries `cached: true` (`mfe1`; an observed value, not a
  general provider rule). Both participants produced an **identically
  named** file, yielding two distinct candidate URLs below their own
  scopes; the map selects only the `mfe1` URL. Mappedness can therefore
  be decided only per resolved URL, not per file name. This witness does
  not establish `cached` or participant order as the universal provider
  rule; that semantic question is reopened for the resolution-model
  follow-up.

## Consequences for round 2

**Collector delta (planned schema) — adjust:**

1. Participant fields: `{ name, requiredVersion, strictVersion, cached,
   entries, bundle? }` — **drop `servedBy` and `pool`** from the planned
   schema; make `bundle` optional.
2. `SharedExternalEntry` = `{ dirty, versions[] }` wrapper; rows
   `{ tag, host, action, remotes }`; multiple share scopes
   (`__GLOBAL__`, `strict`, …) — `strict` may be the only scope present.
3. `scoped-externals` = `remote → pkg → { tag, bundle?, entries }`
   (single object, own schema — not the shared schema).
4. `remotes` entry = `{ scopeUrl, exposes[], integrity? }` (integrity
   optional, present ⇒ record hash values — lossless corpus keeps them).
5. All four repository keys are lazy — any may be absent; absence is the
   observation "zero entries" (V1 mapper's `OPTIONAL_REPOSITORY_KEYS`
   generalizes to every repository).

**Store / derivations — hold or adjust:**

6. Implement `mergeDocumentMaps` (row 8 pseudocode) as the map ground
   truth; in shim mode cross-check against `getImportMap()`; never treat
   an empty shim map as "no map".
7. Provider derivation: longest-prefix match of file URL against
   `remotes[*].scopeUrl` — unique in corpus, host `./` as least-specific
   fallback. Holds.
8. Chunk reclassification must source `@nf-internal/chunk-*` from
   `scoped-externals`, not (only) `shared-chunks` — non-dense remotes
   never appear in `shared-chunks`.
9. Winner-only `shared-chunks` bundle mapping is **unvalidated at
   lossless fidelity** (empty in the whole lab corpus; frankenstein
   evidence is allowlist-projected). Either accept the research-schema
   reading or schedule the roadmap's lossless frankenstein re-capture
   before building views on it.
10. Version-row order is reliably semver-descending; same-tag tie order
    is not guaranteed — sort `(tag desc, action)` in the store rather
    than trusting registry order.
11. Nothing may depend on observing `dirty: true` passively (row 7);
    treat it as a rarely-observable transient, not a state to render.
12. Self-fill rendering: base on "secondary as own external"
    (sole-declarer share row + top-level map entry), not on a
    `selfFillUncovered` participant annotation (row 10).

## Consequences — Task 3 re-check against the live corpus

Each planned collector-schema decision from the round-2 plan, restated
as **holds** or amended (T3-AC-05); numbers reference the list above.

- **Drop `servedBy`/`pool` (item 1): holds.** Absent in both observed
  generations under real sharing (row 13); validator predicates assert
  absence durably in lab and live captures.
- **`bundle` optional (item 1): holds, now at scale.** Host participants
  carry `bundle` (`browser-*` groups), whiteboard/mermaid participants
  don't (row 14 cites); optionality is the released-generation norm, not
  a non-dense edge case.
- **Participant field set (item 1): amended.** Generation-dependent:
  `{name, requiredVersion, strictVersion, cached, bundle?}` plus
  **either** `entries` (map; dev `8e5e0b3`) **or** `file` (string;
  released v4) — never both, never neither (row 14). The collector
  schema must accept both spellings and may use them as the generation
  discriminator; `SnapshotV1`'s participant model needs a normalized
  "served files" representation that both feed.
- **Wrapper/rows/scopes (item 2): holds.** Live rows are the same
  `{dirty, versions[{tag, host, action, remotes}]}` shape; only
  `__GLOBAL__` occurs live (single-version deployment) — `strict`-only
  scopes stay a lab-proven case, nothing live contradicts it.
- **`scoped-externals` own schema (item 3): holds, plus empty form.**
  Live shows the key **present but `{}`** — "lazy" now explicitly means
  absent OR empty (row 12/observations). The `remote → pkg →
  {tag, bundle?, entries}` shape gains no live evidence (v4 keeps the
  repository empty) and stays dev-generation-validated.
- **`remotes` entry shape (item 4): holds at scale.** `{scopeUrl,
  exposes[], integrity}` with populated integrity on all three remotes
  (row 15); integrity hash values must be kept (lossless corpus and
  effective map agree on them).
- **All repository keys lazy (item 5): holds, refined.** Absent key
  (lab) and present-empty (live) are equivalent zero-entry
  observations.
- **`mergeDocumentMaps` as map ground truth (item 6): holds,
  strengthened.** The live single-tag case verifies the URL-resolution
  rule for `imports`, `integrity` AND — first evidence — `scopes`
  (row 15).
- **Provider derivation via longest scope prefix (item 7): holds** with
  the real remote set, conflict-free bounds stated in row 16.
- **Chunk reclassification sourced from `scoped-externals` (item 8):
  amended — generation-dependent sources.** Dev generation: chunk
  pseudo-externals in `scoped-externals` (non-dense remotes, row 5).
  Released v4: chunks **only** in `shared-chunks` bundle lists + the
  map's `./` scope, `scoped-externals` empty (row 12). The store must
  reclassify from the **union** of both sources; the `@nf-internal/`
  specifier prefix is the stable marker in both.
- **Winner-only `shared-chunks` mapping (item 9): resolved as far as
  observable.** Value shape confirmed lossless (row 12); the
  winner-only filter itself stays not-exercised because no available
  deployment produces losing bundle-bearing copies — accept the
  research-schema reading as a bounded residual; no further capture
  task can close it.
- **Store-side `(tag desc, action)` sort (item 10), `dirty` transient
  (item 11), self-fill as own external (item 12): hold.** Live adds
  single-row/`dirty: false` data points and, for item 12, real-package
  confirmation of the own-external pattern (row 14).
- **New (Task 3): generation awareness is a schema requirement, not an
  edge case.** Fixture derivation must ingest both generations;
  `frankenstein-live` becomes the released-generation fixture besides
  the dev-generation lab fixtures. The capture-status/provenance layer
  should surface which generation a snapshot came from (derivable from
  the participant spelling).
