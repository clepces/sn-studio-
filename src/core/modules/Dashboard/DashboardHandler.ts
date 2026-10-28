/**
 * Solaris Nexus Studio - DashboardHandler Coordinator
 * Clepces org. ltd | Modular Architecture & Strict Typing
 */

import { GlobalEventHub } from '../../services/event-hub';
import { DashboardExecutions } from './DashboardExecutions';
import type { ExecutionItem, DashboardInterface } from './types';

export class DashboardHandler implements DashboardInterface {
  public executions: DashboardExecutions;

  constructor() {
    this.executions = new DashboardExecutions();
  }

  public logExecution(execType: string, description: string, result: string, details?: string): void {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const item: ExecutionItem = {
      exec_type: execType,
      description,
      result,
      details: details || 'Telemetría del sistema',
      created_at: timeStr
    };

    this.executions.addExecution(item);
    this.executions.render(1, () => this.clearDashboardSearch());
  }

  public applyDashboardSearch(): void {
    const dashSearch = document.getElementById('dashboard-search-input') as HTMLInputElement | null;
    const q = dashSearch ? dashSearch.value.toLowerCase().trim() : '';

    const activeExecPane = document.getElementById('pane-dash-executions');
    if (activeExecPane && activeExecPane.classList.contains('active')) {
      this.executions.render(1, () => this.clearDashboardSearch());
      return;
    }

    const activePane = document.querySelector('.dash-pane.active');
    if (!activePane) return;

    activePane.querySelectorAll<HTMLElement>('.workflow-task-item').forEach(item => {
      const match = !q || item.innerText.toLowerCase().includes(q);
      item.style.display = match ? 'grid' : 'none';
    });
  }

  public clearDashboardSearch(): void {
    const dashSearch = document.getElementById('dashboard-search-input') as HTMLInputElement | null;
    if (dashSearch) {
      dashSearch.value = '';
      this.applyDashboardSearch();
    }
  }

  public init(): void {
    // Seed default executions
    this.executions.setExecutions([
      {
        exec_type: 'VFS',
        description: 'Orquestación de EnabledMods.txt completada',
        details: '1 mod en cascada (Prioridad 999).',
        result: 'Exitoso',
        created_at: '12:00:00'
      },
      {
        exec_type: 'SYS',
        description: 'Inicialización de micro-kernel Solaris Nexus',
        details: 'Carga de subsistemas 100% tipada.',
        result: 'Listo',
        created_at: '12:00:01'
      }
    ]);

    // Initial render
    this.executions.render(1, () => this.clearDashboardSearch());

    // Search input
    const dashSearch = document.getElementById('dashboard-search-input');
    if (dashSearch) {
      dashSearch.addEventListener('input', () => this.applyDashboardSearch());
    }

    // Subtab navigation in dashboard
    document.querySelectorAll<HTMLElement>('.tab-link-btn[data-dash-tab], .dash-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabKey = btn.getAttribute('data-dash-tab') || btn.getAttribute('data-dash-subtab');
        if (!tabKey) return;
        const paneId = tabKey.startsWith('pane-') ? tabKey : `pane-dash-${tabKey}`;

        document.querySelectorAll<HTMLElement>('.tab-link-btn, .dash-subtab-btn').forEach(b => {
          const bKey = b.getAttribute('data-dash-tab') || b.getAttribute('data-dash-subtab');
          b.classList.toggle('active', bKey === tabKey);
        });

        document.querySelectorAll<HTMLElement>('.dash-pane').forEach(p => {
          p.classList.toggle('active', p.id === paneId);
        });

        this.applyDashboardSearch();
      });
    });

    // EventHub subscription
    GlobalEventHub.subscribe('execution:log', (payload: unknown) => {
      if (payload && typeof payload === 'object') {
        const p = payload as { module?: string; exec_type?: string; message?: string; description?: string; status?: string; result?: string; details?: string };
        const execType = p.module || p.exec_type || 'SYS';
        const desc = p.message || p.description || 'Operación del sistema';
        const res = p.status || p.result || 'OK';
        this.logExecution(execType, desc, res, p.details);
      }
    });
  }
}

export const GlobalDashboardHandler = new DashboardHandler();

declare global {
  interface Window {
    DashboardHandler?: DashboardHandler;
  }
}

if (typeof window !== 'undefined') {
  window.DashboardHandler = GlobalDashboardHandler;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GlobalDashboardHandler.init());
  } else {
    setTimeout(() => GlobalDashboardHandler.init(), 20);
  }
}
