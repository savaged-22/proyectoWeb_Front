import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './monitoring.component.html',
  styleUrls: ['./monitoring.component.css']
})
export class MonitoringComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  casos: any[] = [];
  procesosMetricas: any[] = [];
  logs: any[] = [];
  
  // KPI Metrics
  totalActivos = 0;
  tareasPendientes = 0;
  procesosInstanciadosHoy = 0;
  tasaError = '0.00%';

  ngOnInit() {
    this.fetchDashboardData();
    // Auto refresh every 5 seconds
    setInterval(() => this.fetchDashboardData(), 5000);
  }

  fetchDashboardData() {
    const session = this.authService.getSession();
    if (!session) return;

    this.http.get<any>(`${this.apiUrl}/casos/dashboard?empresaId=${session.empresaId}`).subscribe({
      next: (data) => {
        this.totalActivos = data.totalActivos || 0;
        this.tareasPendientes = data.tareasPendientes || 0;
        this.procesosInstanciadosHoy = data.procesosInstanciadosHoy || 0;
        this.tasaError = data.tasaError || '0.00%';

        if (data.casosActivos) {
          this.casos = data.casosActivos;
        }

        if (data.metricasProcesos) {
          this.procesosMetricas = data.metricasProcesos;
        }

        if (data.ultimosLogs) {
          this.logs = data.ultimosLogs;
        }
      },
      error: (err) => {
        console.error('Error fetching monitoring data', err);
        this.loadMockCasos();
        this.loadMockMetricas();
        this.loadMockLogs();
      }
    });
  }

  seedData() {
    const session = this.authService.getSession();
    if (!session) return;
    
    // Buscar un proceso válido de las métricas para instanciar
    let procesoId = localStorage.getItem('lastProcesoId');
    if (!procesoId || procesoId === '00000000-0000-0000-0000-000000000000') {
        // En un caso real, el usuario elegiría el proceso de un dropdown.
        // Aquí pediremos al backend que nos traiga los procesos o usamos uno quemado
        // Mejor aún: el endpoint de iniciarCaso podría recibir null y elegir uno al azar para testear,
        // Pero para no modificar más el backend, le pediremos al usuario que navegue al builder primero.
        alert('Por favor abre el Process Builder en cualquier proceso para que el sistema guarde el ID, y luego intenta de nuevo.');
        return;
    }
    
    this.http.post(`${this.apiUrl}/casos/iniciar?procesoId=${procesoId}&usuarioId=${session.usuarioId}`, {}).subscribe({
      next: (res) => {
        alert('Caso iniciado correctamente.');
        this.fetchDashboardData();
      },
      error: (err) => {
        alert('Aún no tienes procesos válidos creados. Crea un proceso primero en el Builder.');
      }
    });
  }
  
  formatDate(dateObj: any): string {
    if (!dateObj) return '';
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return String(dateObj);
    return d.toISOString().replace('T', ' ').substring(0, 19);
  }

  loadMockCasos() {
    this.casos = [
      { id: 'CASO-9928-XA', procesoNombre: 'Aprobación de Crédito', estado: 'EN_PROGRESO', actividadActual: 'Revisión Manual', fechaInicio: '2023-10-27 14:22:01' },
      { id: 'CASO-0114-BK', procesoNombre: 'Onboarding Cliente', estado: 'PENDIENTE', actividadActual: 'Esperando Firma', fechaInicio: '2023-10-27 14:22:15' },
      { id: 'CASO-5521-LM', procesoNombre: 'Aprobación de Crédito', estado: 'COMPLETADO', actividadActual: 'Fin', fechaInicio: '2023-10-27 14:21:44' },
      { id: 'CASO-3329-CQ', procesoNombre: 'Pago a Proveedores', estado: 'ERROR', actividadActual: 'Validación KYC', fechaInicio: '2023-10-27 14:20:55' }
    ];
    this.totalActivos = 142;
    this.tareasPendientes = 34;
    this.tasaError = '1.04%';
    this.procesosInstanciadosHoy = 250;
  }

  loadMockMetricas() {
    this.procesosMetricas = [
      { nombreProceso: 'Aprobación de Crédito', casosActivos: 86, tiempoPromedio: '4h 12m' },
      { nombreProceso: 'Onboarding Cliente', casosActivos: 40, tiempoPromedio: '1d 2h' },
      { nombreProceso: 'Pago a Proveedores', casosActivos: 16, tiempoPromedio: '45m' }
    ];
  }
  
  loadMockLogs() {
    this.logs = [
      { tiempo: '14:22:45', nivel: 'INFO', claseCss: 'info', mensaje: 'Caso iniciado: Aprobación de Crédito', isErrorBlock: false },
      { tiempo: '14:22:44', nivel: 'INFO', claseCss: 'info', mensaje: 'Tarea completada por Analista', isErrorBlock: false },
      { tiempo: '14:22:42', nivel: 'WARN', claseCss: 'warn', mensaje: 'Caso CASO-0114 atascado en espera de firma', isErrorBlock: false },
      { tiempo: '14:22:38', nivel: 'ERR', claseCss: 'err', mensaje: 'Fallo en Servicio KYC remoto. Reintentando...', isErrorBlock: true },
      { tiempo: '14:22:31', nivel: 'INFO', claseCss: 'trace', mensaje: 'Caso finalizado exitosamente.', isErrorBlock: false }
    ];
  }
}
