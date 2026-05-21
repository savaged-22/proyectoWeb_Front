export interface Proceso {
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
  esPlantilla: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProcesoPage {
  content: Proceso[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// Elementos del Diagrama
export interface ProcesoLane {
  id: string;
  nombre: string;
  orden: number;
  rolProcesoId: string | null;
}

export interface ProcesoNodo {
  id: string;
  label: string;
  tipo: string;
  posX: number;
  posY: number;
  laneId: string | null;
  propsJson: string | null;
}

export interface ProcesoArco {
  id: string;
  fromNodoId: string;
  toNodoId: string;
  condicionExpr: string | null;
  propsJson: string | null;
}

export interface ProcesoDetalle extends Proceso {
  lanes: ProcesoLane[];
  nodos: ProcesoNodo[];
  arcos: ProcesoArco[];
}

// DTOs Request/Response Mapeados Exactos del Backend
export interface CrearProcesoRequest {
  empresaId: string;
  poolId: string;
  creadoPorId: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  estado?: 'borrador' | 'publicado';
  esPlantilla?: boolean;
  disenoBaseId?: string;
}

export interface EditarProcesoRequest {
  editadoPorId: string; // Requerido por el @NotNull del backend
  nombre?: string;
  descripcion?: string;
  categoria?: string;
  estado?: 'borrador' | 'publicado';
}

export interface EliminarProcesoRequest {
  eliminadoPorId: string;
}

export interface ProcesoFilters {
  estado?: string;
  categoria?: string;
  nombre?: string;
  page?: number;
  size?: number;
}
