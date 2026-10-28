/**
 * Solaris Nexus Studio - ViewNavigator Coordinator
 * Clepces org. ltd | Modular Architecture & Strict Typing
 */

import { GlobalEventHub } from '../../services/event-hub';
import { GlobalTelemetryManager } from './TelemetryManager';
import { GlobalSidebarTree } from './SidebarTree';
import type { ModuleMetadata, NavigationInterface } from './types';

const MODULE_METADATA: Record<string, ModuleMetadata> = {
  'tab-dashboard': {
    title: 'Dashboard',
    subtitle: 'All Your Workflows And Permissions Managed',
    metricNumber: '340',
    metricLabel: 'Executions',
    metricBadge: '↑ 204%'
  },
  'tab-studio': {
    title: 'Studio Edition (Master)',
    subtitle: 'Entorno unificado de ingeniería inversa: Cadenas léxicas, Entidades de flota y Topología galáctica en un solo espacio.',
    metricNumber: 'UNIFICADO',
    metricLabel: 'Modo de Trabajo',
    metricBadge: 'Pro Edition'
  },
  'tab-translation': {
    title: 'Estudio de Traducción',
    subtitle: 'Gestión masiva de diccionarios .str, Token Guard en tiempo real e inyección UTF-8 BOM canónica.',
    metricNumber: '0',
    metricLabel: 'Cadenas en Memoria',
    metricBadge: 'Sin archivo'
  },
  'tab-mods': {
    title: 'Gestor VFS & Mods',
    subtitle: 'Detección multiplataforma (Steam/GOG), jerarquía en EnabledMods.txt y monitor LAA de 3.250 MB.',
    metricNumber: '3',
    metricLabel: 'Mods Activos en Cascada',
    metricBadge: 'Prioridad 999'
  },
  'tab-entities': {
    title: 'Editor de Entidades',
    subtitle: 'Inspección táctica de naves capitales con respaldo atómico y advertencia de checksum multijugador.',
    metricNumber: '5 Naves',
    metricLabel: 'Catálogo de Flota',
    metricBadge: 'Beta Sandbox'
  },
  'tab-galaxy': {
    title: 'Galaxy Forge Companion',
    subtitle: 'Modelador de topologías estelares, detección de planetas aislados y exportación canónica .galaxy.',
    metricNumber: '12 Planetas',
    metricLabel: 'Grafo Conexo Estelar',
    metricBadge: 'Sin Islas'
  },
  'tab-convert': {
    title: 'ConvertData CLI',
    subtitle: 'Conversor bidireccional entre binario DirectX compilado y texto legible por humanos.',
    metricNumber: 'NATIVE_CLI',
    metricLabel: 'Motor de Conversión',
    metricBadge: 'DirectX 9'
  },
  'tab-system': {
    title: 'Diagnóstico & Salud',
    subtitle: 'Verificación de variables fail-fast, conectividad relacional SQLite/MySQL y blindaje UUID Safety.',
    metricNumber: 'HEALTHY',
    metricLabel: 'Estado del Servidor WAMP',
    metricBadge: 'Cero Stack Traces'
  },
  'tab-network': {
    title: 'Red Galáctica & Workshop',
    subtitle: 'Conexión a repositorios remotos ModDB y Steam Workshop para distribución de paquetes de traducción.',
    metricNumber: 'EN DESARROLLO',
    metricLabel: 'Estado del Enlace',
    metricBadge: 'Beta v0.4'
  },
  'tab-pipeline': {
    title: 'Pipeline Gráfico & Shaders',
    subtitle: 'Procesamiento de texturas DDS (DXT1/DXT5), verificación de MIP-maps y linter de shaders HLSL.',
    metricNumber: 'EN DESARROLLO',
    metricLabel: 'Motor Texturas',
    metricBadge: 'DirectX 9 HLSL'
  },
  'tab-swarm': {
    title: 'Swarm Event Bus & Sincronización P2P',
    subtitle: 'Bus de eventos reactivo para colaboración multi-modder en tiempo real y resolución de conflictos.',
    metricNumber: 'EN DESARROLLO',
    metricLabel: 'Bus de Eventos',
    metricBadge: 'Kernel Swarm'
  },
  'tab-vault': {
    title: 'Bóveda de Resguardos (.bak)',
    subtitle: 'Auditoría de snapshots de seguridad automáticos y empaquetado canónico comprimido (.zip / .solaris).',
    metricNumber: 'SEGURO',
    metricLabel: 'Integridad Bóveda',
    metricBadge: 'Disaster Recovery'
  }
};

export class ViewNavigator implements NavigationInterface {
  private activeTabId = 'tab-dashboard';

  public getActiveTab(): string {
    return this.activeTabId;
  }

  public switchTab(targetId: string): void {
    const meta = MODULE_METADATA[targetId] || {
      title: 'Módulo del Sistema',
      subtitle: 'Entorno de configuración modular',
      metricNumber: 'ACTIVO',
      metricLabel: 'Estado',
      metricBadge: 'Operativo'
    };

    // Toggle navigation buttons
    document.querySelectorAll<HTMLElement>('.nav-item-btn, .sidebar-nav-item, .dock-btn, .dock-settings-btn').forEach(btn => {
      const tab = btn.getAttribute('data-tab') || btn.dataset.tab;
      btn.classList.toggle('active', tab === targetId);
    });

    // Toggle view panels
    document.querySelectorAll<HTMLElement>('.view-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === targetId);
    });

