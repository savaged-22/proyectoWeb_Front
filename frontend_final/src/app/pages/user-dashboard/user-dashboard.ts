import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { EmpresaDetail, EmpresaListItem } from '../../core/models/empresa';
import { EmpresaService } from '../../services/empresa.service';
import { SuperadminService } from '../../services/superadmin.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-dashboard.html',
  styleUrls: ['./user-dashboard.css'],
})
export class UserDashboardComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private superadminService = inject(SuperadminService);
  private auth = inject(AuthService);

  empresa?: EmpresaDetail;
  loading = true;
  error = '';

  email = '';
  empresaNombre = '';

  // Dashboard Lulo: stats globales
  isLuloInternal = false;
  empresasCliente: EmpresaListItem[] = [];
  loadingEmpresas = false;

  ngOnInit(): void {
    const session = this.auth.getSession();
    if (!session) {
      this.error = 'No hay sesión activa.';
      this.loading = false;
      return;
    }
    this.email = session.email;
    this.empresaNombre = session.empresaNombre;
    this.isLuloInternal = this.auth.isLuloInternal();

    if (this.isLuloInternal) {
      // Vista Lulo: lista de empresas clientes y stats agregadas.
      this.loadingEmpresas = true;
      this.superadminService.listarEmpresas().subscribe({
        next: (list) => {
          this.empresasCliente = list;
          this.loadingEmpresas = false;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.error = 'No se pudo cargar el listado de empresas.';
          this.loadingEmpresas = false;
          this.loading = false;
        },
      });
      return;
    }

    // Vista usuario de empresa cliente
    this.empresaService.detalle(session.empresaId).subscribe({
      next: (e) => {
        this.empresa = e;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar la información de la empresa.';
        this.loading = false;
      },
    });
  }

  // ── Getters para vista Lulo ────────────────────────────────────────
  get totalEmpresas(): number { return this.empresasCliente.length; }
  get totalUsuariosCliente(): number {
    return this.empresasCliente.reduce((a, e) => a + (e.totalUsuarios || 0), 0);
  }
  get totalProcesosCliente(): number {
    return this.empresasCliente.reduce((a, e) => a + (e.totalProcesos || 0), 0);
  }
  get ultimasEmpresas(): EmpresaListItem[] {
    return [...this.empresasCliente]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 5);
  }
}
