import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface RolPool {
  id: string;
  nombre: string;
  descripcion: string;
  esPropietario: boolean;
  usuariosCount: number;
}

interface Permiso {
  modulo: string;
  accion: string;
  permitido: boolean;
}

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent implements OnInit {
  roles: RolPool[] = [];
  selectedRole: RolPool | null = null;
  permisos: Permiso[] = [];

  ngOnInit() {
    this.roles = [
      { id: '1', nombre: 'Propietario', descripcion: 'Acceso total al sistema y configuración de empresa.', esPropietario: true, usuariosCount: 1 },
      { id: '2', nombre: 'Administrador de Finanzas', descripcion: 'Gestión de facturas, pagos y reportes.', esPropietario: false, usuariosCount: 3 },
      { id: '3', nombre: 'Auditor de Operaciones', descripcion: 'Solo lectura de procesos y logs de auditoría.', esPropietario: false, usuariosCount: 12 },
      { id: '4', nombre: 'Operador de Soporte', descripcion: 'Atención a usuarios y gestión básica.', esPropietario: false, usuariosCount: 45 }
    ];
    this.selectRole(this.roles[0]);
  }

  selectRole(role: RolPool) {
    this.selectedRole = role;
    if (role.esPropietario) {
      this.permisos = [
        { modulo: 'Usuarios', accion: 'Crear, Editar, Eliminar', permitido: true },
        { modulo: 'Configuración Empresa', accion: 'Todas las acciones', permitido: true },
        { modulo: 'Facturación', accion: 'Todas las acciones', permitido: true },
        { modulo: 'Procesos (BPM)', accion: 'Modelar y Ejecutar', permitido: true }
      ];
    } else if (role.nombre.includes('Finanzas')) {
      this.permisos = [
        { modulo: 'Facturación', accion: 'Crear, Editar, Eliminar', permitido: true },
        { modulo: 'Reportes', accion: 'Generar', permitido: true },
        { modulo: 'Usuarios', accion: 'Solo Lectura', permitido: false },
        { modulo: 'Procesos (BPM)', accion: 'Sin Acceso', permitido: false }
      ];
    } else {
      this.permisos = [
        { modulo: 'Procesos (BPM)', accion: 'Solo Lectura', permitido: true },
        { modulo: 'Usuarios', accion: 'Sin Acceso', permitido: false },
        { modulo: 'Configuración Empresa', accion: 'Sin Acceso', permitido: false }
      ];
    }
  }

  togglePermiso(perm: Permiso) {
    if (this.selectedRole && !this.selectedRole.esPropietario) {
      perm.permitido = !perm.permitido;
    }
  }
}
