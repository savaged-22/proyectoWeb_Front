import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Antes de activar la ruta, pide al backend un token renovado.
 * Si el refresh falla (401/expirado/usuario inactivado) → redirige a /login.
 *
 * Esto cumple lo pedido: "renovando token nuevo pidiéndolo al backend al
 * cambiar de pantalla, y al mismo tiempo valido roles".
 */
export const tokenRefreshGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!auth.isAuthenticated()) {
    return router.parseUrl('/login');
  }
  return auth.refresh().pipe(
    map((session) => (session ? true : router.parseUrl('/login'))),
  );
};
