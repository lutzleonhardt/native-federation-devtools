# Task 1: Scaffold the Angular workspace and MV3 extension shell

### Task

Scaffolded the Angular 22 workspace (zoneless, standalone, Vitest) with the
`devtools-ui` shell app (three placeholder views, theme tokens) and the MV3
extension shell with query-parameter theme passing and a copy-only
`build:extension` pipeline guarded by an automated CSP/zoneless check.

### Status

DONE

### Files Modified

All files are new (greenfield task).

- `package.json` (new) — workspace manifest; scripts `build:extension` and
  `check:panel-bundle`; `"license": "MIT"`
- `package-lock.json` (new) — npm lockfile
- `angular.json` (new) — `devtools-ui` app config; production
  `optimization.styles.inlineCritical: false` (MV3 CSP, see Key Decisions)
- `tsconfig.json` (new) — CLI-generated workspace TS config
- `.gitignore`, `.editorconfig`, `.prettierrc` (new) — CLI defaults
- `LICENSE` (new) — MIT, 2026 Lutz Leonhardt
- `projects/devtools-ui/src/main.ts` (new) — reads `?theme=` query param
  (plain web input, no `chrome.*`) and sets `data-theme` on `<html>` before
  `bootstrapApplication`
- `projects/devtools-ui/src/index.html` (new) — title, `color-scheme` meta
- `projects/devtools-ui/src/styles.css` (new) — all panel colors as `--nf-*`
  custom properties: light defaults, dark via `prefers-color-scheme`
  (`:root:not([data-theme])`) and via `:root[data-theme='dark']`
- `projects/devtools-ui/src/app/app.ts` / `app.html` / `app.css` (new) —
  shell component: nav with three router links + `router-outlet`
- `projects/devtools-ui/src/app/app.config.ts` (new) — `provideRouter`
  with `withHashLocation()`
- `projects/devtools-ui/src/app/app.routes.ts` (new) — routes `remotes`,
  `shared`, `import-map` + default redirect
- `projects/devtools-ui/src/app/views/remotes-exposes.ts`,
  `views/shared-dependencies.ts`, `views/import-map.ts` (new) — placeholder
  view components
- `projects/devtools-ui/src/app/app.spec.ts` (new) — smoke tests: app
  creation + the three nav placeholders
- `projects/devtools-ui/tsconfig.app.json`, `tsconfig.spec.json`,
  `public/favicon.ico` (new) — CLI-generated
- `extension/manifest.json` (new) — MV3, `devtools_page` only, no
  permissions key
- `extension/devtools.html` (new) — bootstrap page loading `devtools.js`
- `extension/devtools.js` (new) — plain JS; registers the panel via
  `chrome.devtools.panels.create('Native Federation', '',
  'panel/index.html?theme=<dark|light>')`
- `scripts/build-extension.mjs` (new) — copy-only assembly: `ng build
  --base-href ./` → copy shell files + browser output to `dist/extension/`
  → run bundle check
- `scripts/check-panel-bundle.mjs` (new) — fails the build on `eval(`,
  `new Function(`, zone.js markers in JS, and inline scripts / inline event
  handlers in HTML

### Files Read (Context Only)

- `docs/work/passive-mvp/plan.md` — preamble + Task 1 block
- `/home/lutz/nf-insghts/native-federation-devtools/apps/devtools-probe/`
  (`manifest.json`, `devtools.html`, `devtools.js`) — read-only reference
  for minimal MV3 panel wiring

### Key Decisions

- **Angular 22.0.x** (current stable at implementation time). Zoneless and
  standalone are v22 defaults — no `provideZonelessChangeDetection` call
  needed, no zone.js anywhere in the project. Vitest is the default test
  runner (`ng test`, jsdom).
- **Hash-location routing** (`withHashLocation()`): path-based routing
  cannot work on `chrome-extension://` pages.
- **Theme via `?theme=` query parameter** on the panel URL, set by
  `devtools.js` at `panels.create` time; `main.ts` reads `location.search`
  and sets `data-theme` synchronously before bootstrap (no first-paint
  flash). Two alternatives were implemented/considered and rejected:
  (a) build-time injection of a `theme-init.js` into the built panel
  HTML — worked, but rejected by Lutz: build steps must not silently
  rewrite static artifacts; (b) pushing the theme from `devtools.js` via
  `panel.onShown` — rejected: races the panel document load. Chrome was
  verified to pass query strings through `panels.create` (seen in the
  panel iframe `src`).
- **`inlineCritical: false`** in the production build: Angular's critical
  CSS inlining (beasties) emits `<link … onload="this.media='all'">` — an
  inline event handler that MV3 CSP (`script-src 'self'`) blocks, which
  would have left the panel unstyled. The bundle check now also scans HTML
  for inline scripts/handlers so this class of CSP break fails the build.
- **`build:extension` is copy-only**: `dist/extension/panel/index.html` is
  byte-identical to the Angular build output; no file is modified during
  assembly.
- **Sandbox device artifacts** (`.bashrc`, `.idea`, … char devices in this
  environment) are ignored via local `.git/info/exclude`, not the public
  `.gitignore`.

### Review Focus