    // Update Header Metadata
    const titleEl = document.getElementById('module-view-title');
    const subEl = document.getElementById('module-view-subtitle');
    const metricNumEl = document.getElementById('module-metric-number');
    const metricLblEl = document.getElementById('module-metric-label');
    const metricBdgEl = document.getElementById('module-metric-badge');

    if (titleEl) titleEl.innerText = meta.title;
    if (subEl) subEl.innerText = meta.subtitle;
    if (metricNumEl) metricNumEl.innerText = meta.metricNumber;
    if (metricLblEl) metricLblEl.innerText = meta.metricLabel;
    if (metricBdgEl) metricBdgEl.innerText = meta.metricBadge;

    this.activeTabId = targetId;

    try {
      localStorage.setItem('solaris_active_tab', targetId);
    } catch {
      // Storage access limitations
    }

    if (window.location.hash !== `#${targetId}`) {
      window.history.replaceState(null, '', `#${targetId}`);
    }

    // Refresh telemetry
    GlobalTelemetryManager.renderTelemetryForView(targetId);

    // Contextual actions
    if (typeof (window as unknown as { ContextualActions?: { render: (id: string) => void } }).ContextualActions?.render === 'function') {
      (window as unknown as { ContextualActions: { render: (id: string) => void } }).ContextualActions.render(targetId);
    }

    // Specific module hooks
    if (targetId === 'tab-galaxy') {
      GlobalEventHub.publish('galaxy:refresh');
    }

    GlobalEventHub.publish('view:changed', targetId);
  }

  public toggleSidebar(forceOpen?: boolean): void {
    const sidebar = document.getElementById('main-sidebar');
    if (!sidebar) return;

    if (forceOpen !== undefined) {
      if (forceOpen) sidebar.classList.remove('collapsed');
      else sidebar.classList.add('collapsed');
    } else {
      sidebar.classList.toggle('collapsed');
    }

    const isCollapsed = sidebar.classList.contains('collapsed');
    try {
      localStorage.setItem('solaris_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    } catch {
      // Storage limits
    }

    window.dispatchEvent(new CustomEvent('solaris:sidebar-toggled', { detail: { collapsed: isCollapsed } }));
  }

  public init(): void {
    GlobalSidebarTree.init();

    // Attach nav item click handlers
    document.querySelectorAll<HTMLElement>('.nav-item-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    // Sidebar toggle buttons
    document.getElementById('btn-toggle-sidebar')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSidebar(false);
    });
    document.getElementById('btn-restore-sidebar')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSidebar(true);
    });
    document.getElementById('btn-sidebar-toggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSidebar();
    });

    // Delegated click fallback for sidebar actions
    document.addEventListener('click', (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest('[data-action]') as HTMLElement | null;
      if (target) {
        const action = target.dataset.action;
        if (action === 'collapse-sidebar') {
          this.toggleSidebar(false);
          return;
        } else if (action === 'expand-sidebar' || action === 'restore-sidebar') {
          this.toggleSidebar(true);
          return;
        } else if (action === 'toggle-sidebar') {
          this.toggleSidebar();
          return;
        }
      }

      // Delegated click for view internal subtabs
      const subtabBtn = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-subtab]');
      if (subtabBtn) {
        const targetId = subtabBtn.getAttribute('data-subtab');
        if (!targetId) return;

        const bar = subtabBtn.closest('.str-subtab-bar, .mod-subtab-bar, .entity-subtab-bar, .subtab-bar');
        if (bar) {
          bar.querySelectorAll('[data-subtab]').forEach(btn => btn.classList.toggle('active', btn === subtabBtn));
        }

        const pane = document.getElementById(targetId);
        if (pane) {
          const parentContainer = pane.closest('.view-panel') || document.body;
          parentContainer.querySelectorAll('.str-subtab-pane, .mod-subtab-pane, .entity-subtab-content, .subtab-pane').forEach(p => {
            p.classList.toggle('active', p.id === targetId);
          });
        }
      }
    });

    // Restore saved sidebar state
    try {
      const isCollapsed = localStorage.getItem('solaris_sidebar_collapsed') === 'true';
      if (isCollapsed) this.toggleSidebar(false);
    } catch {
      // Storage limits
    }

    // Subscribe to EventHub
    GlobalEventHub.subscribe('navigation:switch-tab', (tab: unknown) => {
      if (typeof tab === 'string') {
        this.switchTab(tab);
      }
    });

    // Initial hash routing or default
    const hash = window.location.hash.replace('#', '');
    const savedTab = localStorage.getItem('solaris_active_tab');
    const target = (hash && MODULE_METADATA[hash]) ? hash : (savedTab || 'tab-dashboard');
    this.switchTab(target);
  }
}

export const GlobalViewNavigator = new ViewNavigator();

declare global {
  interface Window {
    ViewNavigator?: ViewNavigator;
    ViewNavigatorRouter?: ViewNavigator;
  }
}

if (typeof window !== 'undefined') {
  window.ViewNavigator = GlobalViewNavigator;
  window.ViewNavigatorRouter = GlobalViewNavigator;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GlobalViewNavigator.init());
  } else {
    setTimeout(() => GlobalViewNavigator.init(), 20);
  }
}
