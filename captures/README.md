# Capture corpus (checked-in subset)

Raw runtime captures that the fixture derivation
(`scripts/derive-fixture.mjs`) consumes. Checking the capture in makes the
derivation reproducible for everyone — the full corpus (more phases, more
apps) lives in a private research repository.

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
