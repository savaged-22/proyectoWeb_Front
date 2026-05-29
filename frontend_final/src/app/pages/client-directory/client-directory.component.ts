import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import {
  EditarEmpresaRequest,
  EmpresaListItem,
  RegistroEmpresaRequest,
} from '../../core/models/empresa';
import { SuperadminService } from '../../services/superadmin.service';
import { AuthService } from '../../services/auth.service';
import { IconComponent } from '../../shared/icon.component';
import { descargarCsv, timestampFileSafe } from '../../core/csv-export';

type ModalMode = null | 'crear' | 'editar' | 'eliminar';

@Component({
  selector: 'app-client-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './client-directory.component.html',
  styleUrls: ['./client-directory.component.css'],
})
export class ClientDirectoryComponent implements OnInit {
  private superadmin = inject(SuperadminService);
  private router = inject(Router);
  private auth = inject(AuthService);

  get puedeCrear(): boolean { return this.auth.isSuperadmin() || this.auth.can('EMPRESA_CREAR'); }
  get puedeEditar(): boolean { return this.auth.isSuperadmin() || this.auth.can('EMPRESA_EDITAR'); }
  get puedeEliminar(): boolean { return this.auth.isSuperadmin() || this.auth.can('EMPRESA_ELIMINAR'); }

  empresas: EmpresaListItem[] = [];
  loading = true;
  loadError = '';

  // Filtros
  filtroTexto = '';
  filtroEstado: '' | 'CON_USUARIOS' | 'SIN_USUARIOS' = '';
  filtroDesde = '';
  filtroHasta = '';
  ordenarPor: 'recientes' | 'antiguas' | 'nombre' | 'usuarios' = 'recientes';

  // estado del modal único (crear/editar/eliminar)
  modal: ModalMode = null;
  modalEmpresa: EmpresaListItem | null = null;
  busy = false;
  error = '';
  ok = '';

  // form crear
  formCrear: RegistroEmpresaRequest = this.emptyCrear();
  emailLocal = '';
  showPassword = false;

  togglePassword(): void { this.showPassword = !this.showPassword; }

  // form editar
  formEditar: EditarEmpresaRequest = {};

