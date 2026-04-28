import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Usuario {
  id: string | number;
  email: string;
  estado: string;
  empresa_id: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  private http = inject(HttpClient);
  
  users: Usuario[] = [];
  loading = true;
  error = '';
  searchQuery = '';

  // KPI mocks
  totalUsers = 0;
  activeUsers = 0;
  pendingInvites = 15;

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.http.get<Usuario[]>('http://localhost:8081/api/users').subscribe({
      next: (data) => {
        this.users = data;
        this.totalUsers = data.length;
        this.activeUsers = data.filter(u => u.estado === 'ACTIVO' || u.estado === 'active').length || data.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.error = 'No se pudo conectar con el servidor para cargar los usuarios. Mostrando datos locales de prueba.';
        this.loadMockData();
        this.loading = false;
      }
    });
  }

  loadMockData() {
    this.users = [
      { id: 1, email: 'admin@lulo.com', estado: 'ACTIVO', empresa_id: 'd290f1ee-6c54-4b01-90e6-d701748f0851' },
      { id: 2, email: 'operador@lulo.com', estado: 'ACTIVO', empresa_id: 'd290f1ee-6c54-4b01-90e6-d701748f0851' },
      { id: 3, email: 'nuevo_usuario@lulo.com', estado: 'PENDIENTE', empresa_id: 'd290f1ee-6c54-4b01-90e6-d701748f0851' }
    ];
    this.totalUsers = 3;
    this.activeUsers = 2;
  }
  
  get filteredUsers() {
    if (!this.searchQuery) return this.users;
    return this.users.filter(u => {
      const email = u.email || '';
      return email.toLowerCase().includes(this.searchQuery.toLowerCase());
    });
  }
  
  getDisplayEmail(email: string | undefined): string {
    return email ? email.split('@')[0] : 'Unknown';
  }
  
  getInitials(email: string | undefined): string {
    return email ? email.charAt(0).toUpperCase() : '?';
  }
}
