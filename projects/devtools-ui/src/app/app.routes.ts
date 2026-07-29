import { Routes } from '@angular/router';

import { ImportMap } from './views/import-map';
import { RemotesExposes } from './views/remotes-exposes';
import { SharedDependencies } from './views/shared-dependencies';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'remotes' },
  { path: 'remotes', component: RemotesExposes },
  { path: 'shared', component: SharedDependencies },
  { path: 'import-map', component: ImportMap },
];
