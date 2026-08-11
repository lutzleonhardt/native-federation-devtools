import { TestBed } from '@angular/core/testing';
import { FIXTURES, PRIMARY_FIXTURE_ID, SNAPSHOT_PROVIDER, SnapshotProvider, SnapshotV1 } from 'devtools-bridge';

import { SnapshotExportService } from './snapshot-export.service';
import { serializeSnapshot } from './snapshot-export';

class StubSnapshotProvider implements SnapshotProvider {
  constructor(private readonly snapshot: SnapshotV1 | Error) {}

  captureSnapshot(): Promise<SnapshotV1> {
    return this.snapshot instanceof Error
      ? Promise.reject(this.snapshot)
      : Promise.resolve(structuredClone(this.snapshot));
  }
}

/** Flush the store's pending capture promise. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

function setup(snapshot: SnapshotV1 | Error) {
  TestBed.configureTestingModule({
    providers: [{ provide: SNAPSHOT_PROVIDER, useValue: new StubSnapshotProvider(snapshot) }],
  });
  return TestBed.inject(SnapshotExportService);
}

/** jsdom implements neither createObjectURL nor revokeObjectURL — install spies. */
function spyOnDownload() {
  const createdBlobs: Blob[] = [];
  const clickedAnchors: HTMLAnchorElement[] = [];
  const revokedUrls: string[] = [];

  URL.createObjectURL = vi.fn((blob: Blob) => {
    createdBlobs.push(blob);
    return 'blob:mock-object-url';
  }) as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn((url: string) => {
    revokedUrls.push(url);
  }) as typeof URL.revokeObjectURL;
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clickedAnchors.push(this);
  });

  return { createdBlobs, clickedAnchors, revokedUrls };
}

function blobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe('SnapshotExportService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // T6-AC-01: the downloaded bytes are the verbatim serialization of the
  // in-memory snapshot, under the host+timestamp filename.
  it('downloads the current snapshot as JSON with the derived filename', async () => {
    const download = spyOnDownload();
    const service = setup(FIXTURES[PRIMARY_FIXTURE_ID]);
    await settle();
    expect(service.canExport()).toBe(true);

    service.exportCurrent();

    expect(download.createdBlobs).toHaveLength(1);
    expect(download.createdBlobs[0].type).toBe('application/json');
    const exported = await blobText(download.createdBlobs[0]);
    expect(exported).toBe(serializeSnapshot(FIXTURES[PRIMARY_FIXTURE_ID]));
    expect(JSON.parse(exported)).toEqual(FIXTURES[PRIMARY_FIXTURE_ID]);

    expect(download.clickedAnchors).toHaveLength(1);
    expect(download.clickedAnchors[0].download).toBe(
      'nf-snapshot-lutzleonhardt.de-20260811T115625Z.json',
    );
    expect(download.clickedAnchors[0].href).toBe('blob:mock-object-url');
    expect(download.revokedUrls).toEqual(['blob:mock-object-url']);
  });

  it('does nothing while no snapshot is captured', async () => {
    const download = spyOnDownload();
    const service = setup(new Error('capture failed'));
    await settle();

    expect(service.canExport()).toBe(false);
    service.exportCurrent();

    expect(download.createdBlobs).toHaveLength(0);
    expect(download.clickedAnchors).toHaveLength(0);
  });
});
