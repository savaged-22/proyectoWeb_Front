import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface LoginResponse {
  token: string;
  message: string;
  email: string;
  usuarioId: string;
  empresaId: string;
  poolId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/auth';

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.token);
          localStorage.setItem('email', response.email);
          localStorage.setItem('usuarioId', response.usuarioId);
          localStorage.setItem('empresaId', response.empresaId);
          if (response.poolId) {
            localStorage.setItem('poolId', response.poolId);
          }
        }
      })
    );
  }

  getUsuarioId(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('usuarioId') : null;
  }

  getEmpresaId(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('empresaId') : null;
  }

  getPoolId(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('poolId') : null;
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  }
}
