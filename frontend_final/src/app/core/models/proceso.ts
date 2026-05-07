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

export interface CrearProcesoRequest {
  empresaId: string;
  poolId: string;
  creadoPorId: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  estado?: 'borrador' | 'publicado';
}

export interface ProcesoFilters {
  estado?: string;
  categoria?: string;
  nombre?: string;
  page?: number;
  size?: number;
}
