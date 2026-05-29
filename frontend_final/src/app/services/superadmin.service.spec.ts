import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { SuperadminService } from './superadmin.service';
import { EmpresaListItem, RegistroEmpresaRequest } from '../core/models/empresa';

describe('SuperadminService', () => {
  let service: SuperadminService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch', 'request']);
    TestBed.configureTestingModule({
      providers: [
        SuperadminService,
        { provide: HttpClient, useValue: httpSpy },
      ],
    });
    service = TestBed.inject(SuperadminService);
  });

  it('listarEmpresas pega GET /superadmin/empresas', (done) => {
    const empresas: EmpresaListItem[] = [{
      id: 'e1', nombre: 'Acme', nit: '900', emailContacto: 'a@b.c',
      dominio: 'acme.com', createdAt: '2026-01-01',
      totalUsuarios: 1, totalProcesos: 0, totalPools: 1,
    }];
    httpSpy.get.and.returnValue(of(empresas));

    service.listarEmpresas().subscribe((res) => {
      expect(res).toEqual(empresas);
      const url = (httpSpy.get.calls.mostRecent().args[0] as string);
      expect(url).toContain('/superadmin/empresas');
      done();
    });
  });

  it('crearEmpresa envía POST con dominio', (done) => {
    const req: RegistroEmpresaRequest = {
      nombreEmpresa: 'Acme', nit: '900', dominio: 'acme.com',
      emailContacto: 'a@acme.com', emailAdmin: 'admin@acme.com',
      password: 'Pass1234',
    };
    httpSpy.post.and.returnValue(of({
      empresaId: 'e1', empresaNombre: 'Acme', usuarioId: 'u1',
      emailAdmin: 'admin@acme.com', poolDefault: 'Principal',
      mensaje: 'OK',
    }));

    service.crearEmpresa(req).subscribe((res) => {
      expect(res.empresaNombre).toBe('Acme');
      expect(httpSpy.post.calls.mostRecent().args[1]).toEqual(req);
      done();
    });
  });

  it('eliminarEmpresa requiere confirmNombre en el body', (done) => {
    httpSpy.request.and.returnValue(of({ mensaje: 'Empresa desactivada' }));

    service.eliminarEmpresa('e1', 'Acme').subscribe((res) => {
      expect(res.mensaje).toBe('Empresa desactivada');
      const opts = httpSpy.request.calls.mostRecent().args[2] as any;
      expect(opts.body).toEqual({ confirmNombre: 'Acme' });
      done();
    });
  });
});
