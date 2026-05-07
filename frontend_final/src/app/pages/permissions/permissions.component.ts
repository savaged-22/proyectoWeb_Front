import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Pool } from '../../core/models/pool';
import { Permiso, RolPool } from '../../core/models/rol-pool';
import { PoolService } from '../../services/pool.service';
import { RolPoolService } from '../../services/rol-pool.service';

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

  pools: Pool[] = [];
  selectedPool?: Pool;

  roles: RolPool[] = [];
  selectedRole?: RolPool;
  catalogoPermisos: Permiso[] = [];

  loading = true;
  error = '';

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
}
