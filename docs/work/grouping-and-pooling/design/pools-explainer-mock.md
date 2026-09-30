# Pools Tab — Presentation Contract

Agreed in the planning conversation (2026-09-29) and frozen for Task 6.
UI strings are the intended English wording. Scope: explicit `pool` tags
only (see plan, "Pooling scope").

## Principles

- **Explain membership by showing it, not the algorithm.** A tag matrix
  (packages × remotes) makes the union rules visible; notes appear only
  when a rule changed the result.
- **v4.7 first.** Every sentence is read off stored rows (`action`,
  `servedBy`, tags, and from orchestrator v4.7 `poolName` and
  `poolCause`). A pool whose members carry no `poolName` was recorded by
  an older runtime: its reasons read *unknown*, never inferred, and the
  card notes "orchestrator before 4.7: pool name and reasons not
  recorded".
- **Conditional tab.** The `Pools` nav tab exists only when the capture
  holds a tag pool or an orphan tag; `/pools` stays reachable and says
  "No pool tags in this capture." otherwise.

## Layout

Definition line (always first), linking the docs:

> A pool is a set of packages that must come from the same build. Remotes
> opt packages in with a `pool` tag; the orchestrator then makes sure each
> remote gets all of them from one build.

Per pool: header, matrix, outcome lines, notes.

```
pool @nf-lab/ui-core           2 packages · 4 remotes · formed by: ui
                        host     mfe1        mfe2        mfe3
@nf-lab/ui-core         2.0.0    1.0.0 ⬡ui   1.0.0 ⬡ui   1.0.0
@nf-lab/ui-dom            —      1.0.0 ⬡ui   1.0.0 ⬡ui   1.0.0

host   every package from its own build (host precedence)
mfe1   every package from its own build · mfe2, mfe3 use this build
mfe2   redirected: every package from mfe1's build — the shared versions
       would have mixed @nf-lab/ui-core@2.0.0 + @nf-lab/ui-dom@1.0.0
mfe3   redirected: every package from mfe1's build — …

a tag pulls a package into the pool; every remote using that package
takes part (mfe3 declares no tag)
```

- Header: pool name as the orchestrator names it — the stored
  `poolName` (v4.7+, most-declared tag, `~2` suffix on a clash), else the
  smallest member (older runtimes); the pool ID keys on the smallest
  member either way,
  share scope when not the default, counts, `formed by:` distinct tags.
  A single-remote pool adds "only one remote declares its members —
  nothing to coordinate".
- Matrix cell: `<tag version>` + `⬡<tag>` when tagged, `<tag version>`
  when declared untagged, `—` when not declared; a scoped row reads
  `<tag version> (own copy: <label>)`, the explanation as tooltip;
  `<label>` is `unknown` before v4.7.
- Outcome words: *every package from its own build*, *redirected to
  `<build>`*, *own copy of every package*, *packages from different
  builds*; ` — <reason>` when the consumer's copies carry a `poolCause`
  (` — reason unknown` on an own-copy line before v4.7); `· <remotes> use
  this build` when others are anchored on it.

| `poolCause` | Cell label | Outcome reason |
|---|---|---|
| `incompatible` | version conflict | `version conflict: needs <pkg>@<range>, shared is <tag>` (members at another tag than the shared one; generic text when none) |
| `uncovered` | not covered | no single build has every package it imports |
| `torn` | would mix builds | the shared versions would mix builds |
| `unshared` | no shared copy | `no remote shares <pkg> any more` |
| other | `<raw>` | `pooling cause "<raw>"` |
- Coherence finding (should never appear — pooling guarantees it):
  "no single build ships this combination: …".
- `dirty` record: "pending re-election — outcomes not settled yet".

## Membership notes (only when they occurred)

| Case | Note |
|---|---|
| different tags, one pool | `tags a, b form one pool — they meet through <package>` |
| one tag, several pools | `tag "t" also forms pool <other> — tags only connect through a shared package` |
| untagged entrypoint joined | `<entrypoint> follows its package <package>` |
| orphan (own section) | `<package>: tag "t" by <remote> joined nothing — likely a typo or a missing sibling` |

## Acceptance reference

- `pooling-anchor` (V2): pool `@nf-lab/conflict-lib`, formed by
  `family`; mfe2 redirected to mfe1; untagged-remote footnote.
- `pool-tag-anchored`: as drawn above.
- `pool-tag-islanded`: mfe1 `own copy of every package`; ui-core has no
  shared version ("no remote shares @nf-lab/ui-core — 2 remotes run
  their own copy").
- `pool-tag-coherent`: every remote one build, no notes.
- `pool-tag-orphan`: no pool; orphan section only.
