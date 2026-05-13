import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProcesoService } from '../../services/proceso.service';
import { Proceso } from '../../core/models/proceso';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-process-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './process-list.component.html',
  styleUrls: ['./process-list.component.css']
})
export class ProcessListComponent implements OnInit {
  private procesoService = inject(ProcesoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  procesos: Proceso[] = [];
  isLoading = true;
  errorMsg = '';

  ngOnInit() {
    this.cargarProcesos();
  }

  cargarProcesos() {
    if (!this.authService.isAuthenticated()) {
      this.errorMsg = 'No se encontró información de la sesión. Por favor re-inicia sesión.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.procesoService.listar().subscribe({
      next: (page) => {
        this.procesos = page?.content ?? [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar los procesos. Por favor intenta de nuevo.';
        this.isLoading = false;
        console.error('Error loading processes', err);
      }
    });
  }

  editarProceso(procesoId: string) {
    this.router.navigate(['/app/process-builder'], { queryParams: { id: procesoId } });
  }

  getEstadoClass(estado: string): string {
    const s = estado.toLowerCase();
    if (s.includes('borrador') || s.includes('draft')) return 'badge-draft';
    if (s.includes('activo') || s.includes('active')) return 'badge-active';
    if (s.includes('archivado') || s.includes('archived')) return 'badge-archived';
    return 'badge-default';
  }
}
