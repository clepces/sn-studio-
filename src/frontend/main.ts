import { GlobalRouter } from '@/router/view-navigator.router';
import { GlobalEventBus } from '@/state/event-bus';
import { GlobalStore } from '@/state/app-store.state';
import { SystemApiClient } from '@/api-client/system-api.client';
import { GlobalTelemetryManager } from '@/modules/telemetry-manager';
import { GlobalNexusCore } from '@/state/nexus-core';
import { initPreloader } from '@/modules/preloader-manager';

import '@/components/nexus-components';
import '@/modules/contextual-actions';
import '@/modules/dashboard-handler';
import '@/modules/sidebar-tree';
import '@/modules/platform-detector';
import '@/modules/minimod-injector';
import '@/modules/mod-manager';
import '@/modules/entity-editor';
import '@/modules/galaxy-forge';
import '@/modules/convert-cli';
import '@/modules/system-health';
import '@/modules/view-navigator';
import '@/modules/nexus-ui';

console.info('🚀 [SolarisNexus] Enterprise Frontend initialized with 100% Pure TypeScript Architecture.');
(window as any).GlobalNexusCore = GlobalNexusCore;

document.addEventListener('DOMContentLoaded', async () => {
  initPreloader();
  try {
    const health = await SystemApiClient.getHealth();
    GlobalStore.setState({ systemHealth: health });
    GlobalEventBus.emit('system:ready', health);
  } catch (err) {
    console.warn('[SolarisNexus] Error al verificar estado inicial:', err);
  }
});

document.addEventListener('click', (e: MouseEvent) => {
  const target = (e.target as HTMLElement | null)?.closest('[data-action]') as HTMLElement | null;
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'global-telemetry:scroll-left') {
    const c = document.getElementById('global-telemetry-carousel');
    if (c) c.scrollBy({ left: -320, behavior: 'smooth' });
  } else if (action === 'global-telemetry:scroll-right') {
    const c = document.getElementById('global-telemetry-carousel');
    if (c) c.scrollBy({ left: 320, behavior: 'smooth' });
  }
});

export { GlobalRouter, GlobalEventBus, GlobalStore, GlobalTelemetryManager };
