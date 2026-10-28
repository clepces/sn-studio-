/**
 * Solaris Nexus Studio - Entity Management Types
 * Strict typing for Sins of a Solar Empire Rebellion .entity inspection & combat mechanics
 */

export interface EntityWeapon {
  name?: string;
  type: string;
  arc: string;
  dps: number;
  range: number;
}

export interface EntityAbility {
  id: string;
  name: string;
  type: string;
  desc: string;
}

export interface EntityItem {
  id: string;
  name: string;
  faction: string;
  factionCode: 'TEC' | 'ADV' | 'VAS' | string;
  role: string;
  filePath: string;
  shieldPoints: number;
  hullPoints: number;
  antiMatter: number;
  armorPoints: number;
  hullRestore?: number;
  shieldRestore?: number;
  antiMatterRestore?: number;
  weapons?: EntityWeapon[];
  abilities?: EntityAbility[];
  credits?: number;
  metal?: number;
  crystal?: number;
  buildTime?: number;
  slotCount?: number;
}

export interface CombatStats {
  ehp: number;
  mitigation: number;
  ratio: string;
}

export interface EntityEditorInterface {
  init(): void;
  loadCatalog(): Promise<void>;
  selectEntity(entity: EntityItem): void;
  setFactionFilter(faction: string): void;
  switchSubtab(tabName: string): void;
  saveCurrentEntity(): Promise<void>;
  resetToVanilla(): void;
}
