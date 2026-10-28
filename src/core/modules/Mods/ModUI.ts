/**
 * Solaris Nexus Studio - ModUI Subsystem
 * DOM renderer for Mod active cards, empty state, and hierarchy ordering
 */

import type { ActiveMod } from './types';

export interface ModUIEvents {
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
  onInjectMinimod: () => void;
  onScanMods: () => void;
}

export class ModUI {
  public renderModList(activeMods: ActiveMod[], events: ModUIEvents): void {
    const container = document.getElementById('mod-active-list');
    if (!container) return;
    container.innerHTML = '';

    if (!activeMods || activeMods.length === 0) {
      this.renderEmptyState(container, events);
      return;
    }

    activeMods.forEach((mod: ActiveMod, idx: number) => {
      const card = document.createElement('div');
      const isMissing = mod.state === 'MISSING_DIRECTORY';
      const isEmpty = mod.state === 'EMPTY_DIRECTORY';

      let statusWarning = '';
      if (isMissing) {
        statusWarning = `<div class="mod-status-warning-row"><span class="metric-badge-pill danger">⚠️ ERROR CRÍTICO: CARPETA FANTASMA (NO EXISTE EN DISCO)</span></div>`;
      } else if (isEmpty) {
        statusWarning = `<div class="mod-status-warning-row"><span class="metric-badge-pill warning">⚠️ AVISO: CARPETA VACÍA SIN ASSETS</span></div>`;
      }

      card.className = `mod-item-card ${mod.isMinimod ? 'is-minimod' : ''} ${isMissing ? 'mod-card-missing' : ''}`;

      card.innerHTML = `
        <div class="mod-item-left">
          <span class="mod-priority-badge ${isMissing ? 'mod-priority-missing' : ''}">P${mod.priority}</span>
          <div class="mod-info-col">
            <div class="mod-title">${mod.name}</div>
            <div class="mod-ram-text">
              Consumo RAM: <strong>${mod.ramMb} MB</strong> ${mod.isMinimod ? '· <span class="minimod-highlight">[MINIMOD QUIRÚRGICO P999]</span>' : ''}
            </div>
            ${statusWarning}
          </div>
        </div>
        <div class="mod-actions-col">
          <button class="btn-row-action btn-mod-up" data-idx="${idx}" title="Subir prioridad" ${idx === 0 ? 'disabled' : ''}>▲ Subir</button>
          <button class="btn-row-action btn-mod-down" data-idx="${idx}" title="Bajar prioridad" ${idx === activeMods.length - 1 ? 'disabled' : ''}>▼ Bajar</button>
          <button class="btn-row-action btn-mod-remove btn-mod-remove-danger" data-idx="${idx}" title="${isMissing ? 'Purgar mod fantasma' : 'Desactivar'}">
            ${isMissing ? '✕ Purgar Huérfano' : '✕ Quitar'}
          </button>
        </div>
      `;

      card.querySelector('.btn-mod-up')?.addEventListener('click', () => events.onMoveUp(idx));
      card.querySelector('.btn-mod-down')?.addEventListener('click', () => events.onMoveDown(idx));
      card.querySelector('.btn-mod-remove')?.addEventListener('click', () => events.onRemove(idx));

      container.appendChild(card);
    });
  }

  private renderEmptyState(container: HTMLElement, events: ModUIEvents): void {
    const emptyWrapper = document.createElement('div');
    emptyWrapper.className = 'mod-empty-state';
    emptyWrapper.innerHTML = `
      <div class="empty-icon">🛡️</div>
      <div class="empty-title">Modo Canónico Vanilla Activo</div>
      <div class="empty-desc">
        EnabledMods.txt no contiene mods externos en cascada. El juego se ejecuta con el diccionario en español y los archivos base oficiales de Rebellion.
      </div>
      <div class="empty-actions">
        <button class="btn-row-action" id="btn-empty-inject-minimod">
          ⚡ Inyectar Minimod de Idioma (P999)
        </button>
        <button class="btn-row-action" id="btn-empty-scan-mods">
          📁 Escanear Carpeta de Mods
        </button>
      </div>
    `;

    emptyWrapper.querySelector('#btn-empty-inject-minimod')?.addEventListener('click', () => {
      events.onInjectMinimod();
    });

    emptyWrapper.querySelector('#btn-empty-scan-mods')?.addEventListener('click', () => {
      events.onScanMods();
    });

    container.appendChild(emptyWrapper);
  }
}
