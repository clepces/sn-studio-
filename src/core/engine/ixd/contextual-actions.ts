/**
 * Solaris Nexus Studio - ContextualActions Module (TypeScript)
 * Clepces org. ltd
 */

import { GlobalEventHub } from '@core/services/event-hub';
import { ToastNotification } from '@core/engine/ui/toast.component';

const G_ICONS: Record<string, string> = {
  refresh: '<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>',
  scan: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
  zap: '<svg viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  security: '<svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>'
};

export class ContextualActionsModule {
  public render(tabId: string): void {
    const container = document.getElementById('header-actions-container');
    if (!container) return;
    container.innerHTML = '';

    if (tabId === 'tab-dashboard') {
      const btn = document.createElement('button');
      btn.className = 'btn-reagle-action btn-reagle-primary';
      btn.innerHTML = `${G_ICONS.refresh}<span class="action-label">Sincronizar</span>`;
      btn.addEventListener('click', () => GlobalEventHub.publish('dashboard:sync'));
      container.appendChild(btn);
    } else if (tabId === 'tab-translation') {
      container.innerHTML = `
        <input type="file" id="str-file-input" accept=".str" class="str-file-input-hidden">
        <button class="btn-reagle-action" id="btn-load-str" title="Cargar archivo .str externo">${G_ICONS.download}<span class="action-label">Cargar .str</span></button>
        <button class="btn-reagle-action" id="btn-demo-str" title="Recargar catálogo">${G_ICONS.refresh}<span class="action-label">Dataset Oficial</span></button>
        <button class="btn-reagle-action btn-reagle-primary" id="btn-export-str-main" title="Exportar .str">${G_ICONS.save}<span class="action-label">Exportar .str</span></button>
      `;
      document.getElementById('btn-load-str')?.addEventListener('click', () => document.getElementById('str-file-input')?.click());
      document.getElementById('str-file-input')?.addEventListener('change', (e) => GlobalEventHub.publish('translation:upload', e));
      document.getElementById('btn-demo-str')?.addEventListener('click', () => GlobalEventHub.publish('translation:load-demo'));
      document.getElementById('btn-export-str-main')?.addEventListener('click', () => GlobalEventHub.publish('translation:export'));
    } else if (tabId === 'tab-mods') {
      container.innerHTML = `
        <button class="btn-reagle-action" id="btn-scan-mods-top">${G_ICONS.scan}<span class="action-label">Escanear</span></button>
        <button class="btn-reagle-action" id="btn-inject-minimod-top">${G_ICONS.zap}<span class="action-label">Minimod P999</span></button>
        <button class="btn-reagle-action btn-reagle-primary" id="btn-save-vfs-top">${G_ICONS.save}<span class="action-label">Guardar VFS</span></button>
      `;
      document.getElementById('btn-scan-mods-top')?.addEventListener('click', () => GlobalEventHub.publish('mods:scan'));
      document.getElementById('btn-inject-minimod-top')?.addEventListener('click', () => GlobalEventHub.publish('mods:switch-tab', 'subtab-mods-injector'));
      document.getElementById('btn-save-vfs-top')?.addEventListener('click', () => GlobalEventHub.publish('mods:save-vfs'));
    } else if (tabId === 'tab-entities') {
      container.innerHTML = `
        <button class="btn-reagle-action" id="btn-reload-catalog-top">${G_ICONS.refresh}<span class="action-label">Recargar</span></button>
        <button class="btn-reagle-action btn-reagle-primary" id="btn-save-entity-top">${G_ICONS.save}<span class="action-label">Guardar Sandbox</span></button>
      `;
      document.getElementById('btn-reload-catalog-top')?.addEventListener('click', () => GlobalEventHub.publish('entities:load-catalog'));
      document.getElementById('btn-save-entity-top')?.addEventListener('click', () => GlobalEventHub.publish('entities:save-current'));
    } else if (tabId === 'tab-galaxy') {
      container.innerHTML = `
        <button class="btn-reagle-action" id="btn-galaxy-8">${G_ICONS.play}<span class="action-label">Mapa 8P</span></button>
        <button class="btn-reagle-action btn-reagle-primary" id="btn-galaxy-12">${G_ICONS.play}<span class="action-label">Generar 12P</span></button>
        <button class="btn-reagle-action" id="btn-galaxy-export">${G_ICONS.save}<span class="action-label">Exportar .galaxy</span></button>
      `;
      document.getElementById('btn-galaxy-8')?.addEventListener('click', () => GlobalEventHub.publish('galaxy:generate', 8));
      document.getElementById('btn-galaxy-12')?.addEventListener('click', () => GlobalEventHub.publish('galaxy:generate', 12));
      document.getElementById('btn-galaxy-export')?.addEventListener('click', () => GlobalEventHub.publish('galaxy:export'));
    } else if (tabId === 'tab-convert') {
      const btn = document.createElement('button');
      btn.className = 'btn-reagle-action btn-reagle-primary';
      btn.innerHTML = `${G_ICONS.play}<span class="action-label">Ejecutar Conversión</span>`;
      btn.addEventListener('click', () => GlobalEventHub.publish('convert:run'));
      container.appendChild(btn);
    } else if (tabId === 'tab-system') {
      const btn = document.createElement('button');
      btn.className = 'btn-reagle-action btn-reagle-primary';
      btn.innerHTML = `${G_ICONS.security}<span class="action-label">Auditoría Fail-Fast</span>`;
      btn.addEventListener('click', () => GlobalEventHub.publish('system:run-audit'));
      container.appendChild(btn);
    } else {
      const btn = document.createElement('button');
      btn.className = 'btn-reagle-action btn-reagle-primary';
      btn.innerHTML = `${G_ICONS.save}<span class="action-label">Nuevo Resguardo</span>`;
      btn.addEventListener('click', () => ToastNotification.info('Generando respaldo atómico .bak...'));
      container.appendChild(btn);
    }
  }
}

export const GlobalContextualActions = new ContextualActionsModule();

if (typeof window !== 'undefined') {
  (window as any).ContextualActions = GlobalContextualActions;
}


