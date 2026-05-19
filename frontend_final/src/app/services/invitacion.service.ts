import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface InvitarRequest {
  empresaId: string;
  rolPoolId: string;
  invitadoPorId: string;
  emailInvitado: string;
}

export interface InvitarResponse {
  invitacionId: string;
  emailInvitado: string;
  rolAsignado: string;
  token: string;
  expiresAt: string;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class InvitacionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/invitaciones`;

  invitar(payload: InvitarRequest): Observable<InvitarResponse> {
    return this.http.post<InvitarResponse>(this.base, payload);
  }
}
