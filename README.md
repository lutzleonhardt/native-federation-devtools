# Native Federation DevTools

A read-only Chrome DevTools extension for inspecting [Native Federation](https://native-federation.com)
applications: remotes and exposes, shared-dependency resolution, and the
effective import map — with honest evidence states instead of guesses.

> Community project. Not officially affiliated with Native Federation.

**Status:** pre-release, under active development. The Packages and Remotes
tabs are implemented; Import Map and Diagnostics currently render placeholders.

## Why

In a micro-frontend setup with mixed framework versions, the interesting
questions are hard to answer from the outside: *Which version of
`@angular/core` won? Who provided it? Why did this remote end up with its own
copy?* The negotiation happens once at startup and then disappears into the
import map. This extension reads the result back out and explains it.

## What it shows

**Packages** — per-package negotiation detail: every candidate version with
its outcome (shared, scoped, or skipped), the requesting participant and its
range, strict requirements, and which participant provides the mapped entry.
Conflicts are listed separately. Includes SRI coverage and chunk mapping where
the capture provides it.

**Remotes** — the same data from each participant's point of view: exposes
with their mapped targets, the remote's own dependency declarations and where
each one resolves, capability evidence (SRI, dense chunking), chunk
attribution, and scoped externals.

Any snapshot can be exported as JSON, which doubles as a reproducible bug
report.

In progress: **Import Map** (the effective map with attribution per row),
**Diagnostics** (registry↔map lint), and global search. The data layer behind
them is in place — the views are not.

## Design constraints

**Read-only by construction.** The extension inspects without invoking getters
or triggering side effects — it never mutates the application it is pointed
at. This is enforced by tests in `guards/`, not by convention.

**Explicit about what it cannot know.** Where the runtime data proves
resolution but not intent, the UI says so instead of inferring. Derived values
are labelled (`source-derived`); missing chunk evidence is stated rather than
silently omitted.

**No permissions.** The manifest requests none — no host permissions, no
content scripts. The panel talks to the inspected page through the DevTools
API only.

## Install (development build)

```bash
npm install
npm run build:extension
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load
unpacked** → select the built extension directory. Open DevTools on any Native
Federation application; the panel appears as a new tab.

## Development

```bash
npm start        # dev panel in the browser, with fixtures
npm test         # UI, bridge, collector, and guard suites
```

The dev panel can replay captured scenarios without a running application via
`?fixture=<id>` — strict share scopes, split versions across remotes, scope
isolation, dynamic initialization, and a live capture of a deployed
Angular/React host.

## Repository layout

| Path | Contents |
| --- | --- |
| `extension/` | MV3 manifest and DevTools page |
| `projects/` | collector, bridge, and UI libraries |
| `captures/` | raw runtime captures and the corpus manifest |
| `guards/` | invariant tests, including the privacy scan |
| `docs/` | specs and validation reports |
| `scripts/` | capture, fixture derivation, and build tooling |

Captures are lab data of this project's own scenario runner and its own
deployed demo application only — never third-party pages. See
[`captures/README.md`](captures/README.md) for the corpus policy, provenance,
and regeneration steps.

The product boundary is defined in
[`docs/specs/native-federation-devtools.md`](docs/specs/native-federation-devtools.md).

## License

MIT
