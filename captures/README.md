# Capture corpus (checked-in subset)

Raw runtime captures. Three corpora live here:

- the **lab lossless scenario corpus** (`<scenario>/` directories +
  `manifest.json`) — the V2 shape-validation ground truth,
- the **frankenstein-live captures** (`frankenstein-live/`) — lossless
  phase captures of the publicly deployed frankenstein meeting room
  (real released-orchestrator evidence for shape-validation rows
  12–16), and
- the legacy **frankenstein capture** (`frankenstein/`) that the V1
  fixture derivation (`scripts/derive-fixture.mjs`) consumes.

## Lab lossless scenario corpus (V2)

One capture per scenario of the playground scenario catalog (separate
repository, `nf/playground`, branch `lab/v2-scenarios` — see
`captures/manifest.json` for the exact commits). Envelope
`lab-lossless-capture/1`: the full `__NATIVE_FEDERATION__` registry
namespace cloned **losslessly** (no allowlist, no caps), the DOM
import-map tag inventory, and the effective `importShim.getImportMap()`
copy including SRI integrity hash values.

Produced by evaluating `scripts/lab-capture-dump.js` unchanged in the
served scenario page (chrome-devtools MCP session; the probe is one
async function expression and works identically from any headless CDP
driver). Regeneration:

1. playground checkout: `node run-scenario.mjs <scenario>` (serves on
   `http://localhost:4300/`),
2. evaluate `scripts/lab-capture-dump.js` in the page, save the result
   as `captures/<scenario>/<runstamp>.json` (pretty-printed, 2 spaces),
3. `node scripts/build-lab-manifest.mjs` — rewrites `manifest.json`
   (per-file sha256, commits, probe hash),
4. `node scripts/validate-lab-corpus.mjs` — checks hashes, scenario
   set, envelope structure, and per-scenario losslessness evidence.

A re-capture of the same scenario is semantically identical to the
committed file modulo `capturedAt`/`observedAt` timestamps (verified
A→A including a full rebuild).

The captures are lab data of this project's own scenario runner
(vanilla lab elements, `@nf-lab/conflict-lib` version levers). The
lab-data-only policy below applies; SRI hashes may stay.

Probe revision note: the 10 lab captures of run `20260811T095850Z` were
produced with the probe at revision `38c180aeab83…` (sha256), before the
Task-3 fallback branch for pages without `__NF_SCENARIO_READY__` was
added. The fallback branch is unreachable when the runner defines the
ready promise, so lab behavior is unchanged — verified A→A on
`clean-skip` with the current probe (semantically identical modulo
timestamps). The manifest pins the *current* probe (regeneration
contract); the validator additionally rejects any lab capture carrying
fallback-mode scenario keys.

## Frankenstein-live captures (V2, rows 12–16)

`frankenstein-live/<runstamp>-<phase>.json` — lossless phase captures
of <https://lutzleonhardt.de/frankenstein-meeting-room/>, this
project's own app, publicly deployed and listed among the official
Native Federation resources. Same envelope (`lab-lossless-capture/1`)
and probe as the lab corpus; the probe falls back to its settled-page
condition (`scenario.readySource: "page-settled"`, `scenario.phase`
label) because the live page has no scenario runner.

Phases: `01-initial` (post-init state after load) and
`02-post-interaction` (after selecting a meeting, which loads the
whiteboard and mermaid remote modules). The deployed app performs **no
dynamic post-init `initRemoteEntry`** — all three `remoteEntry.json`
fetches happen during startup, and the phase-identity check in the
validator proves the registry, DOM map tags, and effective shim map
stay byte-identical across the interaction.

Unlike lab scenarios these captures are **deployment-dependent, not
regenerable from checkouts** (XC-01 exempts them): the live app may be
redeployed at any time. Provenance lives in
`frankenstein-live/provenance.json` (capture URL + date, best-known
orchestrator version and how it was determined) and is embedded into
`manifest.json` by the builder; per-file sha256 pins the observed
state. To re-capture after a redeploy: delete the superseded phase
files, repeat the capture flow against the live URL (set
`__NF_SCENARIO_ID__`/`__NF_SCENARIO_PHASE__` in the page, evaluate the
probe, pretty-print), update `provenance.json`, rebuild the manifest,
re-run the validator — its live-evidence predicates intentionally fail
loudly if the deployed registry shapes changed, pointing at the shape
report.

This is our own application; the lab-data-only policy holds and SRI
hashes may stay.

## Frankenstein capture (V1 fixture source)

Consumed by `scripts/derive-fixture.mjs`. Checking the capture in makes
the derivation reproducible for everyone — the full corpus (more
phases, more apps) lives in a private research repository.

## Provenance

`frankenstein/production-04-remote-interaction.json` — capture of the
*frankenstein meeting room*, this project's own lab application, served
from `127.0.0.1` (run `20260724T134007Z`, phase `remote-interaction`:
host + `mermaid` + `whiteboard` remotes, react 18.3.1 shared by
`whiteboard`). Produced by the research collector with allowlist
projection (`sanitization: allowlist-projection-v1`); it contains no
cookies, headers, request/response bodies, storage values, or credentials.

The same application is publicly deployed at
<https://lutzleonhardt.de/frankenstein-meeting-room/> and listed among the
official Native Federation resources
(<https://native-federation.com/resources/>).

## Policy

Only captures of this project's own lab applications may be checked in
here — never captures of real or third-party pages, regardless of how
harmless they look. The privacy guard (`guards/privacy-scan.spec.ts`)
scans every checked-in capture for URL userinfo/query/fragment and
forbidden key names. Captures may keep SRI integrity hashes; the fixture
projection is the minimal layer on top and drops them.
