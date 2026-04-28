import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  
  // Verificamos de forma segura si estamos en el navegador
  if (typeof window !== 'undefined' && localStorage) {
    const role = localStorage.getItem('role');
    
    // Si el rol es estrictamente ADMIN, permitimos el acceso
    if (role === 'ADMIN') {
      return true;
    }
  }
  
  // Si no es ADMIN, lo devolvemos al dashboard de usuario normal
  return router.parseUrl('/user-dashboard');
};
