import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SuperadminService } from '../../services/superadmin.service';

/**
 * Vista de métricas agregadas para usuarios con METRICAS_VER o SUPERADMIN.
 * Muestra los conteos clave de la plataforma (empresas, usuarios, procesos,
 * pools, roles, eventos auditados) en tarjetas KPI.
 */
@Component({
  selector: 'app-lulo-metricas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lulo-metricas.component.html',
  styleUrls: ['./lulo-metricas.component.css'],
})
export class LuloMetricasComponent implements OnInit {
  private superadmin = inject(SuperadminService);

  data = signal<Record<string, any>>({});
  loading = signal(true);
  error = signal<string | null>(null);
  timestamp = signal<string | null>(null);

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.superadmin.metricas().subscribe({
      next: (m) => {
        this.timestamp.set(m['timestamp']);
        delete m['timestamp'];
        this.data.set(m);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudieron cargar las métricas.');
        this.loading.set(false);
      },
    });
  }

  entries(): { label: string; value: any; icon: string }[] {
    const labels: Record<string, { label: string; icon: string }> = {
      empresas:     { label: 'Empresas registradas',  icon: '🏢' },
      usuarios:     { label: 'Usuarios totales',      icon: '👥' },
      procesos:     { label: 'Procesos creados',      icon: '📊' },
      pools:        { label: 'Pools de trabajo',      icon: '🗂️' },
      rolesPool:    { label: 'Roles configurados',    icon: '🛡️' },
      eventosAudit: { label: 'Eventos en auditoría',  icon: '📝' },
    };
    return Object.entries(this.data()).map(([k, v]) => ({
      label: labels[k]?.label ?? k,
      icon: labels[k]?.icon ?? '📈',
      value: v,
    }));
  }
}
