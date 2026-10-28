import { GlobalRouter } from '@/router/view-navigator.router';
import { GlobalEventBus } from '@/state/event-bus';
import { GlobalStore } from '@/state/app-store.state';
import { SystemApiClient } from '@/api-client/system-api.client';
import { GlobalNexusCore } from '@/state/nexus-core';
import kernel from '@core/kernel';

import '@core/engine/ui/nexus-components';
import '@core/engine/ixd/contextual-actions';
import '@core/modules/Dashboard';
import '@core/modules/Mods';
import '@core/modules/Entities';
import '@core/modules/GalaxyForge';
import '@core/modules/ConvertCli';
import '@core/modules/SystemHealth';
import { GlobalTelemetryManager, Preloader } from '@core/modules/Navigation';
import '@core/modules/Navigation';
import '@core/engine/ui/nexus-ui';

console.info('🚀 [SolarisNexus] Enterprise Frontend initialized with 100% Pure TypeScript Architecture.');
(window as any).GlobalNexusCore = GlobalNexusCore;

document.addEventListener('DOMContentLoaded', async () => {
  console.info('[SolarisNexus] DOMContentLoaded detected. Initializing Preloader...');
  Preloader.init();
  console.info('[SolarisNexus] Booting Kernel...');
  await kernel.boot();
  try {
    console.info('[SolarisNexus] Verifying system health...');
    const health = await SystemApiClient.getHealth();
    console.info('[SolarisNexus] System Healthy:', health);
    GlobalStore.setState({ systemHealth: health });
    GlobalEventBus.emit('system:ready', health);
  } catch (err) {
    console.error('[SolarisNexus] CRITICAL: Startup verification failed:', err);
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
