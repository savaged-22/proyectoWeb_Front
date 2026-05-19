/**
 * Modelo de la sesión guardada en localStorage tras hacer login.
 */
export interface UserSession {
  token: string;
  usuarioId: string;
  empresaId: string;
  empresaNombre: string;
  poolId: string;
  email: string;
  rol: 'PROPIETARIO' | 'COLABORADOR';
  /** Códigos de permiso efectivos del usuario en su pool (PROCESO_VER, ROL_CREAR, …). */
  permisos: string[];
}

const STORAGE_KEY = 'lulo.session';

const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export function saveSession(session: UserSession): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  // legacy keys for compatibilidad con guards y código pre-refactor
  localStorage.setItem('token', session.token);
  localStorage.setItem('role', session.rol === 'PROPIETARIO' ? 'ADMIN' : 'USER');
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
