import { Routes } from '@angular/router';

import { LandingPage } from './pages/landing/landing';
import { LoginPage } from './pages/login/login';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

import { LayoutComponent } from './layout/layout.component';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard';
import { MonitoringComponent } from './pages/monitoring/monitoring.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { PermissionsComponent } from './pages/permissions/permissions.component';
import { ProcessInventoryComponent } from './pages/process-inventory/process-inventory.component';
import { ProcessNewComponent } from './pages/process-new/process-new.component';
import { ClientDirectoryComponent } from './pages/client-directory/client-directory.component';
import { ClientDetailComponent } from './pages/client-detail/client-detail.component';
import { PortfolioDashboardComponent } from './pages/portfolio-dashboard/portfolio-dashboard.component';
import { ProcessBuilderComponent } from './pages/process-builder/process-builder.component';
import { ProcessListComponent } from './pages/process-list/process-list.component';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'login', component: LoginPage },

  {
    path: 'app',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',        component: UserDashboardComponent },
      { path: 'monitoring',       component: MonitoringComponent },
      { path: 'users',            component: UserManagementComponent },
      { path: 'permissions',      component: PermissionsComponent },
      { path: 'processes',        component: ProcessInventoryComponent },
      { path: 'processes/new',    component: ProcessNewComponent },
      { path: 'process-list',     component: ProcessListComponent },
      { path: 'process-builder',  component: ProcessBuilderComponent },
      { path: 'clients',          component: ClientDirectoryComponent },
      { path: 'clients/:id',      component: ClientDetailComponent },
      {
        path: 'portfolio',
        component: PortfolioDashboardComponent,
        canActivate: [adminGuard],
      },
    ],
  },

  // Compatibilidad con rutas antiguas
  { path: 'admin-dashboard', redirectTo: '/app/portfolio', pathMatch: 'full' },
  { path: 'user-dashboard',  redirectTo: '/app/dashboard', pathMatch: 'full' },
];
