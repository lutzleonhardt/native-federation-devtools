#!/usr/bin/env node
/**
 * Build the run manifest for the lab lossless capture corpus
 * (`captures/manifest.json`), following the research-corpus pattern
 * (frankenstein `manifest.json`: schema id, run id, source commits,
 * collector block, per-file sha256).
 *
 * The manifest is what makes the corpus checkable (XC-01): the validator
 * (`scripts/validate-lab-corpus.mjs`) verifies hashes, schema ids, and the
 * expected scenario set against this file. Re-running the builder over an
 * unchanged capture set is deterministic except for `createdAt`.
 *
 * Usage: node scripts/build-lab-manifest.mjs [--playground <path>]
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CAPTURES_DIR = join(REPO_ROOT, "captures");
const MANIFEST_PATH = join(CAPTURES_DIR, "manifest.json");
const PROBE_PATH = join(REPO_ROOT, "scripts", "lab-capture-dump.js");

// Catalog order from the playground scenario corpus (Task 1).
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
  "self-fill"
];

const args = process.argv.slice(2);
const playgroundFlag = args.indexOf("--playground");
const playgroundDir =
  playgroundFlag !== -1 && args[playgroundFlag + 1]
    ? resolve(args[playgroundFlag + 1])
    : resolve(REPO_ROOT, "..", "nf", "playground");

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

const git = (repoDir, ...gitArgs) =>
  execFileSync("git", ["-C", repoDir, ...gitArgs], { encoding: "utf8" }).trim();

const failures = [];

const captures = [];
const orchestratorCommits = new Set();
for (const scenario of EXPECTED_SCENARIOS) {
  const dir = join(CAPTURES_DIR, scenario);
  let files;
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  } catch {
    failures.push(`missing capture directory: captures/${scenario}/`);
    continue;
  }
  if (files.length === 0) {
    failures.push(`no capture file in captures/${scenario}/`);
    continue;
  }
  // Newest runstamp is the corpus member; older ones may exist locally
  // but are not part of the manifest.
  const file = files[files.length - 1];
  const buffer = readFileSync(join(dir, file));
  let envelope;
  try {
    envelope = JSON.parse(buffer.toString("utf8"));
  } catch (error) {
    failures.push(`captures/${scenario}/${file}: unparseable JSON (${error.message})`);
    continue;
  }
  if (envelope?.scenario?.scenarioId !== scenario) {
    failures.push(
      `captures/${scenario}/${file}: scenario.scenarioId is ${JSON.stringify(
        envelope?.scenario?.scenarioId
      )}, expected "${scenario}"`
    );
  }
  if (envelope?.scenario?.orchestratorCommit) {
    orchestratorCommits.add(envelope.scenario.orchestratorCommit);
  }
  captures.push({
    scenario,
    path: `${scenario}/${file}`,
    runstamp: file.replace(/\.json$/, ""),
    sha256: sha256(buffer)
  });
}

if (orchestratorCommits.size !== 1) {
  failures.push(
    `expected exactly one orchestrator commit across captures, saw: ${[...orchestratorCommits].join(", ") || "none"}`
  );
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`manifest: ${failure}`);
  process.exit(1);
}

const runId = captures.map((c) => c.runstamp).sort().at(-1);

const manifest = {
  schemaVersion: "lab-lossless-corpus/1",
  runId,
  createdAt: new Date().toISOString(),
  source: {
    playground: {
      repository: "nf/playground",
      branch: git(playgroundDir, "branch", "--show-current"),
      commit: git(playgroundDir, "rev-parse", "HEAD"),
      runner: "run-scenario.mjs"
    },
    orchestratorCommit: [...orchestratorCommits][0],
    probe: {
      file: "scripts/lab-capture-dump.js",
      schemaVersion: "lab-lossless-capture/1",
      sha256: sha256(readFileSync(PROBE_PATH))
    }
  },
  collector: {
    kind: "chrome-devtools-mcp",
    interface: "generic-devtools",
    webMcpUsed: false,
    sanitization: "lossless"
  },
  serving: {
    mode: "run-scenario-single-origin",
    origin: "http://localhost:4300",
    cacheControl: "no-store"
  },
  expectedScenarios: EXPECTED_SCENARIOS,
  captures
};

writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
console.log(`wrote captures/manifest.json (runId ${runId}, ${captures.length} captures)`);
