/**
 * Solaris Nexus Studio - DashboardHandler Module (TypeScript)
 * Clepces org. ltd
 */

import { GlobalNexusCore } from '../state/nexus-core';

export class DashboardHandlerModule {
  private executionsData: any[] = [];
  private executionsPagination: any = null;
  private readonly EXEC_PER_PAGE = 8;

  public renderExecutionsPage(page: number): void {
    const list = document.getElementById('dash-executions-list');
    const emptyContainer = document.getElementById('dash-executions-empty');
    if (!list) return;

    const dashSearch = document.getElementById('dashboard-search-input') as HTMLInputElement | null;
    const query = dashSearch ? dashSearch.value.toLowerCase().trim() : '';

    const filtered = this.executionsData.filter(e => {
      if (!query) return true;
      return (e.description && e.description.toLowerCase().includes(query)) ||
             (e.exec_type && e.exec_type.toLowerCase().includes(query)) ||
             (e.details && e.details.toLowerCase().includes(query)) ||
             (e.result && e.result.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      list.innerHTML = '';
      if (emptyContainer) {
        emptyContainer.style.display = 'block';
        emptyContainer.innerHTML = window.NexusComponents ? window.NexusComponents.renderEmptyState({
          title: query ? 'Sin ejecuciones coincidentes' : 'Historial de Ejecuciones Vacío',
          description: query 
            ? `No se encontraron registros que coincidan con "${query}".`
            : 'No hay registros de ejecución en la base de datos.',
          icon: 'search',
          actionText: query ? 'Limpiar Búsqueda' : null,
          actionCallback: query ? 'window.DashboardHandler?.clearDashboardSearch()' : null
        }) : `<div class="log-empty-state">No hay registros</div>`;
      }
      if (this.executionsPagination) this.executionsPagination.setTotal(0);
      return;
    }

    if (emptyContainer) emptyContainer.style.display = 'none';

    if (this.executionsPagination) {
      this.executionsPagination.setTotal(filtered.length);
    }

    const start = (page - 1) * this.EXEC_PER_PAGE;
    const end = Math.min(filtered.length, start + this.EXEC_PER_PAGE);
    const pageItems = filtered.slice(start, end);

    list.innerHTML = pageItems.map(e => `
      <div class="workflow-task-item">
        <div class="workflow-col-main">
          <div class="main-text">
            <div class="main-title">[${e.exec_type}] ${e.description}</div>
            <div class="main-desc" title="${e.details || ''}">${e.details || 'Telemetría del sistema'}</div>
          </div>
        </div>
        <div class="workflow-col-badge">
          <span class="log-time">${e.created_at}</span>
        </div>
        <div class="workflow-col-action">
          <span class="metric-badge-pill">✓ ${e.result}</span>
        </div>
      </div>
    `).join('');
  }

  public clearDashboardSearch(): void {
    const dashSearch = document.getElementById('dashboard-search-input') as HTMLInputElement | null;
    if (dashSearch) {
      dashSearch.value = '';
      this.applyDashboardSearch();
    }
  }

  public applyDashboardSearch(): void {
    const dashSearch = document.getElementById('dashboard-search-input') as HTMLInputElement | null;
    const q = dashSearch ? dashSearch.value.toLowerCase().trim() : '';

    const activeExecPane = document.getElementById('pane-dash-executions');
    if (activeExecPane && activeExecPane.classList.contains('active')) {
      if (this.executionsPagination) this.executionsPagination.currentPage = 1;
      this.renderExecutionsPage(1);
      return;
    }

    const activePane = document.querySelector('.dash-pane.active');
    if (!activePane) return;

    let visibleCount = 0;
    activePane.querySelectorAll<HTMLElement>('.workflow-task-item').forEach(item => {
      const match = item.innerText.toLowerCase().includes(q);
      item.style.display = match ? 'grid' : 'none';
      if (match) visibleCount++;
    });

    const emptyBox = activePane.querySelector<HTMLElement>('.dash-pane-empty');
    if (emptyBox) {
      if (visibleCount === 0 && q !== '') {
        emptyBox.style.display = 'block';
        emptyBox.innerHTML = window.NexusComponents ? window.NexusComponents.renderEmptyState({
          title: 'Sin coincidencias en esta pestaña',
          description: `No se encontraron elementos que coincidan con "${q}".`,
          icon: 'search',
          actionText: 'Limpiar Filtro',
          actionCallback: 'window.DashboardHandler?.clearDashboardSearch()'
        }) : '';
      } else {
        emptyBox.style.display = 'none';
      }
    }
  }

  public async loadExecutions(): Promise<void> {
    const list = document.getElementById('dash-executions-list');
    const countEl = document.getElementById('dash-exec-count');
    const paginationContainer = document.getElementById('dash-executions-pagination');
    if (!list) return;

    try {
      const res = await GlobalNexusCore.apiGet('system/executions');
      let executions = (res && res.success && res.data && res.data.executions) ? res.data.executions : [];

      if (executions.length === 0) {
        try {
          const cached = JSON.parse(localStorage.getItem('solaris_executions') || '[]');
          if (Array.isArray(cached) && cached.length > 0) executions = cached;
        } catch (e) {}
      }

      this.executionsData = executions;
      if (countEl) countEl.innerText = String(executions.length);

      if (window.NexusComponents && paginationContainer && !this.executionsPagination) {
        this.executionsPagination = new window.NexusComponents.Pagination({
          container: paginationContainer,
          totalItems: this.executionsData.length,
          itemsPerPage: this.EXEC_PER_PAGE,
          currentPage: 1,
          onPageChange: (newPage: number) => {
            this.renderExecutionsPage(newPage);
          }
        });
      }

      this.renderExecutionsPage(1);
    } catch (e) {}
  }

  public async loadPermissions(): Promise<void> {
    const list = document.getElementById('dash-permissions-list');
    if (!list) return;
    try {
      const res = await GlobalNexusCore.apiGet('system/permissions');
      if (res && res.success && res.data && res.data.permissions) {
        list.innerHTML = res.data.permissions.map((p: any) => `
          <div class="workflow-task-item">
            <div class="workflow-col-main">
              <div class="main-text">
                <div class="main-title">${p.resource}</div>
                <div class="main-desc" title="${p.path}">${p.path}</div>
              </div>
            </div>
            <div class="workflow-col-badge">
              <span class="metric-badge-pill ${p.granted ? '' : 'neutral'}">${p.access}</span>
            </div>
            <div class="workflow-col-action">
              <span class="metric-badge-pill ${p.granted ? '' : 'warning'}">${p.statusText}</span>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {}
  }

  public logExecution(type: string, description: string, result: string, details: string | null = null): void {
    const entry = {
      exec_type: type,
      description,
      details,
      result,
      created_at: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    this.executionsData.unshift(entry);
    const countEl = document.getElementById('dash-exec-count');
    if (countEl) countEl.innerText = String(this.executionsData.length);

    try {
      localStorage.setItem('solaris_executions', JSON.stringify(this.executionsData.slice(0, 100)));
    } catch (e) {}

    this.renderExecutionsPage(1);
    GlobalNexusCore.apiPost('system/executions', entry).catch(() => {});
  }

  public init(): void {
    document.querySelectorAll<HTMLElement>('.tab-link-btn[data-dash-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-link-btn[data-dash-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabName = btn.getAttribute('data-dash-tab');
        if (tabName) {
          try {
            localStorage.setItem('solaris_dash_tab', tabName);
          } catch (e) {}
          document.querySelectorAll<HTMLElement>('.dash-pane').forEach(pane => {
            const match = pane.id === `pane-dash-${tabName}`;
            pane.classList.toggle('active', match);
            pane.style.display = match ? 'block' : 'none';
          });
          this.applyDashboardSearch();
        }
      });
    });

    const savedDashTab = localStorage.getItem('solaris_dash_tab');
    if (savedDashTab) {
      const matchBtn = document.querySelector<HTMLElement>(`.tab-link-btn[data-dash-tab="${savedDashTab}"]`);
      if (matchBtn) matchBtn.click();
    }

    const searchInput = document.getElementById('dashboard-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.applyDashboardSearch());
    }

    this.loadPermissions();
    this.loadExecutions();
  }
}

export const GlobalDashboardHandler = new DashboardHandlerModule();

declare global {
  interface Window {
    DashboardHandler: DashboardHandlerModule;
  }
}

if (typeof window !== 'undefined') {
  window.DashboardHandler = GlobalDashboardHandler;
}
