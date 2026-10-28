/**
 * Solaris Nexus Studio - MinimodInjector Subsystem
 * Surgical P999 language minimod injection into EnabledMods.txt
 */

import { GlobalNexusCore } from '@/state/nexus-core';
import { GlobalEventHub } from '../../services/event-hub';
import { ToastNotification } from '../../engine/ui/toast.component';
import type { ActiveMod } from './types';

export class MinimodInjector {
  public updateMinimodStatus(): void {
    const state = GlobalNexusCore.state;
    const activeMods: ActiveMod[] = state.activeMods || [];
    const hasMinimod = activeMods.some(m => m.isMinimod || (m.name && m.name.includes('[ES]')));

    const badge = document.getElementById('minimod-active-status-badge');
    const panel = document.getElementById('minimod-status-panel');
    const btn = document.getElementById('btn-toggle-minimod-p999');
    const title = document.getElementById('minimod-current-title');

    if (badge) {
      badge.className = `metric-badge-pill ${hasMinimod ? '' : 'neutral'}`;
      badge.innerText = hasMinimod ? '✓ ACTIVO EN P999' : '○ STANDBY (Vanilla)';
    }
    if (panel) {
      panel.className = `minimod-status-panel ${hasMinimod ? 'active' : ''}`;
    }
    if (btn) {
      btn.innerText = hasMinimod ? '✕ Retirar Minimod P999' : '⚡ Inyectar Minimod (P999)';
      btn.style.color = hasMinimod ? '#dc2626' : '#1a73e8';
    }
    if (title) {
      title.innerText = hasMinimod
        ? 'Minimod: [ES] Idioma Español Rebellion (Activo en P999)'
        : 'Minimod: [ES] Idioma Español Rebellion (Standby)';
    }
  }

  public toggleMinimodP999(onStateChange?: () => void): void {
    const state = GlobalNexusCore.state;
    if (!state.activeMods) {
      state.activeMods = [];
    }

    const hasMinimod = state.activeMods.some((m: ActiveMod) => m.isMinimod || (m.name && m.name.includes('[ES]')));
    if (hasMinimod) {
      state.activeMods = state.activeMods.filter((m: ActiveMod) => !m.isMinimod && !(m.name && m.name.includes('[ES]')));
      GlobalEventHub.publish('execution:log', {
        module: 'VFS',
        message: 'Retirado minimod [ES] de EnabledMods.txt (Modo Vanilla)',
        status: 'Desactivado'
      });
      ToastNotification.info('Minimod de idioma [ES] retirado de la cascada VFS.');
    } else {
      const input = document.getElementById('input-minimod-name') as HTMLInputElement | null;
      const inputName = input?.value?.trim() || 'Idioma Español Rebellion';
      state.activeMods.unshift({
        name: `[ES] ${inputName}`,
        priority: 999,
        isMinimod: true,
        ramMb: 15,
        state: 'OK'
      });
      GlobalEventHub.publish('execution:log', {
        module: 'VFS',
        message: `Inyectado minimod quirúrgico [ES] ${inputName} (Prioridad 999)`,
        status: 'En Cascada'
      });
      ToastNotification.success(`Inyectado minimod [ES] ${inputName} con Prioridad 999.`);
    }

    this.updateMinimodStatus();
    if (onStateChange) onStateChange();
  }

  public injectCustomMinimod(onStateChange?: () => void): void {
    const nameInput = document.getElementById('input-minimod-name') as HTMLInputElement | null;
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      ToastNotification.warning('Introduce un nombre descriptivo para el minimod.');
      return;
    }

    const state = GlobalNexusCore.state;
    if (!state.activeMods) {
      state.activeMods = [];
    }

    state.activeMods.unshift({
      name: `[ES] ${name}`,
      priority: 999,
      isMinimod: true,
      ramMb: 15,
      state: 'OK'
    });

    GlobalEventHub.publish('execution:log', {
      module: 'VFS',
      message: `Inyectado minimod [ES] ${name} (Prioridad 999)`,
      status: 'En Cascada'
    });

    if (nameInput) nameInput.value = '';
    this.updateMinimodStatus();
    ToastNotification.success(`Minimod [ES] ${name} inyectado con prioridad 999 en la cima de EnabledMods.txt.`);

    if (onStateChange) onStateChange();
  }
}
