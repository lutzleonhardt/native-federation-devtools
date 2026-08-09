import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SnapshotExportService } from './shared/snapshot-export.service';

@Component({
  selector: 'nf-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly exporter = inject(SnapshotExportService);
}
