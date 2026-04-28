import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header admin-header">
        <div class="logo">BPM COMMAND <span>| Admin Control Center</span></div>
        <button class="logout-btn" (click)="logout()">Logout</button>
      </header>
      <main class="dashboard-content">
        <h1>Welcome, Administrator</h1>
        <p>You have owner privileges. Here you can manage pools, processes, and access advanced matrix configurations.</p>
        
        <div class="cards-grid">
          <div class="card">
            <h3>User Matrix</h3>
            <p>Manage roles and permissions across all business divisions.</p>
          </div>
          <div class="card">
            <h3>System Telemetry</h3>
            <p>View real-time infrastructure SLA and node uptime.</p>
          </div>
          <div class="card">
            <h3>Global Processes</h3>
            <p>Approve and standardize enterprise-level flows.</p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container { min-height: 100vh; background-color: #f1f5f9; font-family: 'Inter', sans-serif; }
    .dashboard-header { padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; background-color: #0f172a; color: white; }
    .admin-header .logo span { color: #38bdf8; font-weight: 400; font-size: 0.9rem; }
    .logo { font-weight: 800; font-size: 1.2rem; }
    .logout-btn { background: transparent; border: 1px solid #475569; color: white; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    .logout-btn:hover { background: #1e293b; }
    .dashboard-content { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    h1 { color: #0f172a; margin-top: 0; }
    p { color: #475569; line-height: 1.6; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
    .card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-top: 4px solid #38bdf8; }
    .card h3 { margin-top: 0; color: #0f172a; }
  `]
})
export class AdminDashboardComponent {
  private router = inject(Router);

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }
}
