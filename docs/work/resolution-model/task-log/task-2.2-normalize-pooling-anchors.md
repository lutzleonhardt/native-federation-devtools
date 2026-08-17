### Task

Normalize witnessed raw `pool` and `servedBy` anchors independently at the Store boundary while retaining exact field provenance and all existing registry cardinalities.

### Status

DONE

All three Task 2.2 acceptance criteria are covered by green focused and repository-wide tests. The implementation remains a direct evidence projection and adds no pooling, provider, runtime-use, delivery, or UI semantics.

### Files Modified

- `projects/devtools-ui/src/app/shared/store/resolution/model.ts` (modified) — updates the existing nullable anchor comments to describe direct snapshot values and Store-only `null` normalization without changing the public shape.
- `projects/devtools-ui/src/app/shared/store/resolution/normalize-registry-evidence.ts` (modified) — replaces static null/missing seeds with independent own-property-aware normalization for `pool` and `servedBy`, including defensive handling of explicit in-memory `undefined`.
- `projects/devtools-ui/src/app/shared/store/resolution/normalize-registry-evidence.spec.ts` (modified) — adds the real five-declaration pooling witness matrix plus a focused hand-seeded `undefined` regression guard.

### Files Read (Context Only)

- `docs/work/resolution-model/plan.md` — Task 2.2 scope, acceptance criteria, and no-inference boundary.
- `docs/work/resolution-model/task-log/task-1-normalize-canonical-registry-evidence.md` — original canonical model, stable ID/cardinality decisions, and the prior null/missing anchor seeds.
- `docs/work/resolution-model/task-log/task-2-capture-pooling-anchor-witness.md` — witnessed values, raw omissions, and evidence-only semantics.
- `docs/work/resolution-model/task-log/task-2.1-preserve-witnessed-anchors.md` — completed raw SnapshotV1 handoff, own-key guarantees, and `/3` producer provenance.
- `projects/devtools-bridge/src/lib/snapshot-v1.ts` — independently optional `ExternalRemoteV1.pool?: string` and `servedBy?: string` contract.
- `projects/devtools-bridge/src/lib/fixtures/pooling-anchor.fixture.ts` — exact five-declaration source-order matrix used by the Store test.
- `projects/collector/src/lib/constants.ts` — 4096-character collector string bound.
- `projects/collector/src/lib/safe.ts` — bounded-string behavior: accept strings, retain empty strings, and truncate over-limit values with evidence.
- `projects/collector/src/lib/runtime-schema.ts` — host-side string projection and omission of non-string values.
- `projects/collector/src/lib/passive-probe.ts` — injected schema mirror that collects both raw anchors as bounded strings.
- `package.json` — focused and full repository test commands.

### Key Decisions

- `pool` remains an opaque raw string, not a pool identity, enum, brand, or graph key. The witnessed `family` value does not justify a closed vocabulary; the only stronger collector guarantee is bounded string transport.
- `servedBy` remains a direct per-declaration string anchor. Equal values are not interpreted as a universal provider or an effective runtime binding.
- A shared local `normalizeParticipantAnchor` helper performs an own-property check per field, returns the direct string with `present` evidence, and maps absence to canonical `null` with `missing` evidence. The two fields are never coupled.
- The existing path-addressed `EvidenceRef` is sufficient for field-level provenance, so no new provenance union or domain wrapper was introduced.
- An own property containing `undefined` cannot originate from serialized JSON or the validated collector pipeline, but hand-built TypeScript snapshots can represent it because optional properties are not exact. The helper defensively treats that invalid in-memory value as missing, preserving the invariant `present => string`; empty strings still remain present.
- The helper retains its small inline return type because the shape is local, non-exported, and not reused as a domain concept.
- The real pooling fixture supplies all four presence combinations across five declarations, so one focused corpus-backed test was preferred over a broad metamorphic matrix.
- Registration traversal, IDs, ordinals, candidate construction, and aggregate collections were left unchanged; the model file change is documentation-only.

### Review Focus

- **Behavior claims:** Present raw strings survive exactly; missing or explicit in-memory `undefined` anchors become Store `null` with `missing` evidence; `pool` and `servedBy` retain independent `present`/`missing` paths without mutating raw own-key presence.
- **Assumptions / choices:** Valid production SnapshotV1 values are JSON-serializable and therefore cannot carry an own property whose value is `undefined`; the defensive branch exists for hand-seeded or mutated in-memory objects. Raw pool labels are opaque bounded strings, including the empty string.
- **Scope notes:** `model.ts` changes comments only. No effective-binding collection exists in this normalizer, and no pool ID, graph, provider, runtime-use, delivery, or UI behavior was added. The pre-existing `.gitignore` modification is unrelated user work and must not be staged with Task 2.2.
- **Read next:** `normalize-registry-evidence.ts` at `normalizeParticipantAnchor` — verify the own-key/value/evidence invariant; `normalize-registry-evidence.spec.ts` at “normalizes witnessed pooling anchors independently…” — verify the real value, omission, provenance, and cardinality matrix; the same spec at “treats an explicit undefined anchor…” — verify the defensive invalid in-memory case remains independent from `servedBy`.

