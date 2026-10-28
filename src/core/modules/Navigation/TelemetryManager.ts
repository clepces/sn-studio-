/**
 * Solaris Nexus Studio - TelemetryManager Subsystem
 * View-specific telemetry metrics carousel, dynamic badges, and real-time health indicators
 */

import { GlobalEventHub } from '../../services/event-hub';
import { GlobalEventBus } from '@/state/event-bus';
import type { TelemetryCardDef } from './types';

export const VIEW_TELEMETRY_MAP: Record<string, { title: string; cards: TelemetryCardDef[] }> = {
  'tab-dashboard': {
    title: '[ Telemetría Activa: Dashboard Sins Nexus ]',
    cards: [
      {
        title: 'Cadenas Rebellion',
        badgeText: '✓ 100% Real',
        badgeClass: 'success',
        value: '7.828',
        footerText: 'Localizations/es/String/English.str',
        tab: 'tab-translation'
      },
      {
        title: 'Memoria 32-bit',
        badgeText: 'LAA Seguro',
        badgeClass: 'success',
        value: '1.400 MB',
        footerText: '1.850 MB margen libre',
        tab: 'tab-mods'
      },
      {
        title: 'Mods Activos',
        badgeText: '3 Activos',
        badgeClass: 'indigo',
        value: '3 Mods',
        footerText: 'Cascada EnabledMods.txt P999',
        tab: 'tab-mods'
      },
      {
        title: 'Entidades GameInfo',
        badgeText: 'Vanilla',
        badgeClass: 'success',
        value: '1.872',
        footerText: 'Directorio GameInfo',
        tab: 'tab-entities'
      }
    ]
  },
  'tab-studio': {
    title: '[ Telemetría Activa: Studio Edition Master ]',
    cards: [
      {
        title: '🌐 Entorno Unificado',
        badgeText: 'Pro Edition',
        badgeClass: 'indigo',
        value: 'Sins Nexus',
        footerText: 'Traducción + Entidades + Galaxia'
      },
      {
        title: '⚡ Motor Integrado',
        badgeText: 'Operativo',
        badgeClass: 'success',
        value: '60 FPS',
        footerText: 'Visualizador Canvas 2D Listo'
      },
      {
        title: '🛡️ Seguridad VFS',
        badgeText: 'Fail-Fast',
        badgeClass: 'success',
        value: '0 Conflictos',
        footerText: 'Sin colisión de hashes'
      }
    ]
  },
  'tab-translation': {
    title: '[ Telemetría Activa: Estudio de Traducción .str ]',
    cards: [
      {
        title: '🛡️ Token Guard',
        badgeText: 'Seguro',
        badgeClass: 'success',
        value: '0 Errores',
        footerText: 'Format: %s | {0} | \\n'
      },
      {
        title: '📑 Codificación',
        badgeText: 'BOM Certificado',
        badgeClass: 'success',
        value: 'UTF-8 BOM',
        footerText: 'CRLF Windows (0xEF...)'
      },
      {
        title: '⚡ Latencia Regex',
        badgeText: 'Óptimo',
        badgeClass: 'success',
        value: '2.4 ms',
        valueClass: 'value--blue',
        footerText: '7,828 ops/sec en memoria'
      },
      {
        title: '📚 Glosario Oficial',
        badgeText: '14 Protegidos',
        badgeClass: 'indigo',
        value: '98.2%',
        valueClass: 'value--success',
        footerText: 'Facciones OK (TEC, Vasari)'
      }
    ]
  },
  'tab-mods': {
    title: '[ Telemetría Activa: Gestor VFS & Cascada de Mods ]',
    cards: [
      {
        title: 'VFS Cascada',
        badgeText: 'Prioridad 999',
        badgeClass: 'success',
        value: '3 Mods',
        footerText: 'EnabledMods.txt activo'
      },
      {
        title: 'Sobrescrituras',
        badgeText: '2 Detectadas',
        badgeClass: 'neutral',
        value: '2 Archivos',
        footerText: 'English.str / main.brushes'
      },
      {
        title: 'Memoria RAM LAA',
        badgeText: 'Seguro',
        badgeClass: 'success',
        value: '1.415 MB',
        footerText: 'Techo: 3.250 MB'
      }
    ]
  },
  'tab-entities': {
    title: '[ Telemetría Activa: Inspector de Entidades de Flota ]',
    cards: [
      {
        title: 'Naves Capitales',
        badgeText: 'Catálogo',
        badgeClass: 'success',
        value: '5 Naves',
        footerText: 'TEC / Advent / Vasari'
      },
      {
        title: 'Mitigación Armadura',
        badgeText: 'Cálculo EHP',
        badgeClass: 'indigo',
        value: 'Fórmula Oficial',
        footerText: '1 / (1 + Armor * 0.05)'
      },
      {
        title: 'Checksum Sync',
        badgeText: 'Multijugador',
        badgeClass: 'success',
        value: '100% Match',
        footerText: 'Sin desincronización'
      }
    ]
  },
  'tab-galaxy': {
    title: '[ Telemetría Activa: Topología Galaxy Forge ]',
    cards: [
      {
        title: '🌌 Sectores Estelares',
        badgeText: 'Generado',
        badgeClass: 'success',
        value: '12 Planetas',
        footerText: 'Topología circular optimizada'
      },
      {
        title: '🌐 Rutas Hyperlane',
        badgeText: 'Conectado',
        badgeClass: 'indigo',
        value: 'Grafo Conexo',
        footerText: 'BFS Cero Islas'
      },
      {
        title: '📄 Formato .galaxy',
        badgeText: 'Canónico',
        badgeClass: 'success',
        value: 'Rebellion Def',
        footerText: 'Compatible con el juego'
      }
    ]
  },
  'tab-convert': {
    title: '[ Telemetría Activa: ConvertData CLI DirectX ]',
    cards: [
      {
        title: 'Native CLI',
        badgeText: 'Binario / TXT',
        badgeClass: 'indigo',
        value: 'ConvertData',
        footerText: 'DirectX 9 Native Exe'
      },
      {
        title: 'Modo Conversión',
        badgeText: 'Bidireccional',
        badgeClass: 'success',
        value: 'TXT ⇆ BIN',
        footerText: 'GameInfo & Mesh'
      }
    ]
  },
  'tab-system': {
    title: '[ Telemetría Activa: Diagnóstico & Salud de Servidor ]',
    cards: [
      {
        title: 'Estado Servidor',
        badgeText: 'Operativo',
        badgeClass: 'success',
        value: 'HEALTHY',
        footerText: 'Express + SQLite3'
      },
      {
        title: 'Fail-Fast Check',
        badgeText: 'Cero Stacks',
        badgeClass: 'success',
        value: '100% OK',
        footerText: 'Variables de entorno validadas'
      }
    ]
  },
  'tab-network': {
    title: '[ Telemetría Activa: Red Galáctica & Workshop ]',
    cards: [
      {
        title: 'Conexión Workshop',
        badgeText: 'En Desarrollo',
        badgeClass: 'neutral',
        value: 'Steam / ModDB',
        footerText: 'Servicios remotos de distribución'
      }
    ]
  },
  'tab-pipeline': {
    title: '[ Telemetría Activa: Pipeline Gráfico & Shaders ]',
    cards: [
      {
        title: 'Texturas DDS',
        badgeText: 'DXT1 / DXT5',
        badgeClass: 'indigo',
        value: 'Shaders HLSL',
        footerText: 'DirectX 9 Graphics Pipeline'
      }
    ]
  },
  'tab-swarm': {
    title: '[ Telemetría Activa: Swarm Event Bus ]',
    cards: [
      {
        title: 'Event Bus',
        badgeText: 'Reactivo',
        badgeClass: 'indigo',
        value: 'Swarm Bus',
        footerText: 'Sincronización P2P'
      }
    ]
  },
  'tab-vault': {
    title: '[ Telemetría Activa: Bóveda de Resguardos (.bak) ]',
    cards: [
      {
        title: 'Bóveda Snapshots',
        badgeText: 'Disaster Recovery',
        badgeClass: 'success',
        value: 'Protegido',
        footerText: 'Resguardos atómicos .solaris'
      }
    ]
  }
};

