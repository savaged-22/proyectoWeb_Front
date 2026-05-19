import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Pool } from '../../core/models/pool';
import { Permiso, RolPool } from '../../core/models/rol-pool';
import { PoolService } from '../../services/pool.service';
import { RolPoolService } from '../../services/rol-pool.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
