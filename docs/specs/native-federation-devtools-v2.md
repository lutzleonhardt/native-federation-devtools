# Native Federation DevTools — V2 Spec

Status: design proposal building on the shipped V1 (see
`native-federation-devtools.md`, the validated product handoff). V1 is
live with three tabs (Remotes & Exposes, Shared Dependencies, Import Map)
reading two evidence layers: the runtime resolver outcome
(`__NATIVE_FEDERATION__`) and the effective browser resolution
(import-map shim).

Marking convention, extended from V1: every statement is backed by the
V1 capture evidence, by **source reading** of the pinned upstream
repositories — orchestrator `8e5e0b3` (2026-08-05) and
native-federation-core `5e93131` (2026-08-08), cloned under
`~/projects/nf/` — or by the **lab lossless capture corpus**
(`captures/<scenario>/`, envelope `lab-lossless-capture/1`,
orchestrator 4.6.0 @ `8e5e0b3`, manifest `captures/manifest.json`;
verdicts in `docs/work/v2/shape-validation.md`). Source-backed
statements cite `file:line`; corpus-backed statements cite
`<scenario>/<runstamp>.json` + JSON path. Where corpus and source
reading disagree, the corpus wins and the statement says so. Anything
else carries an explicit `Assumption:` or `Open question:` label.

## 1. V2 scope decision

V2 stays on the two passive evidence layers V1 already reads. It does
**not** add remote-entry body fetching, recording reload, or transport
provenance (deferred, section 6). What changes:

- A new **Packages** tab becomes the default view: the negotiation,
  rendered conflict-first as version rows.
- The **Remotes** tab is extended into a per-remote perspective
  (dependencies as seen by one remote, chunks, capability badges).
- The **Import Map** tab is kept as the raw evidence view, demoted as a
  destination, promoted as a data source (provider derivation,
  diagnostics).
- A **Diagnostics** tab lints registry against import map.
- A **global search** joins the three pivots.
- The shell gains a **capture status strip**: nav-level channel-state
  signaling, carried over from the amended V1 Task 9 (section 4.6).
- All views render from one normalized store (section 3).

## 2. What source reading established

Source reading is a new evidence class for this project: it states what
the pinned orchestrator *does*, which capture evidence alone could not
show. It settles several V1 open items.

### 2.1 The losing declaration survives (settles the V1 §6 prerequisite)

V1 could not say what a version conflict looks like in the repositories.
The source answers it: per shared package and scope the registry holds
`{ dirty, versions: SharedVersion[] }`, and each `SharedVersion` is
`{ tag, host, action: 'share'|'skip'|'scope', remotes: SharedVersionMeta[] }`
(`orchestrator src/lib/core/1.domain/externals/version.contract.ts:14`).
Resolution keeps **one row per `(tag, action)` pair**
(`apply-winner.ts:113-123`):

- The elected winner gets `action: 'share'`.
- A losing version whose participants all accept the winner's tag gets
  `action: 'skip'` — with its full participant list intact.
- A version with strict objectors is *split*: non-strict participants stay
  in a `skip` row, objectors move to a `scope` row of the same tag
  (`apply-winner.ts:94-107`).
- Under `strict.strictExternalCompatibility` the same situation instead
  throws, the init fails, and nothing is committed
  (`apply-winner.ts:73-79`).

