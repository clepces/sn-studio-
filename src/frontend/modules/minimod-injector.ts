/**
 * Solaris Nexus Studio - MinimodInjector Module (TypeScript)
 * Clepces org. ltd
 */

import { GlobalNexusCore } from '../state/nexus-core';

export class MinimodInjectorModule {
  public updateMinimodStatus(): void {
    const state = GlobalNexusCore.state;
    const hasMinimod = state.activeMods && state.activeMods.some((m: any) => m.isMinimod || (m.name && m.name.includes('[ES]')));
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
      title.innerText = hasMinimod ? 'Minimod: [ES] Idioma Español Rebellion (Activo en P999)' : 'Minimod: [ES] Idioma Español Rebellion (Standby)';
    }
  }

  public toggleMinimodP999(): void {
    const state = GlobalNexusCore.state;
    const hasMinimod = state.activeMods && state.activeMods.some((m: any) => m.isMinimod || (m.name && m.name.includes('[ES]')));
    if (hasMinimod) {
      state.activeMods = state.activeMods.filter((m: any) => !m.isMinimod && !(m.name && m.name.includes('[ES]')));
      window.DashboardHandler?.logExecution('VFS', 'Retirado minimod [ES] de EnabledMods.txt (Modo Vanilla)', 'Desactivado');
    } else {
      const inputName = (document.getElementById('input-minimod-name') as HTMLInputElement | null)?.value?.trim() || 'Idioma Español Rebellion';
      state.activeMods.unshift({
        name: `[ES] ${inputName}`,
        priority: 999,
        isMinimod: true,
        ramMb: 15
      });
      window.DashboardHandler?.logExecution('VFS', `Inyectado minimod quirúrgico [ES] ${inputName} (Prioridad 999)`, 'En Cascada');
    }
    window.ModManagerModule?.recalculatePriorities();
    window.ModManagerModule?.renderModList();
    window.ModManagerModule?.saveVfsHierarchy();
  }

  public injectCustomMinimod(): void {
    const nameInput = document.getElementById('input-minimod-name') as HTMLInputElement | null;
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      alert('Introduce un nombre descriptivo para el minimod.');
      return;
    }

    GlobalNexusCore.state.activeMods.unshift({
      name: `[ES] ${name}`,
      priority: 999,
      isMinimod: true,
      ramMb: 15
    });

    window.ModManagerModule?.recalculatePriorities();
    window.ModManagerModule?.renderModList();
    window.DashboardHandler?.logExecution('VFS', `Inyectado minimod [ES] ${name} (Prioridad 999)`, 'En Cascada');
    
    if (nameInput) nameInput.value = '';
    window.ModManagerModule?.switchSubTab('subtab-mods-catalog');
    alert(`Minimod [ES] ${name} inyectado con prioridad 999 en la cima de EnabledMods.txt.`);
  }
}

export const GlobalMinimodInjector = new MinimodInjectorModule();

declare global {
  interface Window {
    MinimodInjector: MinimodInjectorModule;
  }
}

if (typeof window !== 'undefined') {
  window.MinimodInjector = GlobalMinimodInjector;
}
