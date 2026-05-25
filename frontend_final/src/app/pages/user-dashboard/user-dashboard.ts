import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HttpClient } from '@angular/common/http';

import { EmpresaDetail, EmpresaListItem } from '../../core/models/empresa';
import { EmpresaService } from '../../services/empresa.service';
import { SuperadminService } from '../../services/superadmin.service';
import { AuthService } from '../../services/auth.service';
import { RolPoolService } from '../../services/rol-pool.service';
import { environment } from '../../../environments/environment';

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
  private rolPoolService = inject(RolPoolService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  empresa?: EmpresaDetail;
  loading = true;
  error = '';

  email = '';
  empresaNombre = '';

  // Dashboard Lulo: stats globales
  isLuloInternal = false;
  empresasCliente: EmpresaListItem[] = [];
  loadingEmpresas = false;

  // Stats internas Lulo (para usuarios sin EMPRESA_VER)
  totalUsuariosLulo = 0;
  totalRolesLulo = 0;
  ultimosUsuariosLulo: { email: string; estado: string }[] = [];

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
      this.loadingEmpresas = true;

      // Lista empresas solo si tiene permiso (no rebota 403).
      if (this.auth.isSuperadmin() || this.auth.can('EMPRESA_VER')) {
        this.superadminService.listarEmpresas().subscribe({
          next: (list) => { this.empresasCliente = list; },
          error: () => { this.empresasCliente = []; },
        });
      }

      // Stats internas Lulo (usuarios + roles) si tiene permiso para verlos.
      if (this.auth.isSuperadmin() || this.auth.can('LULO_USUARIO_VER')) {
        this.http.get<any[]>(`${environment.apiUrl}/users`).subscribe({
          next: (users) => {
            const internos = users.filter(u =>
              (u.email || '').toLowerCase().endsWith('@lulo.app'));
            this.totalUsuariosLulo = internos.length;
            this.ultimosUsuariosLulo = internos.slice(0, 5)
              .map(u => ({ email: u.email, estado: u.estado }));
          },
          error: () => {},
        });
      }
      if (this.auth.isSuperadmin() || this.auth.can('LULO_ROL_GESTIONAR')) {
        const poolId = session.poolId;
        if (poolId) {
          this.rolPoolService.listar(poolId).subscribe({
            next: (roles) => { this.totalRolesLulo = roles.length; },
            error: () => {},
          });
        }
      }

      this.loadingEmpresas = false;
      this.loading = false;
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

  // ── Capabilities (controlan qué cards se muestran en el dashboard) ────
  get esSuperadmin(): boolean { return this.auth.isSuperadmin(); }
  get puedeVerEmpresas(): boolean { return this.esSuperadmin || this.auth.can('EMPRESA_VER'); }
  get puedeGestionarEmpresas(): boolean {
    return this.esSuperadmin || this.auth.can('EMPRESA_CREAR') || this.auth.can('EMPRESA_EDITAR');
  }
  get puedeVerUsuariosLulo(): boolean {
    return this.esSuperadmin || this.auth.can('LULO_USUARIO_VER');
  }
  get puedeGestionarRolesLulo(): boolean {
    return this.esSuperadmin || this.auth.can('LULO_ROL_GESTIONAR');
  }
  get puedeVerAuditoria(): boolean {
    return this.esSuperadmin || this.auth.can('AUDIT_GLOBAL_VER') || this.auth.can('METRICAS_VER');
  }
  get puedeVerSoporte(): boolean {
    return this.esSuperadmin || this.auth.can('SOPORTE_PROCESOS_VER');
  }

  /**
   * Rol bonito para mostrar en saludo. "SuperAdmin" / "Gestor de Empresas" /
   * etc. (viene del rol_pool asignado, no del tipo global).
   */
  get rolDisplay(): string {
    const s = this.auth.getSession();
    return s?.rolPoolNombre || s?.rol || 'Usuario';
  }
}
