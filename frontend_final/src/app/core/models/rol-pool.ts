export interface Permiso {
  id: string;
  codigo: string;
  descripcion: string;
}

export interface RolPool {
  id: string;
  poolId: string;
  poolNombre: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  esPropietario: boolean;
  permisos: Permiso[];
  createdAt: string;
}
