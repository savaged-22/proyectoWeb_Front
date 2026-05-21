import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Permiso, RolPool } from '../core/models/rol-pool';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RolPoolService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = `${environment.apiUrl}/roles-pool`;

  listar(poolId: string): Observable<RolPool[]> {
    const session = this.auth.getSession();
    const params = new HttpParams()
      .set('poolId', poolId)
      .set('usuarioId', session?.usuarioId ?? '');
    return this.http.get<RolPool[]>(this.base, { params });
  }

  permisos(poolId: string): Observable<Permiso[]> {
    const session = this.auth.getSession();
    const params = new HttpParams()
      .set('poolId', poolId)
      .set('usuarioId', session?.usuarioId ?? '');
    return this.http.get<Permiso[]>(`${this.base}/permisos`, { params });
  }

  crear(payload: {
    poolId: string;
    creadoPorId: string;
    nombre: string;
    descripcion?: string;
    codigosPermiso: string[];
  }): Observable<RolPool> {
    return this.http.post<RolPool>(this.base, payload);
  }
}
