import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FIXTURES, PRIMARY_FIXTURE_ID, fixtureIdFromQuery } from 'devtools-bridge';

/**
 * Swap the `fixture` query param, keeping path, remaining params (theme)
 * and the hash route (current tab + `select` payload) intact.
 */
export function fixtureUrl(
  location: { pathname: string; search: string; hash: string },
  fixtureId: string,
): string {
  const params = new URLSearchParams(location.search);
  params.set('fixture', fixtureId);
  return `${location.pathname}?${params.toString()}${location.hash}`;
}

/**
 * Dev-only fixture switcher in the shell status line — one hop to any
 * `?fixture=<id>` preview instead of typing ids by hand. Mounted via
 * `environment.shellExtras` (`ng serve` only); the extension environment
 * ships an empty list, so the component and its FIXTURES import never
 * reach the packaged bundle. Switching performs a full reload — the
 * snapshot provider reads the fixture id at module evaluation time.
 */
@Component({
  selector: 'nf-fixture-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fixture-picker.html',
  styleUrl: './fixture-picker.css',
})
export class FixturePicker {
  private static readonly ids = Object.keys(FIXTURES);

  protected readonly capturedIds = FixturePicker.ids.filter(
    (id) => !id.startsWith('synthetic-'),
  );
  protected readonly syntheticIds = FixturePicker.ids.filter((id) =>
    id.startsWith('synthetic-'),
  );
  protected readonly current = fixtureIdFromQuery(location.search) ?? PRIMARY_FIXTURE_ID;

  protected onPick(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    if (id !== this.current) {
      this.navigate(fixtureUrl(location, id));
    }
  }

  /** Navigation seam — test doubles replace it (jsdom cannot navigate). */
  protected navigate(url: string): void {
    location.assign(url);
  }
}
