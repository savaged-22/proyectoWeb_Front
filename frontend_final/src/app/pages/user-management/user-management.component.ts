import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EmpresaDetail, UsuarioBasico } from '../../core/models/empresa';
import { RolPool } from '../../core/models/rol-pool';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { PoolService } from '../../services/pool.service';
import { RolPoolService } from '../../services/rol-pool.service';
import { UsuarioService } from '../../services/usuario.service';

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
  private poolService = inject(PoolService);
  private rolPoolService = inject(RolPoolService);
  private usuarioService = inject(UsuarioService);

  empresa?: EmpresaDetail;
  roles: RolPool[] = [];
  loading = true;
  error = '';
  searchQuery = '';

  newUserEmail = '';
  newUserPassword = '';
  newUserRolPoolId = '';
  userStatus = '';
  userStatusError = false;
  creating = false;

  ngOnInit(): void {
    const session = this.auth.getSession();
    if (!session) {
      this.error = 'Sesión no disponible.';
      this.loading = false;
      return;
    }
    this.loadUsuarios(session.empresaId);
    this.cargarRoles();
  }

  private cargarRoles(): void {
    this.poolService.listar().subscribe({
      next: (pools) => {
        if (pools.length === 0) return;
        this.rolPoolService.listar(pools[0].id).subscribe({
          next: (roles) => {
            this.roles = roles;
            if (roles.length > 0) this.newUserRolPoolId = roles[0].id;
          },
          error: () => {
            this.error = 'No se pudieron cargar los roles disponibles.';
          },
        });
      },
      error: () => {
        this.error = 'No se pudieron cargar los pools de la empresa.';
      },
    });
  }

  private loadUsuarios(empresaId: string): void {
    this.empresaService.detalle(empresaId).subscribe({
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

  createUser(): void {
    const session = this.auth.getSession();
    if (!session || !this.newUserEmail || !this.newUserPassword || !this.newUserRolPoolId) return;
    if (this.newUserPassword.length < 8) {
      this.userStatus = 'La contraseña debe tener al menos 8 caracteres.';
      this.userStatusError = true;
      return;
    }
    this.creating = true;
    this.userStatus = '';
    this.userStatusError = false;
    this.usuarioService.crear({
      empresaId: session.empresaId,
      creadoPorId: session.usuarioId,
      rolPoolId: this.newUserRolPoolId,
      email: this.newUserEmail,
      password: this.newUserPassword,
    }).subscribe({
      next: (res) => {
        this.userStatus = `Usuario ${res.email} creado exitosamente con rol "${res.rolAsignado}".`;
        this.userStatusError = false;
        this.newUserEmail = '';
        this.newUserPassword = '';
        this.newUserRolPoolId = this.roles.length > 0 ? this.roles[0].id : '';
        this.creating = false;
        this.loadUsuarios(session.empresaId);
      },
      error: (err) => {
        this.userStatus = err?.error?.message ?? 'Error al crear el usuario.';
        this.userStatusError = true;
        this.creating = false;
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
