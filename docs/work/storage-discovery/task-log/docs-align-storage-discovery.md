# Docs: align the docs and DTO comments with storage discovery

### Task
Bring the documentation and contract comments that Tasks 1–4 left behind in line with
storage discovery: version stamps and corpus coverage in `captures/README.md`, the privacy
policy's probe description, the development and data-model docs, and the DTO and mapper
header comments.

### Status
DONE. Independent review not performed; the user reviewed the finding list and approved the
two groups "stale" and "missing" for implementation, and explicitly excluded the specs.

### Root Cause
The contributor PR updated README, PRIVACY.md and the DEVELOPMENT.md probe table, but the
rest of the repository still described the pre-PR model: `captures/README.md` pinned
`passive-probe/3` and `nf-devtools-collector/3` and knew no `storage-probe/1`; the DTO
(`snapshot-v1.ts`) and the mapper header still said the runtime comes from the page global
`__NATIVE_FEDERATION__`; the data-model doc's Observe stage spoke of "the probe" reading
"globals"; DEVELOPMENT.md's design constraint ("without invoking getters") contradicted the
new probe table in the same file; and PRIVACY.md said "one fixed expression" two sentences
before "a separate fixed expression". PRIVACY.md also predates the PR in one respect: it never
mentioned the shim-map probe's `importShim.getImportMap()` call while claiming "never calls
page functions". The corpus README did not state that every descriptor and web-storage case
is witnessed only synthetically.

### Files Modified
- `captures/README.md` (modified) — versioning map: `passive-probe/4`, new `storage-probe/1`
  row, `nf-devtools-collector/4`; data-flow diagram lists the storage probe "when indicated";
  new "Coverage note (storage discovery)" paragraph naming the synthetic-only coverage and the
  open lab-dump follow-up from the Task 4 log.
- `PRIVACY.md` (modified) — date 2026-10-06; read list names the effective shim map; the
  "complete list" paragraph now describes the three fixed expressions and their two sanctioned
  exceptions one per line, replacing the self-contradicting "one fixed expression" sentence.
- `docs/DEVELOPMENT.md` (modified) — "Read-only by construction" names the two sanctioned,
  isolated exceptions with a link to the Probes section; the `?fixture=` enumeration adds the
  synthetic storage-discovery states.
- `docs/resolution-data-model.md` (modified) — Observe stage: the probes read the registry
  from wherever the orchestrator keeps it, recorded as `runtimeSource`.
- `projects/devtools-bridge/src/lib/snapshot-v1.ts` (modified) — header, the
  `nativeFederationGlobals` field doc (key kept for export compatibility) and the
  `RuntimeRepositoriesV1` doc refer to the runtime storage and `runtimeSource` instead of the
  page global. Comments only.
- `projects/collector/src/lib/snapshot-mapper.ts` (modified) — header: every input is
  untrusted (three now), web-storage items are parsed here like the document tags. Comment only.

### Files Read (Context Only)
- `README.md`, `docs/DEVELOPMENT.md` probe table, `docs/specs/*.md` — checked, specs left
  untouched by user decision.
- `scripts/lab-capture-dump.js`, `scripts/validate-lab-corpus.mjs`,
  `scripts/build-lab-manifest.mjs` — the manifest pins the dump script's sha256 (see Key
  Decisions).
- `guards/privacy-scan.ts`, `projects/collector/src/testing/*.ts`, `extension/manifest.json`,
  UI shell texts — checked, nothing stale.
- `docs/work/storage-discovery/task-log/task-4-fixtures-panel-docs.md` — source of the deferred
  lab-corpus follow-up quoted in the coverage note.

### Key Decisions
- Specs (`docs/specs/*.md`) stay as they are: dated design and handoff documents; the user
  decided their historical statements about `__NATIVE_FEDERATION__` need no footnote.
