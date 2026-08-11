import { FIXTURES, SnapshotV1 } from 'devtools-bridge';

import { exportFilename, serializeSnapshot } from './snapshot-export';

describe('serializeSnapshot', () => {
  // T6-AC-01: the export is the DTO — parse-and-deep-equal over every
  // registered fixture, so availability variants and errors are all covered.
  it.each(Object.entries(FIXTURES))('%s round-trips losslessly', (_id, fixture) => {
    expect(JSON.parse(serializeSnapshot(fixture))).toEqual(fixture);
  });

  // T6-AC-01: the fields the acceptance criterion names survive explicitly.
  it('keeps schemaVersion, availability states, and errors visible', () => {
    const hostile = FIXTURES['synthetic-hostile'];
    const parsed = JSON.parse(serializeSnapshot(hostile)) as SnapshotV1;
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.channels).toEqual(hostile.channels);
    expect(parsed.errors).toEqual(hostile.errors);
    expect(parsed.errors.length).toBeGreaterThan(0);

    const partial = FIXTURES['synthetic-missing-channel'];
    const parsedPartial = JSON.parse(serializeSnapshot(partial)) as SnapshotV1;
    expect(parsedPartial.channels.nativeFederationGlobals.state).toBe('unavailable');
    expect(parsedPartial.runtime).toBeNull();
  });
});

describe('exportFilename', () => {
  it('names the file from the sanitized page host and the capture time', () => {
    expect(exportFilename(FIXTURES['frankenstein-live'])).toBe(
      'nf-snapshot-lutzleonhardt.de-20260811T115625Z.json',
    );
    expect(exportFilename(FIXTURES['synthetic-hostile'])).toBe(
      'nf-snapshot-synthetic-fixture.example-20260809T000000Z.json',
    );
  });

  it('falls back to a safe slug when the page URL does not parse', () => {
    const variant = structuredClone(FIXTURES['synthetic-empty-page']);
    variant.capture.capturedAt = '2026-08-09T12:00:00.000Z';

    variant.capture.pageUrl = 'Not a URL';
    expect(exportFilename(variant)).toBe('nf-snapshot-not-a-url-20260809T120000Z.json');

    // Parses, but has no hostname (about:blank) — never an empty slug.
    variant.capture.pageUrl = 'about:blank';
    expect(exportFilename(variant)).toBe('nf-snapshot-unknown-host-20260809T120000Z.json');
  });
});
