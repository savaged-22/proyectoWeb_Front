import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { Permiso, RolPool } from '../core/models/rol-pool';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RolPoolService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = `${environment.apiUrl}/roles-pool`;

  /**
   * Notifica cuando se crea/edita/elimina un rol de pool. Los componentes
   * que muestran roles (matriz, dropdowns) se suscriben para refrescar
   * sin tener que recargar la página.
   */
  private rolesChangedSubject = new Subject<string>();
  readonly rolesChanged$ = this.rolesChangedSubject.asObservable();

  listar(poolId: string): Observable<RolPool[]> {
    const session = this.auth.getSession();
    const params = new HttpParams()
      .set('poolId', poolId)
      .set('usuarioId', session?.usuarioId ?? '');
    return this.http.get<RolPool[]>(this.base, { params });
  }

  permisos(poolId: string): Observable<Permiso[]> {
    const session = this.auth.getSession();
    const params = new HttpParams()
      .set('poolId', poolId)
      .set('usuarioId', session?.usuarioId ?? '');
    return this.http.get<Permiso[]>(`${this.base}/permisos`, { params });
  }

  crear(payload: {
    poolId: string;
    creadoPorId: string;
    nombre: string;
    descripcion?: string;
    codigosPermiso: string[];
  }): Observable<RolPool> {
    return this.http.post<RolPool>(this.base, payload).pipe(
      tap((r) => this.rolesChangedSubject.next(r.poolId)),
    );
  }

  /** Reemplaza el conjunto de permisos de un rol. Rechazado por el backend en roles propietarios. */
  actualizarPermisos(rolPoolId: string, codigosPermiso: string[]): Observable<RolPool> {
    const session = this.auth.getSession();
    return this.http.patch<RolPool>(`${this.base}/${rolPoolId}/permisos`, {
      actualizadoPorId: session?.usuarioId,
      codigosPermiso,
    }).pipe(tap((r) => this.rolesChangedSubject.next(r.poolId)));
  }

  /** Asigna un usuario existente a un rol del pool. */
  asignarUsuario(rolPoolId: string, usuarioId: string): Observable<RolPool> {
    const session = this.auth.getSession();
    return this.http.post<RolPool>(`${this.base}/${rolPoolId}/usuarios`, {
      usuarioId,
      asignadoPorId: session?.usuarioId,
    });
  }
}
