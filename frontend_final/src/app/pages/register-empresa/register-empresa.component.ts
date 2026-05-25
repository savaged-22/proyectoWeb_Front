import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

import { environment } from '../../../environments/environment';
import {
  RegistroEmpresaRequest,
  RegistroEmpresaResponse,
} from '../../core/models/empresa';

/**
 * Auto-registro público de empresa (HU-01).
 * Llama POST /api/public/empresas/registro (sin auth).
 * Tras éxito redirige a /login con el email pre-cargado.
 */
@Component({
  selector: 'app-register-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register-empresa.component.html',
  styleUrls: ['./register-empresa.component.css'],
})
export class RegisterEmpresaPage {
  private http = inject(HttpClient);
  private router = inject(Router);

  form: RegistroEmpresaRequest = {
    nombreEmpresa: '',
    nit: '',
    dominio: '',
    emailContacto: '',
    emailAdmin: '',
    password: '',
  };

  showPassword = signal(false);
  busy = signal(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  /** Email termina con @dominio. */
  emailValido(): boolean {
    const d = (this.form.dominio || '').trim().toLowerCase();
    const e = (this.form.emailAdmin || '').trim().toLowerCase();
    return !!d && !!e && e.endsWith('@' + d);
  }

  sugerirEmail(): void {
    if (this.form.dominio && !this.form.emailAdmin) {
      this.form.emailAdmin = 'admin@' + this.form.dominio.toLowerCase().trim();
    }
  }

  submit(): void {
    const f = this.form;
    if (!f.nombreEmpresa.trim() || !f.nit.trim() || !f.dominio.trim()
        || !f.emailAdmin.trim() || !f.password.trim()) {
      this.error.set('Please fill in all required fields.');
      return;
    }
    if (!this.emailValido()) {
      this.error.set(`Admin email must end in @${f.dominio}`);
      return;
    }
    if (f.password.length < 8) {
      this.error.set('Password must be at least 8 characters.');
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    this.exito.set(null);

    const body: RegistroEmpresaRequest = {
      ...f,
      dominio: f.dominio.toLowerCase().trim(),
      emailContacto: f.emailContacto || f.emailAdmin,
    };

    this.http.post<RegistroEmpresaResponse>(
      `${environment.apiUrl}/public/empresas/registro`, body,
    ).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.exito.set(
          `${res.empresaNombre} registered. You can now log in as ${res.emailAdmin}.`,
        );
        setTimeout(() => {
          this.router.navigate(['/login'], { queryParams: { email: res.emailAdmin } });
        }, 1500);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message || err?.error?.error || 'Could not register the company.');
      },
    });
  }
}
