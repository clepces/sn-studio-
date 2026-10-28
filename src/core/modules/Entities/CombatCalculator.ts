/**
 * Solaris Nexus Studio - CombatCalculator Subsystem
 * Sins Rebellion combat physics: Effective Hull Points (EHP), damage mitigation, and shield ratio
 */

import type { CombatStats } from './types';

export class CombatCalculator {
  public calculate(shield: number, hull: number, armor: number): CombatStats {
    const armorMultiplier = 1 + (armor * 0.05);
    const mitigation = armor > 0 ? ((armor * 0.05) / armorMultiplier) * 100 : 0;
    const effectiveHull = hull * armorMultiplier;
    const ehp = Math.round(effectiveHull + shield);
    const ratio = hull > 0 ? (shield / hull).toFixed(2) : '0.00';

    return {
      ehp,
      mitigation,
      ratio
    };
  }

  public updateHudFromInputs(): CombatStats {
    const shieldInput = document.getElementById('entity-input-shield') as HTMLInputElement | null;
    const hullInput = document.getElementById('entity-input-hull') as HTMLInputElement | null;
    const armorInput = document.getElementById('entity-input-armor') as HTMLInputElement | null;

    const shield = parseFloat(shieldInput?.value || '0') || 0;
    const hull = parseFloat(hullInput?.value || '0') || 0;
    const armor = parseFloat(armorInput?.value || '0') || 0;

    const stats = this.calculate(shield, hull, armor);

    const ehpEl = document.getElementById('hud-calc-ehp');
    const mitEl = document.getElementById('hud-calc-mitigation');
    const ratEl = document.getElementById('hud-calc-ratio');

    if (ehpEl) ehpEl.innerText = `${stats.ehp.toLocaleString()} HP`;
    if (mitEl) mitEl.innerText = `+${stats.mitigation.toFixed(1)}%`;
    if (ratEl) ratEl.innerText = stats.ratio;

    return stats;
  }
}
