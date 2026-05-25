import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  EditarEmpresaRequest,
  EmpresaDetail,
  EmpresaListItem,
  RegistroEmpresaRequest,
  RegistroEmpresaResponse,
} from '../core/models/empresa';

/**
 * Cliente para los endpoints exclusivos del SUPERADMIN (o usuarios con
 * permisos PERM_EMPRESA_*).
 * Backend: /api/superadmin/empresas
 */
@Injectable({ providedIn: 'root' })
export class SuperadminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/superadmin`;

  listarEmpresas(): Observable<EmpresaListItem[]> {
    return this.http.get<EmpresaListItem[]>(`${this.base}/empresas`);
  }

  crearEmpresa(body: RegistroEmpresaRequest): Observable<RegistroEmpresaResponse> {
    return this.http.post<RegistroEmpresaResponse>(`${this.base}/empresas`, body);
  }

  detalleEmpresa(empresaId: string): Observable<EmpresaDetail> {
    return this.http.get<EmpresaDetail>(`${this.base}/empresas/${empresaId}`);
  }

  editarEmpresa(empresaId: string, body: EditarEmpresaRequest): Observable<EmpresaListItem> {
    return this.http.patch<EmpresaListItem>(`${this.base}/empresas/${empresaId}`, body);
  }

  eliminarEmpresa(empresaId: string, confirmNombre: string): Observable<{ mensaje: string }> {
    return this.http.request<{ mensaje: string }>('delete',
      `${this.base}/empresas/${empresaId}`, { body: { confirmNombre } });
  }

  metricas(): Observable<Record<string, any>> {
    return this.http.get<Record<string, any>>(`${this.base}/metricas`);
  }
}
