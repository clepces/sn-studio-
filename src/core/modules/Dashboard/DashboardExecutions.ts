/**
 * Solaris Nexus Studio - DashboardExecutions Subsystem
 * Manages enterprise execution logs, pagination, and DOM filtering
 */

import type { ExecutionItem } from './types';

export class DashboardExecutions {
  private executions: ExecutionItem[] = [];
  private currentPage = 1;
  private readonly EXEC_PER_PAGE = 8;

  public setExecutions(items: ExecutionItem[]): void {
    this.executions = items;
  }

  public getExecutions(): ExecutionItem[] {
    return this.executions;
  }

  public addExecution(item: ExecutionItem): void {
    this.executions.unshift(item);
  }

  public getCurrentPage(): number {
    return this.currentPage;
  }

  public render(page: number = 1, onClearSearch?: () => void): void {
    this.currentPage = page;
    const list = document.getElementById('dash-executions-list');
    const emptyContainer = document.getElementById('dash-executions-empty');
    if (!list) return;

    const dashSearch = document.getElementById('dashboard-search-input') as HTMLInputElement | null;
    const query = dashSearch ? dashSearch.value.toLowerCase().trim() : '';

    const filtered = this.executions.filter(e => {
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
        emptyContainer.innerHTML = `
          <div class="log-empty-state" style="padding: 24px; text-align: center;">
            <div style="font-size: 1.5rem; margin-bottom: 8px;">🔍</div>
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">
              ${query ? 'Sin ejecuciones coincidentes' : 'Historial de Ejecuciones Vacío'}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">
              ${query ? `No se encontraron registros que coincidan con "${query}".` : 'No hay registros de ejecución en la base de datos.'}
            </div>
            ${query ? '<button type="button" class="btn-row-action" id="btn-clear-dash-search">Limpiar Búsqueda</button>' : ''}
          </div>
        `;

        if (query && onClearSearch) {
          emptyContainer.querySelector('#btn-clear-dash-search')?.addEventListener('click', onClearSearch);
        }
      }
      return;
    }

    if (emptyContainer) emptyContainer.style.display = 'none';

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
}
