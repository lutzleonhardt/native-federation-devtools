/**
 * Test-only loader for the checked-in lossless capture corpus (captures/,
 * envelope `lab-lossless-capture/1` — see captures/README.md). The corpus
 * is the shape ground truth for the collector schemas: specs seed fixture
 * pages with a capture's raw `__NATIVE_FEDERATION__` namespace and assert
 * the probe→mapper pipeline against the same capture's data.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CAPTURES_ROOT = new URL('../../../../captures/', import.meta.url);

const RUNSTAMP_FILE = /^\d{8}T\d{6}Z.*\.json$/;

/**
 * Loads a scenario capture. Without `fileName`, picks the newest runstamp
 * file of the scenario directory (the corpus keeps exactly one per lab
 * scenario; live captures carry multiple phases — pass the phase file
 * explicitly there).
 */
export function loadLabCapture(scenario: string, fileName?: string): Record<string, any> {
  const directory = fileURLToPath(new URL(`${scenario}/`, CAPTURES_ROOT));
  const chosen =
    fileName ??
    readdirSync(directory)
      .filter((file) => RUNSTAMP_FILE.test(file))
      .sort()
      .at(-1);
  if (chosen === undefined) {
    throw new Error(`no runstamp capture found under captures/${scenario}/`);
  }
  return JSON.parse(readFileSync(`${directory}${chosen}`, 'utf8'));
}

/** The raw in-page `__NATIVE_FEDERATION__` namespace of a capture. */
export function labNamespace(capture: Record<string, any>): Record<string, unknown> {
  return capture['channels'].nativeFederationGlobals.data.namespace;
}
