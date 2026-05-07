import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../services/auth.service';

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

  get session() {
    return this.auth.getSession();
  }

  get isPropietario(): boolean {
    return this.auth.isPropietario();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
