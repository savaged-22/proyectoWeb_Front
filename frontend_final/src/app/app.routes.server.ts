import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas con parámetros dinámicos: render on-demand
  { path: 'app/clients/:id', renderMode: RenderMode.Server },

  // Rutas autenticadas que dependen de localStorage:
  // las renderizamos en el cliente para evitar mismatch SSR/CSR
  { path: 'app',                renderMode: RenderMode.Client },
  { path: 'app/dashboard',      renderMode: RenderMode.Client },
  { path: 'app/monitoring',     renderMode: RenderMode.Client },
  { path: 'app/users',          renderMode: RenderMode.Client },
  { path: 'app/permissions',    renderMode: RenderMode.Client },
  { path: 'app/processes',      renderMode: RenderMode.Client },
  { path: 'app/processes/new',  renderMode: RenderMode.Client },
  { path: 'app/clients',        renderMode: RenderMode.Client },
  { path: 'app/portfolio',      renderMode: RenderMode.Client },

  // Resto: prerender estático (landing, login, redirects)
  { path: '**', renderMode: RenderMode.Prerender },
];
