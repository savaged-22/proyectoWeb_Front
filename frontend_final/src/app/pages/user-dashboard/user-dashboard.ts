import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { EmpresaDetail } from '../../core/models/empresa';
import { EmpresaService } from '../../services/empresa.service';
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
  private auth = inject(AuthService);

  empresa?: EmpresaDetail;
  loading = true;
  error = '';

  email = '';
  empresaNombre = '';

  ngOnInit(): void {
    const session = this.auth.getSession();
    if (!session) {
      this.error = 'No hay sesión activa.';
      this.loading = false;
      return;
    }
    this.email = session.email;
    this.empresaNombre = session.empresaNombre;
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
}
