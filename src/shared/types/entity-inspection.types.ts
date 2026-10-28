/**
 * Definiciones de tipos para el inspector de entidades (.entity) de Sins of a Solar Empire: Rebellion.
 */

export interface WeaponBank {
  readonly type: string;
  readonly name: string;
  readonly damage: number;
  readonly cooldown: number;
  readonly range: number;
  readonly dps: number;
}

export interface AbilitySlot {
  readonly id: string;
  readonly name: string;
  readonly antimatterCost: number;
  readonly cooldown: number;
  readonly description: string;
}

export interface EntityCosts {
  readonly credits: number;
  readonly metal: number;
  readonly crystal: number;
}

export interface CapitalShipEntity {
  readonly key: string;
  readonly name: string;
  readonly faction: string;
  readonly factionCode: 'TEC' | 'ADV' | 'VAS';
  readonly type: string;
  readonly file: string;
  readonly hull: number;
  readonly shield: number;
  readonly armor: number;
  readonly antimatter: number;
  readonly hullRestoreRate: number;
  readonly shieldRestoreRate: number;
  readonly antimatterRestoreRate: number;
  readonly maxMitigation: number;
  readonly speed: number;
  readonly costs: EntityCosts;
  readonly buildTime: number;
  readonly slotCount: number;
  readonly weapons: readonly WeaponBank[];
  readonly abilities: readonly AbilitySlot[];
}

export interface EhpCalculationResult {
  readonly hull: number;
  readonly shield: number;
  readonly armor: number;
  readonly armorDamageReductionPct: number;
  readonly ehp: number;
}
