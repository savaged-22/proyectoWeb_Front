import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    this.router.navigate(['/app/processes']);
  }
}
