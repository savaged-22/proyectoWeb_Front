import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { CrearPoolRequest, Pool } from '../core/models/pool';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PoolService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = `${environment.apiUrl}/pools`;

  listar(): Observable<Pool[]> {
    const session = this.auth.getSession();
    const params = new HttpParams()
      .set('empresaId', session?.empresaId ?? '')
      .set('usuarioId', session?.usuarioId ?? '');
    return this.http.get<Pool[]>(this.base, { params });
  }

  crear(nombre: string, configJson?: string): Observable<Pool> {
    const session = this.auth.getSession();
    const body: CrearPoolRequest = {
      empresaId: session?.empresaId ?? '',
      usuarioId: session?.usuarioId ?? '',
      nombre,
      configJson,
    };
    return this.http.post<Pool>(this.base, body);
  }
}
