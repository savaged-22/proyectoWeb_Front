import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { SuperadminService } from '../../services/superadmin.service';
import {
  EmpresaListItem,
  RegistroEmpresaRequest,
} from '../../core/models/empresa';

@Component({
  selector: 'app-superadmin-empresas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './superadmin-empresas.component.html',
  styleUrls: ['./superadmin-empresas.component.css'],
})
export class SuperadminEmpresasComponent implements OnInit {
  private superadmin = inject(SuperadminService);
  private router = inject(Router);

  empresas = signal<EmpresaListItem[]>([]);
  cargando = signal(false);
  mostrarFormulario = signal(false);
  error = signal<string | null>(null);
  enviando = signal(false);

  nueva: RegistroEmpresaRequest = this.emptyForm();

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.superadmin.listarEmpresas().subscribe({
      next: (data) => {
        this.empresas.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(this.extraerError(err));
        this.cargando.set(false);
      },
    });
  }

  abrirFormulario(): void {
    this.nueva = this.emptyForm();
    this.error.set(null);
    this.mostrarFormulario.set(true);
  }

  cancelar(): void {
    this.mostrarFormulario.set(false);
    this.nueva = this.emptyForm();
  }

  guardar(): void {
    if (!this.nueva.nombreEmpresa || !this.nueva.nit || !this.nueva.emailAdmin || !this.nueva.password) {
      this.error.set('Completa todos los campos requeridos');
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.superadmin.crearEmpresa(this.nueva).subscribe({
      next: () => {
        this.enviando.set(false);
        this.mostrarFormulario.set(false);
        this.cargar();
      },
      error: (err) => {
        this.error.set(this.extraerError(err));
        this.enviando.set(false);
      },
    });
  }

  verDetalle(emp: EmpresaListItem): void {
    this.router.navigate(['/app/clients', emp.id]);
  }

  trackById(_i: number, e: EmpresaListItem): string {
    return e.id;
  }

  private emptyForm(): RegistroEmpresaRequest {
    return {
      nombreEmpresa: '',
      nit: '',
      dominio: '',
      emailContacto: '',
      emailAdmin: '',
      password: '',
    };
  }

  private extraerError(err: any): string {
    return err?.error?.error || err?.error?.message || err?.message || 'Error desconocido';
  }
}
