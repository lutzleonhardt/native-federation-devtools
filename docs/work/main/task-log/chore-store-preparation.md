### Task

Prepare the Chrome Web Store submission: verify the published v0.1.0 release zip against the store's packaging rules, add the extension icons it was missing (v0.1.1), produce the listing assets in the format the store demands, and write the privacy policy the review will ask for.

### Status

DONE

Uncommitted. Ready for `/commit chore-store-preparation`.

### Root Cause

Three gaps, all of them invisible on the install route the project has used so far:

- **No icons, anywhere.** `extension/manifest.json` never had an `icons` field and the release zip carried no PNGs. Nothing forces the issue while the extension is installed via *Load unpacked*: it declares no `action`, so it has no toolbar presence, and the only place Chrome shows an icon is the card in `chrome://extensions` — where a grey placeholder reads as "developer build", not as a defect. The store turns that same icon into the product surface (listing tile, extensions menu, install dialog). Worse, the fix is version-gated: every new zip triggers a fresh review, so shipping v0.1.0 first would have cost a second multi-day review cycle for four PNGs.
- **Listing assets in the wrong geometry.** The store accepts screenshots at exactly 1280×800 or 640×400. The README captures are retina grabs at 2340×1803 (graph, remotes) and 2340×1010 (packages) — ratios 1.30 and 2.32 against the required 1.60. None was usable as-is.
- **No privacy document.** The extension reads a foreign page through `chrome.devtools.inspectedWindow.eval`. That single call is the one thing in an otherwise permission-free manifest that a reviewer can misread as remote code execution, and there was no document stating what is read, where it goes, and why the call is safe.

A fourth finding surfaced during verification and is not a gap but a trap: `dist/extension/` held a stale build from `feature/resolution-model` (`main-7YIVVDQZ.js`, built 26 Aug) while the shipped v0.1.0 zip contains `main-DTQSNVCH.js`. Zipping that directory would have published unreleased graph-view work.

### Files Modified

- `extension/manifest.json` (modified) — version `0.1.0` → `0.1.1` (the store rejects an upload whose version is not higher than the previous one) and a four-entry `icons` block (16/32/48/128 → `icons/icon-<n>.png`).
- `scripts/build-extension.mjs` (modified) — one `cpSync` line copying `extension/icons/` into `dist/extension/icons/`, placed next to the existing panel copy. The script's "pure copy — no file is modified during assembly" contract still holds.
- `extension/icons/icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png` (new) — the Native Federation hexagon, alpha-cropped from `docs/assets/readme/native-federation-logo.png` and Lanczos-scaled to fill 94 % of each square tile, transparent background.
- `docs/assets/store/store-icon-128.png` (new) — the same logo as a 96×96 motif centred in a 128×128 canvas, the geometry Google documents for the listing tile.
- `docs/assets/store/screenshot-1-graph.png`, `screenshot-2-packages.png`, `screenshot-3-remotes.png` (new) — 1280×800 each, in listing order.
- `PRIVACY.md` (new) — repo-root privacy policy: the exact fields read, the absence of permissions/network/remote code, where the snapshot lives, and the URL sanitizer.

Build artefact, not part of the commit (`/dist` is gitignored): `dist/native-federation-devtools-v0.1.1.zip` — 166 KB, 11 entries, `manifest.json` at the root, no wrapper directory. This is the file to upload.

### Files Read (Context Only)

- `extension/manifest.json`, `extension/devtools.html`, `extension/devtools.js` — the shipped shell; `devtools.js:6` registers the panel and passes the DevTools theme as a query parameter, and is the only `chrome.*` caller outside the panel bundle.
- `scripts/build-extension.mjs`, `scripts/check-panel-bundle.mjs` — assembly and the MV3-CSP gate (bans `eval(`/`new Function(`/zone.js in JS, inline scripts and inline handlers in HTML; sanctions exactly the literal `inspectedWindow.eval(` shape).
- `projects/devtools-bridge/src/lib/chrome-snapshot-provider.ts:93-118` — the eval call site, its timeout and exception handling.
- `projects/collector/src/lib/passive-probe.ts` (header contract; `:289-295` the page-metadata block) and `privacy.ts` (`sanitizeUrl`) — the two sources `PRIVACY.md` cites.
- `README.md`, `docs/assets/readme/*` (dimensions and content), `package.json`, `.gitignore`.
- GitHub API (unauthenticated) and the published v0.1.0 asset — release metadata, download, byte comparison.

### Key Decisions

— session 2026-08-31

