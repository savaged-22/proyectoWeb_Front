/**
 * Tipos estrictos del diagrama BPMN, alineados con los DTOs del backend
 * (com.lulo.diagram.{activity,gateway,arc,lane}.dto).
 *
 * Un Nodo es la abstracción común; Actividad y Gateway son sus dos
 * subtipos polimórficos. El campo `tipo`/`tipoActividad`/`tipoGateway`
 * identifica la variante específica.
 */

export type TipoActividad =
  | 'tarea'
  | 'servicio'
  | 'manual'
  | 'script'
  | 'subproceso';

export type TipoGateway = 'exclusivo' | 'paralelo' | 'inclusivo';

/** Categoría del nodo en el diagrama. */
export type TipoNodo =
  | 'actividad'
  | 'gateway'
  | 'startEvent'
  | 'endEvent';

// ── Lanes ────────────────────────────────────────────────────────────
export interface Lane {
  id: string;
  procesoId: string;
  nombre: string;
  orden: number;
  rolProcesoId: string | null;
  rolProcesoNombre?: string | null;
}

export interface CrearLaneRequest {
  creadoPorId: string;
  nombre: string;
  orden?: number;
  rolProcesoId?: string | null;
}

export interface EditarLaneRequest {
  editadoPorId: string;
  nombre?: string;
  orden?: number;
  rolProcesoId?: string | null;
}

export interface EliminarLaneRequest {
  eliminadoPorId: string;
}

// ── Actividad ────────────────────────────────────────────────────────
export interface Actividad {
  id: string;
  procesoId: string;
  laneId: string | null;
  label: string;
  tipo: TipoNodo;
  tipoActividad: TipoActividad;
  posX: number;
  posY: number;
  propsJson: string | null;
}

export interface CrearActividadRequest {
  creadoPorId: string;
  label: string;
  tipoActividad: TipoActividad;
  laneId?: string | null;
  posX: number;
  posY: number;
  propsJson?: string | null;
}

export interface EditarActividadRequest {
  editadoPorId: string;
  label?: string;
  tipoActividad?: TipoActividad;
  laneId?: string | null;
  posX?: number;
  posY?: number;
  propsJson?: string | null;
}

export interface EliminarActividadRequest {
  eliminadoPorId: string;
}

// ── Gateway ──────────────────────────────────────────────────────────
export interface Gateway {
  id: string;
  procesoId: string;
  laneId: string | null;
  label: string;
  tipo: TipoNodo;
  tipoGateway: TipoGateway;
  posX: number;
  posY: number;
  configJson: string | null;
}

export interface CrearGatewayRequest {
  creadoPorId: string;
  label: string;
  tipoGateway: TipoGateway;
  laneId?: string | null;
  posX: number;
  posY: number;
  configJson?: string | null;
}

export interface EditarGatewayRequest {
  editadoPorId: string;
  label?: string;
  tipoGateway?: TipoGateway;
  laneId?: string | null;
  posX?: number;
  posY?: number;
  configJson?: string | null;
}

export interface EliminarGatewayRequest {
  eliminadoPorId: string;
}

// ── Arco ─────────────────────────────────────────────────────────────
export interface Arco {
  id: string;
  procesoId: string;
  fromNodoId: string;
  toNodoId: string;
  /** Expresión condición. Solo válida en arcos saliendo de gateway exclusivo/inclusivo. */
  condicionExpr: string | null;
  propsJson: string | null;
}

export interface CrearArcoRequest {
  creadoPorId: string;
  fromNodoId: string;
  toNodoId: string;
  condicionExpr?: string | null;
  propsJson?: string | null;
}

export interface EditarArcoRequest {
  editadoPorId: string;
  fromNodoId?: string;
  toNodoId?: string;
  condicionExpr?: string | null;
  propsJson?: string | null;
}

export interface EliminarArcoRequest {
  eliminadoPorId: string;
}

/** Type guards útiles para discriminar nodos en el editor. */
export function isActividad(n: Actividad | Gateway): n is Actividad {
  return (n as Actividad).tipoActividad !== undefined;
}

export function isGateway(n: Actividad | Gateway): n is Gateway {
  return (n as Gateway).tipoGateway !== undefined;
}
