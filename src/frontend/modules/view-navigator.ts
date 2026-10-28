/**
 * Solaris Nexus Studio - ViewNavigator Module (TypeScript)
 * Clepces org. ltd
 */

import { GlobalEventBus } from '../state/event-bus';
import { GlobalTelemetryManager } from './telemetry-manager';

export interface ModuleMetadata {
  title: string;
  subtitle: string;
  metricNumber: string;
  metricLabel: string;
  metricBadge: string;
}

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

export class ViewNavigatorModule {
  private readonly STUDIO_TABS = ['tab-studio', 'tab-translation', 'tab-mods', 'tab-entities', 'tab-galaxy', 'tab-convert'];
  private lastActiveStudioTab = 'tab-translation';

  public switchTab(targetId: string): void {
    if (this.STUDIO_TABS.includes(targetId)) {
      this.lastActiveStudioTab = targetId;
    }

    try {
      localStorage.setItem('solaris_active_tab', targetId);
    } catch (e) {}

    document.querySelectorAll<HTMLElement>('.sidebar-nav-item').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === targetId);
    });

    document.querySelectorAll<HTMLElement>('.dock-btn[data-tab], .dock-settings-btn').forEach(b => {
      const tab = b.getAttribute('data-tab');
      if (b.id === 'dock-btn-studio') {
        b.classList.toggle('active', this.STUDIO_TABS.includes(targetId));
      } else {
        b.classList.toggle('active', tab === targetId);
      }
    });

    document.querySelectorAll<HTMLElement>('.view-panel').forEach(p => {
      p.classList.toggle('active', p.id === targetId);
    });

    this.updateHeroMetrics(targetId);
    window.ContextualActions?.render(targetId);

    GlobalEventBus.emit('router:navigated', targetId);
    GlobalTelemetryManager.renderTelemetryForView(targetId);

    if (targetId === 'tab-galaxy' && window.GalaxyForgeModule) {
      window.GalaxyForgeModule.refreshCanvas();
    }
  }

  public updateHeroMetrics(targetId: string): void {
    const meta = MODULE_METADATA[targetId];
    if (!meta) return;

    const titleEl = document.getElementById('view-main-title');
    const subtitleEl = document.getElementById('view-main-subtitle');
    const labelEl = document.getElementById('hero-metric-label');
    const numEl = document.getElementById('hero-metric-number');
    const unitEl = document.getElementById('hero-metric-unit');
    const badgeEl = document.getElementById('hero-metric-badge');
    const subtextEl = document.getElementById('hero-metric-subtext');
    const linkEl = document.getElementById('hero-metric-link');

    if (titleEl) titleEl.innerText = meta.title;
    if (subtitleEl) subtitleEl.innerText = meta.subtitle;

    const strCount = window.TranslationStudioModule && window.TranslationStudioModule.getCount() > 0
      ? window.TranslationStudioModule.getCount()
      : 7828;

    if (targetId === 'tab-dashboard') {
      if (labelEl) labelEl.innerText = 'Cadenas Rebellion';
      if (numEl) numEl.innerText = strCount.toLocaleString();
      if (unitEl) unitEl.innerText = 'cadenas';
      if (subtextEl) subtextEl.innerText = 'Localizations/es/String/English.str';
      if (badgeEl) {
        badgeEl.className = 'metric-badge-pill';
        badgeEl.innerText = '✓ 100% Real';
      }
      if (linkEl) {
        linkEl.innerText = 'Ver Cadenas →';
        linkEl.onclick = () => this.switchTab('tab-translation');
      }
    } else if (targetId === 'tab-translation') {
      if (labelEl) labelEl.innerText = 'Cadenas en Memoria';
      if (numEl) numEl.innerText = strCount.toLocaleString();
      if (unitEl) unitEl.innerText = 'cadenas';
      if (subtextEl) subtextEl.innerText = 'Diccionario activo';
      if (badgeEl) {
        badgeEl.className = 'metric-badge-pill';
        badgeEl.innerText = '✓ UTF-8 BOM';
      }
      if (linkEl) {
        linkEl.innerText = 'Ver Editor →';
        linkEl.onclick = () => this.switchTab('tab-translation');
      }
    } else {
      if (labelEl) labelEl.innerText = meta.metricLabel;
      if (numEl) numEl.innerText = meta.metricNumber;
      if (unitEl) unitEl.innerText = '';
      if (subtextEl) subtextEl.innerText = meta.subtitle.slice(0, 40) + '...';
      if (badgeEl) {
        badgeEl.className = 'metric-badge-pill';
        badgeEl.innerText = meta.metricBadge;
      }
      if (linkEl) {
        linkEl.innerText = 'Ver Detalles →';
        linkEl.onclick = () => this.switchTab('tab-system');
      }
    }
  }

  public toggleSidebar(forceOpen: boolean | null = null): void {
    const sidebar = document.querySelector<HTMLElement>('.reagle-sidebar');
    const restoreBtn = document.getElementById('btn-restore-sidebar');
    if (!sidebar) return;

    if (forceOpen === true) {
      sidebar.classList.remove('collapsed');
      if (restoreBtn) restoreBtn.style.display = 'none';
      try { localStorage.setItem('solaris_sidebar_state', 'expanded'); } catch (e) {}
      window.dispatchEvent(new CustomEvent('solaris:sidebar-toggled', { detail: { collapsed: false } }));
      return;
    }

    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    if (restoreBtn) restoreBtn.style.display = isCollapsed ? 'block' : 'none';
    try {
      localStorage.setItem('solaris_sidebar_state', isCollapsed ? 'collapsed' : 'expanded');
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('solaris:sidebar-toggled', { detail: { collapsed: isCollapsed } }));
  }

  public init(): void {
    document.querySelectorAll<HTMLElement>('.sidebar-nav-item, .dock-btn[data-tab], .dock-settings-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (btn.id === 'dock-btn-studio') {
          e.stopPropagation();
          this.switchTab(this.lastActiveStudioTab || 'tab-translation');
          return;
        }
        const tab = btn.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleSidebar());

    const restoreBtn = document.getElementById('btn-restore-sidebar');
    if (restoreBtn) restoreBtn.addEventListener('click', () => this.toggleSidebar(true));

    const savedSidebar = localStorage.getItem('solaris_sidebar_state');
    if (savedSidebar === 'collapsed') this.toggleSidebar();

    window.DashboardHandler?.init();
    window.SidebarTree?.init();

    const hash = window.location.hash.replace('#', '');
    const savedTab = localStorage.getItem('solaris_active_tab') || 'tab-dashboard';
    const initialTab = (hash && document.getElementById(hash)) ? hash : savedTab;

    this.switchTab(initialTab);
  }
}

export const GlobalViewNavigatorModule = new ViewNavigatorModule();

declare global {
  interface Window {
    ViewNavigatorRouter: ViewNavigatorModule;
    ViewNavigator: ViewNavigatorModule;
  }
}

if (typeof window !== 'undefined') {
  window.ViewNavigatorRouter = GlobalViewNavigatorModule;
  window.ViewNavigator = GlobalViewNavigatorModule;
}
