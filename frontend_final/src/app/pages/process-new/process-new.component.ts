import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { Pool } from '../../core/models/pool';
import { PoolService } from '../../services/pool.service';
import { ProcesoService } from '../../services/proceso.service';
import { Proceso } from '../../models/proceso/proceso.model';

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
  private route = inject(ActivatedRoute);

  pools: Pool[] = [];
  plantillas: Proceso[] = [];
  loadingPools = true;
  loadingPlantillas = false;
  poolsError = '';

  isTemplate = false;

  // form state
  nombre = '';
  descripcion = '';
  categoria = 'admin';
  prioridad: 'low' | 'medium' | 'high' = 'medium';
  poolIdSeleccionado = '';
  disenoBaseId = '';

  saving = false;
  saveError = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.isTemplate = params['isTemplate'] === 'true';
      if (!this.isTemplate) {
        this.cargarPlantillas();
      }
    });

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

  cargarPlantillas() {
    this.loadingPlantillas = true;
    this.procesoService.listar({ size: 100 }).subscribe({
      next: (page) => {
        this.plantillas = (page.content || []).filter(p => p.esPlantilla);
        this.loadingPlantillas = false;
      },
      error: (err) => {
        console.error('Error cargando plantillas', err);
        this.loadingPlantillas = false;
      }
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
    
    const payload: any = {
      poolId: this.poolIdSeleccionado,
      nombre: this.nombre.trim(),
      descripcion: this.descripcion.trim(),
      categoria: this.categoria,
      esPlantilla: this.isTemplate
    };

    if (!this.isTemplate && this.disenoBaseId) {
      payload.disenoBaseId = this.disenoBaseId;
    }

    this.procesoService
      .crear(payload)
      .subscribe({
        next: (res) => {
          this.saving = false;
          if (this.isTemplate) {
            this.router.navigate(['/app/process-builder'], { queryParams: { id: res.id } });
          } else {
            this.router.navigate(['/app/processes']);
          }
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
