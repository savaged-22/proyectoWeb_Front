import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EmpresaDetail, UsuarioBasico } from '../../core/models/empresa';
import { RolPool } from '../../core/models/rol-pool';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { PoolService } from '../../services/pool.service';
import { RolPoolService } from '../../services/rol-pool.service';
import { UsuarioService } from '../../services/usuario.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
})
export class UserManagementComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private auth = inject(AuthService);
  private poolService = inject(PoolService);
  private rolPoolService = inject(RolPoolService);
  private usuarioService = inject(UsuarioService);

  empresa?: EmpresaDetail;
  roles: RolPool[] = [];
  loading = true;
  error = '';
  searchQuery = '';

  newUserEmail = '';
  newUserPassword = '';
  newUserRolPoolId = '';
  showNewUserPassword = false;
  userStatus = '';
  userStatusError = false;
  creating = false;

  // ── Modal de edición: rol + estado de un usuario ────────────────────────
  editUser?: UsuarioBasico;
  editRolPoolId = '';
  editEstado = '';
  editStatus = '';
  editError = false;
  editSaving = false;

  readonly estadosDisponibles = ['activo', 'suspendido', 'inactivo', 'pendiente'];

  get puedeGestionarRoles(): boolean {
    return this.auth.can('POOL_ADMINISTRAR');
  }

  abrirEditar(u: UsuarioBasico): void {
    this.editUser = u;
    this.editRolPoolId = this.roles.length > 0 ? this.roles[0].id : '';
    this.editEstado = (u.estado || 'activo').toLowerCase();
    this.editStatus = '';
    this.editError = false;
  }

  cerrarEditar(): void {
    this.editUser = undefined;
  }

  guardarUsuario(): void {
    const session = this.auth.getSession();
    if (!this.editUser || !session) return;
    this.editSaving = true;
    this.editStatus = '';
    this.editError = false;
    this.usuarioService
      .actualizar(this.editUser.id, {
        rolPoolId: this.editRolPoolId || undefined,
        estado: this.editEstado || undefined,
      })
      .subscribe({
        next: () => {
          this.editSaving = false;
          this.editStatus = 'Cambios guardados correctamente.';
          this.editError = false;
          this.loadUsuarios(session.empresaId);
        },
        error: (err) => {
          this.editSaving = false;
          this.editStatus = err?.error?.message ?? 'No se pudieron guardar los cambios.';
          this.editError = true;
        },
      });
  }

  ngOnInit(): void {
    const session = this.auth.getSession();
    if (!session) {
      this.error = 'Sesión no disponible.';
      this.loading = false;
      return;
    }
    this.loadUsuarios(session.empresaId);
    this.cargarRoles();
    // Refresca matriz cuando otro componente crea/edita un rol del pool.
    this.rolPoolService.rolesChanged$.subscribe(() => this.cargarRoles());
  }

  private cargarRoles(): void {
    this.poolService.listar().subscribe({
      next: (pools) => {
        if (pools.length === 0) return;
        this.rolPoolService.listar(pools[0].id).subscribe({
          next: (roles) => {
            this.roles = roles;
            if (roles.length > 0) this.newUserRolPoolId = roles[0].id;
          },
          error: () => {
            this.error = 'No se pudieron cargar los roles disponibles.';
          },
        });
      },
      error: () => {
        this.error = 'No se pudieron cargar los pools de la empresa.';
      },
    });
  }

  private loadUsuarios(empresaId: string): void {
    this.empresaService.detalle(empresaId).subscribe({
      next: (e) => {
        this.empresa = e;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar el directorio de usuarios.';
        this.loading = false;
      },
    });
  }

  /** Dominio email exigido al crear/editar usuarios desde esta vista. */
  get dominioRequerido(): string {
    const session = this.auth.getSession();
    if (!session) return '';
    if (session.esSuperadmin) return 'lulo.app';
    // Para admin empresa el dominio viene del backend en empresaDetalle si lo
    // cargamos; como atajo usamos el sufijo del email del admin actual.
    const fromEmpresa: any = this.empresa as any;
    if (fromEmpresa && fromEmpresa.dominio) return fromEmpresa.dominio;
    const adminMail = session.email || '';
    return adminMail.includes('@') ? adminMail.split('@')[1] : '';
  }

  createUser(): void {
    const session = this.auth.getSession();
    if (!session || !this.newUserEmail || !this.newUserPassword || !this.newUserRolPoolId) return;
    if (this.newUserPassword.length < 8) {
      this.userStatus = 'La contraseña debe tener al menos 8 caracteres.';
      this.userStatusError = true;
      return;
    }
    const dom = this.dominioRequerido;
    if (dom && !this.newUserEmail.toLowerCase().endsWith('@' + dom.toLowerCase())) {
      this.userStatus = `El correo debe terminar en @${dom}`;
      this.userStatusError = true;
      return;
    }
    this.creating = true;
    this.userStatus = '';
    this.userStatusError = false;
    this.usuarioService.crear({
      empresaId: session.empresaId,
      creadoPorId: session.usuarioId,
      rolPoolId: this.newUserRolPoolId,
      email: this.newUserEmail,
      password: this.newUserPassword,
    }).subscribe({
      next: (res) => {
        this.userStatus = `Usuario ${res.email} creado exitosamente con rol "${res.rolAsignado}".`;
        this.userStatusError = false;
        this.newUserEmail = '';
        this.newUserPassword = '';
        this.newUserRolPoolId = this.roles.length > 0 ? this.roles[0].id : '';
        this.creating = false;
        // Actualización optimista: el usuario aparece al instante en la tabla.
        if (this.empresa) {
          this.empresa.usuarios = [
            {
              id: res.usuarioId,
              email: res.email,
              estado: 'activo',
              rolPrincipal: res.rolAsignado,
              createdAt: new Date().toISOString(),
            },
            ...this.empresa.usuarios,
          ];
          this.empresa.totalUsuarios = (this.empresa.totalUsuarios ?? 0) + 1;
        }
        // …y luego sincroniza con el servidor.
        this.loadUsuarios(session.empresaId);
      },
      error: (err) => {
        this.userStatus = err?.error?.message ?? 'Error al crear el usuario.';
        this.userStatusError = true;
        this.creating = false;
      },
    });
  }

  get usuarios(): UsuarioBasico[] {
    return this.empresa?.usuarios ?? [];
  }

  get totalUsers(): number { return this.usuarios.length; }
  get activeUsers(): number {
    return this.usuarios.filter((u) => (u.estado || '').toLowerCase() === 'activo').length;
  }

  get filteredUsers(): UsuarioBasico[] {
    if (!this.searchQuery) return this.usuarios;
    const q = this.searchQuery.toLowerCase();
    return this.usuarios.filter(
      (u) => u.email.toLowerCase().includes(q) || u.rolPrincipal.toLowerCase().includes(q)
    );
  }

  getInitials(email?: string): string {
    return email ? email.charAt(0).toUpperCase() : '?';
  }

  /** El SUPERADMIN dueño de la app no se puede editar desde esta vista. */
  esSuperadminLulo(u: UsuarioBasico): boolean {
    return (u.email || '').toLowerCase() === 'admin@lulo.app';
  }

  badgeForEstado(estado: string): string {
    const m: Record<string, string> = {
      activo: 'green',
      pendiente: 'amber',
      suspendido: 'red',
      inactivo: 'gray',
    };
    return m[(estado || '').toLowerCase()] ?? 'blue';
  }

  get isLuloInternal(): boolean {
    return this.auth.isLuloInternal();
  }

  /**
   * Roles del pool, ordenados con el propietario (SuperAdmin) primero
   * y el resto por nombre. Usado en la matriz inferior.
   */
  get rolesOrdenados(): RolPool[] {
    return [...this.roles].sort((a, b) => {
      if (a.esPropietario && !b.esPropietario) return -1;
      if (!a.esPropietario && b.esPropietario) return 1;
      return (a.nombre || '').localeCompare(b.nombre || '');
    });
  }

  /**
   * Permisos a mostrar en la matriz agrupados por sección.
   * Solo aparecen los permisos que al menos un rol visible tiene.
   */
  private static readonly GRUPOS_MATRIZ: { label: string; codigos: string[] }[] = [
    { label: 'Empresas', codigos: [
      'EMPRESA_VER', 'EMPRESA_CREAR', 'EMPRESA_EDITAR',
      'EMPRESA_ELIMINAR', 'EMPRESA_SUSPENDER', 'EMPRESA_REACTIVAR',
    ]},
    { label: 'Usuarios Lulo', codigos: [
      'LULO_USUARIO_VER', 'LULO_USUARIO_CREAR',
      'LULO_USUARIO_EDITAR', 'LULO_USUARIO_ELIMINAR',
    ]},
    { label: 'Roles Lulo', codigos: ['LULO_ROL_GESTIONAR'] },
    { label: 'Auditoría y Métricas', codigos: [
      'AUDIT_GLOBAL_VER', 'AUDIT_VER', 'METRICAS_VER',
    ]},
    { label: 'Soporte', codigos: ['SOPORTE_PROCESOS_VER'] },
    { label: 'Procesos', codigos: [
      'PROCESO_VER', 'PROCESO_CREAR', 'PROCESO_EDITAR',
      'PROCESO_ELIMINAR', 'PROCESO_PUBLICAR', 'PROCESO_COMPARTIR',
    ]},
    { label: 'Diagramas', codigos: ['DIAGRAMA_VER', 'DIAGRAMA_EDITAR'] },
    { label: 'Roles de Empresa', codigos: [
      'ROL_VER', 'ROL_CREAR', 'ROL_EDITAR', 'ROL_ELIMINAR',
    ]},
    { label: 'Usuarios de Empresa', codigos: [
      'USUARIO_VER', 'USUARIO_INVITAR', 'USUARIO_REVOCAR',
    ]},
    { label: 'Pools', codigos: ['POOL_ADMINISTRAR'] },
  ];

  private static readonly ETIQUETAS_PERMISO: Record<string, string> = {
    EMPRESA_VER: 'Consultar empresas',
    EMPRESA_CREAR: 'Crear empresas',
    EMPRESA_EDITAR: 'Editar empresas',
    EMPRESA_ELIMINAR: 'Eliminar empresas',
    EMPRESA_SUSPENDER: 'Suspender empresas',
    EMPRESA_REACTIVAR: 'Reactivar empresas',
    LULO_USUARIO_VER: 'Ver usuarios Lulo',
    LULO_USUARIO_CREAR: 'Crear usuarios Lulo',
    LULO_USUARIO_EDITAR: 'Editar usuarios Lulo',
    LULO_USUARIO_ELIMINAR: 'Eliminar usuarios Lulo',
    LULO_ROL_GESTIONAR: 'Gestionar roles Lulo',
    AUDIT_GLOBAL_VER: 'Auditoría global',
    AUDIT_VER: 'Auditoría de empresa',
    METRICAS_VER: 'Métricas globales',
    SOPORTE_PROCESOS_VER: 'Inspeccionar procesos cliente',
    PROCESO_VER: 'Consultar procesos',
    PROCESO_CREAR: 'Crear procesos',
    PROCESO_EDITAR: 'Editar procesos',
    PROCESO_ELIMINAR: 'Eliminar procesos',
    PROCESO_PUBLICAR: 'Publicar procesos',
    PROCESO_COMPARTIR: 'Compartir procesos',
    DIAGRAMA_VER: 'Ver diagramas',
    DIAGRAMA_EDITAR: 'Editar diagramas',
    ROL_VER: 'Ver roles',
    ROL_CREAR: 'Crear roles',
    ROL_EDITAR: 'Editar roles',
    ROL_ELIMINAR: 'Eliminar roles',
    USUARIO_VER: 'Ver usuarios',
    USUARIO_INVITAR: 'Invitar usuarios',
    USUARIO_REVOCAR: 'Revocar usuarios',
    POOL_ADMINISTRAR: 'Administrar pools',
  };

  /** Grupos visibles: solo los que tienen al menos un permiso en algún rol. */
  get permisosAgrupados(): { label: string; codigos: string[] }[] {
    const todosLosCodigos = new Set<string>();
    this.rolesOrdenados.forEach(r => r.permisos.forEach(p => todosLosCodigos.add(p.codigo)));
    return UserManagementComponent.GRUPOS_MATRIZ
      .map(g => ({
        label: g.label,
        codigos: g.codigos.filter(c => todosLosCodigos.has(c)),
      }))
      .filter(g => g.codigos.length > 0);
  }

  rolTienePermiso(rol: RolPool, codigo: string): boolean {
    return rol.permisos.some(p => p.codigo === codigo);
  }

  etiquetaPermiso(codigo: string): string {
    return UserManagementComponent.ETIQUETAS_PERMISO[codigo] ?? codigo;
  }

  /** Tier visual para cada rol según cobertura de permisos. */
  tierOf(rol: RolPool): { label: string; klass: string } {
    if (rol.esPropietario) return { label: 'FULL ACCESS', klass: 'tier-full' };
    const cobertura = rol.permisos.length;
    if (cobertura >= 5) return { label: 'WRITE ACCESS', klass: 'tier-write' };
    return { label: 'READ ONLY', klass: 'tier-read' };
  }
}
