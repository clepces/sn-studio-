/**
 * Solaris Nexus Studio - NexusUI Application Coordinator (TypeScript)
 * Clepces org. ltd
 */

import { GlobalNexusCore } from '@/state/nexus-core';

export class NexusUICoordinator {
  public async init(): Promise<void> {
    if (GlobalNexusCore && GlobalNexusCore.fetchRealEnvironment) {
      await GlobalNexusCore.fetchRealEnvironment();
    }

    if (window.ViewNavigatorRouter) window.ViewNavigatorRouter.init?.();
    if (window.TranslationStudioModule) window.TranslationStudioModule.init?.();
    if (window.ModManagerModule) window.ModManagerModule.init?.();
    if (window.EntityEditorModule) window.EntityEditorModule.init?.();
    if (window.GalaxyForgeModule) window.GalaxyForgeModule.init?.();
    if (window.ConvertCliModule) window.ConvertCliModule.init?.();
    if (window.SystemHealthModule) window.SystemHealthModule.init?.();

    if (window.ViewNavigatorRouter) {
      const savedTab = localStorage.getItem('solaris_active_tab') || 'tab-dashboard';
      window.ViewNavigatorRouter.switchTab(savedTab);
    }
  }

  public switchTab(targetId: string): void {
    if (window.ViewNavigatorRouter) {
      window.ViewNavigatorRouter.switchTab(targetId);
    }
  }

  public toggleSidebar(forceOpen?: boolean): void {
    if (window.ViewNavigatorRouter) {
      window.ViewNavigatorRouter.toggleSidebar?.(forceOpen);
    }
  }

  public loadDemoData(): void {
    if (window.TranslationStudioModule) {
      window.TranslationStudioModule.loadDemoData();
    }
  }
}

export const GlobalNexusUI = new NexusUICoordinator();

declare global {
  interface Window {
    NexusUI: NexusUICoordinator;
  }
}

if (typeof window !== 'undefined') {
  window.NexusUI = GlobalNexusUI;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GlobalNexusUI.init());
  } else {
    setTimeout(() => GlobalNexusUI.init(), 100);
  }
}
