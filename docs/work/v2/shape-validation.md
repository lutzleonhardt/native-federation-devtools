# V2 Shape Validation — lab lossless corpus vs. source-derived assumptions

Validates the registry/import-map shapes the V2 spec (§2/§3) derived from
orchestrator source `8e5e0b3` against reality: the **lab lossless capture
corpus** (`captures/<scenario>/`, run `20260811T095850Z`, envelope
`lab-lossless-capture/1`, 10 scenarios, orchestrator 4.6.0 @ `8e5e0b3`,
playground commits pinned in `captures/manifest.json`). Every capture is
the unmodified result of evaluating `scripts/lab-capture-dump.js` in the
served scenario page; `scripts/validate-lab-corpus.mjs` re-checks hashes,
envelope structure, and the losslessness evidence cited below.

Verdicts: **confirmed** (observed exactly as assumed) / **deviates**
(observed shape differs — with capture cite) / **not exercised** (the
corpus produces no evidence either way).

Citation form: `<scenario>/<runstamp>.json` + JSON path, all paths
relative to `$.channels.nativeFederationGlobals.data.namespace` unless
prefixed `$.` (envelope root).

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

## Additional durable observations (beyond the 11 rows)

- Host participates as remote `__NF-HOST__` (`scopeUrl: "./"`), its rows
  carry `host: true` (`strict-split/…json`, `…versions[0]`).
- `strict` share scope: `requiredVersion` is pinned to the exact tag at
  store time — config ranges are lost (`strict-scope/20260811T095035Z.json`,
  both rows: `requiredVersion` `"2.0.0"` / `"1.0.0"`). The scope key
  `strict` appeared **without** a `__GLOBAL__` sibling (single shared
  package, all declarations strict).
- Incumbent wins against newer versions: `cached: true` marks the
  committed copy (`dynamic-init-*`: `1.0.0 share cached:true` vs
  `2.0.0 skip cached:false`).
- Integrity: per-remote `integrity` maps (fileName → sha384) exist on
  `remotes` entries only in the integrity scenario, empty `{}` for the
  bare host (`dynamic-init-shim/…json`, `remotes.mfe1.integrity`); the
  shim's effective map holds the same hashes keyed by absolute URL.
- `importShim` exists in **both** modes (`present: true`, all captures);
  `importShim.version` is not exposed by the bundled polyfill
  (`null` everywhere).

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
