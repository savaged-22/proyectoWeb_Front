import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { Proceso } from '../../models/proceso/proceso.model';
import { ProcesoService } from '../../services/proceso.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-process-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './process-inventory.component.html',
  styleUrls: ['./process-inventory.component.css'],
})
export class ProcessInventoryComponent implements OnInit {
  private procesoService = inject(ProcesoService);
  private auth = inject(AuthService);

  procesos: Proceso[] = [];
  plantillas: Proceso[] = [];
  procesosNormales: Proceso[] = [];
  loading = true;
  error = '';

  filterCategoria = '';
  filterEstado = '';
  searchNombre = '';

  total = 0;
  totalActivos = 0;
  totalCompartidos = 0;
  utilizacion = 0;

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    if (!this.auth.isAuthenticated()) {
      this.error = 'Sesión no encontrada. Inicia sesión nuevamente.';
      this.loading = false;
      return;
    }
    this.loading = true;
    this.procesoService
      .listar({
        categoria: this.filterCategoria || undefined,
        estado: this.filterEstado || undefined,
        nombre: this.searchNombre || undefined,
        size: 50,
      })
      .subscribe({
        next: (page) => {
          this.procesos = page.content ?? [];
          this.plantillas = this.procesos.filter(p => p.esPlantilla);
          this.procesosNormales = this.procesos.filter(p => !p.esPlantilla);
          
          this.total = page.totalElements ?? this.procesos.length;
          this.totalActivos = this.procesos.filter((p) => p.activo).length;
          this.totalCompartidos = 0;
          this.utilizacion = this.total > 0
            ? Math.round((this.totalActivos / this.total) * 100)
            : 0;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.error =
            'No se pudieron cargar los procesos. Verifica tu sesión y la conexión con el backend.';
          this.loading = false;
        },
      });
  }

  applyFilters(): void {
    this.fetch();
  }

  badgeForEstado(estado: string): string {
    const map: Record<string, string> = {
      borrador: 'amber',
      activo: 'green',
      publicado: 'green',
      archivado: 'gray',
    };
    return map[(estado || '').toLowerCase()] ?? 'blue';
  }
}