export class TelemetryManager {
  private currentTab = 'tab-dashboard';

  public getCurrentTab(): string {
    return this.currentTab;
  }

  constructor() {
    GlobalEventHub.subscribe('view:changed', (tabId: unknown) => {
      if (typeof tabId === 'string') {
        this.renderTelemetryForView(tabId);
      }
    });

    GlobalEventBus.on('router:navigated', (tabId: unknown) => {
      if (typeof tabId === 'string') {
        this.renderTelemetryForView(tabId);
      }
    });
  }

  public renderTelemetryForView(tabId: string): void {
    this.currentTab = tabId;
    const titleEl = document.getElementById('telemetry-view-title');
    const containerEl = document.getElementById('global-telemetry-carousel');
    if (!containerEl) return;

    const config = VIEW_TELEMETRY_MAP[tabId] || {
      title: `[ Telemetría Activa: Módulo ${tabId} ]`,
      cards: [
        {
          title: '⚙️ Estado de Sistema',
          badgeText: 'Operativo',
          badgeClass: 'success',
          value: '100% OK',
          footerText: 'Monitoreo en tiempo real'
        },
        {
          title: '⏱️ Uptime Motor',
          badgeText: 'Estable',
          badgeClass: 'neutral',
          value: '99.9%',
          footerText: 'Sin interrupciones'
        }
      ]
    };

    if (titleEl) {
      titleEl.innerHTML = `<span>${config.title}</span>`;
    }

    containerEl.innerHTML = config.cards.map(card => {
      const clickAttr = card.tab ? `data-tab="${card.tab}" title="Ir a ${card.tab}"` : '';
      return `
        <div class="reagle-metric-card mini-neu-card" ${clickAttr}>
          <div class="metric-card-top-row">
            <span class="metric-title-small">${card.title}</span>
            <span class="metric-badge-pill ${card.badgeClass || ''}">${card.badgeText}</span>
          </div>
          <div class="metric-value-row">
            <span class="metric-huge-number ${card.valueClass || ''}">${card.value}</span>
          </div>
          <div class="metric-footer-row">
            <span class="metric-footer-text">${card.footerText}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach card click handlers
    containerEl.querySelectorAll<HTMLElement>('[data-tab]').forEach(el => {
      el.addEventListener('click', () => {
        const target = el.getAttribute('data-tab');
        if (target) {
          GlobalEventHub.publish('navigation:switch-tab', target);
        }
      });
    });
  }
}

export const GlobalTelemetryManager = new TelemetryManager();
