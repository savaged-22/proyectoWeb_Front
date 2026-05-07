// Zone.js (variante node) requerida cuando el server hace prerender / SSR
// con `provideZoneChangeDetection`.
import 'zone.js/node';

import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(App, config, context);

export default bootstrap;
