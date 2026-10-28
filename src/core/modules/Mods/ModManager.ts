/**
 * Solaris Nexus Studio - ModManager Coordinator
 * Clepces org. ltd | Modular Architecture & Strict Typing (Zero `any`)
 */

import { GlobalNexusCore } from '@/state/nexus-core';
import { GlobalEventHub } from '../../services/event-hub';
import { ModVfsManager } from './ModVfsManager';
import { MinimodInjector } from './MinimodInjector';
import { PlatformDetector } from './PlatformDetector';
import { ModUI } from './ModUI';
import type { ActiveMod, ModManagerInterface } from './types';

export class ModManager implements ModManagerInterface {
  public vfsManager: ModVfsManager;
  public minimodInjector: MinimodInjector;
  public platformDetector: PlatformDetector;
  public ui: ModUI;

  constructor() {
    this.vfsManager = new ModVfsManager();
    this.minimodInjector = new MinimodInjector();
    this.platformDetector = new PlatformDetector();
    this.ui = new ModUI();
  }

  public switchSubTab(targetSubTabId: string): void {
    document.querySelectorAll<HTMLElement>('.mod-subtab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-subtab') === targetSubTabId);
    });

    document.querySelectorAll<HTMLElement>('.mod-subtab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === targetSubTabId);
    });
  }

  public renderModList(): void {
    const activeMods: ActiveMod[] = GlobalNexusCore.state.activeMods || [];

    this.ui.renderModList(activeMods, {
      onMoveUp: (idx: number) => {
        if (idx > 0) {
          const current = activeMods[idx];
          const prev = activeMods[idx - 1];
          if (current && prev) {
            activeMods[idx] = prev;
            activeMods[idx - 1] = current;
            this.recalculatePriorities();
            this.renderModList();
            this.vfsManager.updateRamMetrics();
          }
        }
      },
      onMoveDown: (idx: number) => {
        if (idx < activeMods.length - 1) {
          const current = activeMods[idx];
          const next = activeMods[idx + 1];
          if (current && next) {
            activeMods[idx] = next;
            activeMods[idx + 1] = current;
            this.recalculatePriorities();
            this.renderModList();
            this.vfsManager.updateRamMetrics();
          }
        }
      },
      onRemove: (idx: number) => {
        activeMods.splice(idx, 1);
        this.recalculatePriorities();
        this.renderModList();
        this.vfsManager.updateRamMetrics();
      },
      onInjectMinimod: () => {
        this.minimodInjector.toggleMinimodP999(() => {
          this.recalculatePriorities();
          this.renderModList();
          this.vfsManager.updateRamMetrics();
          this.vfsManager.saveVfsHierarchy();
        });
      },
      onScanMods: () => {
        this.scanMods();
      }
    });

    this.minimodInjector.updateMinimodStatus();
    this.vfsManager.updateRamMetrics();
  }

  public recalculatePriorities(): void {
    this.vfsManager.recalculatePriorities();
  }

  public async restoreVanilla(): Promise<void> {
    await this.vfsManager.restoreVanilla(() => {
      this.renderModList();
    });
  }

  public async saveVfsHierarchy(): Promise<void> {
    await this.vfsManager.saveVfsHierarchy();
  }

  public async scanMods(): Promise<void> {
    await this.vfsManager.scanMods(() => {
      this.renderModList();
    });
  }

  public checkVfsCollisions(): void {
    this.vfsManager.checkVfsCollisions();
  }

  public init(): void {
    // Sub-tab button bindings
    document.querySelectorAll<HTMLElement>('.mod-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-subtab');
        if (target) this.switchSubTab(target);
      });
    });

    // Action button bindings
    document.querySelector('[data-action="mod:scan"]')?.addEventListener('click', () => this.scanMods());
    document.querySelector('[data-action="mod:restore-vanilla"]')?.addEventListener('click', () => this.restoreVanilla());
    document.querySelector('[data-action="mod:save-vfs"]')?.addEventListener('click', () => this.saveVfsHierarchy());
    document.querySelector('[data-action="mod:validate-custom-path"]')?.addEventListener('click', () => {
      this.platformDetector.validateCustomGamePath();
    });
    document.querySelector('[data-action="mod:detect-platforms"]')?.addEventListener('click', () => {
      this.platformDetector.detectPlatforms();
    });
    document.querySelector('[data-action="mod:check-collisions"]')?.addEventListener('click', () => {
      this.checkVfsCollisions();
    });
    document.querySelector('[data-action="mod:toggle-minimod"]')?.addEventListener('click', () => {
      this.minimodInjector.toggleMinimodP999(() => {
        this.recalculatePriorities();
        this.renderModList();
        this.vfsManager.updateRamMetrics();
        this.vfsManager.saveVfsHierarchy();
      });
    });

    // Custom minimod injector form
    document.getElementById('btn-inject-minimod-action')?.addEventListener('click', () => {
      this.minimodInjector.injectCustomMinimod(() => {
        this.recalculatePriorities();
        this.renderModList();
        this.vfsManager.updateRamMetrics();
        this.switchSubTab('subtab-mods-hierarchy');
      });
    });

    // EventHub integration
    GlobalEventHub.subscribe('mods:switch-tab', (tabId: unknown) => {
      if (typeof tabId === 'string') {
        this.switchSubTab(tabId);
      }
    });

    GlobalEventHub.subscribe('mods:refresh', () => {
      this.renderModList();
    });

    // Restore saved custom path
    try {
      const savedCustomPath = localStorage.getItem('solaris_custom_game_path');
      if (savedCustomPath) {
        const input = document.getElementById('input-custom-game-path') as HTMLInputElement | null;
        if (input) input.value = savedCustomPath;
      }
    } catch {
      // Storage access restrictions
    }

    this.renderModList();
    this.platformDetector.detectPlatforms();
    this.platformDetector.validateCustomGamePath(true);
  }
}

export const GlobalModManager = new ModManager();

// Compatibility bridge for non-modular legacy tabs
declare global {
  interface Window {
    ModManagerModule?: ModManager;
    MinimodInjector?: MinimodInjector;
    PlatformDetector?: PlatformDetector;
  }
}

if (typeof window !== 'undefined') {
  window.ModManagerModule = GlobalModManager;
  window.MinimodInjector = GlobalModManager.minimodInjector;
  window.PlatformDetector = GlobalModManager.platformDetector;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GlobalModManager.init());
  } else {
    setTimeout(() => GlobalModManager.init(), 20);
  }
}
