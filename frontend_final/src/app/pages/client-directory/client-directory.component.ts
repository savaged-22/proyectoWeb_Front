import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { EmpresaListItem, RegistroEmpresaRequest } from '../../core/models/empresa';
import { EmpresaService } from '../../services/empresa.service';

@Component({
  selector: 'app-client-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './client-directory.component.html',
  styleUrls: ['./client-directory.component.css'],
})
export class ClientDirectoryComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private router = inject(Router);

  empresas: EmpresaListItem[] = [];
  loading = true;
  loadError = '';

  // form state
  form: RegistroEmpresaRequest = {
    nombreEmpresa: '',
    nit: '',
    emailContacto: '',
    emailAdmin: '',
    password: '',
  };
  saving = false;
  saveError = '';
  saveSuccess = '';

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.empresaService.listar().subscribe({
      next: (list) => {
        this.empresas = list;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loadError = 'No se pudo obtener el directorio de empresas.';
        this.loading = false;
      },
    });
  }

  submit(): void {
    if (
      !this.form.nombreEmpresa.trim() ||
      !this.form.nit.trim() ||
      !this.form.emailAdmin.trim() ||
      !this.form.password.trim()
    ) {
      this.saveError = 'Completa los campos obligatorios.';
      return;
    }
    this.saving = true;
    this.saveError = '';
    this.saveSuccess = '';
    // emailContacto cae al admin si no se proporciona
    const body: RegistroEmpresaRequest = {
      ...this.form,
      emailContacto: this.form.emailContacto || this.form.emailAdmin,
    };
    this.empresaService.registrar(body).subscribe({
      next: (res) => {
        this.saveSuccess = `${res.empresaNombre} registrada correctamente.`;
        this.saving = false;
        this.form = {
          nombreEmpresa: '',
          nit: '',
          emailContacto: '',
          emailAdmin: '',
          password: '',
        };
        this.refresh();
      },
      error: (err) => {
        console.error(err);
        this.saving = false;
        this.saveError =
          err?.error?.message ?? 'No se pudo registrar la empresa.';
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

  tier(e: EmpresaListItem): { label: string; color: string } {
    if (e.totalProcesos > 50) return { label: 'PLATINUM', color: 'blue' };
    if (e.totalProcesos > 10) return { label: 'ENTERPRISE', color: 'green' };
    if (e.totalUsuarios === 0)  return { label: 'PENDING', color: 'amber' };
    return { label: 'GROWTH', color: 'gray' };
  }

  get totalUsuariosSum(): number {
    return this.empresas.reduce((a, e) => a + e.totalUsuarios, 0);
  }

  get totalProcesosSum(): number {
    return this.empresas.reduce((a, e) => a + e.totalProcesos, 0);
  }
}
