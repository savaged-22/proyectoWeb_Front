import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  CrearProcesoRequest,
  EditarProcesoRequest,
  EliminarProcesoRequest,
  Proceso,
  ProcesoDetalle,
  ProcesoFilters,
  ProcesoPage,
} from '../models/proceso/proceso.model';
import { AuthService } from './auth.service';


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

  cambiarEstado(id: string, nuevoEstado: string): Observable<any> {
    return this.http.put(`${this.base}/${id}/estado`, { estado: nuevoEstado });
  }

  editar(id: string, body: Omit<EditarProcesoRequest, 'editadoPorId'>): Observable<Proceso> {
    const session = this.auth.getSession();
    const payload: EditarProcesoRequest = {
      ...body,
      editadoPorId: session?.usuarioId ?? '',
    };
    return this.http.patch<Proceso>(`${this.base}/${id}`, payload);
  }

  eliminar(id: string): Observable<void> {
    const session = this.auth.getSession();
    const payload: EliminarProcesoRequest = {
      eliminadoPorId: session?.usuarioId ?? '',
    };
    return this.http.delete<void>(`${this.base}/${id}`, { body: payload });
  }
}