- **Behavior claims:**
  - `npm run build:extension` emits a Chrome-loadable MV3 extension; the
    panel page applies the DevTools theme before first paint and falls
    back to `prefers-color-scheme` when the `?theme=` param is absent
    (`ng serve`).
  - The Angular app contains no `chrome.*` reference and no zone.js; only
    `extension/devtools.js` touches `chrome.*`.
  - The build fails (exit 1) if the assembled extension contains `eval(`,
    `new Function(`, zone.js markers, inline scripts, or inline event
    handlers.
- **Assumptions / choices:** The plan wording "theme … passed from the
  devtools bootstrap" was implemented as a panel-URL query parameter
  (verified working in Chrome) rather than an `onShown` push — deviation
  agreed with Lutz during the session.
- **Scope notes:** None — all changes are within the planned surface
  (local `.git/info/exclude` was touched but is not committed content).
- **Read next:**
  - `scripts/build-extension.mjs` — the packaging contract every later
    task depends on
  - `extension/devtools.js` + `projects/devtools-ui/src/main.ts` — the
    theme handshake across the chrome/app boundary
  - `projects/devtools-ui/src/styles.css` — the `--nf-*` token set all
    views must consume

### Test Evidence

- `CI=true npm test` → 2/2 passed (`App` creation; shell renders the three
  nav placeholders `Remotes & Exposes`, `Shared Dependencies`,
  `Import Map`).
- `npm run build:extension` → production bundle ~213 kB raw / ~58 kB
  transfer; "Extension bundle check passed (2 JS, 2 HTML files scanned)".
- Negative test of the guard: a planted `eval("1+1")` file → check exits 1;
  after removal → exits 0.
- `ng serve` smoke: dev server on port 4299 served the shell HTML
  (curl-verified).
- `grep -rn chrome projects/` → only one comment mentions
  `chrome-extension://`; no API references.
- Manual verification (Lutz, 2026-07-29, real Chrome): `dist/extension/`
  loaded unpacked; panel renders the Angular shell; panel iframe `src`
  shows `panel/index.html?theme=light` (query string passes through);
  dark→light DevTools theme switch applied after DevTools restart; no CSP
  violations (console errors present were traced to other installed
  DevTools extensions' message ports, not this extension — it has no
  ports).

### Acceptance Coverage

- **T1-AC-01** — passed: `app.spec.ts` asserts the three nav placeholders;
  `ng serve` smoke via curl; no `chrome.*` in the app.
- **T1-AC-02** — passed (manual, by design of the AC): Chrome loaded the
  unpacked extension; panel renders the Angular app; no CSP violations.
- **T1-AC-03** — passed: `scripts/check-panel-bundle.mjs` runs inside
  `build:extension`; scans JS for `eval(` / `new Function(` / zone.js and
  HTML for inline scripts/handlers; negative-tested (exit 1 on planted
  violation).
- **T1-AC-04** — passed: all panel colors resolve from `--nf-*` custom
  properties; theme applied at bootstrap via `?theme=` (verified in
  Chrome); dev fallback `prefers-color-scheme` (dark testable in dev via
  `localhost:4200/?theme=dark`).

### Open Issues

- None. (Cosmetic: `favicon.ico` ships in `dist/extension/panel/` although
  a panel page never shows it — harmless, drop whenever convenient.)

### Context for Next Task

- **Boundary rule:** nothing under `projects/` may reference `chrome.*`;
  extension-shell code lives in `extension/` (plain JS, outside the
  Angular build). Only the future devtools-bridge library may talk to
  `chrome.*` (plan preamble).
- **Views:** placeholder components at
  `projects/devtools-ui/src/app/views/{remotes-exposes,shared-dependencies,import-map}.ts`,
  routed in `app.routes.ts` (hash location). Task 2's DTO/provider work
  will feed these.
- **Theming:** components must consume colors exclusively via
  `var(--nf-*)` tokens from `styles.css`; never hard-code colors. The
  `data-theme` attribute is set (or absent) on `<html>` before Angular
  boots — app code does not need to know the theme.
- **Build contract:** `npm run build:extension` = AOT production build
  with `--base-href ./` + copy to `dist/extension/` + bundle check that
  fails on CSP/zoneless violations. Keep it copy-only (Lutz: no silent
  build-time mutation of static artifacts).
- **Testing:** Vitest via `ng test` (use `CI=true` for a single
  non-watch run), jsdom environment.
- **Environment gotchas:** Node 25 triggers harmless npm `EBADENGINE`
  warnings; npm registry access needs sandbox-disabled commands in this
  environment.
- **Fixture source for Task 2:** capture corpus at
  `/home/lutz/nf-insghts/native-federation-devtools/captures/raw/frankenstein/20260724T134007Z/`
  (private research repo, read-only reference).

### Git State

`git diff --stat`: empty — all changes are new, untracked files.

`git status --short`:

```
?? .claude/
?? .editorconfig
?? .gitignore
?? .prettierrc
?? LICENSE
?? angular.json
?? extension/
?? package-lock.json
?? package.json
?? projects/
?? scripts/
?? tsconfig.json
```

(`.claude/` is session tooling, not part of this task's commit scope.)
