import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface CrearUsuarioRequest {
  empresaId: string;
  creadoPorId: string;
  rolPoolId: string;
  email: string;
  password: string;
}

export interface CrearUsuarioResponse {
  usuarioId: string;
  email: string;
  rolAsignado: string;
  empresaNombre: string;
  mensaje: string;
}

export interface ActualizarUsuarioRequest {
  rolPoolId?: string;
  estado?: string;
}

export interface ActualizarUsuarioResponse {
  usuarioId: string;
  email: string;
  estado: string;
  rolAsignado: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/users`;

  crear(payload: CrearUsuarioRequest): Observable<CrearUsuarioResponse> {
    return this.http.post<CrearUsuarioResponse>(this.base, payload);
  }

  /** Edita un usuario: reemplaza su rol y/o cambia su estado. */
  actualizar(
    usuarioId: string,
    payload: ActualizarUsuarioRequest,
  ): Observable<ActualizarUsuarioResponse> {
    return this.http.patch<ActualizarUsuarioResponse>(`${this.base}/${usuarioId}`, payload);
  }
}
