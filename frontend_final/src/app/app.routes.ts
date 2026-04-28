import { Routes } from '@angular/router';
import { LandingPage } from './pages/landing/landing';
import { LoginPage } from './pages/login/login';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

import { LayoutComponent } from './layout/layout.component';
import { MonitoringComponent } from './pages/monitoring/monitoring.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { PermissionsComponent } from './pages/permissions/permissions.component';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'login', component: LoginPage },
  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent,
    canActivate: [authGuard, adminGuard] 
  },
  { 
    path: 'app', 
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: UserDashboardComponent },
      { path: 'monitoring', component: MonitoringComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'permissions', component: PermissionsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: 'user-dashboard', redirectTo: '/app/dashboard', pathMatch: 'full' }
];
