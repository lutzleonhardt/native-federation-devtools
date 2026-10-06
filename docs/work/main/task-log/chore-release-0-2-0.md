### Task

Package release 0.2.0 for the Chrome Web Store: bump the manifest version
and build the upload zip from `main` after the share-pools and
packages-verdicts stack merged.

### Status

DONE

No independent review performed; the only source change is the version
field. Tag and GitHub release are the maintainer's step after this commit.

### Root Cause

Not a bug. The store rejects an upload whose version is not strictly higher
than the previous one, and `0.1.1` is the version already prepared for the
store (`chore-store-preparation`). The panel gained the Pools tab, the
Graph groupings and filter, the Packages versions-and-verdicts redesign and
storage discovery since, so the next version is a minor bump, `0.2.0`.

### Files Modified

- `extension/manifest.json` (modified) — `version` `0.1.1` → `0.2.0`; nothing
  else in the manifest changes (still no permissions, host permissions,
  content scripts or background).

Build artefact, not part of the commit (`/dist` is gitignored):
`dist/native-federation-devtools-v0.2.0.zip` — 200 KB, 13 entries,
`manifest.json` at the root, no wrapper directory, bundle
`panel/main-3TA26LP2.js` (579.61 kB raw, 137.31 kB gzip). This is the file
to upload.

### Files Read (Context Only)

- `docs/work/main/task-log/chore-store-preparation.md` (packaging rules and
  the zip recipe), `scripts/build-extension.mjs`, `extension/manifest.json`,
  tags `v0.1.0` and `v0.1.1`

### Key Decisions

- **`0.2.0`, not `0.1.2`:** two new tabs' worth of features since the last
  upload; the previous tag notes mark `0.1.1` as a packaging-only release
  with an unchanged panel.
- **Zip rebuilt from a fresh `dist/extension/`:** the build script wipes
  and reassembles the directory, so the stale-build trap recorded in the
  store-preparation log cannot recur; the zip is written with `zip -r .`
  from inside the directory so `manifest.json` sits at the root.
- **Angular CSS budget warnings left as they are:** three component
  stylesheets exceed the 4 kB warning budget (remote-detail, graph,
  package-versions); warnings only, pre-existing, unrelated to the release.

### Review Focus

- **Behavior claims:** the zip satisfies the store's upload checks —
  `manifest.json` at the top level, MV3, version strictly above `0.1.1`,
  the four declared icons present at their declared paths.
- **Plan deviations:** No plan (fix lane).
- **Assumptions / choices:** the version number; `0.1.1` is assumed to be
  the last version uploaded to the store dashboard.
- **Scope notes:** None.
- **Read next:** `extension/manifest.json` — the one changed line.

### Test Evidence

- `npm run build:extension` → `Extension bundle check passed (2 JS, 2 HTML
  files scanned)`, `Extension assembled at …/dist/extension`.
- `npm run check:panel-bundle` (run before the bump on the same `main`
  state) → passed.
- `unzip -l dist/native-federation-devtools-v0.2.0.zip` → 13 entries,
  `manifest.json` at the root, `icons/icon-{16,32,48,128}.png` present;
  `unzip -p … manifest.json` → `"manifest_version": 3`, `"version": "0.2.0"`.
- `npm run test:guards` → 4 files, 85 tests passed.
- `npx prettier --check extension/manifest.json` → clean.
- No temporary probes.

### Open Issues

None.

### Context for Next Task

- After this commit: `git tag -a v0.2.0` with release notes (Pools tab,
  Graph group-by and include/exclude filter, Packages versions & verdicts,
  storage discovery), push the tag, attach the zip as the GitHub release
  asset (the README's install route points at release assets), then upload
  the same zip to the store dashboard.
- `docs/assets/store/` holds two untracked promo tiles; the store listing
  screenshots there predate the Pools tab and the new Packages tab.

### Git State

```
 extension/manifest.json | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)

 M extension/manifest.json
?? docs/assets/store/promo-tile-1400x560.png
?? docs/assets/store/promo-tile-440x280.png
```

### Sessions

- claude-code a813539f-6246-44a3-a9ad-11f039bba1e2 (2026-10-06) — transcript: ~/.claude/projects/-home-lutz-projects-native-federation-devtools/a813539f-6246-44a3-a9ad-11f039bba1e2.jsonl
