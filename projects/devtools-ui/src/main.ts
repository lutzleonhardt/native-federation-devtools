import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// The extension's devtools bootstrap passes the DevTools theme as a query
// parameter on the panel URL. Applied before bootstrap so the first paint
// uses the right palette; without the parameter (ng serve in a plain
// browser) no data-theme is set and the stylesheet falls back to
// prefers-color-scheme.
const theme = new URLSearchParams(location.search).get('theme');
if (theme === 'dark' || theme === 'light') {
  document.documentElement.dataset['theme'] = theme;
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
