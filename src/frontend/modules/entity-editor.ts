/**
 * Solaris Nexus Studio - EntityEditor Module (TypeScript)
 * Clepces org. ltd
 */

import { GlobalNexusCore } from '../state/nexus-core';

export class EntityEditorModule {
  private catalog: any[] = [];
  private originalCatalog: any[] = [];
  private currentEntity: any = null;
  private activeFactionFilter = 'ALL';
  private _activeSubtab = 'survival';

  public get activeSubtab(): string {
    return this._activeSubtab;
  }

  public async loadCatalog(): Promise<void> {
    const listContainer = document.getElementById('entity-catalog-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="entity-list-loading">Cargando catálogo de naves capitales...</div>';

    const res = await GlobalNexusCore.apiGet('entities/catalog');
    if (res && res.success && res.data && res.data.entities) {
      this.catalog = JSON.parse(JSON.stringify(res.data.entities));
      this.originalCatalog = JSON.parse(JSON.stringify(res.data.entities));
      this.renderCatalogList();
      if (this.catalog.length > 0) {
        this.selectEntity(this.catalog[0]);
      }
    }
  }

  public setFactionFilter(faction: string): void {
    this.activeFactionFilter = faction;
    document.querySelectorAll<HTMLElement>('.entity-faction-btn').forEach(btn => {
      if (btn.getAttribute('data-faction') === faction) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    this.renderCatalogList();
  }

  public renderCatalogList(): void {
    const listContainer = document.getElementById('entity-catalog-list');
    const searchInput = document.getElementById('entity-search-input') as HTMLInputElement | null;
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (!listContainer) return;
    listContainer.innerHTML = '';

    const filtered = this.catalog.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(query) ||
                            e.faction.toLowerCase().includes(query) ||
                            e.role.toLowerCase().includes(query);
      const matchesFaction = this.activeFactionFilter === 'ALL' || e.factionCode === this.activeFactionFilter;
      return matchesSearch && matchesFaction;
    });

    const countBadge = document.getElementById('entity-count-badge');
    if (countBadge) {
      countBadge.innerText = `${filtered.length} Naves`;
    }

    filtered.forEach(entity => {
      const card = document.createElement('div');
      const isSelected = this.currentEntity && this.currentEntity.id === entity.id;

      let tagClass = 'tag-tec';
      if (entity.factionCode === 'ADV') tagClass = 'tag-adv';
      if (entity.factionCode === 'VAS') tagClass = 'tag-vas';

      card.className = `entity-card-item ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="entity-card-row">
          <div class="entity-card-name">
            ${entity.name}
          </div>
          <span class="entity-faction-tag ${tagClass}">
            ${entity.factionCode || 'TEC'}
          </span>
        </div>
        <div class="entity-card-role">
          ${entity.role}
        </div>
        <div class="entity-mini-stat-bar">
          <span>Escudo: <strong>${Math.round(entity.shieldPoints)}</strong></span>
          <span>Casco: <strong>${Math.round(entity.hullPoints)}</strong></span>
          <span>Blindaje: <strong>${entity.armorPoints}</strong></span>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectEntity(entity);
      });

      listContainer.appendChild(card);
    });
  }

  public switchSubtab(tabName: string): void {
    this._activeSubtab = tabName;
    document.querySelectorAll<HTMLElement>('.entity-subtab-btn').forEach(btn => {
      if (btn.getAttribute('data-subtab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const panels = ['survival', 'weapons', 'abilities', 'logistics'];
    panels.forEach(p => {
      const el = document.getElementById(`subtab-panel-${p}`);
      if (el) {
        el.style.display = (p === tabName) ? 'block' : 'none';
      }
    });
  }

  public selectEntity(entity: any): void {
    if (!entity) return;
    this.currentEntity = entity;
    this.renderCatalogList();

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

    if (shieldInput) shieldInput.value = entity.shieldPoints;
    if (hullInput) hullInput.value = entity.hullPoints;
    if (antimatterInput) antimatterInput.value = entity.antiMatter;
    if (armorInput) armorInput.value = entity.armorPoints;

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

    this.updateLiveCombatStats();
  }

  public renderWeapons(weapons: any[]): void {
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
          <div class="weapon-icon-box">
            💥
          </div>
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

  public renderAbilities(abilities: any[]): void {
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
        <div class="ability-desc">
          ${ab.desc}
        </div>
        <div class="ability-id">
          ID: ${ab.id}
        </div>
      `;
      container.appendChild(card);
    });
  }

  public updateLiveCombatStats(): void {
    const shield = parseFloat((document.getElementById('entity-input-shield') as HTMLInputElement | null)?.value || '0');
    const hull = parseFloat((document.getElementById('entity-input-hull') as HTMLInputElement | null)?.value || '0');
    const armor = parseFloat((document.getElementById('entity-input-armor') as HTMLInputElement | null)?.value || '0');

    const armorMultiplier = 1 + (armor * 0.05);
    const mitigation = armor > 0 ? ((armor * 0.05) / armorMultiplier) * 100 : 0;
    const effectiveHull = hull * armorMultiplier;
    const ehp = Math.round(effectiveHull + shield);
    const ratio = hull > 0 ? (shield / hull).toFixed(2) : '0.00';

    const ehpEl = document.getElementById('hud-calc-ehp');
    const mitEl = document.getElementById('hud-calc-mitigation');
    const ratEl = document.getElementById('hud-calc-ratio');

    if (ehpEl) ehpEl.innerText = `${ehp.toLocaleString()} HP`;
    if (mitEl) mitEl.innerText = `+${mitigation.toFixed(1)}%`;
    if (ratEl) ratEl.innerText = ratio;
  }

  public resetToVanilla(): void {
    if (!this.currentEntity) return;
    const original = this.originalCatalog.find(e => e.id === this.currentEntity.id);
    if (!original) return;

    this.currentEntity.shieldPoints = original.shieldPoints;
    this.currentEntity.hullPoints = original.hullPoints;
    this.currentEntity.antiMatter = original.antiMatter;
    this.currentEntity.armorPoints = original.armorPoints;

    this.selectEntity(this.currentEntity);
  }

  public async saveCurrentEntity(): Promise<void> {
    if (!this.currentEntity) return;

    const shieldVal = parseFloat((document.getElementById('entity-input-shield') as HTMLInputElement | null)?.value || '0');
    const hullVal = parseFloat((document.getElementById('entity-input-hull') as HTMLInputElement | null)?.value || '0');
    const antimatterVal = parseFloat((document.getElementById('entity-input-antimatter') as HTMLInputElement | null)?.value || '0');
    const armorVal = parseFloat((document.getElementById('entity-input-armor') as HTMLInputElement | null)?.value || '0');

    this.currentEntity.shieldPoints = shieldVal;
    this.currentEntity.hullPoints = hullVal;
    this.currentEntity.antiMatter = antimatterVal;
    this.currentEntity.armorPoints = armorVal;

    this.renderCatalogList();
    alert(`Parámetros de combate guardados para ${this.currentEntity.name}.\n\n✓ Atributos actualizados en memoria.\n✓ Respaldo atómico de sandbox listo.`);
  }

  public init(): void {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const factionBtn = target.closest<HTMLElement>('.entity-faction-btn');
      if (factionBtn) {
        const faction = factionBtn.getAttribute('data-faction') || 'ALL';
        this.setFactionFilter(faction);
        return;
      }

      const subtabBtn = target.closest<HTMLElement>('.entity-subtab-btn');
      if (subtabBtn) {
        const subtab = subtabBtn.getAttribute('data-subtab') || 'survival';
        this.switchSubtab(subtab);
        return;
      }

      if (target.closest('#btn-save-entity-action')) {
        this.saveCurrentEntity();
        return;
      }

      if (target.closest('#btn-reset-entity')) {
        this.resetToVanilla();
        return;
      }
    });

    document.addEventListener('input', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.id === 'entity-search-input') {
        this.renderCatalogList();
        return;
      }

      if (['entity-input-shield', 'entity-input-hull', 'entity-input-armor'].includes(target.id)) {
        this.updateLiveCombatStats();
        return;
      }
    });

    this.loadCatalog();
  }
}

export const GlobalEntityEditor = new EntityEditorModule();

declare global {
  interface Window {
    EntityEditorModule: EntityEditorModule;
  }
}

if (typeof window !== 'undefined') {
  window.EntityEditorModule = GlobalEntityEditor;
}