- **Icon variant A (transparent) over a white plate.** The logo's hexagon interior is fully transparent (`(0,0,0,0)` at centre) and the `{ES}` glyph is blue `#1f87ae`, so the obvious worry — the mark vanishing in Chrome's dark theme — needed checking rather than guessing. Rendered both variants at 128/48/32/16 on white and on `#252629` as one comparison sheet: A stays legible on dark because the hexagon silhouette carries it, and is visibly larger on light; the plate only wins on dark and disappears against the store's white background, where it just makes the logo look smaller. A is also the brand-faithful option — reshaping someone else's project logo is not this task's call.
- **New version 0.1.1 rather than replacing the v0.1.0 asset.** The store refuses an upload whose version is not strictly higher, and the published v0.1.0 asset stays byte-identical to what the README's install route already points at.
- **Icons committed as source, copied by the build.** They live in `extension/icons/` and are copied like `manifest.json` — no generation step inside the build. Consistent with the existing shell layout and with the standing preference against build steps that silently rewrite static artefacts.
- **Full panel width, padded vertically — not a centred crop.** The first attempt cropped 23 px from each side to hit the 1.6 ratio and decapitated the UI: the tab bar read "ackages" and "Export JSON" lost its edge. Keeping the full 2340 px width and padding the remainder with the panel background `#252629` costs 8 px of padding on the graph shot and nothing on remotes.
- **Packages screenshot top-aligned, not centred.** Its source is 2.32:1, so it needs 248 px of vertical padding. Centred, the panel floated in a grey box like a screenshot of a screenshot; anchored at the top, the tab bar sits on the frame edge and the empty space below reads as an unfilled panel.
- **Graph cropped at 1434 px, remotes at 1462 px.** The graph has a natural seam there — below it the next chunk group would have been sliced mid-box, which reads as a rendering error. The remotes list is a scroll viewport, so a clipped row at the bottom edge reads as "there is more", which is true.
- **A separate 96-in-128 store icon.** Reusing the 94 %-fill manifest icon would work, but Google documents padding for the listing tile; two files cost nothing and each is right for its slot.
- **`PRIVACY.md` names the four fields instead of claiming "minimal data".** `location.origin`, `location.pathname`, `document.readyState`, the `__NATIVE_FEDERATION__` registry, DOM import maps, `importShim` presence — read off `passive-probe.ts:289-295` and the probe's header contract, with both files linked so the claim is checkable. The `sanitizeUrl` paragraph (userinfo, query, fragment stripped) is the strongest sentence in the document: it answers "could a session token end up in an exported snapshot" with no.
- **Prettier on the two touched files only.** `extension/manifest.json` and `scripts/build-extension.mjs` verified clean; `PRIVACY.md` deliberately not run through it, per the standing rule that markdown in this repo is not prettier-clean and reformatting buries the diff.

### Review Focus

- **Behavior claims:** (1) `dist/native-federation-devtools-v0.1.1.zip` satisfies every packaging rule the store checks at upload — `manifest.json` at the top level, version strictly above the published 0.1.0, four declared icons present at their declared paths. (2) The release build is reproducible from `main`: rebuilding produced `main-DTQSNVCH.js`, the exact bundle inside the shipped v0.1.0 zip. (3) `PRIVACY.md` describes what the code actually reads, field for field.
- **Assumptions / choices:** the icon variant is a design judgement, reversible in a minute (both variants were generated; only A was written to the repo). The screenshots show the `exported-playground-checkout` fixture, not a live session — accurate UI, synthetic data. "No data collection" in `PRIVACY.md` follows Google's definition of collection as transmission off the device; the JSON export is a user-initiated local file and is described as such.
- **Scope notes:** `dist/extension/` was rebuilt and now holds the `main` build instead of the stale `feature/resolution-model` one — intended, and the reason the reproducibility check was possible. `README.md` was deliberately not touched: the "Chrome Web Store: coming soon" badge and a link to `PRIVACY.md` both belong to the post-publication step.
- **Read next:** `extension/manifest.json` — four icon paths, all resolved against the zip listing; `scripts/build-extension.mjs:24` — the one added line, and whether it belongs above the panel copy; `PRIVACY.md` § "What the extension reads" against `projects/collector/src/lib/passive-probe.ts:289-295` — the only place this change makes a factual claim about behavior.

### Test Evidence

— session 2026-08-31

Verification of the published v0.1.0 (step 5 of the store checklist):

