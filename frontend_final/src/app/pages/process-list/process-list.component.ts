import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProcesoService, ProcesoResponse } from '../../services/proceso.service';
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

  procesos: ProcesoResponse[] = [];
  isLoading = true;
  errorMsg = '';

  ngOnInit() {
    this.cargarProcesos();
  }

  cargarProcesos() {
    const empresaId = this.authService.getEmpresaId();
    const usuarioId = this.authService.getUsuarioId();

    if (!empresaId || !usuarioId) {
      this.errorMsg = 'No se encontró información de la sesión. Por favor re-inicia sesión.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.procesoService.listar(empresaId, usuarioId).subscribe({
      next: (response: any) => {
        console.log('Backend response:', response);
        // Manejamos si viene en .content (Page) o si es un array directo
        if (Array.isArray(response)) {
          this.procesos = response;
        } else if (response && response.content) {
          this.procesos = response.content;
        } else {
          this.procesos = [];
        }
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
