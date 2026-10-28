/**
 * Solaris Nexus Studio - NexusCore Client Services (TypeScript Enterprise)
 * Clepces org. ltd
 */

export interface NexusCoreState {
  allEntries: any[];
  filteredEntries: any[];
  currentFilter: string;
  activeMods: any[];
  realEnv: any | null;
  totalStrings: number;
  totalEntities: number;
  totalGalaxies: number;
  currentEditIndex: number | null;
  rowHeight: number;
  visibleCount: number;
  currentGalaxy: any | null;
  page: number;
  pageSize: any;
}

export interface NexusCoreBridge {
  state: NexusCoreState;
  extractTokens: (t: string) => string[];
  validateTokenSyntax: (orig: string, trans: string) => { valid: boolean; missing: string[]; extra: string[]; error?: string; message?: string };
  generateDemoEntries: () => any[];
  downloadBlob: (content: string, filename: string, type?: string) => void;
  apiPost: (endpoint: string, payload: any) => Promise<any>;
  apiGet: (endpoint: string) => Promise<any>;
  fetchRealEnvironment: () => Promise<any>;
}

export class NexusCoreService implements NexusCoreBridge {
  public state: NexusCoreState = {
    allEntries: [],
    filteredEntries: [],
    currentFilter: 'all',
    activeMods: [],
    realEnv: null,
    totalStrings: 7828,
    totalEntities: 1872,
    totalGalaxies: 126,
    currentEditIndex: null,
    rowHeight: 40,
    visibleCount: 40,
    currentGalaxy: null,
    page: 1,
    pageSize: 25,
  };

  public extractTokens(text: string): string[] {
    const regex = /\[VALUE\d*\]|%[0-9\.]*[sdf]|\{\d+\}/g;
    const found: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      found.push(m[0]);
    }
    return found;
  }

  public validateTokenSyntax(originalText: string, translatedText: string): { valid: boolean; missing: string[]; extra: string[]; error?: string; message?: string } {
    const origTokens = this.extractTokens(originalText);
    const currTokens = this.extractTokens(translatedText);
    const missing = origTokens.filter(t => !currTokens.includes(t));
    const extra = currTokens.filter(t => !origTokens.includes(t));
    const valid = missing.length === 0 && extra.length === 0;

    return {
      valid,
      missing,
      extra,
      error: valid ? undefined : `Faltan [${missing.join(', ')}] o sobran [${extra.join(', ')}]`,
      message: valid ? 'Sintaxis de tokens correcta.' : undefined
    };
  }

  public generateDemoEntries(): any[] {
    const templates: [string, string, string][] = [
      ['IDS_MAIN_MENU_TITLE', 'Sins of a Solar Empire: Rebellion', 'Sins of a Solar Empire: Rebellion'],
      ['IDS_FLEET_STATUS', 'Fleet %s holding position with [VALUE] ships.', 'Flota %s manteniendo posición con [VALUE] naves.'],
      ['IDS_CAPITAL_SHIP_NAME', 'Kol Class Battleship', 'Acorazado Clase Kol'],
      ['IDS_TITAN_RAGNAROV', 'Ragnarov Titan armed with railguns.', 'Titán Ragnarov equipado con cañones de riel.'],
      ['IDS_ABILITY_SNIPE', 'Snipe enemy capital ships dealing [VALUE] damage.', 'Francotirador contra naves capitales infligiendo [VALUE] de daño.'],
      ['IDS_RESEARCH_ARMOR', 'Increases armor rating by [VALUE]%.', 'Incrementa el blindaje en un [VALUE]%.'],
      ['IDS_PLANET_DESERT', 'Arid and barren desert planet.', 'Planeta desértico árido y yermo.']
    ];

    const entries: any[] = [];
    for (let i = 0; i < 7828; i++) {
      const item = templates[i % templates.length]!;
      entries.push({
        id: `${item[0]}_${i}`,
        original: item[1],
        translated: item[2],
        tokens: this.extractTokens(item[1]),
      });
    }
    return entries;
  }

  public downloadBlob(content: string, filename: string, type = 'text/plain;charset=utf-8'): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public async apiPost(endpoint: string, payload: any): Promise<any> {
    try {
      const res = await fetch(`/api/${endpoint.replace(/^\//, '')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  public async apiGet(endpoint: string): Promise<any> {
    try {
      const res = await fetch(`/api/${endpoint.replace(/^\//, '')}`);
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  }

  public async fetchRealEnvironment(): Promise<any> {
    const res = await this.apiGet('system/environment');
    if (res && res.success && res.data) {
      this.state.realEnv = res.data;
      this.state.activeMods = (res.data.mods.activeDetailed && res.data.mods.activeDetailed.length > 0)
        ? res.data.mods.activeDetailed
        : (res.data.mods.active || []).map((name: string, i: number) => ({
            name,
            priority: 999 - (i * 10),
            ramMb: 15,
            isMinimod: name.startsWith('[ES]'),
            state: 'OK'
          }));
      if (res.data.game?.spanishLocalization?.stringCount) {
        this.state.totalStrings = res.data.game.spanishLocalization.stringCount;
      }
      if (res.data.game?.entitiesCount) {
        this.state.totalEntities = res.data.game.entitiesCount;
      }
      if (res.data.game?.galaxiesCount) {
        this.state.totalGalaxies = res.data.game.galaxiesCount;
      }
    }
    return res;
  }
}

export const GlobalNexusCore = new NexusCoreService();

if (typeof window !== 'undefined') {
  (window as any).NexusCore = GlobalNexusCore;
}

