import { SnapshotV1 } from '../snapshot-v1';
import { frankensteinProductionFixture } from './frankenstein-production.fixture';
import { syntheticCollisionFixture } from './synthetic-collision.fixture';
import { syntheticEmptyPageFixture } from './synthetic-empty-page.fixture';
import { syntheticMissingChannelFixture } from './synthetic-missing-channel.fixture';
import { syntheticMultiVersionFixture } from './synthetic-multi-version.fixture';
import { syntheticNotRecognizedFixture } from './synthetic-not-recognized.fixture';

/**
 * All checked-in fixtures. Ids equal the fixture file basenames
 * (`<id>.fixture.ts`) — the guards enforce this and scan every entry.
 */
export const FIXTURES = {
  'frankenstein-production': frankensteinProductionFixture,
  'synthetic-collision': syntheticCollisionFixture,
  'synthetic-missing-channel': syntheticMissingChannelFixture,
  'synthetic-multi-version': syntheticMultiVersionFixture,
  'synthetic-not-recognized': syntheticNotRecognizedFixture,
  'synthetic-empty-page': syntheticEmptyPageFixture,
} satisfies Record<string, SnapshotV1>;

export type FixtureId = keyof typeof FIXTURES;

export const PRIMARY_FIXTURE_ID: FixtureId = 'frankenstein-production';