Therefore "declared but unregistered" does not exist for singleton
externals: every declaring participant remains addressable in exactly one
version row. Corpus-observed participant key set (shape-validation
row 1): `{ name, requiredVersion, strictVersion, bundle, cached,
entries }` — `bundle` is absent for non-dense participants, and
`servedBy`/`pool` (the contract's pooling fields) appear **nowhere**
in the corpus; they stay out of the V2 schema unless the planned
real-app re-capture surfaces them (§7 J). Package entries are wrapped:
`shared-externals[scope][pkg] = { dirty, versions }` — `dirty` lives
on the package entry, not on rows
(`clean-skip/20260811T090637Z.json`). Election priority:
host version > `profile.latestSharedExternal` > least extra downloads
with a tear-count tiebreak (`determine-shared-externals.ts:126-184`).

### 2.2 What the registry is lossy about

Written in `store-remote-entry.ts:83-136`; persisted only by the final
pipeline commit (`commit-changes.ts:42`). Fields that do **not** survive
into `__NATIVE_FEDERATION__`:

- `singleton` — consumed as a routing switch only
  (`store-remote-entry.ts:104-113`): `true` → `shared-externals`,
  `false` → `scoped-externals`. Recoverable per package by section
  membership, not per declaration.
- `requiredVersion` / `strictVersion` of non-singleton externals —
  `ScopedVersion` keeps only `{ tag, bundle?, entries }`.
- `$version` of the body — never read anywhere in the orchestrator.
- `exposes[].element` and all `dev` blocks — dropped at the mapping
  (`store-remote-entry.ts:89-98`).
- The manifest key when it diverges from the body `name` — the body name
  wins with a warning (`get-remote-entries.ts:155-163`).
- The original remote-entry URL — only `scopeUrl` is stored.
- An invalid semver `version` is *replaced* by
  `smallestVersion(requiredVersion)` before storing
  (`store-remote-entry.ts:139-155`).

### 2.3 Failure and lifecycle semantics

- A remote whose entry fetch/parse fails is filtered out with a warning
  and leaves **no registry trace at all** (`get-remote-entries.ts:132-140`).
  "Remote absent" and "remote never initialized" are indistinguishable in
  passive data. Honest state, not a bug to fix in V2.
- The storage adapter clones on get and set
  (`global-this.storage.ts:20-24`); repositories work on a decoupled
  in-memory cache and persist only at commit points (end of init, end of
  each dynamic `initRemoteEntry`). A snapshot is stable between commits;
  the capture timestamp V1 already shows is the right label.
- `loadRemoteModule` never fetches or writes — it only reads the repo
  (`expose-module-loader.ts:17`). Registry mutation after init happens
  only through dynamic remote-entry initialization.
- Version rows are sorted newest-first at every commit
  (`store-remote-entry.ts:199-207`); corpus-confirmed semver-descending
  regardless of arrival order or negotiation outcome
  (`dynamic-init-native/20260811T095456Z.json`). Same-tag tie order
  (`skip` before `scope`) has a single data point — the store sorts
  `(tag desc, action)` itself instead of relying on registry order.
- `dirty: true` in committed state is source-possible (a dynamic
  override evicts the replaced remote's copies and marks the affected
  externals dirty, `store-remote-entry.ts:35-44`, and only re-declared
  externals are re-resolved) — but the corpus observed the post-ready
  state after an override **clean**
  (`dynamic-override/20260811T095734Z.json`, `dirty = false`); dirty
  showed only transiently during eviction. Treat it as a
  rarely-observable transient: render "pending re-election" if seen,
  never as corruption — and nothing in V2 may depend on catching it.
- A dynamic init that fails mid-merge leaves its partial mutations in
  the in-memory repositories; there is no rollback, and the **next
  successful commit persists them** (`createFederationResult` catches
  the error and continues in non-strict mode). A capture may therefore
  contain remnants of a failed dynamic init — an interpretation caveat
  for Diagnostics findings.
- `__NATIVE_FEDERATION__` is only the **default** storage namespace:
  `storageNamespace` renames it and a custom `storage` adapter can move
  it off `globalThis` entirely (`storage.config.ts:4-8`). An absent
  global under a custom namespace is indistinguishable from "no
  federation" — a documented coverage bound of passive capture.

### 2.4 Chunks, dense and legacy representation

- With the build feature `denseChunking`: bodies carry a `chunks` map
  (bundle name → chunk files), shared entries carry a `bundle` field, and
  the runtime stores `shared-chunks` per remote and bundle
  (`store-remote-entry.ts:116-125`). Corpus correction: this holds per
  **dense-built** remote only — a non-dense remote is missing from
  `shared-chunks` entirely; its chunks live as `@nf-internal/chunk-*`
  rows under `scoped-externals` instead
  (`non-dense/20260811T095326Z.json`). Import-map mapping is
  winner-only per source reading: bundles are registered per use
  (`generate-import-map.ts registerBundleChunks`), and
  `mapping-or-exposed` is registered unconditionally for every remote
  (`generate-import-map.ts:512`) — corpus-confirmed as a key, but
  every `mapping-or-exposed` list in the lab corpus is **empty**, so
  populated bundle lists and the "loser's chunks exist but are not
  mapped" diff remain unvalidated at lossless fidelity (open question
  I). That diff stays the source-derived expectation — an explainable
  diff, not an inconsistency.
- Without `denseChunking` (legacy builds): chunks are emitted as
  pseudo-shared entries `@nf-internal/chunk-*` with version `0.0.0` and
  `singleton: false` (`native-federation-core
  src/lib/core/build/bundle-shared.ts:390-413`), which the orchestrator
  therefore routes into `scoped-externals` (corpus-confirmed,
  `non-dense/20260811T095326Z.json`). Corpus correction: less is lost
  than assumed — shared participants keep their `entries` map with the
  per-package served file, so file-level attribution stays intact;
  only the `bundle` grouping is absent.
