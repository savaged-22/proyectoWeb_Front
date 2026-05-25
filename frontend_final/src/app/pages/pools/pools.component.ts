import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { Pool } from '../../core/models/pool';
import { PoolService } from '../../services/pool.service';
import { RolPoolService } from '../../services/rol-pool.service';
import { AuthService } from '../../services/auth.service';
import { RolPool } from '../../core/models/rol-pool';
import { IconComponent } from '../../shared/icon.component';

interface PoolDetail extends Pool {
  totalRoles?: number;
  rolesPreview?: RolPool[];
  loadingRoles?: boolean;
}

@Component({
  selector: 'app-pools',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './pools.component.html',
  styleUrls: ['./pools.component.css'],
})
export class PoolsComponent implements OnInit {
  private poolService = inject(PoolService);
  private rolPoolService = inject(RolPoolService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  pools: PoolDetail[] = [];
  loading = true;
  error = '';
  creating = false;
  showCreate = false;
  newPoolName = '';
  createError = '';
  selectedPool: PoolDetail | null = null;

  get puedeCrear(): boolean {
    return this.auth.isSuperadmin() || this.auth.can('POOL_ADMINISTRAR');
  }

  get puedeVerRoles(): boolean {
    return this.auth.isSuperadmin() || this.auth.can('ROL_VER') || this.auth.can('LULO_ROL_GESTIONAR');
  }

  get puedeVerProcesos(): boolean {
    return this.auth.isSuperadmin() || this.auth.can('PROCESO_VER');
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = '';
    this.poolService.listar().subscribe({
      next: (list) => {
        this.pools = list.map((p) => ({ ...p, loadingRoles: true }));
        this.loading = false;
        this.pools.forEach((p) => this.cargarRoles(p));
        const id = this.route.snapshot.queryParamMap.get('id');
        if (id) {
          const match = this.pools.find((p) => p.id === id);
          if (match) this.seleccionarPool(match);
        }
      },
      error: (err) => {
        console.error(err);
        this.error = 'Could not load pools.';
        this.loading = false;
      },
    });
  }

  private cargarRoles(p: PoolDetail): void {
    if (!this.puedeVerRoles) {
      p.loadingRoles = false;
      return;
    }
    this.rolPoolService.listar(p.id).subscribe({
      next: (rs) => {
        p.totalRoles = rs.length;
        p.rolesPreview = rs.slice(0, 4);
        p.loadingRoles = false;
      },
      error: () => { p.loadingRoles = false; },
    });
  }

  abrirCrear(): void {
    this.showCreate = true;
    this.newPoolName = '';
    this.createError = '';
  }

  cerrarCrear(): void {
    if (this.creating) return;
    this.showCreate = false;
  }

  seleccionarPool(p: PoolDetail): void {
    this.selectedPool = p;
    if (this.puedeVerRoles && p.totalRoles === undefined) {
      p.loadingRoles = true;
      this.cargarRoles(p);
    }
  }

  cerrarDetalle(): void {
    this.selectedPool = null;
  }

  crear(): void {
    const nombre = this.newPoolName.trim();
    if (!nombre) {
      this.createError = 'Name is required.';
      return;
    }
    this.creating = true;
    this.createError = '';
    this.poolService.crear(nombre).subscribe({
      next: (nuevo) => {
        this.creating = false;
        this.showCreate = false;
        const detail: PoolDetail = { ...nuevo, totalRoles: 0, rolesPreview: [], loadingRoles: false };
        this.pools = [detail, ...this.pools];
      },
      error: (err) => {
        this.creating = false;
        this.createError = err?.error?.message || err?.error?.error || 'Could not create pool.';
      },
    });
  }
}
