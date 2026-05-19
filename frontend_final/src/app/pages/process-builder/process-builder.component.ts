import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProcesoService } from '../../services/proceso.service';
import { ProcesoDetalle, ProcesoNodo, ProcesoLane } from '../../models/proceso/proceso.model';
import { AuthService } from '../../services/auth.service';
import { DiagramService } from '../../services/diagram.service';
import { BpmnMapperService } from '../../services/bpmn-mapper.service';

import BpmnModeler from 'bpmn-js/lib/Modeler';

@Component({
  selector: 'app-process-builder',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './process-builder.component.html',
  styleUrls: ['./process-builder.component.css']
})
export class ProcessBuilderComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas', { static: true }) private canvasEl!: ElementRef;
  private bpmnModeler: any;
  private fb = inject(FormBuilder);
  private procesoService = inject(ProcesoService);
  private authService = inject(AuthService);
  private diagramService = inject(DiagramService);
  private bpmnMapper = inject(BpmnMapperService);
  private route = inject(ActivatedRoute);

  // Estado del proceso actual
  procesoId: string | null = null;
  procesoActual: ProcesoDetalle | null = null;
  isLoadingProcess = false;
  isImporting = false;

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

  mapActividad(t: string): string {
    const type = t.toLowerCase();
    if (type.includes('service')) return 'servicio';
    if (type.includes('manual')) return 'manual';
    if (type.includes('script')) return 'script';
    if (type.includes('subprocess')) return 'subproceso';
    return 'tarea';
  }

  mapGateway(t: string): string {
    const type = t.toLowerCase();
    if (type.includes('parallel')) return 'paralelo';
    if (type.includes('inclusive')) return 'inclusivo';
    return 'exclusivo';
  }

  getDbId(bpmnId: string): string {
    return bpmnId.startsWith('id_') ? bpmnId.substring(3) : bpmnId;
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.procesoId = params['id'];
      if (this.procesoId) {
        this.cargarDatosProceso(this.procesoId);
      }
    });
  }

  ngAfterViewInit() {
    this.bpmnModeler = new BpmnModeler({
      container: this.canvasEl.nativeElement
    });

    this.renderizarXML();

    // Listen to selection changes
    this.bpmnModeler.on('selection.changed', (e: any) => {
      const newSelection = e.newSelection;
      if (newSelection && newSelection.length > 0) {
        const element = newSelection[0];
        
        this.selectedElement = {
           id: element.id,
           label: element.businessObject.name || element.id,
           tipo: element.type
        };

        if (element.type.includes('Task')) {
          this.selectedNodeType = element.type.includes('Service') ? 'serviceTask' : 'userTask';
        } else if (element.type.includes('Gateway')) {
          this.selectedNodeType = 'gateway';
        } else if (element.type.includes('Participant') || element.type.includes('Lane')) {
          this.selectedNodeType = 'lane';
          this.selectedLaneName = this.selectedElement.label;
        } else {
          this.selectedNodeType = 'userTask'; // fallback
        }

        this.propertiesForm.patchValue({
          label: this.selectedElement.label,
          type: element.type.includes('Gateway') ? this.mapGateway(this.selectedElement.tipo) : this.mapActividad(this.selectedElement.tipo),
        });

        this.showProperties = true;
      } else {
        this.showProperties = false;
        this.selectedElement = null;
      }
    });

    // ─── Sincronización Bidireccional: Canvas -> DB ───
    const eventBus = this.bpmnModeler.get('eventBus');
    const modeling = this.bpmnModeler.get('modeling');

    // Funciones de mapeo movidas a nivel de clase

    eventBus.on('shape.added', (e: any) => {
      if (this.isImporting || !this.procesoId) return;
      const element = e.element;
      if (element.type === 'bpmn:Process' || element.type === 'label') return;

      const session = this.authService.getSession();
      if (!session) return;

      // Detectar tipo y mapear a nuestra base de datos
      if (element.type.includes('Task') || element.type.includes('Event')) {
        this.diagramService.crearActividad(this.procesoId, {
          creadoPorId: session.usuarioId,
          label: element.businessObject.name || element.type.replace('bpmn:', ''),
          tipoActividad: this.mapActividad(element.type),
          posX: element.x,
          posY: element.y
        }).subscribe({
          next: (res) => {
            try {
              console.log('Actividad creada en BD, intentando actualizar ID en canvas a:', 'id_' + res.id);
              modeling.updateProperties(element, { id: 'id_' + res.id });
              console.log('ID actualizado exitosamente en el canvas');
            } catch (err) {
              console.error('Error al actualizar el ID en el canvas:', err);
            }
          },
          error: (err) => console.error('Error al crear actividad', err)
        });
      } else if (element.type.includes('Gateway')) {
        this.diagramService.crearGateway(this.procesoId, {
          creadoPorId: session.usuarioId,
          label: element.businessObject.name || element.type.replace('bpmn:', ''),
          tipoGateway: this.mapGateway(element.type),
          posX: element.x,
          posY: element.y
        }).subscribe({
          next: (res) => {
            try {
              console.log('Gateway creado en BD, actualizando ID a:', 'id_' + res.id);
              modeling.updateProperties(element, { id: 'id_' + res.id });
            } catch (err) {
              console.error('Error al actualizar ID de gateway:', err);
            }
          },
          error: (err) => console.error('Error al crear gateway', err)
        });
      }
    });

    eventBus.on('connection.added', (e: any) => {
      if (this.isImporting || !this.procesoId) return;
      const element = e.element;
      if (element.type === 'bpmn:SequenceFlow') {
        const sourceId = this.getDbId(element.source.id);
        const targetId = this.getDbId(element.target.id);
        // Solo guardar si ambos extremos ya tienen un UUID de BD válido (longitud 36)
        if (sourceId.length === 36 && targetId.length === 36) {
          const session = this.authService.getSession();
          if (!session) return;
          this.diagramService.crearArco(this.procesoId, {
            creadoPorId: session.usuarioId,
            fromNodoId: sourceId,
            toNodoId: targetId
          }).subscribe({
            next: (res) => {
              modeling.updateProperties(element, { id: 'id_' + res.id });
            },
            error: (err) => console.error('Error al crear arco', err)
          });
        }
      }
    });

    eventBus.on('shape.changed', (e: any) => {
      if (this.isImporting || !this.procesoId) return;
      const element = e.element;
      const dbId = this.getDbId(element.id);
      if (dbId.length !== 36) return; // Solo actualizar si ya tiene UUID

      const session = this.authService.getSession();
      if (!session) return;

      // Actualizar posiciones o labels cuando se mueven
      if (element.type.includes('Task') || element.type.includes('Event')) {
        this.diagramService.editarActividad(this.procesoId, dbId, {
          editadoPorId: session.usuarioId,
          label: element.businessObject.name || element.type.replace('bpmn:', ''),
          posX: element.x,
          posY: element.y
        }).subscribe();
      } else if (element.type.includes('Gateway')) {
        this.diagramService.editarGateway(this.procesoId, dbId, {
          editadoPorId: session.usuarioId,
          label: element.businessObject.name || element.type.replace('bpmn:', ''),
          posX: element.x,
          posY: element.y
        }).subscribe();
      }
    });

    eventBus.on('shape.removed', (e: any) => {
      if (this.isImporting || !this.procesoId) return;
      const element = e.element;
      const dbId = this.getDbId(element.id);
      if (dbId.length !== 36) return;

      const session = this.authService.getSession();
      if (!session) return;

      if (element.type.includes('Task') || element.type.includes('Event')) {
        this.diagramService.eliminarActividad(this.procesoId, dbId, { eliminadoPorId: session.usuarioId }).subscribe();
      } else if (element.type.includes('Gateway')) {
        this.diagramService.eliminarGateway(this.procesoId, dbId, { eliminadoPorId: session.usuarioId }).subscribe();
      }
    });

    eventBus.on('connection.removed', (e: any) => {
      if (this.isImporting || !this.procesoId) return;
      const element = e.element;
      const dbId = this.getDbId(element.id);
      if (dbId.length !== 36) return;

      const session = this.authService.getSession();
      if (!session) return;

      if (element.type === 'bpmn:SequenceFlow') {
        this.diagramService.eliminarArco(this.procesoId, dbId, { eliminadoPorId: session.usuarioId }).subscribe();
      }
    });
  }

  cargarDatosProceso(id: string) {
    if (!this.authService.isAuthenticated()) return;

    localStorage.setItem('lastProcesoId', id);

    this.isLoadingProcess = true;
    this.procesoService.obtener(id).subscribe({
      next: (proceso) => {
        this.procesoActual = proceso;
        this.isLoadingProcess = false;
        console.log('Proceso cargado:', proceso);
        this.renderizarXML();
      },
      error: (err) => {
        console.error('Error cargando proceso:', err);
        this.isLoadingProcess = false;
      }
    });
  }

  renderizarXML() {
    if (!this.bpmnModeler) return;

    let xml = '';
    if (this.procesoActual && this.procesoActual.nodos && this.procesoActual.nodos.length > 0) {
      xml = this.bpmnMapper.buildXmlFromModel(this.procesoActual);
    } else {
      xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Lulo BPM" exporterVersion="1.0">
  <bpmn:process id="Process_1" isExecutable="true">
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
    }

    this.isImporting = true;
    this.bpmnModeler.importXML(xml).then(() => {
      console.log('Diagram loaded successfully');
      this.isImporting = false;
    }).catch((err: any) => {
      console.error('Error loading diagram', err);
      this.isImporting = false;
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
    this.selectedElement = this.procesoActual?.nodos.find((n: ProcesoNodo) => n.id === mockId) || {
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

    this.selectedElement = this.procesoActual?.lanes.find((l: ProcesoLane) => l.nombre === name) || {
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

    const dbId = this.getDbId(this.selectedElement.id);
    const isNew = dbId.length !== 36;

    if (this.selectedNodeType === 'lane') {
      const ob$ = isNew 
        ? this.diagramService.crearLane(this.procesoId, { creadoPorId: usuarioId, nombre: val.label })
        : this.diagramService.editarLane(this.procesoId, dbId, { editadoPorId: usuarioId, nombre: val.label });
      
      ob$.subscribe({
        next: (res: any) => this.onSaveSuccess(isNew ? res.id : dbId),
        error: (err) => this.onSaveError(err)
      });
    } else if (this.selectedNodeType === 'gateway') {
      const config = val.propsJson?.trim() ? val.propsJson : undefined;
      const ob$ = isNew
        ? this.diagramService.crearGateway(this.procesoId, { creadoPorId: usuarioId, label: val.label, tipoGateway: val.type, posX: this.selectedElement.x || 150, posY: this.selectedElement.y || 100, configJson: config })
        : this.diagramService.editarGateway(this.procesoId, dbId, { editadoPorId: usuarioId, label: val.label, tipoGateway: val.type, configJson: config });
        
      ob$.subscribe({
        next: (res: any) => this.onSaveSuccess(isNew ? res.id : dbId),
        error: (err) => this.onSaveError(err)
      });
    } else {
      // Actividad (User Task, Service Task, etc)
      const props = val.propsJson?.trim() ? val.propsJson : undefined;
      const ob$ = isNew
        ? this.diagramService.crearActividad(this.procesoId, { creadoPorId: usuarioId, label: val.label, tipoActividad: val.type, posX: this.selectedElement.x || 150, posY: this.selectedElement.y || 100, propsJson: props })
        : this.diagramService.editarActividad(this.procesoId, dbId, { editadoPorId: usuarioId, label: val.label, tipoActividad: val.type, propsJson: props });
        
      ob$.subscribe({
        next: (res: any) => this.onSaveSuccess(isNew ? res.id : dbId),
        error: (err) => this.onSaveError(err)
      });
    }
  }

  private onSaveSuccess(newDbId?: string) {
    this.isSavingProperties = false;
    
    // Si era nuevo y se guardó, actualizamos su ID en el canvas
    if (newDbId && this.selectedElement && newDbId !== this.getDbId(this.selectedElement.id)) {
      try {
        const modeling = this.bpmnModeler.get('modeling');
        const elementRegistry = this.bpmnModeler.get('elementRegistry');
        const element = elementRegistry.get(this.selectedElement.id);
        if (element) {
           modeling.updateProperties(element, { id: 'id_' + newDbId });
        }
      } catch (e) {
        console.error('No se pudo actualizar el ID en el canvas tras guardarlo:', e);
      }
    }

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