- Two registry generations exist in the wild: `file: string` per version
  was replaced by `bundle` + `entries` (orchestrator commit `a424249`,
  "Support for integrated secondary entrypoints"). There is no migration
  code; mixed-generation storage is possible.

### 2.5 Corrections to V1 assumptions

- V1 §2 states claims are "recovered from the explicit recording reload,
  not from a passive snapshot". Source reading shows remote-entry bodies
  are static JSON at the convention URL `scopeUrl + 'remoteEntry.json'` —
  the same convention the orchestrator itself assumes for its override
  comparison (`get-remote-entries.ts:106`). Recovering claims therefore
  does not *require* a recording reload in principle — but no cost-free
  MV3 mechanism for the fetch exists either (section 6 lists the real
  costs). The V1 "Evidence missing — requires the recording reload"
  banner text should change to "deferred", not to "passively available".
- V1 §6 derives mapped-target versions "against the repositories' `file`
  fields" — that is the old generation; current registries carry
  `entries` maps (2.4).

### 2.6 Import-map commit mechanics (collector-relevant)

- The default configuration writes **native**
  `<script type="importmap">` tags (`use-default.ts:10`); es-module-shims
  is not part of the default path. `useShimImportMap` writes
  `importmap-shim` tags in shim mode and native tags in polyfill mode
  (`use-import-shim.ts:15-16`). An absent `importShim` global is the
  *normal* state for default-config hosts, not a degraded one.
- The init flow commits with `override: true`, removing previous tags of
  the same type; **dynamic inits append** one additional tag each
  (`replace-in-dom.ts:8-20`, `init.flow.ts:18` vs.
  `init-remote-entry.flow.ts:14`). After n dynamic inits the DOM holds
  n+1 map tags; the effective map is a merge performed by the browser
  (native) or the shim.
- Corpus-validated commit mechanics: both `dynamic-init-*` scenarios
  end with exactly n+1 tags of exactly the mode's type; the
  `dynamic-override` scenario ends with **one** tag (an overriding
  re-init replaces rather than appends); zero tags of the other mode's
  type appear in any capture — the tag type is the mode discriminator.
  Sharper shim finding: `importShim.getImportMap()` is **empty in
  native mode in every capture** — the polyfill never ingests native
  `importmap` tags on a capable browser. The store must compute the
  document-order merge itself in native mode; in shim mode
  `getImportMap()` is a cross-check. An empty shim map means "shim
  uninvolved", never "no map". The merge rule is pinned
  (shape-validation row 8): later tag wins per specifier, with targets
  and integrity keys resolved against the page base URL — the URL
  normalization is the non-obvious, corpus-verified part; the
  same-specifier collision branch is adopted from es-module-shims
  semantics, not corpus-proven.
- Collector consequences: `domImportMaps` must collect **all** tags of
  both types in document order; only `importShim.getImportMap()` reports
  a browser-merged effective map, and only where the shim exists. This
  refines the 4.6 channel mapping: exactly one populated channel is the
  *expected healthy state per mode*, so "exactly one → partial" would
  mislabel default-config and shim-mode pages alike — partial should key
  off observed tag types instead (e.g. `importmap-shim` tags present but
  the shim yielded nothing).
- Write-side only, irrelevant to reading: Trusted Types policy
  (default name `nfo`, `replace-in-dom.ts:14`).

## 3. Architecture: one store, three pivots

Normalization belongs in the data model, not in the views. V2 builds one
normalized store per capture; every view is a projection of it.

Core relation (the "edge list"): one row per
*(scope, package, version tag, action, participant)* with
`requiredVersion`, `strictVersion`, `bundle?`, `entries`, `cached`,
plus the joined effective resolution (import-map target URL and
integrity presence). The effective map is the store's own
document-order merge of the mode's tags (pinned rule, shape-validation
row 8); in shim mode `importShim.getImportMap()` is a cross-check
only. Secondary entities: remotes (scopeUrl, exposes),
chunk groups (owner, bundle name, files, mapped?), import-map entries
(specifier, target, scope, integrity).

Normalization rules applied on ingest:

1. **Provider derivation.** The providing remote of a mapped file is
   derived by matching the effective target URL prefix against remote
   `scopeUrl`s — the import map is authoritative for delivery. This
   removes "no single provider recorded" as a bug, not as a state:
   derivation has three honest outcomes. *Derived* (exactly one
   most-specific non-host scope matches, or the host matches beyond its
   base URL), *ambiguous* (multiple scopes match with no unique
   most-specific winner — see open question G), and *unattributable*
   (no scope matches — e.g. CDN or foreign-origin targets). The host
   scope (`./`, effectively the page base URL) is a prefix of almost
   everything and must never win by default; a bare longest-prefix rule
   would silently attribute foreign files to the host.
