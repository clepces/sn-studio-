/**
 * Solaris Nexus Studio - PlatformDetector Module (TypeScript)
 * Clepces org. ltd
 */

import { GlobalNexusCore } from '../state/nexus-core';

export class PlatformDetectorModule {
  public async detectPlatforms(): Promise<void> {
    const container = document.getElementById('platform-detection-list');
    if (!container) return;

    const res = await GlobalNexusCore.apiGet('mods/detect-platforms');
    if (res && res.success && res.data && res.data.platforms) {
      container.innerHTML = res.data.platforms.map((p: any) => `
        <div class="platform-path-card ${p.exists ? 'detected' : 'not-found'}">
          <div class="platform-card-header">
            <span class="platform-card-title">${p.platform}</span>
            <span class="metric-badge-pill ${p.exists ? '' : 'neutral'}">${p.exists ? '✓ RUTA DETECTADA' : 'NO INSTALADO'}</span>
          </div>
          <div class="platform-card-path">
            ${p.path}
          </div>
          <div class="platform-card-desc">
            ${p.description}
          </div>
        </div>
      `).join('');
    }
  }

  public async validateCustomGamePath(): Promise<void> {
    const input = document.getElementById('input-custom-game-path') as HTMLInputElement | null;
    const path = input ? input.value.trim() : '';
    if (!path) return;

    const res = await GlobalNexusCore.apiPost('mods/validate-custom-path', { path });
    const msg = document.getElementById('custom-path-status-msg');
    const bRw = document.getElementById('res-badge-rw');
    const bExe = document.getElementById('res-badge-exe');
    const bLoc = document.getElementById('res-badge-loc');
    const bEnt = document.getElementById('res-badge-ent');

    if (res && res.success) {
      if (bRw) { bRw.className = 'metric-badge-pill'; bRw.innerText = res.is_writable ? '✓ Permisos RW' : 'Solo Lectura'; }
      if (bExe) { bExe.className = `metric-badge-pill ${res.has_exe ? '' : 'warning'}`; bExe.innerText = res.has_exe ? '✓ Rebellion.exe' : 'Sin .exe'; }
      if (bLoc) { bLoc.className = `metric-badge-pill ${res.has_localizations ? '' : 'neutral'}`; bLoc.innerText = res.has_localizations ? '✓ Localizations (es)' : 'Sin Localizations'; }
      if (bEnt) { bEnt.className = `metric-badge-pill ${res.has_gameinfo ? '' : 'neutral'}`; bEnt.innerText = res.has_gameinfo ? '✓ GameInfo Detectado' : 'Sin GameInfo'; }
      if (msg) {
        msg.innerText = res.message || 'Directorio verificado con éxito.';
        msg.style.color = '#16a34a';
      }
      try {
        localStorage.setItem('solaris_custom_game_path', path);
      } catch (e) {}
      window.DashboardHandler?.logExecution('FS', `Validado y vinculado directorio personalizado: ${path}`, 'Ruta OK');
    } else {
      if (msg) {
        msg.innerText = (res && res.message) ? res.message : 'Error al validar directorio.';
        msg.style.color = '#ef4444';
      }
    }
  }
}

export const GlobalPlatformDetector = new PlatformDetectorModule();

declare global {
  interface Window {
    PlatformDetector: PlatformDetectorModule;
  }
}

if (typeof window !== 'undefined') {
  window.PlatformDetector = GlobalPlatformDetector;
}
