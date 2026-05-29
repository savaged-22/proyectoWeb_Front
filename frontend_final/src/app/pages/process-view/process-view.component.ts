import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ProcessViewerComponent } from '../../components/process-viewer/process-viewer.component';
import { AuthService } from '../../services/auth.service';

/**
 * Página visor de proceso (modo read-only). Usa el componente reutilizable
 * <app-process-viewer> y añade botones para volver / editar (si tiene permiso).
 */
@Component({
  selector: 'app-process-view',
  standalone: true,
  imports: [CommonModule, RouterModule, ProcessViewerComponent],
  templateUrl: './process-view.component.html',
  styleUrls: ['./process-view.component.css'],
})
export class ProcessViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private location = inject(Location);

  procesoId: string | null = null;

  ngOnInit(): void {
    this.procesoId = this.route.snapshot.paramMap.get('id');
  }

  puedeEditar(): boolean {
    return this.auth.can('PROCESO_EDITAR');
  }

  irAEditar(): void {
    if (!this.procesoId) return;
    this.router.navigate(['/app/process-builder'], { queryParams: { id: this.procesoId } });
  }

  volver(): void {
    const qp = this.route.snapshot.queryParamMap;
    const back = qp.get('back');
    const empresaId = qp.get('empresa');

    // Vino del inspector de procesos: regresa con la empresa pre-seleccionada
    // (no a la lista de empresas).
    if (back === 'soporte') {
      this.router.navigate(['/app/lulo/soporte'], {
        queryParams: empresaId ? { empresa: empresaId } : {},
      });
      return;
    }
    // Vino del detalle de empresa cliente.
    if (back === 'clients' && empresaId) {
      this.router.navigate(['/app/clients', empresaId]);
      return;
    }
    // Fallback: usar historia del navegador, o contextual.
    if (window.history.length > 1) {
      this.location.back();
    } else if (this.auth.isLuloInternal()) {
      this.router.navigate(['/app/lulo/soporte']);
    } else {
      this.router.navigate(['/app/processes']);
    }
  }
}
