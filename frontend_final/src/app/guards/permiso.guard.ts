import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de ruta por permiso. Si el usuario no tiene ninguno de los permisos
 * indicados, lo redirige al dashboard.
 * Uso: canActivate: [permisoGuard('PROCESO_VER')]
 */
export const permisoGuard =
  (...codigos: string[]): CanActivateFn =>
  () => {
    const router = inject(Router);
    const auth = inject(AuthService);
    return auth.canAny(...codigos) ? true : router.parseUrl('/app/dashboard');
  };
