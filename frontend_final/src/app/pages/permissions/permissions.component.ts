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

  showModal = false;
  modalNombre = '';
  modalDescripcion = '';
  modalPermisos: Set<string> = new Set();
  modalLoading = false;
  modalError = '';

  ngOnInit(): void {
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

  // ── Matriz interactiva: prender/apagar permisos del rol ─────────────────
  guardandoCodigo: string | null = null;
  matrizError = '';

  togglePermisoRol(rol: RolPool, codigo: string): void {
    if (rol.esPropietario || this.guardandoCodigo) return;

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

  // ── Catálogo de permisos agrupado para el modal ─────────────────────────
  private static readonly GRUPOS: { prefijo: string; label: string; icono: string }[] = [
    { prefijo: 'PROCESO',  label: 'Procesos', icono: 'procesos' },
    { prefijo: 'DIAGRAMA', label: 'Diagrama', icono: 'diagrama' },
    { prefijo: 'ROL',      label: 'Roles',    icono: 'roles' },
    { prefijo: 'USUARIO',  label: 'Usuarios', icono: 'usuarios' },
  ];

  private static readonly ICONOS_ACCION: Record<string, string> = {
    VER: 'eye', CREAR: 'plus', EDITAR: 'pencil', ELIMINAR: 'trash',
    PUBLICAR: 'publish', COMPARTIR: 'share', INVITAR: 'mail', REVOCAR: 'ban',
    ADMINISTRAR: 'cog',
  };

  private static readonly ETIQUETAS_ACCION: Record<string, string> = {
    VER: 'Ver', CREAR: 'Crear', EDITAR: 'Editar', ELIMINAR: 'Eliminar',
    PUBLICAR: 'Publicar', COMPARTIR: 'Compartir', INVITAR: 'Invitar',
    REVOCAR: 'Revocar', ADMINISTRAR: 'Administrar',
  };

  /** Agrupa el catálogo por prefijo del código; lo no reconocido va a "Administración". */
  get gruposPermiso(): { label: string; icono: string; permisos: Permiso[] }[] {
    const grupos = PermissionsComponent.GRUPOS.map((g) => ({
      label: g.label,
      icono: g.icono,
      permisos: this.catalogoPermisos.filter((p) => p.codigo.startsWith(g.prefijo + '_')),
    }));
    const conocidos = new Set(grupos.flatMap((g) => g.permisos.map((p) => p.codigo)));
    const otros = this.catalogoPermisos.filter((p) => !conocidos.has(p.codigo));
    if (otros.length) grupos.push({ label: 'Administración', icono: 'cog', permisos: otros });
    return grupos.filter((g) => g.permisos.length > 0);
  }

  iconoPermiso(codigo: string): string {
    const accion = codigo.split('_')[1] ?? '';
    return PermissionsComponent.ICONOS_ACCION[accion] ?? 'key';
  }

  etiquetaPermiso(codigo: string): string {
    const accion = codigo.split('_')[1] ?? codigo;
    return PermissionsComponent.ETIQUETAS_ACCION[accion] ?? accion.toLowerCase();
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
        this.rolPoolService.listar(this.selectedPool!.id).subscribe({
          next: (rs) => {
            this.roles = rs;
            this.selectRole(nuevoRol);
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
