#!/usr/bin/env node
/**
 * Validate the lab lossless capture corpus against its run manifest
 * (`captures/manifest.json`).
 *
 * Adapted from the research repo's `validate-frankenstein-corpus.mjs`,
 * reduced to the manifest-level checks that make sense for a lossless
 * corpus: manifest schema/metadata, per-file sha256, expected scenario
 * set, envelope structure, and per-scenario losslessness evidence.
 * The research validator's deep repository-shape validation is
 * deliberately NOT ported — an allowlist schema would reject exactly
 * the fields losslessness exists to keep.
 *
 * The per-scenario evidence predicates encode T2-AC-02 durably: each
 * asserts a field the product allowlist drops (`bundle`, `entries`,
 * `requiredVersion`, per-remote `integrity`, populated shim map) where
 * the scenario is known to produce it.
 *
 * Usage: node scripts/validate-lab-corpus.mjs
 * Exit code 0 = corpus valid, 1 = issues (listed on stderr).
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CAPTURES_DIR = join(REPO_ROOT, "captures");
const MANIFEST_PATH = join(CAPTURES_DIR, "manifest.json");
const PROBE_PATH = join(REPO_ROOT, "scripts", "lab-capture-dump.js");

const MANIFEST_SCHEMA = "lab-lossless-corpus/1";
const CAPTURE_SCHEMA = "lab-lossless-capture/1";
const EXPECTED_SCENARIOS = [
  "clean-skip",
  "strict-split",
  "scope-isolation",
  "strict-scope",
  "scoped",
  "non-dense",
  "dynamic-init-native",
  "dynamic-init-shim",
  "dynamic-override",
  "self-fill",
  "co-declared-share"
];
const CHANNELS = ["nativeFederationGlobals", "domImportMaps", "importShim"];
const SRI = /^sha(256|384|512)-[A-Za-z0-9+/=]+$/;

const issues = [];
const issue = (location, message) => issues.push(`${location}: ${message}`);
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

// --- per-scenario losslessness evidence (observed shapes, not hypotheses)
const sharedVersions = (ns, scope, pkg) =>
  ns["shared-externals"]?.[scope]?.[pkg]?.versions ?? [];
const EVIDENCE = {
  "clean-skip": (ns, env, loc) => {
    const versions = sharedVersions(ns, "__GLOBAL__", "@nf-lab/conflict-lib");
    if (versions.length !== 2) issue(loc, `expected 2 version rows, saw ${versions.length}`);
    if (!versions.some((v) => v.action === "skip" && v.remotes?.length > 0))
      issue(loc, "expected a skip row with intact participant list");
    for (const v of versions)
      for (const r of v.remotes ?? [])
        for (const field of ["requiredVersion", "bundle", "entries"])
          if (!(field in r)) issue(loc, `participant ${r.name} misses allowlist-dropped field '${field}'`);
  },
  "strict-split": (ns, env, loc) => {
    const versions = sharedVersions(ns, "__GLOBAL__", "@nf-lab/conflict-lib");
    const actionsOfLosingTag = versions.filter((v) => v.tag === "1.0.0").map((v) => v.action).sort();
    if (actionsOfLosingTag.join(",") !== "scope,skip")
      issue(loc, `expected tag 1.0.0 split into scope+skip rows, saw [${actionsOfLosingTag}]`);
  },
  "scope-isolation": (ns, env, loc) => {
    const versions = sharedVersions(ns, "__GLOBAL__", "@nf-lab/conflict-lib");
    if (!versions.some((v) => v.action === "scope"))
      issue(loc, "expected a scope row for the losing declaration");
  },
  "strict-scope": (ns, env, loc) => {
    const strictScope = ns["shared-externals"]?.["strict"];
    if (!strictScope) return issue(loc, "expected share scope 'strict' in shared-externals");
    const versions = strictScope["@nf-lab/conflict-lib"]?.versions ?? [];
    if (versions.filter((v) => v.action === "share").length !== 2)
      issue(loc, "expected TWO share rows under the strict scope");
  },
  scoped: (ns, env, loc) => {
    const scoped = ns["scoped-externals"];
    if (!scoped) return issue(loc, "expected populated scoped-externals");
    let sawBundle = false;
    for (const [remote, pkgs] of Object.entries(scoped))
      for (const [pkg, entry] of Object.entries(pkgs)) {
        if (!("tag" in entry) || !("entries" in entry))
          issue(loc, `scoped ${remote}/${pkg} misses tag/entries`);
        if ("bundle" in entry) sawBundle = true;
      }
    if (!sawBundle) issue(loc, "expected at least one ScopedVersion with a bundle field");
  },
  "non-dense": (ns, env, loc) => {
    const scoped = ns["scoped-externals"] ?? {};
    const chunkKeys = Object.values(scoped).flatMap((pkgs) =>
      Object.keys(pkgs).filter((k) => k.startsWith("@nf-internal/chunk-"))
    );
    if (chunkKeys.length === 0) issue(loc, "expected @nf-internal/chunk-* pseudo-externals");
    // bundle proven optional here: chunk entries carry only {tag, entries}
    const withBundle = Object.values(scoped).flatMap((pkgs) =>
      Object.entries(pkgs).filter(([k, e]) => k.startsWith("@nf-internal/chunk-") && "bundle" in e)
    );
    if (withBundle.length > 0)
      issue(loc, "chunk pseudo-externals unexpectedly carry a bundle field now — update the shape report");
  },
  "dynamic-init-native": (ns, env, loc) => {
    const maps = env.channels.domImportMaps.data?.maps ?? [];
    if (maps.length !== 2 || !maps.every((m) => m.type === "importmap"))
      issue(loc, `expected exactly 2 importmap tags, saw ${maps.map((m) => m.type).join(",")}`);
  },
  "dynamic-init-shim": (ns, env, loc) => {
    const maps = env.channels.domImportMaps.data?.maps ?? [];
    if (maps.length !== 2 || !maps.every((m) => m.type === "importmap-shim"))
      issue(loc, `expected exactly 2 importmap-shim tags, saw ${maps.map((m) => m.type).join(",")}`);
    const shimMap = env.channels.importShim.data?.map;
    if (!shimMap || Object.keys(shimMap.imports ?? {}).length === 0)
      issue(loc, "expected populated importShim.getImportMap() imports");
    const integrity = Object.values(shimMap?.integrity ?? {});
    if (integrity.length === 0 || !integrity.every((v) => SRI.test(v)))
      issue(loc, "expected SRI hash values in the effective shim map integrity block");
    const remoteIntegrity = Object.entries(ns.remotes ?? {}).filter(
      ([name, r]) => name !== "__NF-HOST__" && Object.keys(r.integrity ?? {}).length > 0
    );
    if (remoteIntegrity.length === 0)
      issue(loc, "expected per-remote integrity maps in the remotes repository");
  },
  "dynamic-override": (ns, env, loc) => {
    const maps = env.channels.domImportMaps.data?.maps ?? [];
    if (maps.length !== 1)
      issue(loc, `override must REPLACE the map tag — expected 1 tag, saw ${maps.length}`);
  },
  "self-fill": (ns, env, loc) => {
    const scope = ns["shared-externals"]?.["__GLOBAL__"] ?? {};
    if (!("@nf-lab/conflict-lib" in scope) || !("@nf-lab/conflict-lib/extra" in scope))
      issue(loc, "expected the secondary entry point as its own external beside the primary");
  },
  "co-declared-share": (ns, env, loc) => {
    // The corpus's only multi-declarer row: same version from two remotes
    // is ONE row (action 'share'), not a negotiation split.
    const versions = sharedVersions(ns, "__GLOBAL__", "@nf-lab/conflict-lib");
    if (versions.length !== 1)
      return issue(loc, `expected ONE co-declared version row, saw ${versions.length}`);
    const row = versions[0];
    if (row.action !== "share")
      issue(loc, `expected action 'share' on the co-declared row, saw '${row.action}'`);
    const remotes = row.remotes ?? [];
    if (remotes.length !== 2)
      issue(loc, `expected TWO declarers in one row, saw ${remotes.length}`);
    const cachedParticipants = remotes.filter((r) => r.cached === true);
    if (cachedParticipants.length !== 1)
      issue(loc, `expected exactly one participant observed cached:true, saw ${cachedParticipants.length}`);
    const fileNames = new Set(remotes.map((r) => r.entries?.["@nf-lab/conflict-lib"]));
    if (fileNames.size !== 1)
      issue(loc, "co-declarers no longer build identical file names — update the shape report");

    // Resolve both same-named files below their own remote scope. `cached`
    // is deliberately NOT used to elect a provider: only the map target says
    // which concrete URL is selected in this capture.
    const candidateUrls = remotes.map((participant) => {
      const scopeUrl = ns.remotes?.[participant.name]?.scopeUrl;
      const file = participant.entries?.["@nf-lab/conflict-lib"];
      if (typeof scopeUrl !== "string" || typeof file !== "string") {
        issue(loc, `cannot resolve candidate URL for ${participant.name} from ${scopeUrl} + ${file}`);
        return { name: participant.name, url: null };
      }
      try {
        const resolvedScope = new URL(scopeUrl, env.page?.url).href;
        return { name: participant.name, url: new URL(file, resolvedScope).href };
      } catch {
        issue(loc, `cannot resolve candidate URL for ${participant.name} from ${scopeUrl} + ${file}`);
        return { name: participant.name, url: null };
      }
    });
    if (new Set(candidateUrls.map(({ url }) => url).filter(Boolean)).size !== 2)
      issue(loc, `expected two distinct candidate URLs, saw ${JSON.stringify(candidateUrls)}`);

    const targets = (env.channels.domImportMaps.data?.maps ?? []).flatMap((m) =>
      Object.entries(m.map?.imports ?? {})
        .filter(([specifier]) => specifier === "@nf-lab/conflict-lib")
        .flatMap(([, url]) => {
          if (typeof url !== "string") {
            issue(loc, `mapped target is not a string: ${JSON.stringify(url)}`);
            return [];
          }
          try {
            return [new URL(url, env.page?.url).href];
          } catch {
            issue(loc, `cannot resolve mapped target ${url}`);
            return [];
          }
        })
    );
    if (targets.length !== 1)
      issue(loc, `expected exactly one selected target URL, saw [${targets.join(",")}]`);
    const selectedCandidates = candidateUrls.filter(
      ({ url }) => url !== null && targets.includes(url)
    );
    if (selectedCandidates.length !== 1)
      issue(loc, `expected exactly one candidate URL selected, saw ${JSON.stringify(selectedCandidates)}`);
  }
};

// --- live-capture evidence (frankenstein-live, report rows 12–16) --------
// Same doctrine as EVIDENCE: these encode the OBSERVED shapes of the
// deployed released-v4 orchestrator generation (participants carry `file`,
// not the lab generation's `entries` map). A redeploy that changes any of
// them fails loudly and points at the shape report.
const forEachParticipant = (ns, fn) => {
  for (const [scope, pkgs] of Object.entries(ns["shared-externals"] ?? {}))
    for (const [pkg, entry] of Object.entries(pkgs))
      for (const version of entry.versions ?? [])
        for (const participant of version.remotes ?? []) fn(participant, pkg, scope);
};
const liveEvidence = (ns, env, loc) => {
  // Row 12: populated shared-chunks bundle lists; mapping-or-exposed empty.
  const chunkRepo = ns["shared-chunks"] ?? {};
  const bundleLists = Object.values(chunkRepo).flatMap((bundles) =>
    Object.entries(bundles).filter(([key]) => key !== "mapping-or-exposed")
  );
  if (bundleLists.length === 0) issue(loc, "expected populated shared-chunks bundle lists");
  for (const [bundle, files] of bundleLists)
    if (!Array.isArray(files) || files.length === 0)
      issue(loc, `shared-chunks bundle ${bundle} has an empty file list`);
  for (const [remote, bundles] of Object.entries(chunkRepo))
    if (!Array.isArray(bundles["mapping-or-exposed"]) || bundles["mapping-or-exposed"].length !== 0)
      issue(loc, `mapping-or-exposed no longer empty for ${remote} — update the shape report`);
  // Row 12 mapping side: every listed chunk appears in the effective map scopes.
  const domMaps = env.channels.domImportMaps.data?.maps ?? [];
  const scopeTargets = domMaps.flatMap((m) =>
    Object.values(m.map?.scopes ?? {}).flatMap((entries) => Object.values(entries))
  );
  const chunkFiles = bundleLists.flatMap(([, files]) => files);
  for (const file of chunkFiles)
    if (!scopeTargets.some((target) => target.endsWith("/" + file)))
      issue(loc, `shared-chunks file ${file} not mapped in any import-map scope`);
  // Rows 13/14: v4 participant shape — `file` string, no `entries` map, and
  // no servedBy/pool under real Angular sharing.
  forEachParticipant(ns, (participant, pkg) => {
    if (typeof participant.file !== "string")
      issue(loc, `participant ${participant.name} of ${pkg} misses the v4 'file' field`);
    for (const absent of ["entries", "servedBy", "pool"])
      if (absent in participant)
        issue(loc, `participant ${participant.name} of ${pkg} unexpectedly carries '${absent}' — update the shape report`);
  });
  // Row 14: real secondary entry points as own top-level package keys;
  // scoped-externals observed EMPTY in this generation.
  const globalScope = ns["shared-externals"]?.["__GLOBAL__"] ?? {};
  for (const pkg of ["@angular/common/http", "rxjs/operators"])
    if (!(pkg in globalScope))
      issue(loc, `expected secondary entry point ${pkg} as its own package key`);
  if (Object.keys(ns["scoped-externals"] ?? {}).length !== 0)
    issue(loc, "scoped-externals no longer empty in the v4 deployment — update the shape report");
  // Row 15: per-remote integrity at scale, SRI values, and an effective shim
  // map whose integrity keys are resolved absolute URLs.
  const remotesWithIntegrity = Object.entries(ns.remotes ?? {}).filter(
    ([, remote]) => Object.keys(remote.integrity ?? {}).length > 0
  );
  if (remotesWithIntegrity.length < 2)
    issue(loc, `expected per-remote integrity on 2+ remotes, saw ${remotesWithIntegrity.length}`);
  for (const [name, remote] of remotesWithIntegrity)
    for (const [file, hash] of Object.entries(remote.integrity))
      if (!SRI.test(hash)) issue(loc, `remotes.${name}.integrity[${file}] is not an SRI hash`);
  const shimMap = env.channels.importShim.data?.map;
  const shimIntegrity = Object.entries(shimMap?.integrity ?? {});
  if (shimIntegrity.length === 0) issue(loc, "expected populated shim map integrity block");
  for (const [url, hash] of shimIntegrity) {
    if (!/^https?:\/\//.test(url)) issue(loc, `shim integrity key not an absolute URL: ${url}`);
    if (!SRI.test(hash)) issue(loc, `shim integrity value not an SRI hash for ${url}`);
  }
  // Row 16: provider derivation — every shared package has exactly one
  // providing participant in this deployment.
  for (const [pkg, entry] of Object.entries(globalScope)) {
    const participants = (entry.versions ?? []).flatMap((v) => v.remotes ?? []);
    if (participants.length !== 1)
      issue(loc, `package ${pkg} has ${participants.length} participants — single-provider assumption broken, update the shape report`);
  }
};
// Registry stability under remote module loading: phases must be identical
// except for capture timestamps.
const livePhaseIdentity = (phases, loc) => {
  const first = phases.get("01-initial");
  const second = phases.get("02-post-interaction");
  if (!first || !second) return;
  const nsOf = (env) => env.channels?.nativeFederationGlobals?.data?.namespace;
  if (JSON.stringify(nsOf(first)) !== JSON.stringify(nsOf(second)))
    issue(loc, "namespace differs between phases — module loading mutated the registry, update the shape report");
  const tagsOf = (env) => (env.channels?.domImportMaps?.data?.maps ?? []).map((m) => m.text);
  if (JSON.stringify(tagsOf(first)) !== JSON.stringify(tagsOf(second)))
    issue(loc, "DOM import-map tags differ between phases");
  const shimOf = (env) => env.channels?.importShim?.data?.map;
  if (JSON.stringify(shimOf(first)) !== JSON.stringify(shimOf(second)))
    issue(loc, "effective shim map differs between phases");
};

// --- manifest ------------------------------------------------------------
let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
} catch (error) {
  console.error(`captures/manifest.json: unreadable (${error.message}) — run scripts/build-lab-manifest.mjs`);
  process.exit(1);
}

if (manifest.schemaVersion !== MANIFEST_SCHEMA)
  issue("manifest.schemaVersion", `expected ${MANIFEST_SCHEMA}, saw ${manifest.schemaVersion}`);
if (!/^\d{8}T\d{6}Z$/.test(manifest.runId ?? ""))
  issue("manifest.runId", `not a runstamp: ${manifest.runId}`);
if (!/^[0-9a-f]{40}$/.test(manifest.source?.playground?.commit ?? ""))
  issue("manifest.source.playground.commit", "not a full commit hash");
if (!manifest.source?.orchestratorCommit)
  issue("manifest.source.orchestratorCommit", "missing");
if (manifest.collector?.sanitization !== "lossless")
  issue("manifest.collector.sanitization", `expected lossless, saw ${manifest.collector?.sanitization}`);
if (manifest.collector?.kind !== "chrome-devtools-mcp")
  issue("manifest.collector.kind", `expected chrome-devtools-mcp, saw ${manifest.collector?.kind}`);
if (JSON.stringify(manifest.expectedScenarios) !== JSON.stringify(EXPECTED_SCENARIOS))
  issue("manifest.expectedScenarios", "does not match the catalog");

// Probe drift: the manifest pins the probe that produced the corpus.
try {
  const probeHash = sha256(readFileSync(PROBE_PATH));
  if (manifest.source?.probe?.sha256 !== probeHash)
    issue(
      "manifest.source.probe.sha256",
      "does not match scripts/lab-capture-dump.js — probe changed since capture; re-capture or rebuild the manifest"
    );
} catch (error) {
  issue("scripts/lab-capture-dump.js", `unreadable (${error.message})`);
}

// --- capture entries -----------------------------------------------------
const manifestScenarios = (manifest.captures ?? []).map((c) => c.scenario);
if (JSON.stringify([...manifestScenarios].sort()) !== JSON.stringify([...EXPECTED_SCENARIOS].sort()))
  issue("manifest.captures", `scenario set mismatch: [${manifestScenarios.join(",")}]`);

const manifestPaths = new Set();
for (const entry of manifest.captures ?? []) {
  const loc = `manifest.captures[${entry.scenario}]`;
  manifestPaths.add(entry.path);
  let buffer;
  try {
    buffer = readFileSync(join(CAPTURES_DIR, entry.path));
  } catch {
    issue(loc, `capture file missing: ${entry.path}`);
    continue;
  }
  if (sha256(buffer) !== entry.sha256) {
    issue(loc, `sha256 mismatch for ${entry.path}`);
    continue;
  }

  let env;
  try {
    env = JSON.parse(buffer.toString("utf8"));
  } catch (error) {
    issue(loc, `unparseable JSON (${error.message})`);
    continue;
  }

  // Envelope structure
  if (env.schemaVersion !== CAPTURE_SCHEMA)
    issue(loc, `schemaVersion ${env.schemaVersion} !== ${CAPTURE_SCHEMA}`);
  if (env.scenario?.scenarioId !== entry.scenario)
    issue(loc, `scenarioId ${env.scenario?.scenarioId} !== ${entry.scenario}`);
  if (env.scenario?.ready !== true)
    issue(loc, `capture taken without resolved readiness (readyError: ${env.scenario?.readyError})`);
  // Fallback-mode keys are live-capture-only: a lab capture carrying them
  // means the runner readiness contract was silently bypassed.
  for (const liveOnly of ["readySource", "phase"])
    if (liveOnly in (env.scenario ?? {}))
      issue(loc, `lab capture carries fallback-mode scenario key '${liveOnly}' — probe ran without __NF_SCENARIO_READY__`);
  if (env.scenario?.orchestratorCommit !== manifest.source?.orchestratorCommit)
    issue(loc, "orchestratorCommit differs from manifest");
  if (env.page?.origin !== manifest.serving?.origin)
    issue(loc, `page.origin ${env.page?.origin} !== serving.origin ${manifest.serving?.origin}`);
  if (env.collector?.sanitization !== "lossless") issue(loc, "collector.sanitization !== lossless");
  if (!Array.isArray(env.collectionErrors) || env.collectionErrors.length > 0)
    issue(loc, `collectionErrors not empty: ${JSON.stringify(env.collectionErrors)}`);
  for (const name of CHANNELS) {
    const channel = env.channels?.[name];
    if (!channel) {
      issue(loc, `channel ${name} missing`);
      continue;
    }
    if (channel.availability !== "available") issue(loc, `channel ${name} not available`);
    if (Number.isNaN(Date.parse(channel.observedAt ?? "")))
      issue(loc, `channel ${name} observedAt not a timestamp`);
  }

  // Per-scenario losslessness evidence
  const ns = env.channels?.nativeFederationGlobals?.data?.namespace;
  if (!ns) {
    issue(loc, "namespace clone missing");
  } else {
    EVIDENCE[entry.scenario]?.(ns, env, loc);
  }
}

// --- live captures (frankenstein-live) -----------------------------------
const LIVE_SCENARIO = "frankenstein-live";
const live = manifest.liveCaptures;
if (live) {
  const lloc = "manifest.liveCaptures";
  if (live.scenarioId !== LIVE_SCENARIO)
    issue(`${lloc}.scenarioId`, `expected ${LIVE_SCENARIO}, saw ${live.scenarioId}`);
  if (live.collector?.kind !== "chrome-devtools-mcp")
    issue(`${lloc}.collector.kind`, `expected chrome-devtools-mcp, saw ${live.collector?.kind}`);
  if (live.collector?.sanitization !== "lossless")
    issue(`${lloc}.collector.sanitization`, "expected lossless");

  // Provenance: sidecar is the source of truth, the manifest embeds it.
  let sidecar = null;
  try {
    sidecar = JSON.parse(readFileSync(join(CAPTURES_DIR, LIVE_SCENARIO, "provenance.json"), "utf8"));
  } catch (error) {
    issue(`captures/${LIVE_SCENARIO}/provenance.json`, `unreadable (${error.message})`);
  }
  if (sidecar && JSON.stringify(sidecar) !== JSON.stringify(live.provenance))
    issue(`${lloc}.provenance`, "differs from the provenance.json sidecar — rebuild the manifest");
  const prov = live.provenance;
  if (
    !prov?.captureUrl ||
    !prov?.captureDate ||
    prov?.deploymentDependent !== true ||
    prov?.regenerableFromCheckouts !== false ||
    !prov?.deployment?.orchestrator?.bestKnown
  )
    issue(
      `${lloc}.provenance`,
      "missing required fields (captureUrl, captureDate, deploymentDependent: true, regenerableFromCheckouts: false, deployment.orchestrator.bestKnown)"
    );
  manifestPaths.add(`${LIVE_SCENARIO}/provenance.json`);

  const phases = new Map();
  for (const entry of live.files ?? []) {
    const loc = `${lloc}[${entry.phase}]`;
    manifestPaths.add(entry.path);
    let buffer;
    try {
      buffer = readFileSync(join(CAPTURES_DIR, entry.path));
    } catch {
      issue(loc, `capture file missing: ${entry.path}`);
      continue;
    }
    if (sha256(buffer) !== entry.sha256) {
      issue(loc, `sha256 mismatch for ${entry.path}`);
      continue;
    }
    let env;
    try {
      env = JSON.parse(buffer.toString("utf8"));
    } catch (error) {
      issue(loc, `unparseable JSON (${error.message})`);
      continue;
    }
    if (env.schemaVersion !== CAPTURE_SCHEMA)
      issue(loc, `schemaVersion ${env.schemaVersion} !== ${CAPTURE_SCHEMA}`);
    if (env.scenario?.scenarioId !== LIVE_SCENARIO)
      issue(loc, `scenarioId ${env.scenario?.scenarioId} !== ${LIVE_SCENARIO}`);
    if (env.scenario?.ready !== true)
      issue(loc, `capture taken without settled page (readyError: ${env.scenario?.readyError})`);
    if (env.scenario?.readySource !== "page-settled")
      issue(loc, `expected readySource page-settled, saw ${env.scenario?.readySource}`);
    if (env.scenario?.orchestratorCommit !== null)
      issue(loc, "live capture must not stamp a lab orchestratorCommit");
    if (env.scenario?.phase !== entry.phase)
      issue(loc, `scenario.phase ${env.scenario?.phase} !== manifest phase ${entry.phase}`);
    if (env.page?.url !== prov?.captureUrl)
      issue(loc, `page.url ${env.page?.url} !== provenance.captureUrl ${prov?.captureUrl}`);
    if (env.collector?.sanitization !== "lossless") issue(loc, "collector.sanitization !== lossless");
    if (!Array.isArray(env.collectionErrors) || env.collectionErrors.length > 0)
      issue(loc, `collectionErrors not empty: ${JSON.stringify(env.collectionErrors)}`);
    for (const name of CHANNELS) {
      const channel = env.channels?.[name];
      if (!channel) {
        issue(loc, `channel ${name} missing`);
        continue;
      }
      if (channel.availability !== "available") issue(loc, `channel ${name} not available`);
      if (Number.isNaN(Date.parse(channel.observedAt ?? "")))
        issue(loc, `channel ${name} observedAt not a timestamp`);
    }
    phases.set(entry.phase, env);

    const ns = env.channels?.nativeFederationGlobals?.data?.namespace;
    if (!ns) issue(loc, "namespace clone missing");
    else liveEvidence(ns, env, loc);
  }
  if (!phases.has("01-initial")) issue(lloc, "phase 01-initial missing");
  livePhaseIdentity(phases, lloc);
}

// --- stray files: everything under captures/ must be accounted for ------
const onDisk = readdirSync(CAPTURES_DIR, { recursive: true, encoding: "utf8" })
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replaceAll("\\", "/"));
for (const file of onDisk) {
  if (file === "manifest.json") continue;
  if (file.startsWith("frankenstein/")) continue; // research-corpus subset, own provenance
  if (!manifestPaths.has(file)) issue(`captures/${file}`, "not listed in the manifest (stray capture)");
}

if (issues.length > 0) {
  for (const line of issues) console.error(`INVALID ${line}`);
  console.error(`\n${issues.length} issue(s).`);
  process.exit(1);
}
console.log(
  `corpus valid: ${manifest.captures.length} captures` +
    (live ? ` + ${live.files.length} live phases` : "") +
    `, runId ${manifest.runId}, probe ${manifest.source.probe.sha256.slice(0, 12)}…`
);
