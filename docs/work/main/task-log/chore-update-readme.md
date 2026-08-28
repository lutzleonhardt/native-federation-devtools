### Task

Make the README state that the panel only works with the v4 Orchestrator (not the v3 runtime), and replace the build-from-source install path with the GitHub release as the primary, step-by-step install route — both aligned with the staged DevTools page of the official website (`native-federation-website`, `src/content/docs/v4/devtools.md`).

### Status

DONE

README-only change, uncommitted. Ready for `/commit chore-update-readme`.

### Root Cause

Two gaps, both provenance rather than bugs:

- **No version boundary.** The README said "for Native Federation applications" and "Open DevTools on any Native Federation application". The probe reads `window.__NATIVE_FEDERATION__` (`projects/collector/src/lib/snapshot-mapper.ts:188`), the registry global that only `@softarc/native-federation-orchestrator` (v4) exposes; on a v3 (`@softarc/native-federation-runtime`) page the global is undefined, the channel is `unavailable`, and the UI shows *No Native Federation detected* (`projects/devtools-ui/src/app/shared/honest-state/not-detected.html:2`). Nothing in the README told a v3 user why the panel stays empty.
- **Install path behind the website.** `native-federation/devtools` already carries release v0.1.0 with `native-federation-devtools-v0.1.0.zip`; the website's devtools page points users at that zip. The README still only offered `npm install && npm run build:extension` — a node toolchain for something the website installs in three clicks — and the two official sources disagreed on how to install.

### Files Modified

- `README.md` (modified) — (1) tagline scoped to "applications running the **v4 Orchestrator**"; (2) two new badges: `requires — orchestrator v4` and a live `img.shields.io/github/v/release/native-federation/devtools?include_prereleases` release badge linked to the releases page; (3) new **Requirements** section (blockquote: v4 orchestrator required, `window.__NATIVE_FEDERATION__` is what is read, v3 runtime not supported, panel shows *No Native Federation detected*) — same wording as the website's `[!NOTE]`; (4) **Install** rewritten: "From a release" as a five-step walkthrough for people who have never used *Load unpacked* (download → unzip into a folder of its own → `chrome://extensions` → Developer mode → Load unpacked → open DevTools on a v4 app, tab **Native Federation**, reopen DevTools if it was already open), plus an upgrade note (unpacked extensions do not self-update; reload icon; automatic updates come with the Web Store); "From source" reduced to a link to `docs/DEVELOPMENT.md#install-development-build`; (5) ecosystem table: orchestrator row marked "(v4) — the runtime this panel reads".

### Files Read (Context Only)

- `native-federation-website` (staged, uncommitted): `src/content/docs/v4/devtools.md` (the v4 `[!NOTE]` and the release install steps this README mirrors), `faq.md`, `core/sharing.md`, `orchestrator/version-resolver.md` (DevTools tip callouts), `src/data/nav.v4.ts`, `src/data/llms.ts`, `src/pages/index.astro` (teaser).
- `projects/collector/src/lib/snapshot-mapper.ts`, `projects/devtools-bridge/src/lib/snapshot-v1.ts`, fixtures `synthetic-empty-page.fixture.ts` / `synthetic-not-recognized.fixture.ts`, `projects/devtools-ui/src/app/shell/capture-status-strip.html`, `shared/honest-state/not-detected.html` — which global is read and what the UI says when it is absent vs. malformed.
- `extension/manifest.json`, `extension/devtools.js` (panel tab title `Native Federation`), `scripts/build-extension.mjs` (output `dist/extension/`), `docs/DEVELOPMENT.md` (§ "Install (development build)" already holds the source build — anchor target).
- GitHub API (unauthenticated): releases of `native-federation/devtools` (v0.1.0, `prerelease: true`) and `lutzleonhardt/native-federation-devtools` (none); `releases/latest` redirect behaviour; the v0.1.0 zip listing.

### Key Decisions

- **Wording mirrors the website verbatim where it matters.** "Requires the v4 Orchestrator … classic v3 runtime (`@softarc/native-federation-runtime`) … not supported" is copied from the website's note so the two official sources cannot drift in meaning; the README adds the mechanism (`window.__NATIVE_FEDERATION__`) and the observable symptom because a README reader is closer to the code.
- **Symptom wording corrected against the UI, not guessed.** First draft said the panel reports "not recognized" on v3 pages. That is the *other* honest state (global present but without the four repository keys). On a v3 page the global is simply undefined → *No Native Federation detected*. Verified in the fixtures and the template before keeping it.
- **Link `/releases`, not `/releases/latest`.** v0.1.0 is flagged pre-release; GitHub excludes pre-releases from `/latest`, which today 302s to the bare releases list. The plain releases URL is honest for as long as everything is pre-release, and the website was changed the same way in parallel.
- **Release badge with `include_prereleases`.** Without the flag shields shows "no releases" for the same reason. Verified: renders `release: v0.1.0`. Kept the "Chrome Web Store: coming soon" badge next to it — the store stays the eventual primary channel.
- **Release path stays in the README, in full (Lutz).** My suggestion to move source-build instructions to `DEVELOPMENT.md` was accepted only for the *contributor* path. Reasoning from Lutz: normally people install from the Web Store; until that exists the release zip *is* the user install, and some users do not know how *Load unpacked* works — so the step-by-step belongs on the front page, not in a dev doc.
- **"Unzip into a folder of its own."** The release zip is flat (`manifest.json`, `devtools.html`, `devtools.js`, `panel/` at the root, no wrapper directory); unzipping in Downloads scatters files, and "select the unzipped folder" then has no target. Read from the actual v0.1.0 asset, not assumed.
- **Prettier not run.** The README was not prettier-clean before this change (`*…*` vs `_…_`, table padding); running it would bury the edit in a reformat diff (see memory: prettier only on touched files, never on the existing markdown).

