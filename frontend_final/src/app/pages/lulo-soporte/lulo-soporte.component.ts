import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';

import { SuperadminService } from '../../services/superadmin.service';
import { AuthService } from '../../services/auth.service';
import { EmpresaListItem } from '../../core/models/empresa';
import { environment } from '../../../environments/environment';

interface ProcesoCliente {
  id: string;
  nombre: string;
  categoria?: string;
  estado: string;
  createdAt: string;
}

/**
 * Soporte: el equipo Lulo selecciona una empresa cliente y consulta sus
 * procesos en modo solo lectura (SOPORTE_PROCESOS_VER o SUPERADMIN).
 * No expone botones de edición — el backend además rechaza 403 si el caller
 * es SUPERADMIN (Lulo no opera procesos cliente).
 */
@Component({
  selector: 'app-lulo-soporte',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lulo-soporte.component.html',
  styleUrls: ['./lulo-soporte.component.css'],
})
export class LuloSoporteComponent implements OnInit {
  private superadmin = inject(SuperadminService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  empresas = signal<EmpresaListItem[]>([]);
  selectedEmpresa = signal<EmpresaListItem | null>(null);
  procesos = signal<ProcesoCliente[]>([]);
  loadingEmpresas = signal(true);
  loadingProcesos = signal(false);
  error = signal<string | null>(null);
  filtroEmpresa = '';

  ngOnInit(): void {
    this.cargarEmpresas();
  }

  /** Si entra con ?empresa=<id> (vino del visor), reabre esa empresa. */
  private autoSeleccionarSiHayQuery(): void {
    const empresaId = this.route.snapshot.queryParamMap.get('empresa');
    if (!empresaId) return;
    const e = this.empresas().find(x => x.id === empresaId);
    if (e) this.abrir(e);
  }

  cargarEmpresas(): void {
    this.loadingEmpresas.set(true);
    this.superadmin.listarEmpresas().subscribe({
      next: (list) => {
        this.empresas.set(list);
        this.loadingEmpresas.set(false);
        this.autoSeleccionarSiHayQuery();
      },
      error: () => {
        this.error.set('No se pudieron cargar las empresas.');
        this.loadingEmpresas.set(false);
      },
    });
  }

  abrir(e: EmpresaListItem): void {
    this.selectedEmpresa.set(e);
    this.procesos.set([]);
    this.error.set(null);
    const session = this.auth.getSession();
    if (!session) return;
    this.loadingProcesos.set(true);
    const params = new HttpParams()
      .set('empresaId', e.id)
      .set('usuarioId', session.usuarioId)
      .set('size', '50');
    this.http
      .get<{ content: ProcesoCliente[] }>(`${environment.apiUrl}/procesos`, { params })
      .subscribe({
        next: (page) => {
          this.procesos.set(page.content ?? []);
          this.loadingProcesos.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'No se pudieron cargar los procesos.');
          this.loadingProcesos.set(false);
        },
      });
  }

  cerrar(): void {
    this.selectedEmpresa.set(null);
    this.procesos.set([]);
  }

  verProceso(p: ProcesoCliente): void {
    const empresaId = this.selectedEmpresa()?.id;
    this.router.navigate(['/app/process-view', p.id], {
      queryParams: { back: 'soporte', empresa: empresaId },
    });
  }

  get empresasFiltradas(): EmpresaListItem[] {
    const q = this.filtroEmpresa.trim().toLowerCase();
    if (!q) return this.empresas();
    return this.empresas().filter(e =>
      e.nombre.toLowerCase().includes(q)
      || e.nit.toLowerCase().includes(q)
      || (e.dominio || '').toLowerCase().includes(q));
  }
}
