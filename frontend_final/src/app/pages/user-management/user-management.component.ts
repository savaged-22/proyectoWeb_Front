import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EmpresaDetail, UsuarioBasico } from '../../core/models/empresa';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
})
export class UserManagementComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private auth = inject(AuthService);

  empresa?: EmpresaDetail;
  loading = true;
  error = '';
  searchQuery = '';

  inviteEmail = '';
  inviteRol = 'Editor';

  ngOnInit(): void {
    const session = this.auth.getSession();
    if (!session) {
      this.error = 'Sesión no disponible.';
      this.loading = false;
      return;
    }
    this.empresaService.detalle(session.empresaId).subscribe({
      next: (e) => {
        this.empresa = e;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar el directorio de usuarios.';
        this.loading = false;
      },
    });
  }

  get usuarios(): UsuarioBasico[] {
    return this.empresa?.usuarios ?? [];
  }

  get totalUsers(): number { return this.usuarios.length; }
  get activeUsers(): number {
    return this.usuarios.filter((u) => (u.estado || '').toLowerCase() === 'activo').length;
  }

  get filteredUsers(): UsuarioBasico[] {
    if (!this.searchQuery) return this.usuarios;
    const q = this.searchQuery.toLowerCase();
    return this.usuarios.filter(
      (u) => u.email.toLowerCase().includes(q) || u.rolPrincipal.toLowerCase().includes(q)
    );
  }

  getInitials(email?: string): string {
    return email ? email.charAt(0).toUpperCase() : '?';
  }

  badgeForEstado(estado: string): string {
    const m: Record<string, string> = {
      activo: 'green',
      pendiente: 'amber',
      suspendido: 'red',
      inactivo: 'gray',
    };
    return m[(estado || '').toLowerCase()] ?? 'blue';
  }
}
