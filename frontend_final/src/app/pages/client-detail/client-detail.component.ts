import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { EmpresaDetail } from '../../core/models/empresa';
import { EmpresaService } from '../../services/empresa.service';

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

  empresa?: EmpresaDetail;
  loading = true;
  error = '';
  filterText = '';

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
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar la empresa.';
        this.loading = false;
      },
    });
  }

  get filteredUsuarios() {
    if (!this.empresa) return [];
    if (!this.filterText) return this.empresa.usuarios ?? [];
    const q = this.filterText.toLowerCase();
    return (this.empresa.usuarios ?? []).filter(
      (u) => (u.email || '').toLowerCase().includes(q) || (u.rolPrincipal || '').toLowerCase().includes(q)
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