### Review Focus

- **Behavior claims:** (1) A reader on the v3 runtime learns from the README — before installing — that the panel cannot see their app and what it will display instead. (2) A reader without node can install the current release from the README alone, including the "reopen DevTools" and "does not self-update" gotchas. (3) README and website describe the same install route and the same version boundary.
- **Assumptions / choices:** the observable v3 symptom is derived from the empty-page channel state, not from a live v3 app (no v3 fixture/capture exists in the corpus); `Ctrl+Shift+I` / `⌥⌘I` / `F12` are Chrome's documented DevTools shortcuts; "about a minute" is an estimate.
- **Scope notes:** the "From source" block was demoted from the README to a link — contributors now land in `docs/DEVELOPMENT.md`. No code, tests, or other docs touched. The website repo was *not* edited from this session (read-only in the sandbox; its `/latest` → `/releases` fix arrived in its index in parallel).
- **Read next:** `README.md` § Requirements (lines ~85–92) — the one paragraph that makes a support claim; `README.md` § Install → "From a release" — walk it as a first-time user; `projects/devtools-ui/src/app/shared/honest-state/not-detected.html` — confirms the quoted UI string.

### Test Evidence

No automated tests apply (Markdown only). Manual verification:

- `grep` for the registry global: `snapshot-mapper.ts:188` builds `{ state: 'unavailable', reason: 'window.__NATIVE_FEDERATION__ is not defined' }`; `not-detected.html:2` renders "No Native Federation detected"; `capture-status-strip.html:3` renders "no Native Federation detected".
- `curl https://api.github.com/repos/native-federation/devtools/releases` → one release `v0.1.0`, `prerelease: true`, asset `native-federation-devtools-v0.1.0.zip`; `curl -I …/releases/latest` → `302 → /releases` (no `/latest` target while all releases are pre-release).
- Downloaded the v0.1.0 zip, `unzip -l`: 8 entries, flat layout, `manifest.json` at root, `panel/` subfolder.
- `curl` on the shields URL → HTTP 200, SVG title `release: v0.1.0`.
- `grep '^## Install' docs/DEVELOPMENT.md` → `## Install (development build)` → GitHub slug `#install-development-build` matches the README link.
- `extension/devtools.js:6` → `chrome.devtools.panels.create('Native Federation', …)` — tab name as quoted.
- `npx prettier --check README.md` fails both before (HEAD) and after; the diff prettier wants is unrelated pre-existing style (italics markers, table padding) — left alone.

### Open Issues

- Website `devtools.md` step 1 could gain the same "unzip it into a folder of its own" hint; the website repo is read-only from this sandbox, so this is a manual one-liner for Lutz.
- `/releases/latest` (and the `include_prereleases` badge flag) become the better choice once a release is published without the pre-release flag — revisit at the first non-pre-release tag or at Web Store launch, when the whole "From a release" section shrinks to a fallback.
- `native-federation-website` has an untracked `.idea/` directory — belongs in that repo's `.git/info/exclude` (see memory: local excludes, not `.gitignore`).

### Context for Next Task

- The README now makes three checkable promises that other docs must not contradict: v4-only (`window.__NATIVE_FEDERATION__`), install from `github.com/native-federation/devtools/releases`, panel tab named **Native Federation**. If the panel title, the global, or the release asset naming (`native-federation-devtools-<version>.zip`) changes, update README § Requirements/Install and the website's `devtools.md` together.
- `docs/DEVELOPMENT.md#install-development-build` is now a public anchor linked from the README — keep the heading text stable or update the link.

### Git State

`git diff --stat`

```
 README.md | 46 +++++++++++++++++++++++++++++++++++-----------
 1 file changed, 35 insertions(+), 11 deletions(-)
```

`git status --short`

```
 M README.md
```

### Sessions

- claude-code 3df9c09a-7ffc-48a9-81c6-246d89212764 (2026-08-28) — transcript: /home/lutz/.claude/projects/-home-lutz-projects-native-federation-devtools/3df9c09a-7ffc-48a9-81c6-246d89212764.jsonl
