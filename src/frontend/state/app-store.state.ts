import { GlobalEventBus } from './event-bus';
import type { HealthCheckData } from '@shared/types/api-response.types';

export interface AppState {
  activeTab: string;
  isSidebarOpen: boolean;
  isDevMode: boolean;
  systemHealth: HealthCheckData | null;
  loadedStringsCount: number;
  activeModsCount: number;
}

export class AppStore {
  private state: AppState = {
    activeTab: 'tab-dashboard',
    isSidebarOpen: true,
    isDevMode: false,
    systemHealth: null,
    loadedStringsCount: 0,
    activeModsCount: 0,
  };

  public getState(): Readonly<AppState> {
    return Object.freeze({ ...this.state });
  }

  public setState(patch: Partial<AppState>): void {
    this.state = { ...this.state, ...patch };
    GlobalEventBus.emit('state:changed', this.getState());
  }

  public setActiveTab(tabId: string): void {
    this.setState({ activeTab: tabId });
    GlobalEventBus.emit('tab:changed', tabId);
  }

  public toggleSidebar(force?: boolean): void {
    const next = force !== undefined ? force : !this.state.isSidebarOpen;
    this.setState({ isSidebarOpen: next });
    GlobalEventBus.emit('sidebar:toggled', next);
  }
}

export const GlobalStore = new AppStore();
