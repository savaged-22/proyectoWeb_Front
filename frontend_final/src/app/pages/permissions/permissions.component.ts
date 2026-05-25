import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Pool } from '../../core/models/pool';
import { Permiso, RolPool } from '../../core/models/rol-pool';
import { PoolService } from '../../services/pool.service';
import { RolPoolService } from '../../services/rol-pool.service';
import { AuthService } from '../../services/auth.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css'],
})
export class PermissionsComponent implements OnInit {
  private poolService = inject(PoolService);
  private rolPoolService = inject(RolPoolService);
  private auth = inject(AuthService);

  pools: Pool[] = [];
  selectedPool?: Pool;

  roles: RolPool[] = [];
  selectedRole?: RolPool;
  catalogoPermisos: Permiso[] = [];

  loading = true;
  error = '';
  loadingStuck = false;

  showModal = false;
  modalNombre = '';
  modalDescripcion = '';
  modalPermisos: Set<string> = new Set();
  modalLoading = false;
  modalError = '';

  ngOnInit(): void {
    this.cargar();
    setTimeout(() => {
      if (this.loading) this.loadingStuck = true;
    }, 4000);
    // Auto-refresh roles cuando crear/editar emite el evento global.
    this.rolPoolService.rolesChanged$.subscribe((poolId) => {
      if (this.selectedPool?.id === poolId) {
        this.rolPoolService.listar(poolId).subscribe({
          next: (rs) => { this.roles = rs; },
        });
      }
    });
  }

