export interface EmpresaListItem {
  id: string;
  nombre: string;
  nit: string;
  emailContacto: string;
  createdAt: string;
  totalUsuarios: number;
  totalProcesos: number;
  totalPools: number;
}

export interface UsuarioBasico {
  id: string;
  email: string;
  estado: string;
  rolPrincipal: string;
  createdAt: string;
}

export interface EmpresaDetail {
  id: string;
  nombre: string;
  nit: string;
  emailContacto: string;
  createdAt: string;
  totalUsuarios: number;
  totalProcesos: number;
  totalPools: number;
  totalRolesPool: number;
  usuarios: UsuarioBasico[];
}

export interface RegistroEmpresaRequest {
  nombreEmpresa: string;
  nit: string;
  emailContacto: string;
  emailAdmin: string;
  password: string;
}

export interface RegistroEmpresaResponse {
  empresaId: string;
  empresaNombre: string;
  usuarioId: string;
  emailAdmin: string;
  poolDefault: string;
  mensaje: string;
}
