# Capture corpus (checked-in subset)

Raw runtime captures. Two corpora live here:

- the **lab lossless scenario corpus** (`<scenario>/` directories +
  `manifest.json`) — the V2 shape-validation ground truth, and
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
