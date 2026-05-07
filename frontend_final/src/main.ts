// Zone.js: necesario para que provideZoneChangeDetection (en app.config.ts)
// dispare change detection automático tras callbacks asíncronos como HttpClient.
import 'zone.js';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
