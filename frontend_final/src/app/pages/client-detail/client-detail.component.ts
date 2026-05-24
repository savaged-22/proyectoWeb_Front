import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';

import { EmpresaDetail } from '../../core/models/empresa';
import { EmpresaService } from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface ProcesoCliente {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  estado: string;
  activo: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.css'],
})
export class ClientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private empresaService = inject(EmpresaService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  empresa?: EmpresaDetail;
  loading = true;
  error = '';
  filterText = '';

  // Procesos cliente (vista solo lectura para Lulo internos)
  procesos: ProcesoCliente[] = [];
  loadingProcesos = false;
  errorProcesos = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID de empresa no especificado.';
      this.loading = false;
      return;
    }
    this.empresaService.detalle(id).subscribe({
      next: (data) => {
        this.empresa = data;
        this.loading = false;
        if (this.isLuloInternal) {
          this.cargarProcesos(data.id);
        }
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar la empresa.';
        this.loading = false;
      },
    });
  }

  get isLuloInternal(): boolean {
    return this.auth.isLuloInternal();
  }

  private cargarProcesos(empresaId: string): void {
    const session = this.auth.getSession();
    if (!session) return;
    this.loadingProcesos = true;
    this.errorProcesos = '';
    const params = new HttpParams()
      .set('empresaId', empresaId)
      .set('usuarioId', session.usuarioId)
      .set('size', '50');
    this.http
      .get<{ content: ProcesoCliente[] }>(`${environment.apiUrl}/procesos`, { params })
      .subscribe({
        next: (page) => {
          this.procesos = page.content ?? [];
          this.loadingProcesos = false;
        },
        error: (err) => {
          console.error(err);
          this.errorProcesos = err?.error?.message || 'No se pudieron cargar los procesos.';
          this.loadingProcesos = false;
        },
      });
  }

  get filteredUsuarios() {
    if (!this.empresa) return [];
    if (!this.filterText) return this.empresa.usuarios;
    const q = this.filterText.toLowerCase();
    return this.empresa.usuarios.filter(
      (u) => u.email.toLowerCase().includes(q) || u.rolPrincipal.toLowerCase().includes(q)
    );
  }

  initials(email: string): string {
    return (email ?? '?').charAt(0).toUpperCase();
  }

  badgeForEstado(estado: string): string {
    const map: Record<string, string> = {
      activo: 'green',
      pendiente: 'amber',
      suspendido: 'red',
      inactivo: 'gray',
    };
    return map[(estado || '').toLowerCase()] ?? 'blue';
  }
}