- The stale line pointer in `scripts/lab-capture-dump.js` (`passive-probe.ts:279-307`) is left
  alone on purpose: `captures/manifest.json` pins the script's sha256 and
  `validate-lab-corpus.mjs` rejects any change without a manifest rebuild, which needs the
  playground checkout. It will be corrected when the Task 4 follow-up extends the dump.
- Prettier was run only on the two touched TS files, and the three unrelated hunks it produced
  (pre-existing non-clean formatting) were reverted by hand so the diff stays comment-only.
  Markdown was not formatted at all (pre-existing docs are not prettier-clean).
- PRIVACY.md now mentions the `importShim.getImportMap()` call although that gap predates the
  PR: the rewritten paragraph lists every fixed expression, so omitting one would be a false
  claim in a public policy.
- The DTO channel key `nativeFederationGlobals` keeps its name; only its doc comment changes.

### Review Focus
- **Behavior claims:** none at runtime; docs and comments only. (1) `captures/README.md`'s
  versioning map matches `COLLECTOR_VERSION`, the passive probe's and the storage probe's
  `schemaVersion` stamps. (2) PRIVACY.md lists every fixed expression the collector evaluates
  and every page-side call or getter they make. (3) No doc or contract comment still claims
  the runtime is read from the page global only.
- **Plan deviations:** No plan (fix lane).
- **Assumptions / choices:** wording of the coverage note and the three-bullet probe list in
  PRIVACY.md; placement of the coverage note at the end of the lab-corpus section.
- **Scope notes:** PRIVACY.md's `getImportMap()` mention fixes a pre-PR omission; the
  `lab-capture-dump.js` pointer is intentionally not touched (pinned hash).
- **Read next:** PRIVACY.md "complete list" paragraph (public policy wording);
  `captures/README.md` versioning map + coverage note (contract stamps); `snapshot-v1.ts`
  `nativeFederationGlobals` doc (the compatibility statement).

### Test Evidence
- `npm run test:collector` (tsc + vitest, final code) → 9 files, 114 tests passed.
- `git grep -nE 'passive-probe/3|nf-devtools-collector/3'` → only the historical
  `exported-playground-checkout` fixture and six UI resolution specs that use the stamp as an
  unvalidated seed string; both intentionally left.
- `git diff` of the two TS files inspected: the only remaining hunks are the header and doc
  comments.
- No temporary probes.

### Open Issues
None.

### Context for Next Task
- Gotcha: any edit to `scripts/lab-capture-dump.js`, even a comment, changes the sha256 pinned
  in `captures/manifest.json`; rebuild the manifest with `scripts/build-lab-manifest.mjs`
  against the playground checkout in the same change. Fix the stale `passive-probe.ts:279-307`
  pointer there at that moment.

### Git State
```
$ git diff --stat
 PRIVACY.md                                      | 30 ++++++++++++++-----------
 captures/README.md                              | 20 +++++++++++++----
 docs/DEVELOPMENT.md                             | 12 ++++++----
 docs/resolution-data-model.md                   |  8 ++++---
 projects/collector/src/lib/snapshot-mapper.ts   | 16 ++++++-------
 projects/devtools-bridge/src/lib/snapshot-v1.ts | 18 +++++++++------
 6 files changed, 65 insertions(+), 39 deletions(-)

$ git status --short
 M PRIVACY.md
 M captures/README.md
 M docs/DEVELOPMENT.md
 M docs/resolution-data-model.md
 M projects/collector/src/lib/snapshot-mapper.ts
 M projects/devtools-bridge/src/lib/snapshot-v1.ts
?? docs/assets/store/promo-tile-1400x560.png
?? docs/assets/store/promo-tile-440x280.png
```
The two untracked promo tiles are unrelated.

### Sessions
- claude-code 45166028-6227-45ac-9e93-4b72896a4241 (2026-10-06) — transcript: ~/.claude/projects/-home-lutz-projects-native-federation-devtools/45166028-6227-45ac-9e93-4b72896a4241.jsonl