  // confirmación borrado
  confirmTextoBorrar = '';

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.superadmin.listarEmpresas().subscribe({
      next: (list) => {
        this.empresas = list;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loadError = this.extractError(err) || 'No se pudo obtener el directorio.';
        this.loading = false;
      },
    });
  }

  abrirCrear(): void {
    this.modal = 'crear';
    this.modalEmpresa = null;
    this.formCrear = this.emptyCrear();
    this.emailLocal = '';
    this.showPassword = false;
    this.error = ''; this.ok = '';
  }

  abrirEditar(e: EmpresaListItem): void {
    this.modal = 'editar';
    this.modalEmpresa = e;
    this.formEditar = {
      nombreEmpresa: e.nombre,
      dominio: e.dominio || '',
      emailContacto: e.emailContacto || '',
      nuevoEmailAdmin: '',
      nuevoPasswordAdmin: '',
    };
    this.error = ''; this.ok = '';
  }

  abrirEliminar(e: EmpresaListItem): void {
    this.modal = 'eliminar';
    this.modalEmpresa = e;
    this.confirmTextoBorrar = '';
    this.error = ''; this.ok = '';
  }

  cerrarModal(): void {
    if (this.busy) return;
    this.modal = null;
    this.modalEmpresa = null;
  }

  // ── Crear ─────────────────────────────────────────────────────────────
  submitCrear(): void {
    const f = this.formCrear;
    const dominio = (f.dominio || '').toLowerCase().trim();
    f.emailAdmin = this.emailLocal && dominio ? `${this.emailLocal}@${dominio}` : '';
    if (!f.nombreEmpresa.trim() || !f.nit.trim() || !dominio ||
        !this.emailLocal.trim() || !f.password.trim()) {
      this.error = 'Completa los campos obligatorios.';
      return;
    }
    const nit = f.nit.trim();
    if (!/^\d{9}-\d$/.test(nit)) {
      this.error = 'Tax ID must have 9 digits, hyphen, and verification digit.';
      return;
    }
    this.busy = true; this.error = '';
    const body: RegistroEmpresaRequest = {
      ...f,
      dominio,
      emailContacto: f.emailAdmin,
    };
    this.superadmin.crearEmpresa(body).subscribe({
      next: () => {
        this.busy = false;
        this.cerrarModal();
        this.refresh();
      },
      error: (err) => {
        this.busy = false;
        this.error = this.extractError(err) || 'No se pudo registrar la empresa.';
      },
    });
  }

  // ── Editar ────────────────────────────────────────────────────────────
  submitEditar(): void {
    if (!this.modalEmpresa) return;
    const f = this.formEditar;
    const dominio = (f.dominio || this.modalEmpresa.dominio || '').toLowerCase();
    if (f.nuevoEmailAdmin && !this.emailEnDominio(f.nuevoEmailAdmin, dominio)) {
      this.error = `El correo del nuevo admin debe terminar en @${dominio}`;
      return;
    }
    this.busy = true; this.error = '';
    const body: EditarEmpresaRequest = { ...f };
    if (body.dominio) body.dominio = body.dominio.toLowerCase().trim();
    this.superadmin.editarEmpresa(this.modalEmpresa.id, body).subscribe({
      next: () => {
        this.busy = false;
        this.cerrarModal();
        this.refresh();
      },
      error: (err) => {
        this.busy = false;
        this.error = this.extractError(err) || 'No se pudo actualizar.';
      },
    });
  }

  // ── Eliminar ──────────────────────────────────────────────────────────
  submitEliminar(): void {
    if (!this.modalEmpresa) return;
    if (this.confirmTextoBorrar.trim() !== this.modalEmpresa.nombre) {
      this.error = 'Debes escribir el nombre exacto de la empresa.';
      return;
    }
    this.busy = true; this.error = '';
    this.superadmin.eliminarEmpresa(this.modalEmpresa.id, this.confirmTextoBorrar.trim())
      .subscribe({
        next: () => {
          this.busy = false;
          this.cerrarModal();
          this.refresh();
        },
        error: (err) => {
          this.busy = false;
          this.error = this.extractError(err) || 'No se pudo eliminar.';
        },
      });
  }

  open(id: string): void {
    this.router.navigate(['/app/clients', id]);
  }

  status(e: EmpresaListItem): { label: string; color: string } {
    if (e.totalUsuarios === 0) return { label: 'PENDING', color: 'amber' };
    return { label: 'ACTIVE', color: 'green' };
  }

  get totalUsuariosSum(): number {
    return this.empresas.reduce((a, e) => a + e.totalUsuarios, 0);
  }
  get totalProcesosSum(): number {
    return this.empresas.reduce((a, e) => a + e.totalProcesos, 0);
  }

  trackById(_i: number, e: EmpresaListItem): string { return e.id; }

  get empresasFiltradas(): EmpresaListItem[] {
    let list = [...this.empresas];
    const q = this.filtroTexto.trim().toLowerCase();
    if (q) {
      list = list.filter(e =>
        e.nombre.toLowerCase().includes(q)
        || e.nit.toLowerCase().includes(q)
        || (e.dominio || '').toLowerCase().includes(q)
        || (e.emailContacto || '').toLowerCase().includes(q));
    }
    if (this.filtroEstado === 'CON_USUARIOS') {
      list = list.filter(e => e.totalUsuarios > 0);
    } else if (this.filtroEstado === 'SIN_USUARIOS') {
      list = list.filter(e => e.totalUsuarios === 0);
    }
    if (this.filtroDesde) {
      const desde = new Date(this.filtroDesde).getTime();
      list = list.filter(e => new Date(e.createdAt).getTime() >= desde);
    }
    if (this.filtroHasta) {
      // incluye día completo (hasta 23:59:59)
      const hasta = new Date(this.filtroHasta).getTime() + 86400000 - 1;
      list = list.filter(e => new Date(e.createdAt).getTime() <= hasta);
    }
    switch (this.ordenarPor) {
      case 'recientes':
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        break;
      case 'antiguas':
        list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        break;
      case 'nombre':
        list.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'usuarios':
        list.sort((a, b) => (b.totalUsuarios || 0) - (a.totalUsuarios || 0));
        break;
    }
    return list;
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroEstado = '';
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.ordenarPor = 'recientes';
  }

  get hayFiltrosActivos(): boolean {
    return !!(this.filtroTexto || this.filtroEstado || this.filtroDesde || this.filtroHasta);
  }

  /**
   * Empresa propietaria de la app (Lulo). Protegida contra edición/borrado
   * para evitar que se desactive accidentalmente al SUPERADMIN.
   */
  exportarEmpresasCsv(): void {
    descargarCsv('empresas-' + timestampFileSafe() + '.csv', {
      'Empresa':       e => e.nombre,
      'NIT':           e => e.nit,
      'Dominio':       e => e.dominio || '',
      'Contacto':      e => e.emailContacto || '',
      'Usuarios':      e => e.totalUsuarios,
      'Procesos':      e => e.totalProcesos,
      'Pools':         e => e.totalPools,
      'Creada':        e => e.createdAt,
    }, this.empresasFiltradas);
  }

  esLuloOwner(e: EmpresaListItem): boolean {
    return e.nit === 'LULO-APP';
  }

  /** Sugerencia de email admin a partir del dominio. */
  blockNitChar(e: KeyboardEvent): void {
    if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
  }

  setNit(value: string): void {
    const digits = (value || '').replace(/\D/g, '').slice(0, 10);
    this.formCrear.nit = digits.length <= 9 ? digits : `${digits.slice(0, 9)}-${digits.slice(9)}`;
  }

  setNombreEmpresa(value: string): void {
    const v = value || '';
    this.formCrear.nombreEmpresa = v ? v.charAt(0).toUpperCase() + v.slice(1) : '';
  }

  setEmailLocal(value: string): void {
    this.emailLocal = (value || '').toLowerCase().replace(/[^a-z0-9._\-+]/g, '');
  }

  sugerirEmail(): void {
    if (this.formCrear.dominio && !this.formCrear.emailAdmin) {
      this.formCrear.emailAdmin = `admin@${this.formCrear.dominio.toLowerCase().trim()}`;
    }
  }

  private emailEnDominio(email: string, dominio: string): boolean {
    if (!email || !dominio) return false;
    return email.toLowerCase().endsWith('@' + dominio.toLowerCase());
  }

  private emptyCrear(): RegistroEmpresaRequest {
    return {
      nombreEmpresa: '', nit: '', dominio: '',
      emailContacto: '', emailAdmin: '', password: '',
    };
  }

  private extractError(err: any): string {
    return err?.error?.error || err?.error?.message || err?.message || '';
  }
}
