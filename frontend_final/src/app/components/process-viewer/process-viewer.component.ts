import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';

import { ProcesoService } from '../../services/proceso.service';
import { BpmnMapperService } from '../../services/bpmn-mapper.service';
import { ProcesoDetalle } from '../../models/proceso/proceso.model';

/**
 * Componente visor de procesos (read-only).
 *
 * Reutilizable: pásale un `procesoId` y renderiza el diagrama BPMN con
 * navegación (zoom + pan) pero sin permitir modificación. Usa la misma
 * librería `bpmn-js` que el editor, pero con `NavigatedViewer` en vez de
 * `Modeler`, lo que garantiza que el usuario no puede alterar nada.
 *
 * Acepta también `proceso` ya cargado para evitar refetch en pantallas que
 * ya tienen los datos en memoria.
 */
@Component({
  selector: 'app-process-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './process-viewer.component.html',
  styleUrls: ['./process-viewer.component.css'],
})
export class ProcessViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('viewerCanvas', { static: true }) private canvasEl!: ElementRef;

  @Input() procesoId: string | null = null;
  @Input() proceso: ProcesoDetalle | null = null;
  @Input() height = '600px';

  private viewer: any | null = null;
  private viewReady = false;

  procesoActual: ProcesoDetalle | null = null;
  cargando = false;
  error: string | null = null;

  private procesoService = inject(ProcesoService);
  private mapper = inject(BpmnMapperService);

  ngAfterViewInit(): void {
    this.viewer = new BpmnViewer({ container: this.canvasEl.nativeElement });
    this.viewReady = true;
    this.cargarYRender();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewReady) return;
    if (changes['procesoId'] || changes['proceso']) {
      this.cargarYRender();
    }
  }

  ngOnDestroy(): void {
    try { this.viewer?.destroy(); } catch {}
  }

  private cargarYRender(): void {
    if (this.proceso) {
      this.procesoActual = this.proceso;
      this.render();
      return;
    }
    if (!this.procesoId) return;
    this.cargando = true;
    this.error = null;
    this.procesoService.obtener(this.procesoId).subscribe({
      next: (det) => {
        this.procesoActual = det;
        this.cargando = false;
        this.render();
      },
      error: (err) => {
        this.error = err?.error?.error || err?.message || 'No se pudo cargar el proceso';
        this.cargando = false;
      },
    });
  }

  private async render(): Promise<void> {
    if (!this.viewer || !this.procesoActual) return;
    try {
      const xml = this.mapper.buildXmlFromModel(this.procesoActual);
      await this.viewer.importXML(xml);
      // Ajusta el zoom para que se vea todo el diagrama
      const canvas = this.viewer.get('canvas');
      canvas.zoom('fit-viewport', 'auto');
    } catch (e: any) {
      this.error = 'Error renderizando diagrama: ' + (e?.message ?? e);
    }
  }

  zoomIn(): void {
    const c = this.viewer?.get('canvas');
    if (c) c.zoom(c.zoom() + 0.15);
  }
  zoomOut(): void {
    const c = this.viewer?.get('canvas');
    if (c) c.zoom(Math.max(0.2, c.zoom() - 0.15));
  }
  zoomFit(): void {
    const c = this.viewer?.get('canvas');
    if (c) c.zoom('fit-viewport', 'auto');
  }
}
