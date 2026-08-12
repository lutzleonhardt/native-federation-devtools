import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MasterDetail } from './master-detail';

// Test scaffolding only — real consumers keep templates in separate files.
@Component({
  imports: [MasterDetail],
  template: `
    <nf-master-detail>
      <nav nfMaster class="the-list">list</nav>
      <section nfDetail class="the-detail">detail</section>
    </nf-master-detail>
  `,
})
class MasterDetailHost {}

// T9-AC-05: the split layout renders its slots.
describe('MasterDetail (view kit)', () => {
  it('projects master and detail content into their panes', () => {
    const fixture = TestBed.createComponent(MasterDetailHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.master .the-list')?.textContent).toBe('list');
    expect(el.querySelector('.detail .the-detail')?.textContent).toBe('detail');
    expect(el.querySelector('.master .the-detail')).toBeNull();
  });
});
