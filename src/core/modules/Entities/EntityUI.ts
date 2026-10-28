/**
 * Solaris Nexus Studio - EntityUI Subsystem
 * DOM rendering for entity cards, inspection forms, weapon batteries, and abilities
 */

import type { EntityItem, EntityWeapon, EntityAbility } from './types';

export class EntityUI {
  public renderCatalogList(
    entities: EntityItem[],
    selectedId: string | null,
    onSelect: (entity: EntityItem) => void
  ): void {
    const listContainer = document.getElementById('entity-catalog-list');
    const countBadge = document.getElementById('entity-count-badge');

    if (countBadge) {
      countBadge.innerText = `${entities.length} Naves`;
    }

    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (entities.length === 0) {
      listContainer.innerHTML = '<div class="entity-empty-msg">No se encontraron naves que coincidan con los filtros.</div>';
      return;
    }

    entities.forEach(entity => {
      const card = document.createElement('div');
      const isSelected = selectedId === entity.id;

      let tagClass = 'tag-tec';
      if (entity.factionCode === 'ADV') tagClass = 'tag-adv';
      if (entity.factionCode === 'VAS') tagClass = 'tag-vas';

      card.className = `entity-card-item ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="entity-card-row">
          <div class="entity-card-name">${entity.name}</div>
          <span class="entity-faction-tag ${tagClass}">${entity.factionCode || 'TEC'}</span>
        </div>
        <div class="entity-card-role">${entity.role}</div>
        <div class="entity-mini-stat-bar">
          <span>Escudo: <strong>${Math.round(entity.shieldPoints)}</strong></span>
          <span>Casco: <strong>${Math.round(entity.hullPoints)}</strong></span>
          <span>Blindaje: <strong>${entity.armorPoints}</strong></span>
        </div>
      `;

      card.addEventListener('click', () => onSelect(entity));
      listContainer.appendChild(card);
    });
  }

  public renderEntityDetails(entity: EntityItem): void {
    const titleEl = document.getElementById('selected-entity-title');
    const roleEl = document.getElementById('selected-entity-role');
    const fileEl = document.getElementById('selected-entity-filepath');
    const tagEl = document.getElementById('selected-entity-faction-tag');

    if (titleEl) titleEl.innerText = entity.name;
    if (roleEl) roleEl.innerText = `${entity.faction} · ${entity.role}`;
    if (fileEl) fileEl.innerText = entity.filePath;

    if (tagEl) {
      let tagClass = 'tag-tec';
      if (entity.factionCode === 'ADV') tagClass = 'tag-adv';
      if (entity.factionCode === 'VAS') tagClass = 'tag-vas';
      tagEl.className = `entity-faction-tag ${tagClass}`;
      tagEl.innerText = entity.factionCode || 'TEC';
    }

    const shieldInput = document.getElementById('entity-input-shield') as HTMLInputElement | null;
    const hullInput = document.getElementById('entity-input-hull') as HTMLInputElement | null;
    const antimatterInput = document.getElementById('entity-input-antimatter') as HTMLInputElement | null;
    const armorInput = document.getElementById('entity-input-armor') as HTMLInputElement | null;

    if (shieldInput) shieldInput.value = String(entity.shieldPoints);
    if (hullInput) hullInput.value = String(entity.hullPoints);
    if (antimatterInput) antimatterInput.value = String(entity.antiMatter);
    if (armorInput) armorInput.value = String(entity.armorPoints);

    const hullRegenEl = document.getElementById('lbl-hull-regen');
    const shieldRegenEl = document.getElementById('lbl-shield-regen');
    const antimatterRegenEl = document.getElementById('lbl-antimatter-regen');

    if (hullRegenEl) hullRegenEl.innerText = `Regen: ${entity.hullRestore ? entity.hullRestore.toFixed(2) : '1.80'} HP/s`;
    if (shieldRegenEl) shieldRegenEl.innerText = `Regen: ${entity.shieldRestore ? entity.shieldRestore.toFixed(2) : '3.60'} HP/s`;
    if (antimatterRegenEl) antimatterRegenEl.innerText = `Regen: ${entity.antiMatterRestore ? entity.antiMatterRestore.toFixed(2) : '0.75'} /s`;

    this.renderWeapons(entity.weapons || []);
    this.renderAbilities(entity.abilities || []);

    const costCredEl = document.getElementById('cost-credits');
    const costMetalEl = document.getElementById('cost-metal');
    const costCrystEl = document.getElementById('cost-crystal');
    const costBuildEl = document.getElementById('cost-buildtime');
    const costSupplyEl = document.getElementById('cost-supply');

    if (costCredEl) costCredEl.innerText = Number(entity.credits || 3000).toLocaleString();
    if (costMetalEl) costMetalEl.innerText = Number(entity.metal || 400).toLocaleString();
    if (costCrystEl) costCrystEl.innerText = Number(entity.crystal || 250).toLocaleString();
    if (costBuildEl) costBuildEl.innerText = `${entity.buildTime || 75} seg`;
    if (costSupplyEl) costSupplyEl.innerText = `${entity.slotCount || 50} Pts`;
  }

  public renderWeapons(weapons: EntityWeapon[]): void {
    const container = document.getElementById('entity-weapons-container');
    if (!container) return;
    container.innerHTML = '';

    if (!weapons.length) {
      container.innerHTML = '<div class="entity-empty-msg">No hay baterías de armamento registradas para esta nave.</div>';
      return;
    }

    weapons.forEach((w, idx) => {
      const card = document.createElement('div');
      card.className = 'entity-weapon-card';
      card.innerHTML = `
        <div class="weapon-card-left">
          <div class="weapon-icon-box">💥</div>
          <div>
            <div class="weapon-title">${w.name || `Batería Táctica #${idx + 1}`}</div>
            <div class="weapon-sub">${w.type} · Arco: <strong>${w.arc}</strong></div>
          </div>
        </div>
        <div class="weapon-card-right">
          <div class="weapon-dps">${w.dps} DPS</div>
          <div class="weapon-range">Alcance: ${w.range} m</div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  public renderAbilities(abilities: EntityAbility[]): void {
    const container = document.getElementById('entity-abilities-container');
    if (!container) return;
    container.innerHTML = '';

    if (!abilities.length) {
      container.innerHTML = '<div class="entity-empty-msg">Sin habilidades tácticas activas.</div>';
      return;
    }

    const icons = ['⚡', '🛡️', '🎯', '🌟'];

    abilities.forEach((ab, idx) => {
      const card = document.createElement('div');
      card.className = 'entity-ability-card';
      card.innerHTML = `
        <div class="ability-card-top">
          <div class="ability-title-row">
            <span>${icons[idx % icons.length]}</span>
            <span>${ab.name}</span>
          </div>
          <span class="metric-badge-pill ability-pill">${ab.type}</span>
        </div>
        <div class="ability-desc">${ab.desc}</div>
        <div class="ability-id">ID: ${ab.id}</div>
      `;
      container.appendChild(card);
    });
  }

  public switchSubtab(tabName: string): void {
    document.querySelectorAll<HTMLElement>('.entity-subtab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-subtab') === tabName);
    });

    const panels = ['survival', 'weapons', 'abilities', 'logistics'];
    panels.forEach(p => {
      const el = document.getElementById(`subtab-panel-${p}`);
      if (el) {
        el.style.display = (p === tabName) ? 'block' : 'none';
      }
    });
  }

  public updateFactionButtons(activeFaction: string): void {
    document.querySelectorAll<HTMLElement>('.entity-faction-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-faction') === activeFaction);
    });
  }
}
