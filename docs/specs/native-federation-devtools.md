# Native Federation DevTools — Product Handoff

Status: validated product boundary from the runtime-observability research
(Tasks 2 and 3). Evidence sources live in the private research repository
(`nf-insghts/native-federation-devtools`): the Frankenstein corpus run
`captures/raw/frankenstein/20260724T134007Z/`,
`docs/research/frankenstein-runtime-observations.md`, and the Task 2/3 logs
under `docs/work/runtime-observability/task-log/`.

Marking convention: every statement in this document is backed by that
evidence unless it carries an explicit `Assumption:` or `Open question:`
label. The three open questions are collected in section 5.

## 1. The four debugging questions

The product answers four questions about a running Native Federation page:

1. Which remotes are available, and which exposes does each provide?
2. For each shared dependency: which version was selected, which remote
   provided it, and what action did the resolver take (`share`, `scope`,
   or `skip`)?
3. What does a given import specifier effectively resolve to in the
   browser — the effective import-map target?
4. What claim and transport evidence supports those answers — what did
   each participant request, and what actually went over the network?

Everything in the smallest useful UI (section 4) serves one of these
questions. Anything that serves none of them is deferred (section 6).

## 2. The four evidence layers

The answers come from four distinct evidence layers. They are kept
separate because each one proves something different — and fails to prove
something that is tempting to read into it.

**Observed remote-entry claims.** Remote-entry bodies state what each
participant requested: its name, its expose keys, and its shared-dependency
declarations (version, required version range, singleton and strict-version
flags). Claims are recovered from the explicit recording reload, not from a
passive snapshot. A claim is not an outcome: a declared shared package can
be skipped or overridden by the resolver, and the presence of a claim does
not prove the declared file was ever fetched or executed. Claim coverage is
inherently partial — a remote entry requested before DevTools attached, or
skipped by the runtime, produces no observable claim.

**Runtime resolver outcome.** The page-global `__NATIVE_FEDERATION__`
exposes four repositories: `remotes`, `scoped-externals`,
`shared-externals`, and `shared-chunks`. They record what the resolver
decided: per shared package and scope, the selected version tag, the
resolver action, the providing remote, and per-participant version
requirements. This layer does not prove delivery: its `cached` flag is
resolver bookkeeping, not evidence of browser-cache behavior. It is also a
partial projection — the full Federation result stays application-internal
(Angular dependency injection) and is not observable from globals.

**Effective browser resolution.** The effective import map (via the
import-map shim) states what each specifier resolves to right now; the
demonstrated page had one shim map with 22 imports, one scope, and 29
integrity entries. This layer proves resolution only: an import-mapped
file is not necessarily requested, and a requested file is not proof of
execution or mounting.

**Transport provenance.** Sanitized request metadata from the recording
reload — method, query-free URL, status, and timing — shows what actually
crossed the network after recording started. Metadata cannot answer
questions that need headers or bodies. A successful remote-entry fetch is
not proof its exposes were used, and the absence of a request can mean
cache reuse or a pre-recording fetch, not absence of the module.

## 3. Capture modes and the safety invariants

**Passive post-load snapshot.** Attaches to the already-loaded page and
reads the resolver outcome, the effective import map, and page metadata.
In the demonstrated run this covered the negotiated happy-path state
completely, but carried no network evidence — the expected gap when
attaching after load. It never navigates the page.

**Explicit recording reload.** A separate, visibly distinct user action:
the collector arms its network listeners first, then asks DevTools to
reload the inspected tab. In the demonstrated run this added remote-entry
claims and transport provenance while the observed runtime state and
effective import map stayed content-identical to the passive snapshot.
Recording is the only way to recover claims, and its coverage is bounded
by the recording session — it is a diagnostic step, not the default mode.

The two invariants:

- Passive capture never mutates the inspected page: no global, DOM, or
  storage writes, no Federation loader calls, no navigation. Verified by
  identical before/after state digests across all ten corpus captures and
  by automated probe tests.
- Exports never contain cookies, headers, credentials, request or response
  bodies, or business data; exported URLs are stripped of user info,
  query, and fragment.

## 4. The smallest useful UI

Assumption: the following four views are sufficient for the four
debugging questions; this is a product proposal, not demonstrated fact.
Every view must render three honest states instead of inventing data:
*missing* (the evidence channel was unavailable or not captured),
*partial* (captured, but coverage-limited — e.g. claims without a
recording), and *ambiguous* (an association the evidence cannot prove).

- **Remotes and exposes** — per remote: name, scope URL, and expose keys.
  Identity is the pair of remote name and expose key; distinct remotes can
  expose the same key or retain a colliding module name, so exposes are
  never keyed by expose key alone.
