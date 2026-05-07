export interface Pool {
  id: string;
  empresaId: string;
  empresaNombre: string;
  nombre: string;
  configJson: string;
  createdAt: string;
}

export interface CrearPoolRequest {
  empresaId: string;
  usuarioId: string;
  nombre: string;
  configJson?: string;
}