- `curl -L` on the release asset, then `sha256sum` on both files → `f9df051e3c3537bb09b7dbfbc4f26741248f0a38dd348e627d6949914203803c`, identical to `dist/native-federation-devtools-v0.1.0.zip`. What was audited is what users download.
- `unzip -l` → 8 entries, `manifest.json` at the root, no wrapper directory.
- `unzip -p … manifest.json` → MV3, version `0.1.0`, description 72 chars (limit 132), no `permissions`, `host_permissions`, `content_scripts`, or `background`; `icons` absent — the finding.
- `grep` over `panel/main-*.js`: `fetch(` 0 hits, no `XMLHttpRequest`/`WebSocket`/`sendBeacon`, external URLs only `angular.dev/best-practices/security`, `native-federation.com`, and W3C namespace URIs; `chrome` appears once, as `devtools.inspectedWindow` — no remote code, no network surface.

v0.1.1:

- `npm run build:extension` → `Extension bundle check passed (2 JS, 2 HTML files scanned)`, bundle `main-DTQSNVCH.js` (467.30 kB) — byte-for-byte the name in the v0.1.0 zip, confirming `main` is the release state and the stale feature-branch build is gone.
- `unzip -l dist/native-federation-devtools-v0.1.1.zip` → 11 entries; `manifest.json` at the root; `icons/icon-{16,32,48,128}.png` present at the paths the manifest declares.
- `npm run test:guards` → 4 files, 53 tests passed (327 ms).
- `npx prettier --check extension/manifest.json scripts/build-extension.mjs` → clean.

Assets:

- Dimensions read back with PIL: all three screenshots exactly 1280×800; store icon 128×128.
- Each screenshot inspected visually after generation. The first crop pass was rejected on sight (clipped "Packages" / "Export JSON"), regenerated at full width, and the packages shot re-anchored to the top after the centred version looked like a floating window.

Probes: the icon comparison sheet (`icon-comparison.png`) and both candidate icon sets were written to the session scratchpad under `$TMPDIR/icons`, never to the repository, and the downloaded v0.1.0 asset likewise stayed in `$TMPDIR`. Nothing temporary remains in the tree — `git status --short` lists only the five intended paths.

### Open Issues

- No `v0.1.1` tag or GitHub release yet. The `gh` token had expired (`The token in default is invalid`); Lutz ran `gh auth login` at the end of the session, so the upload path is open but unused.
- The store's privacy-policy URL (`…/blob/main/PRIVACY.md`) 404s until this commit is pushed — enter it in the Privacy tab only after the push, not before.
- `README.md` still advertises "Chrome Web Store: coming soon" and does not link `PRIVACY.md`. Both belong to the publication step, together with the store link in the release notes and the hand-off to Manfred for the NF website.
- Not yet verified in a browser: *Load unpacked* on `dist/extension/` and the icon actually appearing on the `chrome://extensions` card. One minute of manual work, worth doing before the upload rather than after a rejected review.
- Account-level decisions still open and outside this change: which Google account owns the item, whether to verify `native-federation.com` as the publisher domain, and the EU trader/non-trader declaration (as "trader", name, address and phone become publicly visible on the listing).

### Context for Next Task

- **Version discipline is now load-bearing.** `extension/manifest.json` is the single source of the store version, and every subsequent upload needs a strictly higher one. The release zip name (`native-federation-devtools-v<version>.zip`) is what the README's install route promises — keep them in step.
- **Icons are part of the build output.** Anything that assembles or repackages the extension must carry `extension/icons/`; `scripts/build-extension.mjs` does, and `check-panel-bundle.mjs` ignores PNGs, so the gate stays green.
- **The screenshot pipeline is reproducible from this log**: full source width, crop height 1434 (graph) / 1462 (remotes), scale to 1280 px wide, pad to 800 with `#252629`, top-aligned for sources flatter than 1.6. Re-run it whenever the README captures are refreshed.
- **`PRIVACY.md` is a factual claim about `passive-probe.ts`.** If the probe ever reads another field, the document is wrong and the store listing becomes inaccurate — treat it like a test that lives in markdown.

### Git State

`git diff --stat`

```
 extension/manifest.json     | 8 +++++++-
 scripts/build-extension.mjs | 1 +
 2 files changed, 8 insertions(+), 1 deletion(-)
```

`git status --short`

```
 M extension/manifest.json
 M scripts/build-extension.mjs
?? PRIVACY.md
?? docs/assets/store/
?? extension/icons/
```

### Sessions

- claude-code 2124178c-b87f-4439-8958-143aec9d5fee (2026-08-31) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-native-federation-devtools/2124178c-b87f-4439-8958-143aec9d5fee.jsonl
