import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { Pool } from '../../core/models/pool';
import { PoolService } from '../../services/pool.service';
import { ProcesoService } from '../../services/proceso.service';

@Component({
  selector: 'app-process-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './process-new.component.html',
  styleUrls: ['./process-new.component.css'],
})
export class ProcessNewComponent implements OnInit {
  private poolService = inject(PoolService);
  private procesoService = inject(ProcesoService);
  private router = inject(Router);

  pools: Pool[] = [];
  loadingPools = true;
  poolsError = '';

  // form state
  nombre = '';
  descripcion = '';
  categoria = 'admin';
  prioridad: 'low' | 'medium' | 'high' = 'medium';
  poolIdSeleccionado = '';

  saving = false;
  saveError = '';

  ngOnInit(): void {
    this.poolService.listar().subscribe({
      next: (pools) => {
        this.pools = pools;
        if (pools.length > 0) this.poolIdSeleccionado = pools[0].id;
        this.loadingPools = false;
      },
      error: () => {
        this.poolsError = 'No se pudieron cargar los pools.';
        this.loadingPools = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/app/processes']);
  }

  submit(): void {
    if (!this.nombre.trim() || !this.poolIdSeleccionado) {
      this.saveError = 'Ingresa un nombre y selecciona un pool.';
      return;
    }
    this.saving = true;
    this.saveError = '';
    this.procesoService
      .crear({
        poolId: this.poolIdSeleccionado,
        nombre: this.nombre.trim(),
        descripcion: this.descripcion.trim(),
        categoria: this.categoria,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/app/processes']);
        },
        error: (err) => {
          console.error(err);
          this.saving = false;
          this.saveError =
            err?.error?.message ?? 'No se pudo crear el proceso.';
        },
      });
  }
}
