/**
 * Solaris Nexus Studio - EntityCatalog Subsystem
 * Fetches capital ship catalog, handles faction filtering and search indices
 */

import { GlobalNexusCore } from '@/state/nexus-core';
import type { EntityItem } from './types';

export class EntityCatalog {
  private catalog: EntityItem[] = [];
  private originalCatalog: EntityItem[] = [];
  private activeFactionFilter = 'ALL';

  public async load(): Promise<EntityItem[]> {
    try {
      const res = await GlobalNexusCore.apiGet('entities/catalog') as {
        success: boolean;
        data?: { entities: EntityItem[] };
      };

      if (res && res.success && res.data && Array.isArray(res.data.entities)) {
        this.catalog = JSON.parse(JSON.stringify(res.data.entities));
        this.originalCatalog = JSON.parse(JSON.stringify(res.data.entities));
        return this.catalog;
      }
    } catch (err) {
      console.warn('[EntityCatalog] Error al cargar catálogo de entidades:', err);
    }
    return [];
  }

  public getCatalog(): EntityItem[] {
    return this.catalog;
  }

  public getOriginal(id: string): EntityItem | undefined {
    return this.originalCatalog.find(e => e.id === id);
  }

  public setFactionFilter(faction: string): void {
    this.activeFactionFilter = faction;
  }

  public getFactionFilter(): string {
    return this.activeFactionFilter;
  }

  public filterEntities(query: string = ''): EntityItem[] {
    const q = query.toLowerCase().trim();
    return this.catalog.filter(e => {
      const matchesSearch = !q ||
        e.name.toLowerCase().includes(q) ||
        e.faction.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q);
      const matchesFaction = this.activeFactionFilter === 'ALL' || e.factionCode === this.activeFactionFilter;
      return matchesSearch && matchesFaction;
    });
  }

  public resetEntityToOriginal(id: string): EntityItem | null {
    const original = this.getOriginal(id);
    const current = this.catalog.find(e => e.id === id);
    if (!original || !current) return null;

    current.shieldPoints = original.shieldPoints;
    current.hullPoints = original.hullPoints;
    current.antiMatter = original.antiMatter;
    current.armorPoints = original.armorPoints;

    return current;
  }
}
