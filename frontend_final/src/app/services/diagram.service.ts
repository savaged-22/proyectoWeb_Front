import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ─── Shared ───────────────────────────────────────────────────────────────────
export interface NodoResponse {
  id: string;
  label: string;
  tipo: string;
  posX: number;
  posY: number;
  laneId: string | null;
  propsJson: string | null;
}

export interface ArcoResponse {
  id: string;
  fromNodoId: string;
  toNodoId: string;
  condicionExpr: string | null;
  propsJson: string | null;
}

export interface LaneResponse {
  id: string;
  nombre: string;
  orden: number;
  rolProcesoId: string | null;
}

// ─── Actividades ──────────────────────────────────────────────────────────────
export interface CrearActividadRequest {
  creadoPorId: string;
  laneId?: string;
  label: string;
  /** tarea | subproceso | manual | servicio | script */
  tipoActividad: string;
  posX?: number;
  posY?: number;
  propsJson?: string;
}

export interface EditarActividadRequest {
  editadoPorId: string;
  label?: string;
  tipoActividad?: string;
  laneId?: string;
  posX?: number;
  posY?: number;
  propsJson?: string;
}

// ─── Gateways ─────────────────────────────────────────────────────────────────
export interface CrearGatewayRequest {
  creadoPorId: string;
  laneId?: string;
  label?: string;
  posX?: number;
  posY?: number;
  /** exclusivo | paralelo | inclusivo */
  tipoGateway: string;
  configJson?: string;
}

export interface EditarGatewayRequest {
  editadoPorId: string;
  laneId?: string;
  label?: string;
  posX?: number;
  posY?: number;
  tipoGateway?: string;
  configJson?: string;
}

// ─── Arcos (conexiones) ───────────────────────────────────────────────────────
export interface CrearArcoRequest {
  creadoPorId: string;
  fromNodoId: string;
  toNodoId: string;
  condicionExpr?: string;
  propsJson?: string;
}

export interface EditarArcoRequest {
  editadoPorId: string;
  fromNodoId?: string;
  toNodoId?: string;
  condicionExpr?: string;
  propsJson?: string;
}

// ─── Lanes ────────────────────────────────────────────────────────────────────
export interface CrearLaneRequest {
  creadoPorId: string;
  rolProcesoId?: string;
  nombre: string;
  orden?: number;
}

export interface EditarLaneRequest {
  editadoPorId: string;
  rolProcesoId?: string;
  limpiarRolProceso?: boolean;
  nombre?: string;
  orden?: number;
}

// ─── Delete requests ──────────────────────────────────────────────────────────
export interface EliminarRequest {
  eliminadoPorId: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class DiagramService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8081/api/procesos';

  private url(procesoId: string, resource: string): string {
    return `${this.base}/${procesoId}/${resource}`;
  }

  // ── Actividades ─────────────────────────────────────────────────────────────
  crearActividad(procesoId: string, req: CrearActividadRequest): Observable<NodoResponse> {
    return this.http.post<NodoResponse>(this.url(procesoId, 'actividades'), req);
  }

  editarActividad(procesoId: string, actividadId: string, req: EditarActividadRequest): Observable<NodoResponse> {
    return this.http.patch<NodoResponse>(`${this.url(procesoId, 'actividades')}/${actividadId}`, req);
  }

  eliminarActividad(procesoId: string, actividadId: string, req: EliminarRequest): Observable<void> {
    return this.http.delete<void>(`${this.url(procesoId, 'actividades')}/${actividadId}`, { body: req });
  }

  // ── Gateways ────────────────────────────────────────────────────────────────
  crearGateway(procesoId: string, req: CrearGatewayRequest): Observable<NodoResponse> {
    return this.http.post<NodoResponse>(this.url(procesoId, 'gateways'), req);
  }

  editarGateway(procesoId: string, gatewayId: string, req: EditarGatewayRequest): Observable<NodoResponse> {
    return this.http.patch<NodoResponse>(`${this.url(procesoId, 'gateways')}/${gatewayId}`, req);
  }

  eliminarGateway(procesoId: string, gatewayId: string, req: EliminarRequest): Observable<void> {
    return this.http.delete<void>(`${this.url(procesoId, 'gateways')}/${gatewayId}`, { body: req });
  }

  // ── Arcos ───────────────────────────────────────────────────────────────────
  crearArco(procesoId: string, req: CrearArcoRequest): Observable<ArcoResponse> {
    return this.http.post<ArcoResponse>(this.url(procesoId, 'arcos'), req);
  }

  editarArco(procesoId: string, arcoId: string, req: EditarArcoRequest): Observable<ArcoResponse> {
    return this.http.patch<ArcoResponse>(`${this.url(procesoId, 'arcos')}/${arcoId}`, req);
  }

  eliminarArco(procesoId: string, arcoId: string, req: EliminarRequest): Observable<void> {
    return this.http.delete<void>(`${this.url(procesoId, 'arcos')}/${arcoId}`, { body: req });
  }

  // ── Lanes ───────────────────────────────────────────────────────────────────
  crearLane(procesoId: string, req: CrearLaneRequest): Observable<LaneResponse> {
    return this.http.post<LaneResponse>(this.url(procesoId, 'lanes'), req);
  }

  editarLane(procesoId: string, laneId: string, req: EditarLaneRequest): Observable<LaneResponse> {
    return this.http.patch<LaneResponse>(`${this.url(procesoId, 'lanes')}/${laneId}`, req);
  }

  eliminarLane(procesoId: string, laneId: string, req: EliminarRequest): Observable<void> {
    return this.http.delete<void>(`${this.url(procesoId, 'lanes')}/${laneId}`, { body: req });
  }
}