- **Shared dependencies** — per package and scope: the selected version
  tag, resolver action, providing remote, and each participant's declared
  requirement. Without a recording this view is *partial*: it shows the
  outcome but not the claims behind it. No duplicate-version scenario was
  demonstrated, so competing versions must render as unresolved
  uncertainty, not as an interpreted winner.
- **Import map** — specifier to effective target, with integrity presence.
- **Evidence** — recorded requests, matched remote entries, and unmatched
  or ambiguous candidates, preserved rather than discarded.

The one demonstrated worked example, from the production corpus run:

- Claim: the `whiteboard` remote entry declares shared `react` 18.3.1,
  required version `^18.3.1`, singleton, strict, with out-file
  `react.QYXZqQxJ1j.js`.
- Outcome: `shared-externals` (global scope) holds `react` with the single
  version tag 18.3.1, action `share`, sole provider `whiteboard`.
- Resolution: the effective map targets `react` at
  `…/whiteboard/react.QYXZqQxJ1j.js`.
- Transport: the whiteboard `remoteEntry.json` returned HTTP 200 inside
  the recording session.
- Still unproven even here: whether the react bundle executed — that
  depends on the whiteboard element actually mounting.

The UI states plainly what zero-configuration observation cannot see:
`__NF_REGISTRY__` may be absent, Quickstart markers are optional and
initial-only, and the public `/audit` needs evidence a passive extension
does not have. None of these are product inputs.

## 5. Open validation questions (micro-spikes)

- **A — Filename-independent remote-entry discovery.** The feasibility
  prototype matched the exact basenames `federation.manifest.json` and
  `remoteEntry.json`; real descriptor URLs are arbitrary strings, a
  manifest can be inline or absent, and the runtime `scopeUrl` has already
  lost filename and query information. Open question: can bounded
  candidate matching (scope-based filtering plus body validation) discover
  remote entries without filename assumptions, within the privacy bounds?
- **B — Body-size signals before content reads.** Chrome's `getContent()`
  offers no range or cancel API, so the prototype transiently held whole
  allowlisted bodies. Open question: which pre-read signals (declared
  sizes, resource-timing data) are reliable enough to gate body reads?
- **C — Ambiguous claim association.** The runtime host key `__NF-HOST__`
  can differ from the host's remote-entry body name, and distinct remotes
  can share a body name. Open question: how should claims be associated
  with runtime entries so that duplicates and aliases stay visibly
  ambiguous instead of being forced into one interpretation?

## 6. Deferred

Out of scope for the first product; listed without design detail:

- Cooperative host integration (bridge / published snapshots)
- Topology graph
- Mutating commands
- Framework detection
- Timelines

### Backlog candidate: consumer perspective on shared dependencies

*(Idea from Lutz during Task 4, 2026-07-31 — park for a Phase-2 `/plan`.)*

The Phase-1 Shared Dependencies view is provider-centric: it shows who
provides the selected version and the participants recorded under it. The
actual debugging question is consumer-centric — "remote `mermaid` declared
`react@^13`, what does it *get*, and where is the mismatch?"

Evidence basis (both passive, two layers correlated, never merged):

- **Runtime resolver outcome** records the demands: per-participant
  `requiredVersion` under each version tag, plus the action.
- **Effective browser resolution** records the delivery side: import-map
  `scopes` state which file a specifier resolves to for imports from a
  remote's scope. The *version* of a mapped target is not in the map — it
  is derived by joining target file names against the repositories' `file`
  fields, and must stay visible as a cross-layer correlation.
- Limits: resolution is not loading (transport provenance stays Phase 2);
  declared-but-unregistered claims stay Phase 2; a requirement/outcome
  mismatch is mechanically checkable (semver) and rendered as a marker,
  never as an inferred resolver motive.

UI direction (discussed, not decided): cross-linked detail views first —
package → all declarations with outcome and mismatch markers; remote → its
dependencies with resolution status; expandable rows in the existing table
as the cheapest first stage. A node-edge topology graph (Obsidian-style)
stays a later, separate lens: good for coupling overview, weak for the
precise version question.

Prerequisite before designing: the capture corpus demonstrates no
cross-remote version conflict, and the repository shape of the losing
declaration (participant under the winning tag vs. own `scope`/`skip`
entry) is unverified. Extend the Frankenstein lab app to produce a real
conflict and capture it first — fixture-first, like Phase 1.

## 7. Prior art — not templates

The private `nf-chrome-plugin` repository is a frozen earlier attempt: its
Angular UI was built on mock fixtures before real observability had been
validated. Its spec (`docs/specs/native-federation-chrome-devtools.md` in
that repository) is superseded by this handoff.

`apps/devtools-probe` in the private research repository is the
feasibility spike behind Task 3: it proves that a minimal-permission MV3
DevTools extension can capture passively within the safety invariants and
export within bounds. Its internal machinery — settlement state machine,
generic artifact schema, exact-filename gates — is prototype scaffolding,
not product architecture. Both are read-only references, not templates.
