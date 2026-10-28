/**
 * Solaris Nexus Studio - PlatformDetector Subsystem
 * Scans OS user profile paths (Steam, GOG, Stardock) & validates custom game directories
 */

import { GlobalNexusCore } from '@/state/nexus-core';
import { GlobalEventHub } from '../../services/event-hub';
import { ToastNotification } from '../../engine/ui/toast.component';
import type { PlatformInfo, CustomPathValidationResult } from './types';

export class PlatformDetector {
  public async detectPlatforms(): Promise<void> {
    const container = document.getElementById('platform-detection-list');
    if (!container) return;

    try {
      const res = await GlobalNexusCore.apiGet('mods/detect-platforms') as {
        success: boolean;
        data?: { platforms: PlatformInfo[] };
      };

      if (res && res.success && res.data && Array.isArray(res.data.platforms)) {
        container.innerHTML = res.data.platforms.map((p: PlatformInfo) => `
          <div class="platform-path-card ${p.exists ? 'detected' : 'not-found'}">
            <div class="platform-card-header">
              <span class="platform-card-title">${p.platform}</span>
              <span class="metric-badge-pill ${p.exists ? '' : 'neutral'}">${p.exists ? '✓ RUTA DETECTADA' : 'NO INSTALADO'}</span>
            </div>
            <div class="platform-card-path">${p.path}</div>
            <div class="platform-card-desc">${p.description}</div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.warn('[PlatformDetector] Error detectando plataformas:', err);
    }
  }

  public async validateCustomGamePath(isSilent: boolean = false): Promise<void> {
    const input = document.getElementById('input-custom-game-path') as HTMLInputElement | null;
    const path = input ? input.value.trim() : '';
    if (!path) {
      if (!isSilent) ToastNotification.warning('Por favor introduce una ruta física del juego.');
      return;
    }

    try {
      const res = await GlobalNexusCore.apiPost('mods/validate-custom-path', { path }) as CustomPathValidationResult;
      const msg = document.getElementById('custom-path-status-msg');
      const bRw = document.getElementById('res-badge-rw');
      const bExe = document.getElementById('res-badge-exe');
      const bLoc = document.getElementById('res-badge-loc');
      const bEnt = document.getElementById('res-badge-ent');

      if (res && res.success) {
        if (bRw) {
          bRw.className = 'metric-badge-pill';
          bRw.innerText = res.is_writable ? '✓ Permisos RW' : 'Solo Lectura';
        }
        if (bExe) {
          bExe.className = `metric-badge-pill ${res.has_exe ? '' : 'warning'}`;
          bExe.innerText = res.has_exe ? '✓ Rebellion.exe' : 'Sin .exe';
        }
        if (bLoc) {
          bLoc.className = `metric-badge-pill ${res.has_localizations ? '' : 'neutral'}`;
          bLoc.innerText = res.has_localizations ? '✓ Localizations (es)' : 'Sin Localizations';
        }
        if (bEnt) {
          bEnt.className = `metric-badge-pill ${res.has_gameinfo ? '' : 'neutral'}`;
          bEnt.innerText = res.has_gameinfo ? '✓ GameInfo Detectado' : 'Sin GameInfo';
        }
        if (msg) {
          msg.innerText = res.message || 'Directorio verificado con éxito.';
          msg.style.color = '#16a34a';
        }

        try {
          localStorage.setItem('solaris_custom_game_path', path);
        } catch {
          // Ignore storage restrictions
        }

        GlobalEventHub.publish('execution:log', {
          module: 'FS',
          message: `Validado y vinculado directorio personalizado: ${path}`,
          status: 'Ruta OK'
        });
        if (!isSilent) ToastNotification.success('Ruta de instalación verificada correctamente.');
      } else {
        if (msg) {
          msg.innerText = res?.message || 'Error al validar directorio.';
          msg.style.color = '#ef4444';
        }
        if (!isSilent) ToastNotification.error(res?.message || 'No se pudo verificar la ruta especificada.');
      }
    } catch (err) {
      console.warn('[PlatformDetector] Error validando ruta:', err);
      if (!isSilent) ToastNotification.error('Error de conexión al validar la ruta.');
    }
  }
}
