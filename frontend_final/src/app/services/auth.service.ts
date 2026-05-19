import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  UserSession,
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
    // Normalizamos: el backend hace match exact en BD, así que evitamos
    // 401 por mayúsculas accidentales o espacios al final.
    const payload: LoginRequest = {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    };
    return this.http
      .post<UserSession & { message?: string }>(`${this.apiUrl}/login`, payload)
      .pipe(tap((res) => saveSession(this.toSession(res))));
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

  isPropietario(): boolean {
    return getSession()?.rol === 'PROPIETARIO';
  }

  private toSession(raw: any): UserSession {
    return {
      token: raw.token,
      usuarioId: raw.usuarioId,
      empresaId: raw.empresaId,
      empresaNombre: raw.empresaNombre,
      poolId: raw.poolId ?? '',
      email: raw.email,
      rol: raw.rol ?? 'COLABORADOR',
    };
  }
}