2. **Legacy chunk reclassification.** Scoped externals whose package name
   starts with `@nf-internal/` are chunks, not packages; they move to the
   owning remote's chunk group and never appear in package counts. The
   prefix is the runtime's own `CHUNK_PREFIX` constant
   (`native-federation-core src/lib/domain/core/chunk.ts:1`), but the
   rule remains a heuristic over a name a real package could carry.
3. **Resolution arrow per participant.** Each participant row gets an
   explicit "resolves to" value: the winner's file (skip) or its own
   file (share participant / scope row). Corpus correction
   (`self-fill/20260811T095850Z.json`): a secondary entry point the
   winner does not cover is **not** a participant annotation — it
   surfaces as its own external with a sole-declarer share row
   (`@nf-lab/conflict-lib/extra`) and a top-level map entry; the
   source-read `selfFillUncovered` path was not exercised. New derived
   rule (proposal): link a secondary-entry external (`pkg/subpath`) to
   its parent package so the Packages tab can group them; the link is
   name-derived and tagged as such.
4. **Capability detection per remote**, derived from data shape:
   `shared-chunks` present → dense chunking; `integrity` present → SRI;
   multi-key `entries` → dense externals. Rendered as badges so views can
   degrade loudly instead of silently.
5. **Provenance marking.** Every field the store computes rather than
   reads — provider, resolution arrows, reclassified chunks, capability
   badges — is tagged `derived`, naming the rule that produced it. The
   spec's marking discipline extends into the data: detail views may
   surface the tag, and Diagnostics findings cite it.

The three pivots — by package, by remote, by file — group the same edges
differently. Rendering the same edge in two pivots is projection, not
duplication; the consistency guarantee lives in the store. A shared row
component renders "participant → resolution" identically in all pivots.

Views answer their core question without navigation; links change the
question. Cross-links everywhere: remote names, package names, file names
are clickable in every tab and jump to the owning detail view.

### Collector delta (early task)

The V1 collector allowlist was deliberately cut to what the V1 views
consumed (Task 7 YAGNI). The store above needs fields the allowlist
currently drops, so extending the collector is an **early V2 task that
precedes the views**, not an afterthought:

- per-remote `integrity` (SRI capability badge, per-file SRI columns)
  — corpus shape: `remotes` entry = `{ scopeUrl, exposes[],
  integrity? }`, hash values included,
- `bundle` (optional — absent for non-dense participants) and
  `entries` on shared participants (chunk attribution, resolution
  arrows, entry-point coverage), plus the `{ dirty, versions }`
  package wrapper,
- `servedBy` and `pool` on participants — **dropped**: never observed
  in the corpus (shape-validation row 1); reinstate only if the
  real-app re-capture surfaces them (§7 J),
- the `ScopedVersion` shape, corpus-validated
  (`scoped/20260811T095215Z.json`): nesting is
  `scoped-externals[remote][pkg] → { tag, bundle?, entries }` — a
  single object, no `versions` array, no `dirty`. The V1 allowlist
  forcing this repository through the shared schema is definitively
  wrong,
- all four repository keys are lazy in both directions (a conflict
  capture has no `scoped-externals`, a scoped capture no
  `shared-externals`), and `strict` can be the **only** share scope
  present — nothing may assume `__GLOBAL__` exists
  (`strict-scope/20260811T095035Z.json`).

Every addition triggers the established hand-sync discipline (probe
string + `runtime-schema.ts`) plus a privacy review: `entries` values
are file names and fall under the URL sanitization rules.

Export compatibility: `Assumption:` no consumer of exported snapshots
depends on the scoped-externals schema, since that section was empty in
every live capture to date. Under that assumption the recommendation is
to grow the current snapshot format rather than fork a SnapshotV2: add
the new fields additively, correct the scoped shape, and stamp an
explicit `schemaVersion` so corpus tooling can branch; reserve a major
bump for semantic changes to fields that were ever populated. Open
question until the assumption is checked against the existing corpus
tooling.

## 4. The views

Tab order: **Packages · Remotes · Import Map · Diagnostics**, global
search at the top right. Master-detail layout: navigable tree-table left,
detail pane for the selection right. No node-link graph in V2 (stays
deferred, as in V1 §6): the topology is a three-level hierarchy, and an
indented tree with resolution arrows answers the same questions
deterministically and copy-pastably.

