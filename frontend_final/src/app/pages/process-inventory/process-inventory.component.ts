import { Component, OnInit, inject, HostListener } from '@angular/core';
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
  plantillasArchivadas: Proceso[] = [];
  procesosNormales: Proceso[] = [];
  procesosArchivados: Proceso[] = [];
  loading = true;
  error = '';

  filterCategoria = '';
  filterEstado = '';
  searchNombre = '';

  isTemplatesExpanded = true;
  isProcessesExpanded = true;
  templatesView: 'table' | 'card' = 'table';
  processesView: 'table' | 'card' = 'table';

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
          this.procesos = page.content ?? [];
          
          this.plantillas = this.procesos.filter(p => p.esPlantilla && p.estado?.toUpperCase() !== 'ARCHIVADO');
          this.plantillasArchivadas = this.procesos.filter(p => p.esPlantilla && p.estado?.toUpperCase() === 'ARCHIVADO');
          
          this.procesosNormales = this.procesos.filter(p => !p.esPlantilla && p.estado?.toUpperCase() !== 'ARCHIVADO');
          this.procesosArchivados = this.procesos.filter(p => !p.esPlantilla && p.estado?.toUpperCase() === 'ARCHIVADO');
          
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

  toggleTemplates() {
    this.isTemplatesExpanded = !this.isTemplatesExpanded;
  }

  toggleProcesses() {
    this.isProcessesExpanded = !this.isProcessesExpanded;
  }

  // Mapa de transiciones válidas
  readonly transiciones: Record<string, string[]> = {
    'BORRADOR':   ['ACTIVO'],
    'ACTIVO':     ['PUBLICADO', 'INACTIVO'],
    'PUBLICADO':  ['INACTIVO'],
    'INACTIVO':   ['ARCHIVADO'],
    'ARCHIVADO':  []
  };

  getTransiciones(estado: string): string[] {
    return this.transiciones[estado?.toUpperCase() || ''] ?? [];
  }

  tieneTransiciones(estado: string): boolean {
    return this.getTransiciones(estado).length > 0;
  }

  // Estado del dropdown por proceso
  openDropdownId: string | null = null;
  loadingEstadoId: string | null = null;

  toggleDropdown(event: Event, procesoId: string) {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === procesoId ? null : procesoId;
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event) {
    this.openDropdownId = null;
  }

  cambiarEstado(proceso: any, nuevoEstado: string) {
    this.loadingEstadoId = proceso.id;
    this.openDropdownId = null;
    this.procesoService.cambiarEstado(proceso.id, nuevoEstado).subscribe({
      next: () => {
        proceso.estado = nuevoEstado;
        this.loadingEstadoId = null;
        this.mostrarToast('Estado actualizado a ' + nuevoEstado, 'success');
      },
      error: () => {
        this.loadingEstadoId = null;
        this.mostrarToast('Error al actualizar el estado', 'error');
      }
    });
  }

  procesoAArchivar: any = null;
  showArchiveModal = false;

  abrirModalArchivar(proceso: any) {
    this.procesoAArchivar = proceso;
    this.showArchiveModal = true;
  }

  confirmarArchivado() {
    if (!this.procesoAArchivar) return;
    this.cambiarEstado(this.procesoAArchivar, 'ARCHIVADO');
    this.showArchiveModal = false;
    this.procesoAArchivar = null;
  }

  cancelarArchivado() {
    this.showArchiveModal = false;
    this.procesoAArchivar = null;
  }

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;

  mostrarToast(mensaje: string, tipo: 'success' | 'error') {
    this.toastMessage = mensaje;
    this.toastType = tipo;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }
}
