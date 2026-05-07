import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { EmpresaListItem } from '../../core/models/empresa';
import { EmpresaService } from '../../services/empresa.service';
import {
  DashboardService,
  ResumenEstadisticas,
} from '../../services/dashboard.service';

@Component({
  selector: 'app-portfolio-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './portfolio-dashboard.component.html',
  styleUrls: ['./portfolio-dashboard.component.css'],
})
export class PortfolioDashboardComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private dashboard = inject(DashboardService);
  private router = inject(Router);

  empresas: EmpresaListItem[] = [];
  stats?: ResumenEstadisticas;

  loading = true;
  error = '';

  ngOnInit(): void {
    this.empresaService.listar().subscribe({
      next: (list) => {
        this.empresas = list;
        this.tryLoadStats();
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo obtener el portafolio.';
        this.loading = false;
      },
    });
  }

  private tryLoadStats(): void {
    this.dashboard.resumen().subscribe({
      next: (data) => {
        this.stats = data.estadisticas;
        this.loading = false;
      },
      error: () => {
        // los stats agregados son opcionales; calculamos desde empresas
        this.stats = {
          totalEmpresas: this.empresas.length,
          totalUsuarios: this.empresas.reduce((a, e) => a + e.totalUsuarios, 0),
          totalPools: this.empresas.reduce((a, e) => a + e.totalPools, 0),
          totalProcesos: this.empresas.reduce((a, e) => a + e.totalProcesos, 0),
          totalRolesPool: 0,
          totalRolesProceso: 0,
          totalLanes: 0,
          totalNodos: 0,
          totalArcos: 0,
        };
        this.loading = false;
      },
    });
  }

  open(id: string): void {
    this.router.navigate(['/app/clients', id]);
  }

  tier(e: EmpresaListItem): { label: string; color: string } {
    if (e.totalProcesos > 50) return { label: 'PLATINUM', color: 'blue' };
    if (e.totalProcesos > 10) return { label: 'ENTERPRISE', color: 'green' };
    if (e.totalUsuarios === 0) return { label: 'PENDING', color: 'amber' };
    return { label: 'GROWTH', color: 'gray' };
  }

  status(e: EmpresaListItem): { label: string; color: string } {
    if (e.totalUsuarios === 0) return { label: 'Action Required', color: 'amber' };
    return { label: 'Active', color: 'green' };
  }
}
