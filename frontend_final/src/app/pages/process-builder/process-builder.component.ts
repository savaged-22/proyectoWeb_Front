import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProcesoService } from '../../services/proceso.service';
import { ProcesoDetalle } from '../../core/models/proceso';
import { AuthService } from '../../services/auth.service';
import { DiagramService } from '../../services/diagram.service';

@Component({
  selector: 'app-process-builder',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './process-builder.component.html',
  styleUrls: ['./process-builder.component.css']
})
export class ProcessBuilderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private procesoService = inject(ProcesoService);
  private authService = inject(AuthService);
  private diagramService = inject(DiagramService);
  private route = inject(ActivatedRoute);

  // Estado del proceso actual
  procesoId: string | null = null;
  procesoActual: ProcesoDetalle | null = null;
  isLoadingProcess = false;

  // Selección actual para el panel de propiedades
  selectedElement: any = null;
  isSavingProperties = false;

  showProperties = true;
  showNewProcessModal = false;
  selectedNodeType: 'userTask' | 'serviceTask' | 'gateway' | 'lane' = 'userTask';
  selectedLaneName: string = '';

  // Formulario de propiedades (simplificado)
  propertiesForm: FormGroup = this.fb.group({
    label: [''],
    type: [''],
    laneId: [null],
    propsJson: ['']
  });

  // Estado del modal
  isSubmitting = false;
  submitError = '';
  submitSuccess = '';

  newProcessForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: [''],
    categoria: [''],
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.procesoId = params['id'];
      if (this.procesoId) {
        this.cargarDatosProceso(this.procesoId);
      }
    });
  }

  cargarDatosProceso(id: string) {
    if (!this.authService.isAuthenticated()) return;

    this.isLoadingProcess = true;
    this.procesoService.obtener(id).subscribe({
      next: (proceso) => {
        this.procesoActual = proceso;
        this.isLoadingProcess = false;
        console.log('Proceso cargado:', proceso);
      },
      error: (err) => {
        console.error('Error cargando proceso:', err);
        this.isLoadingProcess = false;
      }
    });
  }

  toggleProperties() {
    this.showProperties = !this.showProperties;
  }

  openNewProcessModal() {
    this.newProcessForm.reset();
    this.submitError = '';
    this.submitSuccess = '';
    this.showNewProcessModal = true;
  }

  closeNewProcessModal() {
    this.showNewProcessModal = false;
    this.isSubmitting = false;
    this.submitError = '';
  }

  selectNode(type: 'userTask' | 'serviceTask' | 'gateway', mockId: string = 'demo-id') {
    this.selectedNodeType = type;
    this.showProperties = true;
    
    // Para el demo, si no hay proceso cargado, creamos un objeto dummy
    this.selectedElement = this.procesoActual?.nodos.find(n => n.id === mockId) || {
      id: mockId,
      label: type === 'gateway' ? 'Check Status' : 'New Task',
      tipo: type
    };

    this.propertiesForm.patchValue({
      label: this.selectedElement.label,
      type: this.selectedElement.tipo,
      propsJson: this.selectedElement.propsJson || ''
    });
  }

  selectLane(name: string, mockId: string = 'lane-demo-id') {
    this.selectedNodeType = 'lane';
    this.selectedLaneName = name;
    this.showProperties = true;

    this.selectedElement = this.procesoActual?.lanes.find(l => l.nombre === name) || {
      id: mockId,
      nombre: name
    };

    this.propertiesForm.patchValue({
      label: this.selectedElement.nombre
    });
  }

  onCreateProcess() {
    if (this.newProcessForm.invalid) {
      this.newProcessForm.markAllAsTouched();
      return;
    }

    const session = this.authService.getSession();
    if (!session) {
      this.submitError = 'Sesión inválida. Por favor re-inicia sesión.';
      return;
    }

    // poolId no vive en la sesión nueva; lo leemos del legacy key o usamos fallback demo.
    const legacyPoolId =
      typeof localStorage !== 'undefined' ? localStorage.getItem('poolId') : null;
    const poolId = legacyPoolId || '00000000-0000-0000-0000-000000000000';

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    const request: Parameters<typeof this.procesoService.crear>[0] = {
      poolId,
      nombre: this.newProcessForm.value.nombre,
      descripcion: this.newProcessForm.value.descripcion || '',
      categoria: this.newProcessForm.value.categoria || '',
      estado: 'borrador',
    };

    this.procesoService.crear(request).subscribe({
      next: (proceso) => {
        this.isSubmitting = false;
        this.submitSuccess = `¡Proceso "${proceso.nombre}" creado exitosamente!`;
        setTimeout(() => this.closeNewProcessModal(), 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.message || err.error?.error || err.message || 'Error al crear el proceso.';
        this.submitError = msg;
        console.error('Error creating process', err);
      }
    });
  }

  applyChanges() {
    if (!this.procesoId || !this.selectedElement) return;

    const usuarioId = this.authService.getSession()?.usuarioId;
    if (!usuarioId) return;

    this.isSavingProperties = true;
    const val = this.propertiesForm.value;

    if (this.selectedNodeType === 'lane') {
      this.diagramService.editarLane(this.procesoId, this.selectedElement.id, {
        editadoPorId: usuarioId,
        nombre: val.label,
      }).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err) => this.onSaveError(err)
      });
    } else if (this.selectedNodeType === 'gateway') {
      this.diagramService.editarGateway(this.procesoId, this.selectedElement.id, {
        editadoPorId: usuarioId,
        label: val.label,
        tipoGateway: val.type
      }).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err) => this.onSaveError(err)
      });
    } else {
      // Actividad (User Task, Service Task, etc)
      this.diagramService.editarActividad(this.procesoId, this.selectedElement.id, {
        editadoPorId: usuarioId,
        label: val.label,
        tipoActividad: val.type,
        propsJson: val.propsJson
      }).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err) => this.onSaveError(err)
      });
    }
  }

  private onSaveSuccess() {
    this.isSavingProperties = false;
    // Recargar datos para ver reflejado el cambio
    if (this.procesoId) this.cargarDatosProceso(this.procesoId);
    alert('Cambios guardados correctamente');
  }

  private onSaveError(err: any) {
    this.isSavingProperties = false;
    console.error('Error al guardar propiedades:', err);
    alert('Error al guardar los cambios');
  }
}
