import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  UserSession,
  TipoUsuario,
  saveSession,
  getSession,
  clearSession,
} from '../core/auth/session';

interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  login(credentials: LoginRequest): Observable<UserSession> {
    const payload: LoginRequest = {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    };
    return this.http
      .post<any>(`${this.apiUrl}/login`, payload)
      .pipe(tap((res) => saveSession(this.toSession(res))));
  }

  /**
   * Renueva el token llamando al backend. El backend recalcula permisos/roles
   * desde DB y emite un JWT nuevo. Si falla → limpia sesión.
   */
  refresh(): Observable<UserSession | null> {
    return this.http.post<any>(`${this.apiUrl}/refresh`, {}).pipe(
      tap((res) => saveSession(this.toSession(res))),
      catchError(() => {
        clearSession();
        return of(null);
      }),
    );
  }

  logout(): void {
    clearSession();
  }

  getSession(): UserSession | null {
    return getSession();
  }

  isAuthenticated(): boolean {
    return !!getSession()?.token;
  }

  isSuperadmin(): boolean {
    return !!getSession()?.esSuperadmin;
  }

  isAdminEmpresa(): boolean {
    return !!getSession()?.esAdminEmpresa;
  }

  /** Propietario o ADMIN_EMPRESA o SUPERADMIN. */
  isPropietario(): boolean {
    const s = getSession();
    if (!s) return false;
    return s.esSuperadmin || s.esAdminEmpresa || s.rol === 'PROPIETARIO';
  }

  tipoUsuario(): TipoUsuario | null {
    return getSession()?.tipoUsuario ?? null;
  }

  /**
   * Nombre a mostrar en header: nombre de empresa, o "Dueño App" si SUPERADMIN.
   */
  displayEmpresaName(): string {
    const s = getSession();
    if (!s) return '';
    // Cualquier usuario interno de Lulo ve "Lulo" como marca de empresa.
    if (s.esSuperadmin || s.empresaEsLulo) return 'Lulo';
    return s.empresaNombre || '';
  }

  /** ¿El usuario tiene el permiso indicado? Propietario/Admin/Superadmin siempre pueden. */
  can(codigo: string): boolean {
    const session = getSession();
    if (!session) return false;
    if (session.esSuperadmin || session.esAdminEmpresa) return true;
    if (session.rol === 'PROPIETARIO') return true;
    return session.permisos?.includes(codigo) ?? false;
  }

  canAny(...codigos: string[]): boolean {
    return codigos.some((c) => this.can(c));
  }

  private toSession(raw: any): UserSession {
    const tipo: TipoUsuario = raw.tipoUsuario ?? 'USUARIO';
    return {
      token: raw.token,
      expiresInMs: raw.expiresInMs,
      usuarioId: raw.usuarioId,
      empresaId: raw.empresaId,
      empresaNombre: raw.empresaNombre,
      poolId: raw.poolId ?? '',
      email: raw.email,
      rol: raw.rol ?? 'COLABORADOR',
      rolPoolNombre: raw.rolPoolNombre,
      tipoUsuario: tipo,
      esSuperadmin: !!raw.esSuperadmin || tipo === 'SUPERADMIN',
      esAdminEmpresa: !!raw.esAdminEmpresa || tipo === 'ADMIN_EMPRESA',
      empresaEsLulo: !!raw.empresaEsLulo,
      permisos: Array.isArray(raw.permisos) ? raw.permisos : [],
    };
  }

  /**
   * Es usuario interno de Lulo: superadmin O cualquier usuario cuya empresa
   * sea LULO-APP. Estos ven la "Consola Lulo" en lugar del menú normal.
   */
  isLuloInternal(): boolean {
    const s = getSession();
    if (!s) return false;
    return s.esSuperadmin || s.empresaEsLulo;
  }
}
