/**
 * Sesión guardada en localStorage tras login/refresh.
 *
 * tipoUsuario es el nivel global de la app:
 *   SUPERADMIN    -> dueño de la aplicación, ve todas las empresas
 *   ADMIN_EMPRESA -> admin de una empresa cliente
 *   USUARIO       -> usuario regular
 *
 * rol es el rol "legacy" dentro del pool, derivado del tipo o del rol_pool.
 */
export type TipoUsuario = 'SUPERADMIN' | 'ADMIN_EMPRESA' | 'USUARIO';

export interface UserSession {
  token: string;
  expiresInMs?: number;
  usuarioId: string;
  empresaId: string;
  empresaNombre: string;
  poolId: string;
  email: string;
  rol: 'PROPIETARIO' | 'COLABORADOR' | 'ADMIN_EMPRESA' | 'SUPERADMIN';
  /** Nombre real del rol_pool asignado (ej. "SuperAdmin", "Auditor"). */
  rolPoolNombre?: string;
  tipoUsuario: TipoUsuario;
  esSuperadmin: boolean;
  esAdminEmpresa: boolean;
  /** True si el usuario pertenece a la empresa interna de Lulo (consola owner). */
  empresaEsLulo: boolean;
  /** Códigos de permiso efectivos (PROCESO_VER, ROL_CREAR, …). */
  permisos: string[];
}

const STORAGE_KEY = 'lulo.session';

const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export function saveSession(session: UserSession): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  // Legacy keys (compatibilidad con código viejo)
  localStorage.setItem('token', session.token);
  let legacyRole = 'USER';
  if (session.esSuperadmin) legacyRole = 'SUPERADMIN';
  else if (session.esAdminEmpresa || session.rol === 'PROPIETARIO') legacyRole = 'ADMIN';
  localStorage.setItem('role', legacyRole);
}

export function getSession(): UserSession | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('role');
}