  cargar(): void {
    this.loading = true;
    this.loadingStuck = false;
    this.error = '';
    this.poolService.listar().subscribe({
      next: (pools) => {
        this.pools = pools;
        if (pools.length > 0) {
          this.selectPool(pools[0]);
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudieron cargar los pools.';
        this.loading = false;
      },
    });
  }

  selectPool(pool: Pool): void {
    this.selectedPool = pool;
    this.loading = true;
    this.error = '';

    this.rolPoolService.listar(pool.id).subscribe({
      next: (rs) => {
        this.roles = rs;
        if (rs.length > 0) this.selectRole(rs[0]);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudieron cargar los roles.';
        this.loading = false;
      },
    });

    this.rolPoolService.permisos(pool.id).subscribe({
      next: (p) => (this.catalogoPermisos = p),
      error: () => (this.catalogoPermisos = []),
    });
  }

  selectRole(role: RolPool): void {
    this.selectedRole = role;
  }

  has(role: RolPool, codigo: string): boolean {
    return role.permisos?.some((p) => p.codigo === codigo) ?? false;
  }

  // ── Gating por permiso ──────────────────────────────────────────────────
  get puedeCrearRol(): boolean {
    return this.auth.can('ROL_CREAR') || this.auth.can('LULO_ROL_GESTIONAR');
  }

  get isLuloInternal(): boolean {
    return this.auth.isLuloInternal();
  }

  get puedeEditarRol(): boolean {
    return this.auth.can('ROL_EDITAR') || this.auth.can('LULO_ROL_GESTIONAR');
  }

  // ── Matriz interactiva: prender/apagar permisos del rol ─────────────────
  guardandoCodigo: string | null = null;
  matrizError = '';

  togglePermisoRol(rol: RolPool, codigo: string): void {
    if (rol.esPropietario || !this.puedeEditarRol || this.guardandoCodigo) return;

    const codigosActuales = rol.permisos.map((p) => p.codigo);
    const nuevos = this.has(rol, codigo)
      ? codigosActuales.filter((c) => c !== codigo)
      : [...codigosActuales, codigo];

    this.guardandoCodigo = codigo;
    this.matrizError = '';

    this.rolPoolService.actualizarPermisos(rol.id, nuevos).subscribe({
      next: (actualizado) => {
        const idx = this.roles.findIndex((r) => r.id === actualizado.id);
        if (idx >= 0) this.roles[idx] = actualizado;
        if (this.selectedRole?.id === actualizado.id) this.selectedRole = actualizado;
        this.guardandoCodigo = null;
      },
      error: (err) => {
        this.matrizError = err.error?.message ?? 'No se pudo actualizar el permiso.';
        this.guardandoCodigo = null;
      },
    });
  }

  get rolesPropietarios(): number {
    return this.roles.filter((r) => r.esPropietario).length;
  }

  get rolesCustom(): number {
    return this.roles.filter((r) => !r.esPropietario).length;
  }

  // ── Vista "Role Pool & Matrix" ─────────────────────────────────────────
  /**
   * Niveles tipo "Full / Write / Read" inferidos de los roles del pool.
   * SUPERADMIN ve todos, ADMIN_EMPRESA ve los de sus pools, USUARIO ve solo
   * su rol asignado.
   */
  get rolesVisibles(): RolPool[] {
    const session = this.auth.getSession();
    if (!session) return [];
    if (session.esSuperadmin || session.esAdminEmpresa) return this.roles;
    // Usuario regular: solo ve roles con todos los permisos que él tiene.
    return this.roles.filter((r) =>
      r.permisos.every((p) => session.permisos?.includes(p.codigo)),
    );
  }

  /** Tier (nivel) según cobertura de permisos: full=todos, write=mitad+, read=resto. */
  tierOf(rol: RolPool): { label: string; klass: string; descripcion: string } {
    if (rol.esPropietario) {
      return {
        label: 'FULL ACCESS',
        klass: 'tier-full',
        descripcion: 'Autoridad completa sobre el pool: usuarios, roles, procesos y auditoría.',
      };
    }
    const cobertura = this.catalogoPermisos.length > 0
      ? rol.permisos.length / this.catalogoPermisos.length
      : 0;
    if (cobertura >= 0.5) {
      return {
        label: 'WRITE ACCESS',
        klass: 'tier-write',
        descripcion: 'Puede crear y modificar flujos del negocio, pero no gestiona usuarios.',
      };
    }
    return {
      label: 'READ ONLY',
      klass: 'tier-read',
      descripcion: 'Solo consulta procesos y métricas; sin permisos de edición.',
    };
  }

  /**
   * Matriz Módulo × Rol. Cada celda indica si el rol tiene al menos un
   * permiso del módulo. Útil para una vista comparativa rápida.
   */
  readonly modulosMatriz: { label: string; prefijo: string }[] = [
    { label: 'Gestión de usuarios',  prefijo: 'USUARIO' },
    { label: 'Procesos y workflows', prefijo: 'PROCESO' },
    { label: 'Diagramas',            prefijo: 'DIAGRAMA' },
    { label: 'Roles y permisos',     prefijo: 'ROL' },
    { label: 'Pools',                prefijo: 'POOL' },
    { label: 'Auditoría',            prefijo: 'AUDIT' },
  ];

  rolTienePrefijo(rol: RolPool, prefijo: string): boolean {
    return rol.permisos.some((p) => p.codigo.startsWith(prefijo + '_'));
  }

  /** Total visible para mostrar en KPI de overview. */
  get totalRolesVisibles(): number {
    return this.rolesVisibles.length;
  }

  abrirModal(): void {
    this.showModal = true;
    this.modalNombre = '';
    this.modalDescripcion = '';
    this.modalPermisos = new Set();
    this.modalError = '';
  }

  cerrarModal(): void {
    this.showModal = false;
  }

  togglePermiso(codigo: string): void {
    this.modalPermisos.has(codigo)
      ? this.modalPermisos.delete(codigo)
      : this.modalPermisos.add(codigo);
  }

  // ── Catálogo de permisos: secciones profesionales ─────────────────────
  /**
   * Cada sección agrupa permisos relacionados. La página muestra solo las
   * secciones cuyos permisos están realmente disponibles para el pool actual
   * (los pools de Lulo no exponen permisos operacionales, y viceversa).
   */
  private static readonly SECCIONES: {
    label: string; icono: string; codigos: string[]
  }[] = [
    // ── ADMINISTRACIÓN LULO ──────────────────────────────────────────
    { label: 'Gestión de Empresas', icono: 'cog', codigos: [
      'EMPRESA_VER', 'EMPRESA_CREAR', 'EMPRESA_EDITAR',
      'EMPRESA_ELIMINAR', 'EMPRESA_SUSPENDER', 'EMPRESA_REACTIVAR',
    ]},
    { label: 'Equipo Lulo', icono: 'usuarios', codigos: [
      'LULO_USUARIO_VER', 'LULO_USUARIO_CREAR',
      'LULO_USUARIO_EDITAR', 'LULO_USUARIO_ELIMINAR', 'LULO_ROL_GESTIONAR',
    ]},
    { label: 'Observabilidad', icono: 'eye', codigos: [
      'METRICAS_VER', 'AUDIT_GLOBAL_VER', 'AUDIT_VER',
    ]},
    { label: 'Soporte Técnico', icono: 'share', codigos: [
      'SOPORTE_PROCESOS_VER',
    ]},
    // ── OPERACIÓN EMPRESA CLIENTE ────────────────────────────────────
    { label: 'Procesos', icono: 'procesos', codigos: [
      'PROCESO_VER', 'PROCESO_CREAR', 'PROCESO_EDITAR',
      'PROCESO_ELIMINAR', 'PROCESO_PUBLICAR', 'PROCESO_COMPARTIR',
    ]},
    { label: 'Diagramas', icono: 'diagrama', codigos: [
      'DIAGRAMA_VER', 'DIAGRAMA_EDITAR',
    ]},
    { label: 'Roles y Permisos', icono: 'roles', codigos: [
      'ROL_VER', 'ROL_CREAR', 'ROL_EDITAR', 'ROL_ELIMINAR',
    ]},
    { label: 'Usuarios de Empresa', icono: 'usuarios', codigos: [
      'USUARIO_VER', 'USUARIO_INVITAR', 'USUARIO_REVOCAR',
    ]},
    { label: 'Pools', icono: 'cog', codigos: [
      'POOL_ADMINISTRAR',
    ]},
  ];

  private static readonly ICONOS_ACCION: Record<string, string> = {
    VER: 'eye', CREAR: 'plus', EDITAR: 'pencil', ELIMINAR: 'trash',
    PUBLICAR: 'publish', COMPARTIR: 'share', INVITAR: 'mail', REVOCAR: 'ban',
    ADMINISTRAR: 'cog', SUSPENDER: 'ban', REACTIVAR: 'plus', GESTIONAR: 'cog',
  };

  /** Etiquetas profesionales por código completo. */
  private static readonly ETIQUETAS_COMPLETAS: Record<string, string> = {
    // Empresas
    EMPRESA_VER:        'Consultar empresas',
    EMPRESA_CREAR:      'Crear empresas',
    EMPRESA_EDITAR:     'Editar empresas',
    EMPRESA_ELIMINAR:   'Eliminar empresas',
    EMPRESA_SUSPENDER:  'Suspender empresas',
    EMPRESA_REACTIVAR:  'Reactivar empresas',
    // Equipo Lulo
    LULO_USUARIO_VER:      'Ver usuarios Lulo',
    LULO_USUARIO_CREAR:    'Crear usuarios Lulo',
    LULO_USUARIO_EDITAR:   'Editar usuarios Lulo',
    LULO_USUARIO_ELIMINAR: 'Eliminar usuarios Lulo',
    LULO_ROL_GESTIONAR:    'Gestionar roles Lulo',
    // Observabilidad
    METRICAS_VER:       'Ver métricas globales',
    AUDIT_GLOBAL_VER:   'Ver auditoría global',
    AUDIT_VER:          'Ver auditoría de empresa',
    // Soporte
    SOPORTE_PROCESOS_VER: 'Inspeccionar procesos cliente',
    // Procesos
    PROCESO_VER:        'Consultar procesos',
    PROCESO_CREAR:      'Crear procesos',
    PROCESO_EDITAR:     'Editar procesos',
    PROCESO_ELIMINAR:   'Eliminar procesos',
    PROCESO_PUBLICAR:   'Publicar procesos',
    PROCESO_COMPARTIR:  'Compartir procesos',
    // Diagramas
    DIAGRAMA_VER:    'Ver diagramas',
    DIAGRAMA_EDITAR: 'Editar diagramas',
    // Roles
    ROL_VER:      'Ver roles',
    ROL_CREAR:    'Crear roles',
    ROL_EDITAR:   'Editar roles',
    ROL_ELIMINAR: 'Eliminar roles',
    // Usuarios empresa
    USUARIO_VER:     'Ver usuarios',
    USUARIO_INVITAR: 'Invitar usuarios',
    USUARIO_REVOCAR: 'Revocar usuarios',
    // Pools
    POOL_ADMINISTRAR: 'Administrar pools',
  };

  /** Devuelve solo las secciones con permisos disponibles en el pool actual. */
  private _gruposPermisoCache: { label: string; icono: string; permisos: Permiso[] }[] = [];
  private _gruposPermisoCacheKey = '';

  get gruposPermiso(): { label: string; icono: string; permisos: Permiso[] }[] {
    const key = this.catalogoPermisos.map((p) => p.codigo).join('|');
    if (key === this._gruposPermisoCacheKey) return this._gruposPermisoCache;
    const disponibles = new Set(this.catalogoPermisos.map((p) => p.codigo));
    this._gruposPermisoCache = PermissionsComponent.SECCIONES
      .map((s) => ({
        label: s.label,
        icono: s.icono,
        permisos: s.codigos
          .filter((c) => disponibles.has(c))
          .map((c) => this.catalogoPermisos.find((p) => p.codigo === c)!)
          .filter(Boolean),
      }))
      .filter((g) => g.permisos.length > 0);
    this._gruposPermisoCacheKey = key;
    return this._gruposPermisoCache;
  }

  trackByLabel(_: number, g: { label: string }): string { return g.label; }
  trackByCodigo(_: number, p: Permiso): string { return p.codigo; }

  iconoPermiso(codigo: string): string {
    const partes = codigo.split('_');
    const accion = partes[partes.length - 1] ?? '';
    return PermissionsComponent.ICONOS_ACCION[accion] ?? 'key';
  }

  etiquetaPermiso(codigo: string): string {
    const full = PermissionsComponent.ETIQUETAS_COMPLETAS[codigo];
    if (full) return full;
    // Fallback: convierte EMPRESA_VER → "Empresa ver"
    return codigo
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  estadoGrupo(permisos: Permiso[]): 'none' | 'some' | 'all' {
    const sel = permisos.filter((p) => this.modalPermisos.has(p.codigo)).length;
    if (sel === 0) return 'none';
    return sel === permisos.length ? 'all' : 'some';
  }

  toggleGrupo(permisos: Permiso[]): void {
    const quitar = this.estadoGrupo(permisos) === 'all';
    for (const p of permisos) {
      quitar ? this.modalPermisos.delete(p.codigo) : this.modalPermisos.add(p.codigo);
    }
  }

  crearRol(): void {
    if (!this.modalNombre.trim() || !this.selectedPool) return;
    const session = this.auth.getSession();
    this.modalLoading = true;
    this.modalError = '';

    this.rolPoolService.crear({
      poolId: this.selectedPool.id,
      creadoPorId: session!.usuarioId,
      nombre: this.modalNombre.trim(),
      descripcion: this.modalDescripcion.trim() || undefined,
      codigosPermiso: Array.from(this.modalPermisos),
    }).subscribe({
      next: (nuevoRol) => {
        this.modalLoading = false;
        this.cerrarModal();
        if (!this.roles.some((r) => r.id === nuevoRol.id)) {
          this.roles = [...this.roles, nuevoRol];
        }
        this.selectRole(nuevoRol);
        this.rolPoolService.listar(this.selectedPool!.id).subscribe({
          next: (rs) => {
            this.roles = rs;
            const match = rs.find((r) => r.id === nuevoRol.id);
            if (match) this.selectRole(match);
          },
        });
      },
      error: (err) => {
        this.modalLoading = false;
        this.modalError = err.error?.message ?? 'Error al crear el rol.';
      },
    });
  }
}