### 4.1 Packages (new, default)

Core question: *which version of X is actually shared, and what happened
to every other declaration?*

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Packages] [Remotes] [Import Map] [Diagnostics]              🔍 Search…      │
├──────────────────────────────┬───────────────────────────────────────────────┤
│ Filter: [All ▾] [⚠ Conflicts]│  @angular/core        scope __GLOBAL__        │
│                              │                                               │
│ ▶ @angular/common     22.0.8 │  Negotiation                                  │
│ ▼ @angular/core   ⚠ 2 vers.  │  ● 22.0.8  share   provider __NF-HOST__ HOST  │
│     ● 22.0.8 share    HOST   │      __NF-HOST__  ~22.0.0 strict → own copy   │
│     ○ 21.2.0 skip → 22.0.8   │      explore      ~22.0.0 strict → 22.0.8 HOST│
│ ▶ @angular/elements   22.0.8 │  ○ 21.2.0  skip                               │
│ ▶ rxjs                7.8.2  │      decide       ~21.2.0        → 22.0.8 HOST│
│ ▶ tslib               2.8.1  │  ◌ 20.1.0  scope  isolated                    │
│ ▶ @ng-internal/event-bus     │      legacy   =20.1.0 strict → own copy, only │
│   …                          │                visible to legacy (scoped map) │
│                              │                                               │
│ Scopes: __GLOBAL__ (12)      │  Entries (6)   @angular/core · primitives/…   │
│         strict (0)           │  Chunks        bundle browser-angular_core    │
│                              │   mapped (5):  chunk-6BOBWJD7 · … → ImportMap↗│
│                              │  Integrity     SRI present for all 6 files    │
└──────────────────────────────┴───────────────────────────────────────────────┘
```

Rules demonstrated in the sketch:

- One expandable package row per scope; collapsed row shows the common
  case in one line, a conflict indicator (`⚠ n versions`) when more than
  one version row exists.
- Version rows carry the action verbatim (`share`/`skip`/`scope`), never
  an interpreted motive. Participants carry their declared range, strict
  flag, and an explicit resolution arrow.
- `skip` caveats render on the participant, not as footnotes. With
  `servedBy` dropped (never observed) and self-fill re-based (3.3),
  the remaining caveat is the secondary-entry link: a skip participant
  whose subpath external resolves to its own copy shows it as a linked
  sibling row ("`/extra` → own copy"), derived by the parent-package
  rule and tagged as name-derived.
- `scope` rows are labeled *isolated* and name their audience — a scoped
  copy is mapped only for its own declarers.
- In the `strict` share scope every exact version is `share` by design
  (`STRICT_SCOPE`, `process-remote-entries.ts:97`); the UI must not
  render multiple shares there as a conflict. Corpus addition: at
  store time `requiredVersion` is pinned to the exact tag — the
  configured range is lost (`strict-scope/20260811T095035Z.json`), so
  strict-scope rows must not present `requiredVersion` as a declared
  range.
- Chunk lists on the provider's version row; losing rows show
  "n chunks declared, not mapped" (from `shared-chunks`, 2.4) —
  rendering blocked on open question I: populated `shared-chunks`
  lists are unvalidated at lossless fidelity.
- Wording is "mapped / loaded on demand", never "loaded" — resolution is
  not delivery (V1 invariant, unchanged).

### 4.2 Remotes (extended)

Core question: *what is the state of this remote?* The detail is the
transposed projection: all packages from one participant's point of view.
The full negotiation of a package is deliberately **not** repeated here —
that is one click away.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Remotes                      │  @tractor-store/explore                       │
│                              │  scopeUrl /playground/explore/                │
│  __NF-HOST__          HOST   │  Badges: dense externals ✓ · chunking ✓ · SRI✓│
│  @tractor-store/explore      │                                               │
│  @tractor-store/decide       │  Exposes (8)                                  │
│  @tractor-store/checkout     │   mfe-home        mfe-home-QJGJZXVQ.js        │
│                              │   mfe-header      mfe-header-W2OE6E3A.js  …   │
│                              │                                               │
│                              │  Shared dependencies (this remote's view)     │
│                              │   @angular/core  ~22.0.0 strict → 22.0.8 HOST │
│                              │                              [skip] pkg ↗     │
│                              │   rxjs           ~7.8.0 strict → 7.8.2  HOST  │
│                              │                              [skip] pkg ↗     │
│                              │   @angular/elements ~22.0.0 → own copy        │
│                              │                              [share·provider] │
│                              │                                               │
│                              │  Chunks — code shared between this remote's   │
│                              │  exposes, plus lazy modules (mapping-or-      │
│                              │  exposed; mapped scoped to /explore/)         │
│                              │   chunk-OZQ6JKLG · chunk-2TRNGCRW · …         │
└──────────────────────────────┴───────────────────────────────────────────────┘
```