### Test Evidence

- `./node_modules/.bin/ng test devtools-ui --include projects/devtools-ui/src/app/shared/store/resolution/normalize-registry-evidence.spec.ts --watch=false` — passed on the final code state: 1 file / 7 tests.
- `npm test` — passed on the final code state: 24 UI files / 242 tests, 3 Bridge files / 74 tests, 6 collector files / 75 tests, and 4 guard files / 49 tests (440 tests total). Only the existing odd-numbered Node 25 non-LTS warning was emitted.
- `./node_modules/.bin/tsc -p projects/devtools-ui/tsconfig.app.json --noEmit` — passed with no diagnostics.
- `./node_modules/.bin/prettier --check` on the three Task 2.2 files — passed.
- `git diff --check` — passed.
- Independent read-only acceptance review — no findings against T2.2-AC-01, T2.2-AC-02, or T2.2-AC-03; follow-up review also found no issue in the explicit-`undefined` hardening or its regression test.
- Manual diff review confirmed the participant loop is the only behavior-changing production site and that no ID, graph, provider, runtime-use, delivery, effective-binding, or UI construct was introduced.

### Acceptance Coverage

- **T2.2-AC-01 — passed:** “normalizes witnessed pooling anchors independently without changing registry cardinality” proves exact present values, all independent raw own-key omissions before and after normalization, and Store-only nulls; “treats an explicit undefined anchor as missing in a hand-seeded snapshot” preserves the stronger `present => string` invariant. Contributes to XC-01 and XC-04.
- **T2.2-AC-02 — passed:** the pooling witness test checks independent field paths and states for all five declarations, exact 2 shared / 3 version / 5 declaration / 0 private / 5 candidate / 0 diagnostic cardinalities, and unchanged declaration-to-candidate links. Effective bindings remain outside and untouched by this canonical registry normalizer. Contributes to XC-02 and XC-03.
- **T2.2-AC-03 — passed:** production code copies only direct values and evidence; the focused shape/cardinality test, full green suite, and independent diff review confirm no pool identity, graph, universal provider, runtime-use statement, or delivery claim was derived. Contributes to XC-01 and XC-06.

### Open Issues

- No blocking or product issues.
- The unrelated `.gitignore` modification remains in the worktree and must be excluded from Task 2.2 staging.

### Context for Next Task

- `normalizeRegistryEvidence(snapshot: SnapshotV1): CanonicalRegistryEvidence` remains the sole canonical registry normalization entry point.
- Raw `ExternalRemoteV1` exposes independently optional `pool?: string` and `servedBy?: string`; valid JSON absence is an absent own key, never an explicit `undefined` value.
- Canonical `ParticipantDeclaration.pool` and `.servedBy` are `string | null`. Each declaration provenance contains its participant path plus independent field paths whose states match usable direct string evidence.
- `normalizeParticipantAnchor` also maps a hand-seeded own property containing `undefined` to `null`/`missing`; it preserves empty strings as direct `present` evidence and ignores inherited values.
- The validated pooling matrix is: host neither; `mfe1` main both; `mfe2` main only `servedBy`; `mfe1` extra only `pool`; `mfe2` extra neither. Registry and candidate occurrence counts remain source-order stable.
- Pool labels remain opaque participant metadata and `servedBy` remains a declaration anchor. Later resolver work may compare evidence under its own acceptance criteria but must not reinterpret these fields inside normalization.
- The unrelated `.gitignore` edit must remain excluded from Task 2.2 staging.

### Git State

`git diff --stat`

```text
 .gitignore                                         |   2 +-
 .../src/app/shared/store/resolution/model.ts       |   4 +-
 .../resolution/normalize-registry-evidence.spec.ts | 200 +++++++++++++++++++++
 .../resolution/normalize-registry-evidence.ts      |  32 +++-
 4 files changed, 229 insertions(+), 9 deletions(-)
```

`git status --short`

```text
 M .gitignore
 M projects/devtools-ui/src/app/shared/store/resolution/model.ts
 M projects/devtools-ui/src/app/shared/store/resolution/normalize-registry-evidence.spec.ts
 M projects/devtools-ui/src/app/shared/store/resolution/normalize-registry-evidence.ts
?? docs/work/resolution-model/task-log/task-2.2-normalize-pooling-anchors.md
```
