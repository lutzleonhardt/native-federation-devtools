import { TestBed } from '@angular/core/testing';
import { FIXTURES, PRIMARY_FIXTURE_ID } from 'devtools-bridge';

import { FixturePicker, fixtureUrl } from './fixture-picker';

describe('fixtureUrl', () => {
  it('swaps the fixture param and keeps path, theme, and hash route', () => {
    const url = fixtureUrl(
      { pathname: '/', search: '?fixture=clean-skip&theme=dark', hash: '#/packages?select=x' },
      'strict-split',
    );
    expect(url).toBe('/?fixture=strict-split&theme=dark#/packages?select=x');
  });

  it('adds the fixture param when none is set', () => {
    expect(fixtureUrl({ pathname: '/', search: '', hash: '' }, 'clean-skip')).toBe(
      '/?fixture=clean-skip',
    );
  });
});

describe('FixturePicker (dev shell)', () => {
  function createPicker() {
    const fixture = TestBed.createComponent(FixturePicker);
    fixture.detectChanges();
    return fixture;
  }

  it('lists every fixture id, grouped into captured and synthetic', () => {
    const el = createPicker().nativeElement as HTMLElement;
    const options = Array.from(el.querySelectorAll('option')).map((option) => option.value);

    expect(options).toHaveLength(Object.keys(FIXTURES).length);
    expect(new Set(options)).toEqual(new Set(Object.keys(FIXTURES)));
    const groups = Array.from(el.querySelectorAll('optgroup')).map((group) => group.label);
    expect(groups).toEqual(['captured', 'synthetic']);
  });

  it('preselects the primary fixture when no query param is set', () => {
    const el = createPicker().nativeElement as HTMLElement;
    // [selected] binds the DOM property, not the attribute — query by property.
    const selected = Array.from(el.querySelectorAll('option')).find((option) => option.selected);
    expect(selected?.value).toBe(PRIMARY_FIXTURE_ID);
  });

  it('navigates to the swapped fixture URL on change', () => {
    const fixture = createPicker();
    const navigate = vi
      .spyOn(fixture.componentInstance as unknown as { navigate(url: string): void }, 'navigate')
      .mockImplementation(() => {});

    const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(
      '.picker-select',
    )!;
    select.value = 'clean-skip';
    select.dispatchEvent(new Event('change'));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][0]).toContain('fixture=clean-skip');
  });
});
