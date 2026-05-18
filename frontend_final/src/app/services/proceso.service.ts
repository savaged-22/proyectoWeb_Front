import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  CrearProcesoRequest,
  Proceso,
  ProcesoDetalle,
  ProcesoFilters,
  ProcesoPage,
} from '../core/models/proceso';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export interface ProcesoDetalleResponse extends ProcesoResponse {
  lanes: any[]; //hacerlos tipados
  nodos: any[];
  arcos: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ProcesoService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = `${environment.apiUrl}/procesos`;

  listar(filters: ProcesoFilters = {}): Observable<ProcesoPage> {
    const session = this.auth.getSession();
    let params = new HttpParams()
      .set('empresaId', session?.empresaId ?? '')
      .set('usuarioId', session?.usuarioId ?? '')
      .set('page', String(filters.page ?? 0))
      .set('size', String(filters.size ?? 20));

    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.categoria) params = params.set('categoria', filters.categoria);
    if (filters.nombre) params = params.set('nombre', filters.nombre);

    return this.http.get<ProcesoPage>(this.base, { params });
  }

  crear(body: Omit<CrearProcesoRequest, 'empresaId' | 'creadoPorId'>): Observable<Proceso> {
    const session = this.auth.getSession();
    const payload: CrearProcesoRequest = {
      ...body,
      empresaId: session?.empresaId ?? '',
      creadoPorId: session?.usuarioId ?? '',
    };
    return this.http.post<Proceso>(this.base, payload);
  }

  obtener(id: string): Observable<ProcesoDetalle> {
    const session = this.auth.getSession();
    const params = new HttpParams()
      .set('empresaId', session?.empresaId ?? '')
      .set('usuarioId', session?.usuarioId ?? '');
    return this.http.get<ProcesoDetalle>(`${this.base}/${id}`, { params });
  }
}
