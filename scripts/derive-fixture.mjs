#!/usr/bin/env node
/**
 * Derives the primary SnapshotV1 fixture from a raw frankenstein runtime
 * capture (schemaVersion frankenstein-runtime-capture/1).
 *
 * The source capture is checked in under captures/ (see captures/README.md
 * for provenance and the lab-data-only policy), so the derivation is
 * reproducible for everyone. When the DTO grows per view, extend the
 * projection here and re-run; the script is the auditable record of
 * exactly which fields survive and which sanitization is applied.
 *
 * Run manually — the generated fixture is committed as a static file and
 * never rewritten at build time.
 *
 *   node scripts/derive-fixture.mjs [capture.json] [--out <file.ts>]
 *
 * Projection rules (allowlist — everything not listed is dropped):
 *  - page URL and every URL-ish string are sanitized to origin + path
 *    (no userinfo, query, or fragment)
 *  - per-remote `integrity` maps keep their SRI hash values (collected by
 *    policy — V2 corpus decision); the effective import map keeps only
 *    the list of targets that carry an integrity entry
 *  - runtime repositories keep the collector's projected field names
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const DEFAULT_CAPTURE = 'captures/frankenstein/production-04-remote-interaction.json';
const DEFAULT_OUT = 'projects/devtools-bridge/src/lib/fixtures/frankenstein-production.fixture.ts';

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const outFile = outIndex === -1 ? DEFAULT_OUT : args[outIndex + 1];
const captureFile =
  args.filter((a, i) => outIndex === -1 || (i !== outIndex && i !== outIndex + 1))[0] ??
  DEFAULT_CAPTURE;

const capture = JSON.parse(readFileSync(captureFile, 'utf8'));

function sanitizeUrl(raw) {
  const url = new URL(raw);
  if (url.username || url.password) {
    throw new Error(`refusing to project URL with userinfo: ${url.origin}`);
  }
  return `${url.origin}${url.pathname}`;
}

function channelState(channel, presentPath, missingReason) {
  if (!channel || channel.availability !== 'available') {
    return {
      state: 'unavailable',
      reason: channel ? `channel reported '${channel.availability}'` : 'channel missing from source capture',
    };
  }
  if (presentPath && channel.data?.present !== true) {
    return { state: 'unavailable', reason: missingReason };
  }
  return { state: 'available' };
}

// --- runtime repositories -------------------------------------------------

const REPOSITORY_KEYS = ['remotes', 'scoped-externals', 'shared-externals', 'shared-chunks'];

function projectRemotes(value) {
  const out = {};
  for (const [name, remote] of Object.entries(value)) {
    out[name] = {
      scopeUrl: sanitizeUrl(remote.scopeUrl),
      exposes: (remote.exposes ?? []).map((e) => ({
        moduleName: sanitizeUrl(e.moduleName),
        file: e.file,
      })),
      // Per-remote SRI map — hash values are collected by policy (V2
      // corpus decision); {} when the source capture records none.
      integrity: { ...(remote.integrity ?? {}) },
    };
  }
  return out;
}

// Mirrors the collector mapper: the served-files spelling discriminates
// the orchestrator generation (`file` = released v4, `entries` = dev);
// both or neither would be a collection error, never silent output.
function projectParticipant(r) {
  const file = typeof r.file === 'string' ? r.file : null;
  const entries = r.entries && typeof r.entries === 'object' ? { ...r.entries } : null;
  if ((file !== null) === (entries !== null)) {
    throw new Error(`participant '${r.name}' carries ${file !== null ? 'both spellings' : 'neither spelling'}`);
  }
  return {
    name: r.name,
    requiredVersion: r.requiredVersion,
    strictVersion: r.strictVersion === true,
    file,
    entries,
    cached: r.cached === true,
    bundle: typeof r.bundle === 'string' ? r.bundle : null,
    servedFiles:
      entries !== null
        ? Object.entries(entries).map(([entry, entryFile]) => ({ entry, file: entryFile }))
        : [{ entry: null, file }],
    generation: entries !== null ? 'dev' : 'v4',
  };
}

function projectExternalScopes(value) {
  const out = {};
  for (const [scope, packages] of Object.entries(value)) {
    const scopeOut = {};
    for (const [pkg, external] of Object.entries(packages)) {
      scopeOut[pkg] = {
        dirty: external.dirty === true,
        versions: (external.versions ?? []).map((v) => ({
          tag: v.tag,
          action: v.action,
          host: v.host === true,
          remotes: (v.remotes ?? []).map(projectParticipant),
        })),
      };
    }
    out[scope] = scopeOut;
  }
  return out;
}

// scoped-externals has its own single-object schema (no versions array,
// no dirty, no negotiation fields).
function projectScopedExternals(value) {
  const out = {};
  for (const [scope, packages] of Object.entries(value)) {
    const scopeOut = {};
    for (const [pkg, scoped] of Object.entries(packages)) {
      scopeOut[pkg] = {
        tag: scoped.tag,
        bundle: typeof scoped.bundle === 'string' ? scoped.bundle : null,
        entries: { ...(scoped.entries ?? {}) },
      };
    }
    out[scope] = scopeOut;
  }
  return out;
}

function deriveGeneration(sharedExternals) {
  const seen = new Set();
  for (const packages of Object.values(sharedExternals)) {
    for (const external of Object.values(packages)) {
      for (const version of external.versions) {
        for (const remote of version.remotes) {
          seen.add(remote.generation);
        }
      }
    }
  }
  if (seen.size === 0) return 'unknown';
  if (seen.size > 1) return 'mixed';
  return seen.has('dev') ? 'dev' : 'v4';
}

function projectSharedChunks(value) {
  const out = {};
  for (const [provider, bundles] of Object.entries(value)) {
    out[provider] = Object.fromEntries(
      Object.entries(bundles).map(([bundle, files]) => [bundle, files.map(String)]),
    );
  }
  return out;
}

const globals = capture.channels.nativeFederationGlobals;
let nfChannel = channelState(globals, true, 'window.__NATIVE_FEDERATION__ is not defined');
let runtime = null;
if (nfChannel.state === 'available') {
  const repositories = globals.data.repositories ?? {};
  // Mirrors the collector mapper: every repository key is lazy — absent
  // means "zero entries" — but a global carrying none of the four keys is
  // not recognized as Native Federation at all.
  const present = REPOSITORY_KEYS.filter((key) => repositories[key]?.present === true);
  if (present.length === 0) {
    nfChannel = {
      state: 'not-recognized',
      reason: 'global present but carries none of the four repository keys',
    };
  } else {
    const repositoryValue = (key) =>
      repositories[key]?.present === true ? repositories[key].value : {};
    const sharedExternals = projectExternalScopes(repositoryValue('shared-externals'));
    runtime = {
      remotes: projectRemotes(repositoryValue('remotes')),
      scopedExternals: projectScopedExternals(repositoryValue('scoped-externals')),
      sharedExternals,
      sharedChunks: projectSharedChunks(repositoryValue('shared-chunks')),
      generation: deriveGeneration(sharedExternals),
    };
  }
}

// --- import maps ----------------------------------------------------------

const projectEntry = (e) => ({ specifier: e.specifier, target: sanitizeUrl(e.target) });

const domChannel = channelState(capture.channels.domImportMaps, false);
const shimChannel = channelState(
  capture.channels.importShim,
  true,
  'window.importShim is not present',
);

let importMaps = null;
if (domChannel.state === 'available' || shimChannel.state === 'available') {
  const documentMaps =
    domChannel.state === 'available'
      ? (capture.channels.domImportMaps.data.maps ?? []).map((m) => ({
          kind: m.type,
          parsed: m.parsed === true,
          importCount: m.map?.imports?.length ?? 0,
          scopeCount: m.map?.scopes?.length ?? 0,
        }))
      : [];
  let effective = null;
  if (shimChannel.state === 'available') {
    const raw = capture.channels.importShim.data.effectiveImportMap;
    effective = {
      imports: raw.imports.map(projectEntry),
      scopes: raw.scopes.map((s) => ({
        scope: sanitizeUrl(s.scope),
        imports: s.imports.map(projectEntry),
      })),
      integrityFor: raw.integrity.map((i) => sanitizeUrl(i.specifier)),
    };
  }
  importMaps = { documentMaps, effective };
}

// --- assemble -------------------------------------------------------------

const snapshot = {
  schemaVersion: 1,
  capture: {
    pageUrl: sanitizeUrl(capture.page.url),
    capturedAt: capture.capturedAt,
    mode: 'passive',
    collectorVersion: capture.schemaVersion,
  },
  channels: {
    nativeFederationGlobals: nfChannel,
    domImportMaps: domChannel,
    importShim: shimChannel,
  },
  runtime,
  importMaps,
  errors: (capture.collectionErrors ?? []).map((e) => ({
    stage: e.stage,
    code: e.code,
    ...(e.detail !== undefined ? { detail: e.detail } : {}),
  })),
};

const banner = `// GENERATED by scripts/derive-fixture.mjs — do not edit by hand; re-run the script.
// Source: ${capture.captureId} (run ${capture.runId}), checked in under captures/
// (see captures/README.md for provenance). Projection: corpus-validated allowlist,
// per-remote SRI values kept by policy, shim-map integrity as presence list only,
// URLs sanitized to origin + path.

import { SnapshotV1 } from '../snapshot-v1';

export const frankensteinProductionFixture = ${JSON.stringify(snapshot, null, 2)} satisfies SnapshotV1;
`;

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, banner);
console.log(`wrote ${outFile}`);
console.log(
  `  remotes: ${runtime ? Object.keys(runtime.remotes).length : 'n/a'}, ` +
    `shared packages: ${runtime ? Object.values(runtime.sharedExternals).reduce((n, s) => n + Object.keys(s).length, 0) : 'n/a'}, ` +
    `imports: ${importMaps?.effective?.imports.length ?? 'n/a'}, ` +
    `scopes: ${importMaps?.effective?.scopes.length ?? 'n/a'}, ` +
    `integrity entries: ${importMaps?.effective?.integrityFor.length ?? 'n/a'}`,
);
