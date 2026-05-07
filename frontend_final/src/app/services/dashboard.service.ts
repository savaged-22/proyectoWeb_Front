import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface ResumenEstadisticas {
  totalEmpresas: number;
  totalUsuarios: number;
  totalPools: number;
  totalRolesPool: number;
  totalRolesProceso: number;
  totalProcesos: number;
  totalLanes: number;
  totalNodos: number;
  totalArcos: number;
}

export interface ResumenResponse {
  estadisticas: ResumenEstadisticas;
  empresas: any[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/resumen`;

  resumen(): Observable<ResumenResponse> {
    return this.http.get<ResumenResponse>(this.base);
  }
}
