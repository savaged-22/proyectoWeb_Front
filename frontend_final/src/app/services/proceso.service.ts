import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CrearProcesoRequest {
  empresaId: string;
  poolId: string;
  creadoPorId: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  estado?: string;
}

export interface ProcesoResponse {
  id: string;
  empresaId: string;
  empresaNombre: string;
  poolId: string;
  poolNombre: string;
  creadoPorId: string;
  creadoPorEmail: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  estado: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProcesoDetalleResponse extends ProcesoResponse {
  lanes: any[];
  nodos: any[];
  arcos: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ProcesoService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/procesos';

  crear(request: CrearProcesoRequest): Observable<ProcesoResponse> {
    return this.http.post<ProcesoResponse>(this.apiUrl, request);
  }

  listar(empresaId: string, usuarioId: string): Observable<any> {
    return this.http.get(this.apiUrl, {
      params: { empresaId, usuarioId }
    });
  }

  obtener(procesoId: string, empresaId: string, usuarioId: string): Observable<ProcesoDetalleResponse> {
    return this.http.get<ProcesoDetalleResponse>(`${this.apiUrl}/${procesoId}`, {
      params: { empresaId, usuarioId }
    });
  }
}