- The dependency rows reuse the shared "participant → resolution"
  component from 4.1; grouping is the only difference.
- Chunk sections carry the context-specific one-line explanation (remote:
  "code shared between this remote's exposes"; package detail: "package-
  internal code shared between the bundle's entry points"). Inline
  education instead of external docs.
- Scoped externals of the remote (true non-singleton packages, after
  reclassification rule 3.2) appear as their own subsection when present.
- Identity stays the V1 rule: remote name + expose key, never expose key
  alone.

### 4.3 Import Map (kept, annotated)

Raw evidence view, unchanged in role, plus attribution: each scope
section is annotated with the owning remote and (dense mode) bundle
group; every row links back to its package or remote detail. The V1
honesty note ("proves resolution only…") stays verbatim.

```
│ GLOBAL IMPORTS                                                    │
│  @angular/core → …/playground/_angular_core.EWio10v_5e.js   SRI ✓ │
│    ↳ package @angular/core ↗ · provider __NF-HOST__ ↗            │
│ SCOPE /playground/explore/   remote @tractor-store/explore ↗      │
│  @nf-internal/chunk-2TRNGCRW → …/explore/chunk-2TRNGCRW.js  SRI ✓ │
│    ↳ bundle mapping-or-exposed ↗                                  │
```

### 4.4 Diagnostics (new)

Core question: *does the committed state contradict itself?* A flat
findings list (lint style) — findings are sentences, not topology.
V2 checks are registry↔import-map only:

```
│ ⚠ Unexplained import          @legacy-widget → …/widget.js        │
│    In the import map, but no registry entry explains it.          │
│ ⚠ Share mapped elsewhere      @angular/forms                      │
│    Registry: share by checkout · map targets /decide/… — mismatch.│
│ ℹ Chunks declared, not mapped @tractor-store/decide (4 files)     │
│    Expected for losing copies (see §2.4) — informational.         │
│ ℹ No SRI                      rxjs._3LcsHIuu_.js                  │
```

Every finding names its evidence layers and links to the affected
entities. Explainable diffs (loser chunks) are informational, never
warnings — the linter must know the resolver's rules or it produces
noise.

### 4.5 Global search

One search field over the store: remotes, packages, version tags,
specifiers, file names, chunk names. The primary entry is a foreign
artifact (a file name from the Network panel, a package from an error
message) whose home tab the user does not know; per-tab search would
require knowing the answer first. Results grouped by entity type; Enter
opens the owning detail view. Per-tab column filters are a later,
separate gesture (narrowing a list vs. navigating).

```
│ 🔍 chunk-ZR2C3J5K                                                 │
│  Chunks     chunk-ZR2C3J5K.js — bundle browser-angular_core,      │
│             provider __NF-HOST__, mapped (SRI ✓)                  │
│  Import map @nf-internal/chunk-ZR2C3J5K → …/chunk-ZR2C3J5K.js     │
```

### 4.6 Shell capture status (carried from the amended V1 Task 9)

V1's Task 9 specified per-tab channel-state indicators; its
channel↔tab mapping was defined over the V1 tab triple, so the
implementation was deferred here rather than built against the outgoing
shell (`docs/work/passive-mvp/plan.md`, Task-9 amendment 2026-08-10).
What carries over is the requirement and the visual vocabulary; the
mapping is redefined for the V2 tab set.

Requirement: the shell — not any single view — signals at a glance
whether each evidence channel fed the current capture. Motivating
observation (V1 fixture review): `synthetic-missing-channel` and
`synthetic-empty-page` carry the identical `nativeFederationGlobals`
state; the difference lives only in import-map evidence. Views
legitimately render them identically — only a nav-level signal surfaces
the difference without any view interpreting foreign channels.

Visual vocabulary (honest, non-alarming — unchanged from the V1
design): `available` renders quietly (no indicator); `unavailable` is a
muted "off" dot — a normal state on non-federated pages, not an error;
`not-recognized` uses the warning tone; channel reasons appear verbatim
as tooltips; while capturing and on capture error, no channel state is
claimed at all.

Proposed mapping for the V2 tabs (design proposal, to be settled with
4.1–4.4): Packages and Remotes reflect `nativeFederationGlobals`;
Import Map aggregates `domImportMaps` + `importShim` keyed off
**observed tag types**, not populated-channel counts — corpus-settled
(2.6): in native mode an empty `importShim.getImportMap()` is the
healthy norm, so "exactly one populated → partial" would mislabel
every healthy native page. Rule: native tags parsed → quiet regardless
of the shim channel; `importmap-shim` tags present but the shim
yielded nothing → partial; no tags of either type → off. It remains
the first real consumer of the V1 `partial` primitive; Diagnostics
depends on both evidence layers and renders partial when either side
is missing (a lint over one layer cannot claim cross-layer
consistency).

### 4.7 Capture actions in the shell

Refresh and capture metadata (page URL, captured-at) are shell chrome,
not view content — one snapshot feeds all views. This lands in V1
already (amended Task 9: shell-level refresh, toolbar consolidation);
V2 inherits it and adds no per-view capture actions.

### 4.8 Rendering approach

Design proposal (implementation guidance, not evidence-backed):

- **Stay hand-rolled HTML/CSS** — the V1 approach carries. Component
  libraries (Material, PrimeNG, grid widgets) are the wrong trade for a
  DevTools panel: foreign aesthetics next to DevTools chrome, theming
  fights, bundle weight, and MV3 CSP requires everything bundled anyway.
  Nothing in the sketches needs one: the V2 widget set is a tree-table,
  a master-detail split (CSS grid), badges, key-value lists, and a
  search overlay.
- **Codify the implied internal kit** instead: `tree-table`,
  `detail-pane`, `badge`, `kv-list`, the shared participant→resolution
  row (3.3), search overlay — plus one design-token stylesheet (CSS
  custom properties).
- **Tree-table pattern:** flatten the hierarchy in the computed
  projection (rows carry depth + expanded flags; expansion state is UI
  state, not store state) and render a flat list. Keeps templates dumb
  and composes with virtual scrolling for the large flat tables
  (import map). Behavior-only utilities from Angular CDK (virtual
  scroll, overlay, focus management) are acceptable; Material styling
  is not.
- **Theme:** follow DevTools via `chrome.devtools.panels.themeName`,
  light/dark through the token sheet; monospace for identifiers
  (specifiers, files, versions); DevTools-native density.

## 5. Honest states in V2

Carried over from V1: *missing*, *partial*, *ambiguous*; resolution ≠
request ≠ execution. New, source-backed:

- **Declared ≠ used.** Registry proves declaration and resolution target,
  never runtime use. Row wording: "resolves to", not "uses".
- **Singleton is implicit.** Section membership only (2.2); the per-copy
  flag needs bodies (deferred).
- **Absent keys are lazy, not errors.** All four repository keys are
  written on first use only; absence means "nothing of this kind
  registered" — corpus-confirmed in both directions (`scoped` has no
  `shared-externals`, conflict scenarios no `scoped-externals`).
