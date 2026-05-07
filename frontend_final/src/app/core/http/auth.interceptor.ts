import { HttpInterceptorFn } from '@angular/common/http';
import { getSession } from '../auth/session';

/**
 * Inyecta el header Authorization si hay sesión activa.
 * Funciona también en SSR: getSession() devuelve null fuera del browser.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = getSession();
  if (session?.token) {
    return next(
      req.clone({ setHeaders: { Authorization: `Bearer ${session.token}` } })
    );
  }
  return next(req);
};
