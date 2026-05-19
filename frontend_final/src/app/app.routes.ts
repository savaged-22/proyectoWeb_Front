import { Routes } from '@angular/router';

import { LandingPage } from './pages/landing/landing';
import { LoginPage } from './pages/login/login';
import { authGuard } from './guards/auth.guard';
import { permisoGuard } from './guards/permiso.guard';

import { LayoutComponent } from './layout/layout.component';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard';
import { MonitoringComponent } from './pages/monitoring/monitoring.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { PermissionsComponent } from './pages/permissions/permissions.component';
import { ProcessInventoryComponent } from './pages/process-inventory/process-inventory.component';
import { ProcessNewComponent } from './pages/process-new/process-new.component';
import { ClientDirectoryComponent } from './pages/client-directory/client-directory.component';
import { ClientDetailComponent } from './pages/client-detail/client-detail.component';
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
      { path: 'users',            component: UserManagementComponent,
        canActivate: [permisoGuard('USUARIO_VER')] },
      { path: 'permissions',      component: PermissionsComponent,
        canActivate: [permisoGuard('ROL_VER')] },
      { path: 'processes',        component: ProcessInventoryComponent,
        canActivate: [permisoGuard('PROCESO_VER')] },
      { path: 'processes/new',    component: ProcessNewComponent,
        canActivate: [permisoGuard('PROCESO_CREAR')] },
      { path: 'process-list',     component: ProcessListComponent,
        canActivate: [permisoGuard('PROCESO_VER')] },
      { path: 'process-builder',  component: ProcessBuilderComponent,
        canActivate: [permisoGuard('PROCESO_VER')] },
      { path: 'clients',          component: ClientDirectoryComponent,
        canActivate: [permisoGuard('POOL_ADMINISTRAR')] },
      { path: 'clients/:id',      component: ClientDetailComponent,
        canActivate: [permisoGuard('POOL_ADMINISTRAR')] },
    ],
  },

  // Compatibilidad con rutas antiguas
  { path: 'admin-dashboard', redirectTo: '/app/clients', pathMatch: 'full' },
  { path: 'user-dashboard',  redirectTo: '/app/dashboard', pathMatch: 'full' },
  { path: 'app/portfolio',   redirectTo: '/app/clients', pathMatch: 'full' },
];
