import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EmpresaDetail, UsuarioBasico } from '../../core/models/empresa';
import { RolPool } from '../../core/models/rol-pool';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { RolPoolService } from '../../services/rol-pool.service';
import { InvitacionService } from '../../services/invitacion.service';

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
  private rolPoolService = inject(RolPoolService);
  private invitacionService = inject(InvitacionService);

  empresa?: EmpresaDetail;
  roles: RolPool[] = [];
  loading = true;
  error = '';
  searchQuery = '';

  inviteEmail = '';
  inviteRolPoolId = '';
  inviteStatus = '';
  inviting = false;

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
    if (session.poolId) {
      this.rolPoolService.listar(session.poolId).subscribe({
        next: (roles) => {
          this.roles = roles;
          if (roles.length > 0) this.inviteRolPoolId = roles[0].id;
        },
        error: () => {},
      });
    }
  }

  sendInvitation(): void {
    const session = this.auth.getSession();
    if (!session || !this.inviteEmail || !this.inviteRolPoolId) return;
    this.inviting = true;
    this.inviteStatus = '';
    this.invitacionService.invitar({
      empresaId: session.empresaId,
      rolPoolId: this.inviteRolPoolId,
      invitadoPorId: session.usuarioId,
      emailInvitado: this.inviteEmail,
    }).subscribe({
      next: (res) => {
        this.inviteStatus = `Invitación enviada a ${res.emailInvitado}`;
        this.inviteEmail = '';
        this.inviting = false;
      },
      error: (err) => {
        this.inviteStatus = err?.error?.message ?? 'Error al enviar invitación.';
        this.inviting = false;
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
