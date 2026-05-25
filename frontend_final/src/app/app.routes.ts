import { Routes } from '@angular/router';

import { LandingPage } from './pages/landing/landing';
import { LoginPage } from './pages/login/login';
import { RegisterEmpresaPage } from './pages/register-empresa/register-empresa.component';
import { authGuard } from './guards/auth.guard';
import { permisoGuard } from './guards/permiso.guard';
import { superadminGuard } from './guards/superadmin.guard';
import { tokenRefreshGuard } from './guards/token-refresh.guard';

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
import { ProcessViewComponent } from './pages/process-view/process-view.component';
import { SuperadminEmpresasComponent } from './pages/superadmin-empresas/superadmin-empresas.component';
import { LuloMetricasComponent } from './pages/lulo-metricas/lulo-metricas.component';
import { LuloSoporteComponent } from './pages/lulo-soporte/lulo-soporte.component';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'login', component: LoginPage },
  { path: 'register-empresa', component: RegisterEmpresaPage },

  {
    // tokenRefreshGuard se ejecuta en cada navegación dentro de /app:
    // pide /api/auth/refresh, valida token + recalcula roles/permisos.
    path: 'app',
    component: LayoutComponent,
    canActivate: [authGuard, tokenRefreshGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',        component: UserDashboardComponent },
      { path: 'monitoring',       component: MonitoringComponent },
      { path: 'users',            component: UserManagementComponent,
        canActivate: [permisoGuard('USUARIO_VER', 'LULO_USUARIO_VER')] },
      { path: 'permissions',      component: PermissionsComponent,
        canActivate: [permisoGuard('ROL_VER', 'LULO_ROL_GESTIONAR')] },
      { path: 'processes',        component: ProcessInventoryComponent,
        canActivate: [permisoGuard('PROCESO_VER')] },
      { path: 'processes/new',    component: ProcessNewComponent,
        canActivate: [permisoGuard('PROCESO_CREAR')] },
      { path: 'process-list',     component: ProcessListComponent,
        canActivate: [permisoGuard('PROCESO_VER')] },
      { path: 'process-builder',  component: ProcessBuilderComponent,
        canActivate: [permisoGuard('PROCESO_EDITAR')] },
      { path: 'process-view/:id', component: ProcessViewComponent,
        canActivate: [permisoGuard('PROCESO_VER')] },
      { path: 'clients',          component: ClientDirectoryComponent,
        canActivate: [permisoGuard('POOL_ADMINISTRAR', 'EMPRESA_VER')] },
      { path: 'clients/:id',      component: ClientDetailComponent,
        canActivate: [permisoGuard('POOL_ADMINISTRAR', 'EMPRESA_VER')] },

      // Superadmin (dueño app)
      { path: 'superadmin/empresas', component: SuperadminEmpresasComponent,
        canActivate: [superadminGuard] },

      // Métricas y Soporte (Lulo internos según permisos)
      { path: 'lulo/metricas', component: LuloMetricasComponent,
        canActivate: [permisoGuard('METRICAS_VER', 'AUDIT_GLOBAL_VER')] },
      { path: 'lulo/soporte', component: LuloSoporteComponent,
        canActivate: [permisoGuard('SOPORTE_PROCESOS_VER')] },
    ],
  },

  // Compatibilidad con rutas antiguas
  { path: 'admin-dashboard', redirectTo: '/app/clients', pathMatch: 'full' },
  { path: 'user-dashboard',  redirectTo: '/app/dashboard', pathMatch: 'full' },
  { path: 'app/portfolio',   redirectTo: '/app/clients', pathMatch: 'full' },
];
