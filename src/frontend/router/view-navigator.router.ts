import { GlobalEventBus } from '@/state/event-bus';
import { GlobalStore } from '@/state/app-store.state';

export class ViewNavigatorRouter {
  private activeTabId: string = 'tab-dashboard';

  constructor() {
    this.init();
  }

  private init(): void {
    window.addEventListener('hashchange', () => this.handleHashChange());
    document.addEventListener('click', (e) => this.handleDelegatedClick(e));
  }

  public switchTab(targetTabId: string): void {
    if (!targetTabId) return;

    const panels = document.querySelectorAll<HTMLElement>('.view-panel');
    panels.forEach((p) => {
      p.classList.toggle('active', p.id === targetTabId);
    });

    const navItems = document.querySelectorAll<HTMLElement>('.sidebar-nav-item');
    navItems.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === targetTabId);
    });

    const dockBtns = document.querySelectorAll<HTMLElement>('.dock-btn, .dock-settings-btn');
    dockBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === targetTabId);
    });

    this.activeTabId = targetTabId;
    GlobalStore.setActiveTab(targetTabId);
    GlobalEventBus.emit('router:navigated', targetTabId);

    if (window.location.hash !== `#${targetTabId}`) {
      window.history.replaceState(null, '', `#${targetTabId}`);
    }
  }

  public getActiveTab(): string {
    return this.activeTabId;
  }

  private handleHashChange(): void {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== this.activeTabId) {
      this.switchTab(hash);
    }
  }

  /**
   * Delegación centralizada de clicks en todo el documento.
   * Captura data-tab (navegación), data-action (comandos),
   * y data-message (alertas placeholder para features en desarrollo).
   */
  private handleDelegatedClick(e: MouseEvent): void {
    const clicked = e.target as HTMLElement;

    // 1. Navegación por data-tab
    const tabTarget = clicked.closest<HTMLElement>('[data-tab]');
    if (tabTarget?.dataset.tab) {
      e.preventDefault();
      this.switchTab(tabTarget.dataset.tab);
      return;
    }

    // 2. Acciones por data-action
    const actionTarget = clicked.closest<HTMLElement>('[data-action]');
    if (actionTarget?.dataset.action) {
      e.preventDefault();
      this.handleDataAction(actionTarget);
      return;
    }
  }

  /**
   * Despacha data-action al EventBus o ejecuta lógica inline específica.
   */
  private handleDataAction(el: HTMLElement): void {
    const action = el.dataset.action;
    if (!action) return;

    // Acciones con mensaje placeholder (features en desarrollo)
    if (el.dataset.message) {
      GlobalEventBus.emit('ui:notify', { message: el.dataset.message, type: 'info' });
      return;
    }

    // Acciones de inyección de valor en inputs (presets)
    if (action === 'set-input-value' && el.dataset.target && el.dataset.value) {
      const input = document.querySelector<HTMLInputElement>(el.dataset.target);
      if (input) {
        input.value = el.dataset.value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }

    // Despachar al EventBus para que los módulos lo capturen
    GlobalEventBus.emit(action, { source: el });
  }
}

export const GlobalRouter = new ViewNavigatorRouter();
