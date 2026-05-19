import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import {
  EmpresaDetail,
  EmpresaListItem,
  RegistroEmpresaRequest,
  RegistroEmpresaResponse,
} from '../core/models/empresa';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/empresas`;

  listar(): Observable<EmpresaListItem[]> {
    return this.http.get<EmpresaListItem[]>(this.base);
  }

  detalle(empresaId: string): Observable<EmpresaDetail> {
    return this.http.get<EmpresaDetail>(`${this.base}/${empresaId}`).pipe(
      map(empresa => {
        if (!empresa.usuarios) {
          empresa.usuarios = [];
        }
        if (empresa.totalUsuarios === undefined) {
          empresa.totalUsuarios = 0;
        }
        return empresa;
      })
    );
  }

  registrar(body: RegistroEmpresaRequest): Observable<RegistroEmpresaResponse> {
    return this.http.post<RegistroEmpresaResponse>(`${this.base}/registro`, body);
  }
}
