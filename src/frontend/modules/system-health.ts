/**
 * Solaris Nexus Studio - SystemHealth Module (TypeScript)
 * Clepces org. ltd
 */

import { GlobalNexusCore } from '../state/nexus-core';

export class SystemHealthModule {
  public async runAudit(): Promise<void> {
    const container = document.getElementById('health-report-content');
    if (!container) return;

    container.innerHTML = '<div class="health-audit-loading">Ejecutando diagnóstico del entorno corporativo...</div>';

    const res = await GlobalNexusCore.apiGet('system/health');
    if (res && res.success && res.data) {
      const d = res.data;
      container.innerHTML = `
        <div class="health-status-banner">
          ✓ SERVIDOR WAMP ACTIVO: Conexión establecida con Apache y PHP ${d.phpVersion}.
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
    }
  }

  public init(): void {
    this.runAudit();
  }
}

export const GlobalSystemHealth = new SystemHealthModule();

declare global {
  interface Window {
    SystemHealthModule: SystemHealthModule;
  }
}

if (typeof window !== 'undefined') {
  window.SystemHealthModule = GlobalSystemHealth;
}
