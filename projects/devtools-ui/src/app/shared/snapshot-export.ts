// Imported type-only on purpose: the export privacy guard
// (guards/export-privacy.spec.ts) runs this file in the node vitest suite,
// where the `devtools-bridge` path mapping resolves via a config alias.
import type { SnapshotV1 } from 'devtools-bridge';

/**
 * The export IS the DTO: a verbatim JSON serialization of `SnapshotV1`,
 * including availability states and collection errors — gaps stay visible in
 * the exported file. No sanitization happens here; privacy holds structurally
 * at the DTO level and is enforced by guards/export-privacy.spec.ts.
 */
export function serializeSnapshot(snapshot: SnapshotV1): string {
  return JSON.stringify(snapshot, null, 2);
}

/**
 * `nf-snapshot-<host>-<timestamp>.json` from the sanitized page host and the
 * capture time (not the download time — the file names the capture).
 */
export function exportFilename(snapshot: SnapshotV1): string {
  const host = hostSlug(snapshot.capture.pageUrl);
  const timestamp = timestampSlug(snapshot.capture.capturedAt);
  return `nf-snapshot-${host}-${timestamp}.json`;
}

function hostSlug(pageUrl: string): string {
  let host: string;
  try {
    host = new URL(pageUrl).hostname;
  } catch {
    host = pageUrl;
  }
  const slug = host
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
  return slug === '' ? 'unknown-host' : slug;
}

/** '2026-07-24T13:50:22.812Z' → '20260724T135022Z' (filesystem-safe). */
function timestampSlug(capturedAt: string): string {
  return capturedAt.replace(/\.\d+/, '').replace(/[-:]/g, '');
}
