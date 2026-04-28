import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  
  // Verificamos de forma segura si estamos en el navegador (para evitar errores con SSR)
  if (typeof window !== 'undefined' && localStorage) {
    const token = localStorage.getItem('token');
    
    // Si existe el token, permitimos el paso
    if (token) {
      return true;
    }
  }
  
  // Si no hay token o estamos en el servidor, redirigimos al login
  return router.parseUrl('/login');
};