- **Failed remotes are invisible** (2.3). The UI must not enumerate what
  it cannot see; the Remotes tab states the capture boundary.
- **Feature-dependent richness.** Capability badges (3.4) explain why a
  view is richer or poorer per remote instead of degrading silently.
- **Snapshot semantics.** State is stable between commit points; dynamic
  inits mutate it. Keep the timestamp, keep manual Refresh.

## 6. What V2 explicitly does not do

- No remote-entry body fetching (the V1 claims layer) — deferred to V3.
  Section 2.5 removes the "requires recording reload" premise, but V3
  planning must not read that as "free": every concrete MV3 mechanism
  has real costs.
  - A fetch from the panel runs on the `chrome-extension://` origin and
    is subject to CORS; the extension deliberately holds zero
    `host_permissions` (V1 decision). Coverage would be
    deployment-dependent: cross-origin remotes must already serve CORS
    headers for the page itself, and `ACAO: *` admits the panel too —
    but an origin-echoing allowlist does not, and same-origin remotes
    typically serve no CORS headers at all.
  - Fetching via `inspectedWindow.eval` executes code in the inspected
    page, breaking the passivity invariant — and a page-context fetch is
    credentialed (cookies attach), which the export privacy bounds were
    never reviewed for.
  - Independent of mechanism: the convention URL can 404, and a fetched
    body can be *newer* than the running page's init state (redeploy
    drift — itself a future detector).
- No recording reload, no transport provenance.
- No node-link topology graph (a possible later lens over the same
  version rows; adds no new data).
- No Quickstart integrations (`__NF_REGISTRY__` `orch.init-ready`
  resource with live adapters, DOM manifest discovery via
  `meta[name=mfe-feed]` / `script#mfe-manifest`) — documented capability,
  quickstart-only, revisit with V3.
