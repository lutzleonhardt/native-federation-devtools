import { TestBed } from '@angular/core/testing';

import { KvItem, KvList } from './kv-list';

function createList(items: KvItem[]): HTMLElement {
  const fixture = TestBed.createComponent(KvList);
  fixture.componentRef.setInput('items', items);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

// T9-AC-05: kv-list renders labels and values with mono/link rendering.
describe('KvList (view kit)', () => {
  it('renders label/value pairs in order', () => {
    const el = createList([
      { label: 'scope', value: '__GLOBAL__' },
      { label: 'entries', value: '12' },
    ]);

    const labels = Array.from(el.querySelectorAll('.kv-label')).map((n) => n.textContent);
    const values = Array.from(el.querySelectorAll('.kv-value')).map((n) => n.textContent?.trim());
    expect(labels).toEqual(['scope', 'entries']);
    expect(values).toEqual(['__GLOBAL__', '12']);
  });

  it('renders monospace values via the identifier face', () => {
    const el = createList([
      { label: 'file', value: 'chunk-ABC.js', mono: true },
      { label: 'count', value: '3' },
    ]);

    const values = Array.from(el.querySelectorAll('.kv-value > *'));
    expect(values[0].classList.contains('kv-mono')).toBe(true);
    expect(values[1].classList.contains('kv-mono')).toBe(false);
  });

  it('renders link values as external links', () => {
    const el = createList([
      { label: 'scope url', value: 'https://host.example/', href: 'https://host.example/' },
    ]);

    const link = el.querySelector<HTMLAnchorElement>('.kv-link')!;
    expect(link.textContent).toBe('https://host.example/');
    expect(link.getAttribute('href')).toBe('https://host.example/');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
