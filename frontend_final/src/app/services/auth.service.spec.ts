import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { AuthService } from './auth.service';
import { clearSession } from '../core/auth/session';

describe('AuthService', () => {
  let service: AuthService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['post', 'get']);
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: httpSpy },
      ],
    });
    service = TestBed.inject(AuthService);
    clearSession();
  });

  afterEach(() => clearSession());

  it('arranca sin sesión', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.isSuperadmin()).toBeFalse();
    expect(service.isAdminEmpresa()).toBeFalse();
    expect(service.isLuloInternal()).toBeFalse();
  });

  it('login guarda token y marca isSuperadmin', (done) => {
    const respuesta = {
      token: 'jwt-fake',
      usuarioId: 'u1',
      empresaId: 'e1',
      empresaNombre: 'Lulo',
      poolId: 'p1',
      email: 'admin@lulo.app',
      rol: 'SUPERADMIN',
      tipoUsuario: 'SUPERADMIN',
      esSuperadmin: true,
      esAdminEmpresa: false,
      empresaEsLulo: true,
      permisos: ['EMPRESA_VER'],
    };
    httpSpy.post.and.returnValue(of(respuesta));

    service.login({ email: 'admin@lulo.app', password: 'Admin123!' }).subscribe(() => {
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.isSuperadmin()).toBeTrue();
      expect(service.isLuloInternal()).toBeTrue();
      expect(service.can('EMPRESA_VER')).toBeTrue();
      done();
    });
  });

  it('can() devuelve true para superadmin aunque no tenga el permiso explícito', (done) => {
    httpSpy.post.and.returnValue(of({
      token: 't', usuarioId: 'u', empresaId: 'e', empresaNombre: 'Lulo',
      poolId: 'p', email: 'admin@lulo.app', rol: 'SUPERADMIN',
      tipoUsuario: 'SUPERADMIN', esSuperadmin: true, empresaEsLulo: true,
      permisos: [],
    }));
    service.login({ email: 'admin@lulo.app', password: 'x' }).subscribe(() => {
      expect(service.can('CUALQUIER_PERMISO')).toBeTrue();
      done();
    });
  });

  it('logout limpia la sesión', (done) => {
    httpSpy.post.and.returnValue(of({
      token: 't', usuarioId: 'u', empresaId: 'e', empresaNombre: 'X',
      poolId: 'p', email: 'a@b.c', rol: 'COLABORADOR',
      tipoUsuario: 'USUARIO', esSuperadmin: false, empresaEsLulo: false,
      permisos: ['PROCESO_VER'],
    }));
    service.login({ email: 'a@b.c', password: 'x' }).subscribe(() => {
      expect(service.isAuthenticated()).toBeTrue();
      service.logout();
      expect(service.isAuthenticated()).toBeFalse();
      done();
    });
  });
});
