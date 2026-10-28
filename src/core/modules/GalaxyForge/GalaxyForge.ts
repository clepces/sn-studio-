/**
 * Solaris Nexus Studio - GalaxyForge Coordinator
 * Clepces org. ltd | Modular Architecture & Strict Typing (Zero `any`)
 */

import { GlobalNexusCore } from '@/state/nexus-core';
import { GlobalEventHub } from '../../services/event-hub';
import { GalaxyCanvasRenderer } from './GalaxyCanvasRenderer';
import { GalaxyTopologyValidator } from './GalaxyTopologyValidator';
import { GalaxyExporter } from './GalaxyExporter';
import { GalaxyUI } from './GalaxyUI';
import type { GalaxyScenario, GalaxyForgeInterface } from './types';

export class GalaxyForge implements GalaxyForgeInterface {
  public renderer: GalaxyCanvasRenderer;
  public validator: GalaxyTopologyValidator;
  public exporter: GalaxyExporter;
  public ui: GalaxyUI;

  constructor() {
    this.renderer = new GalaxyCanvasRenderer();
    this.validator = new GalaxyTopologyValidator();
    this.exporter = new GalaxyExporter();
    this.ui = new GalaxyUI();
  }

  public init(): void {
    this.renderer.init('galaxy-canvas');

    // DOM event listeners
    document.getElementById('btn-generate-galaxy')?.addEventListener('click', () => {
      const slider = document.getElementById('planet-count-slider') as HTMLInputElement | null;
      const count = slider ? parseInt(slider.value, 10) : 12;
      this.generate(count);
    });

    document.getElementById('btn-export-galaxy')?.addEventListener('click', () => {
      this.exportGalaxy();
    });

    // EventHub subscriptions
    GlobalEventHub.subscribe('galaxy:generate', (count: unknown) => {
      const c = typeof count === 'number' ? count : 12;
      this.generate(c);
    });

    GlobalEventHub.subscribe('galaxy:export', () => {
      this.exportGalaxy();
    });

    GlobalEventHub.subscribe('galaxy:refresh', () => {
      this.refreshCanvas();
    });

    this.generate(12);
  }

  public refreshCanvas(): void {
    const galaxy = GlobalNexusCore.state.currentGalaxy as GalaxyScenario | null;
    if (galaxy) {
      requestAnimationFrame(() => this.renderer.render(galaxy));
    }
  }

  public async generate(count: number): Promise<void> {
    try {
      const res = await GlobalNexusCore.apiPost('galaxy/generate', {
        scenario_name: `Solaris_Ring_${count}P`,
        planet_count: count
      }) as {
        success: boolean;
        data?: { galaxy: GalaxyScenario };
      };

      if (res && res.success && res.data && res.data.galaxy) {
        this.renderGalaxyTopology(res.data.galaxy);
      }
    } catch (err) {
      console.warn('[GalaxyForge] Error al generar escenario galáctico:', err);
    }
  }

  public renderGalaxyTopology(galaxy: GalaxyScenario): void {
    GlobalNexusCore.state.currentGalaxy = galaxy;

    this.ui.renderTopologySummary(galaxy);
    this.ui.renderNodeList(galaxy);
    this.validator.validate(galaxy);
    this.renderer.render(galaxy);

    GlobalEventHub.publish('execution:log', {
      module: 'GALAXY',
      message: `Generado mapa ${galaxy.scenarioName} (${galaxy.planets.length} planetas, ${galaxy.phaseLanes.length} phase lanes)`,
      status: 'Topología OK'
    });
  }

  public exportGalaxy(): void {
    const galaxy = GlobalNexusCore.state.currentGalaxy as GalaxyScenario | null;
    this.exporter.export(galaxy);
  }
}

export const GlobalGalaxyForge = new GalaxyForge();

declare global {
  interface Window {
    GalaxyForgeModule?: GalaxyForge;
  }
}

if (typeof window !== 'undefined') {
  window.GalaxyForgeModule = GlobalGalaxyForge;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GlobalGalaxyForge.init());
  } else {
    setTimeout(() => GlobalGalaxyForge.init(), 20);
  }
}
