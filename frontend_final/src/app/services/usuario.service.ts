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

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/users`;

  crear(payload: CrearUsuarioRequest): Observable<CrearUsuarioResponse> {
    return this.http.post<CrearUsuarioResponse>(this.base, payload);
  }
}
