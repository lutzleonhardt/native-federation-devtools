import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ExternalVersionV1, NF_HOST } from 'devtools-bridge';

import { MissingEvidence } from '../shared/honest-state/missing-evidence';
import { NotDetected } from '../shared/honest-state/not-detected';
import { StateBadge } from '../shared/honest-state/state-badge';
import { runtimeViewState } from '../shared/runtime-view-state';
import { SnapshotStore } from '../shared/snapshot-store';

/** One participant's declared version requirement, as recorded by the runtime. */
interface ParticipantEntry {
  name: string;
  isHost: boolean;
  requiredVersion: string;
  strictVersion: boolean;
}

/**
 * One rendered entry — identity is the (scope, package, version tag) triple.
 * A package with more than one tag renders one row per tag, all marked
 * ambiguous — the passive capture cannot show a resolved winner.
 */
interface VersionRow {
  scope: string;
  packageName: string;
  /** True on every row of a package that carries multiple version tags. */
  ambiguous: boolean;
  tag: string;
  action: string;
  /** null: the repository names no single provider (undemonstrated shape). */
  provider: { name: string; isHost: boolean } | null;
  participants: ParticipantEntry[];
}

/**
 * The repository names the provider only indirectly: `host: true` marks a
 * host-provided version; otherwise a sole participant is the provider. More
 * than one non-host participant is undemonstrated — return null and let the
 * template render the participants without inventing a winner.
 */
function providerOf(version: ExternalVersionV1): VersionRow['provider'] {
  if (version.host) {
    return { name: NF_HOST, isHost: true };
  }
  if (version.remotes.length === 1) {
    return { name: version.remotes[0].name, isHost: false };
  }
  return null;
}

@Component({
  selector: 'nf-shared-dependencies',
  imports: [MissingEvidence, NotDetected, StateBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shared-dependencies.html',
  styleUrl: './shared-dependencies.css',
})
export class SharedDependencies {
  private readonly store = inject(SnapshotStore);

  protected readonly vm = computed(() => runtimeViewState(this.store.state()));

  protected readonly rows = computed<VersionRow[]>(() => {
    const vm = this.vm();
    if (vm.kind !== 'ready') {
      return [];
    }
    return Object.entries(vm.runtime.sharedExternals).flatMap(([scope, packages]) =>
      Object.entries(packages).flatMap(([packageName, external]) =>
        external.versions.map(
          (version): VersionRow => ({
            scope,
            packageName,
            ambiguous: external.versions.length > 1,
            tag: version.tag,
            action: version.action,
            provider: providerOf(version),
            participants: version.remotes.map((remote) => ({
              name: remote.name,
              isHost: remote.name === NF_HOST,
              requiredVersion: remote.requiredVersion,
              strictVersion: remote.strictVersion,
            })),
          }),
        ),
      ),
    );
  });

  protected refresh(): void {
    void this.store.refresh();
  }
}
