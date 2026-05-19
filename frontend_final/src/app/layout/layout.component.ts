import { Component, inject, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

type MenuAbierto = 'perfil' | 'alertas' | 'ayuda' | null;

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  /** Menú desplegable abierto en la barra superior (perfil / alertas / ayuda). */
  openMenu: MenuAbierto = null;

  get session() {
    return this.auth.getSession();
  }

  get isPropietario(): boolean {
    return this.auth.isPropietario();
  }

  /** Iniciales para el avatar a partir del email. */
  get iniciales(): string {
    const email = this.session?.email ?? '';
    return email.slice(0, 2).toUpperCase() || '?';
  }

  /** ¿El usuario tiene el permiso? Usado para ocultar ítems del menú. */
  can(codigo: string): boolean {
    return this.auth.can(codigo);
  }

  toggleMenu(menu: Exclude<MenuAbierto, null>, ev: Event): void {
    ev.stopPropagation();
    this.openMenu = this.openMenu === menu ? null : menu;
  }

  /** Click fuera de cualquier desplegable lo cierra. */
  @HostListener('document:click')
  cerrarMenus(): void {
    this.openMenu = null;
  }

  abrirDocumentacion(): void {
    // Documentación de la API (Swagger UI) en una pestaña nueva.
    const base = environment.apiUrl.replace(/\/api$/, '');
    const url = base.startsWith('http')
      ? `${base}/swagger-ui/index.html`
      : 'http://localhost:8081/swagger-ui/index.html';
    window.open(url, '_blank');
    this.openMenu = null;
  }

  contactarSoporte(): void {
    window.location.href =
      'mailto:soporte@lulo.app?subject=' +
      encodeURIComponent('Soporte BPM Command');
    this.openMenu = null;
  }

  irAProcesos(): void {
    this.router.navigate(['/app/processes']);
    this.openMenu = null;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
