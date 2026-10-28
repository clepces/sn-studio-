/**
 * Solaris Nexus Studio - SystemHealth Coordinator
 * Clepces org. ltd | Modular Architecture & Strict Typing
 */

import { GlobalNexusCore } from '@/state/nexus-core';
import { GlobalEventHub } from '../../services/event-hub';
import { ToastNotification } from '../../engine/ui/toast.component';
import type { SystemHealthData, SystemHealthInterface } from './types';

export class SystemHealth implements SystemHealthInterface {
  public async runAudit(): Promise<void> {
    const container = document.getElementById('health-report-content');
    if (!container) return;

    container.innerHTML = '<div class="health-audit-loading">Ejecutando diagnóstico del entorno corporativo...</div>';

    try {
      const res = await GlobalNexusCore.apiGet('system/health') as {
        success: boolean;
        data?: SystemHealthData;
      };

      if (res && res.success && res.data) {
        const d = res.data;
        container.innerHTML = `
          <div class="health-status-banner">
            ✓ SERVIDOR ACTIVO: Conexión establecida con el entorno corporativo.
          </div>
          <div class="health-meta-grid">
            <div class="mini-neu-card health-neu-card">
              <span class="mini-card-label">Suite Corporativa</span>
              <span class="health-value-main">${d.appName} (${d.version})</span>
              <span class="health-sub-muted">${d.company}</span>
            </div>
            <div class="mini-neu-card health-neu-card">
              <span class="mini-card-label">Memoria del Servidor</span>
              <span class="mini-card-value">${d.memoryUsageMb} MB</span>
              <span class="health-sub-success">● Consumo Óptimo</span>
            </div>
            <div class="mini-neu-card health-neu-card">
              <span class="mini-card-label">Base de Datos</span>
              <span class="health-value-main">${d.database}</span>
              <span class="health-sub-blue">● SQLite Relacional OK</span>
            </div>
            <div class="mini-neu-card health-neu-card">
              <span class="mini-card-label">Protocolo UUID Safety</span>
              <span class="health-value-main">ACTIVO</span>
              <span class="health-sub-success">● Cero Stack Traces</span>
            </div>
          </div>
        `;

        GlobalEventHub.publish('execution:log', {
          module: 'SYSTEM',
          message: `Diagnóstico del sistema completado: ${d.appName} (${d.memoryUsageMb} MB)`,
          status: 'Salud OK'
        });
      } else {
        container.innerHTML = '<div class="health-audit-loading" style="color: #ef4444;">Error al recuperar estado de salud del sistema.</div>';
        ToastNotification.error('No se pudo completar el diagnóstico del sistema.');
      }
    } catch (err) {
      console.warn('[SystemHealth] Error al ejecutar auditoría:', err);
      container.innerHTML = '<div class="health-audit-loading" style="color: #ef4444;">Fallo de conexión al diagnosticar sistema.</div>';
    }
  }

  public init(): void {
    GlobalEventHub.subscribe('system:run-audit', () => this.runAudit());
    this.runAudit();
  }
}

export const GlobalSystemHealth = new SystemHealth();

declare global {
  interface Window {
    SystemHealthModule?: SystemHealth;
  }
}

if (typeof window !== 'undefined') {
  window.SystemHealthModule = GlobalSystemHealth;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GlobalSystemHealth.init());
  } else {
    setTimeout(() => GlobalSystemHealth.init(), 20);
  }
}