- No mutating commands, framework detection, timelines (V1 §6 unchanged).

## 7. Validation status and open questions

Round-1 validation (plan tasks 1–2) built the serial scenario runner
and the lab lossless capture corpus; verdicts live in
`docs/work/v2/shape-validation.md` and are folded into §2–§5 above.

- **D — Conflict fixture. Closed.** The corpus demonstrates clean
  skip, strict split (`skip`+`scope` rows of one tag), scope
  isolation, and self-fill; the row model held, the self-fill
  *mechanism* deviated (secondary as own external, 3.3).
- **E — Legacy-generation fixture. Half-closed.** Non-dense captured
  (`non-dense`); the pre-`a424249` `file`-field generation remains
  uncaptured — tier-1 seeded fixtures stay the vehicle for the store's
  generation handling; that claim stays source-derived.
- **F — shareScope / strict-scope fixture. Closed.** `strict` scope
  captured, including the range-pinning finding (4.1) and
  `strict`-as-only-scope.
- **G — Provider derivation edge cases. Closed for the corpus.**
  Longest-prefix matching yields a unique winner for every mapped file
  in all 10 captures; the host `./` acts as least-specific fallback.
  Not exercised: nested remote prefixes (a remote served under another
  remote's path).
- **H — Effective-map merge semantics. Closed.** The document-order
  merge with URL normalization reproduces `importShim.getImportMap()`
  exactly in shim mode (shape-validation row 8, implementable
  pseudocode). Adopted with a flagged gap: the same-specifier
  collision branch is not corpus-proven ("later tag wins" follows
  es-module-shims semantics).

Still open — the lab corpus cannot answer these; they need a real
deployment (the planned lossless re-capture of the public
frankenstein app):

- **I — Populated `shared-chunks` and winner-only bundle mapping.**
  Every `mapping-or-exposed` list in the lab corpus is empty; the only
  populated evidence is allowlist-projected. The Packages-tab chunk
  detail (4.1) is blocked on this.
- **J — `servedBy`/`pool` in a real app.** Never observed under the
  lab's minimal sharing; the schema drop (§3 collector delta) is final
  only if a real-app capture with real Angular packages also lacks
  them.
- **K — Real secondary entry points at scale.** Multi-key `entries`
  and the secondary-as-own-external pattern (3.3) are exercised only
  with the lab's artificial package so far.

### Fixture strategy

Status: tier 2 exists — the serial scenario runner plus the
10-scenario lossless corpus (plan round 1; a deliberate deviation from
the one-deployment catalog below: checked-in definition folders plus a
runner preserve stable IDs and regenerability). Tier-1 seeded fixtures
remain the vehicle for the legacy `file` generation. Questions I–K
need a real deployment, not a fixture.

These questions are answerable with artificial fixtures, on two tiers
that prove different things:

- **Tier 1 — seeded pages.** The extension reads only
  `globalThis.__NATIVE_FEDERATION__` and the effective import map, so a
  trivial fixture page can set those globals to hand-crafted JSON with no
  federation runtime at all. Fast and deterministic; covers every shape
  including the legacy `file` generation and mixed-generation storage
  (the part of E that would otherwise require resurrecting an old
  runtime). Proves the extension reads a shape correctly — not that the
  real runtime produces it.
- **Tier 2 — lab app.** A real orchestrator run validates the shape
  assumptions themselves (they are source-derived until captured).
  Needed once per scenario and re-run per orchestrator version bump;
  mandatory for D before 4.1 ships. The non-dense part of E is a build
  flag; the old-generation part depends on an old orchestrator version
  still being installable and is best-effort in tier 2.

Scenario selection works at the composition level, not the build level:
what a remote declares (version, strict, singleton, chunking) is baked
into its build, so the lab app builds a small remote matrix once and a
query parameter (`?scenario=strict-split`) selects the manifest
combination plus the `initFederation` runtime options (the
`strict.*`/`profile.*` flags are init options, not build options). One
deployment serves a catalog of scenarios with stable IDs; captures carry
their scenario ID, which turns the exported JSON into a regression
corpus.

Construction note for the self-fill case in D: the losing participant
must declare a secondary entry point (e.g. `@angular/common/http`) that
the winning copy does not cover (removed on the winner via `skip` in its
federation config), with `profile.scopeUncoveredEntrypoints` off — the
import-map builders then self-fill the uncovered entry point from the
loser's own copy (`generate-import-map.ts selfFillUncovered`).
(Superseded by the built fixture: the map-level effect appeared, but
through a secondary-entry-as-own-external share row; the
`selfFillUncovered` path stayed unexercised — see 3.3.)
