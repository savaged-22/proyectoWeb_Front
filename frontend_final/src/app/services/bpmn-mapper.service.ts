import { Injectable } from '@angular/core';
import { ProcesoDetalle, ProcesoNodo, ProcesoLane, ProcesoArco } from '../models/proceso/proceso.model';

@Injectable({
  providedIn: 'root'
})
export class BpmnMapperService {

  constructor() { }

  /**
   * Construye un string XML de BPMN 2.0 válido a partir de los datos relacionales de la BD.
   */
  public buildXmlFromModel(proceso: ProcesoDetalle): string {
    const processId = 'Process_1';

    // Dimensiones estándar en BPMN
    const TASK_WIDTH = 100;
    const TASK_HEIGHT = 80;
    const GATEWAY_SIZE = 50;
    const EVENT_SIZE = 36;
    const LANE_WIDTH = 600;
    const LANE_HEIGHT = 150;

    let bpmnElements = '';
    let diElements = '';

    // 1. Procesar Nodos (Actividades, Gateways, Eventos)
    for (const nodo of proceso.nodos) {
      let width = TASK_WIDTH;
      let height = TASK_HEIGHT;
      let tag = 'bpmn:task';

      // Identificar el tag BPMN basado en el 'tipo' guardado en BD
      const tipoLower = (nodo.tipo || '').toLowerCase();
      if (tipoLower.includes('start')) {
        tag = 'bpmn:startEvent';
        width = EVENT_SIZE; height = EVENT_SIZE;
      } else if (tipoLower.includes('end')) {
        tag = 'bpmn:endEvent';
        width = EVENT_SIZE; height = EVENT_SIZE;
      } else if (tipoLower.includes('gateway') || tipoLower.includes('exclusivo')) {
        tag = 'bpmn:exclusiveGateway';
        width = GATEWAY_SIZE; height = GATEWAY_SIZE;
      } else if (tipoLower.includes('servicio')) {
        tag = 'bpmn:serviceTask';
      } else if (tipoLower.includes('usuario') || tipoLower.includes('user')) {
        tag = 'bpmn:userTask';
      } else if (tipoLower.includes('send')) {
        tag = 'bpmn:sendTask';
      }

      // Encontrar arcos entrantes y salientes para este nodo
      const incoming = proceso.arcos.filter(a => a.toNodoId === nodo.id);
      const outgoing = proceso.arcos.filter(a => a.fromNodoId === nodo.id);

      bpmnElements += `\n    <${tag} id="id_${nodo.id}" name="${this.escapeXml(nodo.label)}">`;
      incoming.forEach(a => { bpmnElements += `\n      <bpmn:incoming>id_${a.id}</bpmn:incoming>`; });
      outgoing.forEach(a => { bpmnElements += `\n      <bpmn:outgoing>id_${a.id}</bpmn:outgoing>`; });
      bpmnElements += `\n    </${tag}>`;

      // Dibujar DI del nodo
      diElements += `
      <bpmndi:BPMNShape id="id_${nodo.id}_di" bpmnElement="id_${nodo.id}">
        <dc:Bounds x="${nodo.posX || 150}" y="${nodo.posY || 100}" width="${width}" height="${height}" />
      </bpmndi:BPMNShape>`;
    }

    // 2. Procesar Arcos (Secuencias)
    for (const arco of proceso.arcos) {
      bpmnElements += `\n    <bpmn:sequenceFlow id="id_${arco.id}" sourceRef="id_${arco.fromNodoId}" targetRef="id_${arco.toNodoId}" />`;

      // Para el DI de la flecha necesitamos las coordenadas (X,Y) origen y destino
      const fromNode = proceso.nodos.find(n => n.id === arco.fromNodoId);
      const toNode = proceso.nodos.find(n => n.id === arco.toNodoId);

      // Calculamos un centro aproximado si no hay waypoints exactos en la BD
      const fromX = (fromNode?.posX || 150) + (TASK_WIDTH / 2);
      const fromY = (fromNode?.posY || 100) + (TASK_HEIGHT / 2);
      const toX = (toNode?.posX || 300) + (TASK_WIDTH / 2);
      const toY = (toNode?.posY || 100) + (TASK_HEIGHT / 2);

      diElements += `
      <bpmndi:BPMNEdge id="id_${arco.id}_di" bpmnElement="id_${arco.id}">
        <di:waypoint x="${fromX}" y="${fromY}" />
        <di:waypoint x="${toX}" y="${toY}" />
      </bpmndi:BPMNEdge>`;
    }

    // 3. Procesar Lanes (Si existen)
    // El estándar BPMN pone los lanes dentro de un <bpmn:laneSet>
    if (proceso.lanes && proceso.lanes.length > 0) {
      let laneSetXml = `\n    <bpmn:laneSet id="LaneSet_1">`;
      
      let currentLaneY = 50; // Posición Y inicial para los lanes

      for (const lane of proceso.lanes) {
        laneSetXml += `\n      <bpmn:lane id="${lane.id}" name="${this.escapeXml(lane.nombre)}">`;
        
        // Encontrar nodos que pertenecen a este lane
        const nodosInLane = proceso.nodos.filter(n => n.laneId === lane.id);
        nodosInLane.forEach(n => {
          laneSetXml += `\n        <bpmn:flowNodeRef>${n.id}</bpmn:flowNodeRef>`;
        });
        
        laneSetXml += `\n      </bpmn:lane>`;

        // DI del Lane
        diElements += `
      <bpmndi:BPMNShape id="${lane.id}_di" bpmnElement="${lane.id}" isHorizontal="true">
        <dc:Bounds x="120" y="${currentLaneY}" width="${LANE_WIDTH}" height="${LANE_HEIGHT}" />
      </bpmndi:BPMNShape>`;
        
        currentLaneY += LANE_HEIGHT; // Apilar el siguiente lane
      }
      laneSetXml += `\n    </bpmn:laneSet>`;
      
      // Los lanes van primero en el XML del proceso
      bpmnElements = laneSetXml + bpmnElements; 
    }

    // Estructura XML final
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Lulo BPM" exporterVersion="1.0">
  <bpmn:process id="${processId}" isExecutable="true">
${bpmnElements}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
${diElements}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  }

  private escapeXml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
}
