/**
 * Solaris Nexus Studio - EntityEditor Coordinator
 * Clepces org. ltd | Modular Architecture & Strict Typing (Zero `any`)
 */

import { GlobalEventHub } from '../../services/event-hub';
import { ToastNotification } from '../../engine/ui/toast.component';
import { EntityCatalog } from './EntityCatalog';
import { EntityUI } from './EntityUI';
import { CombatCalculator } from './CombatCalculator';
import type { EntityItem, EntityEditorInterface } from './types';

export class EntityEditor implements EntityEditorInterface {
  public catalog: EntityCatalog;
  public ui: EntityUI;
  public calculator: CombatCalculator;
  private currentEntity: EntityItem | null = null;
  private _activeSubtab = 'survival';

  constructor() {
    this.catalog = new EntityCatalog();
    this.ui = new EntityUI();
    this.calculator = new CombatCalculator();
  }

  public get activeSubtab(): string {
    return this._activeSubtab;
  }

  public getCurrentEntity(): EntityItem | null {
    return this.currentEntity;
  }

  public async loadCatalog(): Promise<void> {
    const listContainer = document.getElementById('entity-catalog-list');
    if (listContainer) {
      listContainer.innerHTML = '<div class="entity-list-loading">Cargando catálogo de naves capitales...</div>';
    }

    const entities = await this.catalog.load();
    this.renderCatalogList();
    if (entities.length > 0 && !this.currentEntity) {
      const first = entities[0];
      if (first) this.selectEntity(first);
    }
  }

  public setFactionFilter(faction: string): void {
    this.catalog.setFactionFilter(faction);
    this.ui.updateFactionButtons(faction);
    this.renderCatalogList();
  }

  public renderCatalogList(): void {
    const searchInput = document.getElementById('entity-search-input') as HTMLInputElement | null;
    const query = searchInput ? searchInput.value : '';
    const filtered = this.catalog.filterEntities(query);

    this.ui.renderCatalogList(
      filtered,
      this.currentEntity ? this.currentEntity.id : null,
      (selected: EntityItem) => this.selectEntity(selected)
    );
  }

  public switchSubtab(tabName: string): void {
    this._activeSubtab = tabName;
    this.ui.switchSubtab(tabName);
  }

  public selectEntity(entity: EntityItem): void {
    if (!entity) return;
    this.currentEntity = entity;
    this.renderCatalogList();
    this.ui.renderEntityDetails(entity);
    this.calculator.updateHudFromInputs();

    GlobalEventHub.publish('entity:selected', entity);
  }

  public resetToVanilla(): void {
    if (!this.currentEntity) return;
    const restored = this.catalog.resetEntityToOriginal(this.currentEntity.id);
    if (restored) {
      this.selectEntity(restored);
      ToastNotification.info(`Valores canónicos Vanilla restaurados para ${restored.name}.`);
    }
  }

  public async saveCurrentEntity(): Promise<void> {
    if (!this.currentEntity) return;

    const shieldVal = parseFloat((document.getElementById('entity-input-shield') as HTMLInputElement | null)?.value || '0') || 0;
    const hullVal = parseFloat((document.getElementById('entity-input-hull') as HTMLInputElement | null)?.value || '0') || 0;
    const antimatterVal = parseFloat((document.getElementById('entity-input-antimatter') as HTMLInputElement | null)?.value || '0') || 0;
    const armorVal = parseFloat((document.getElementById('entity-input-armor') as HTMLInputElement | null)?.value || '0') || 0;

    this.currentEntity.shieldPoints = shieldVal;
    this.currentEntity.hullPoints = hullVal;
    this.currentEntity.antiMatter = antimatterVal;
    this.currentEntity.armorPoints = armorVal;

    this.renderCatalogList();
    this.calculator.updateHudFromInputs();

    GlobalEventHub.publish('execution:log', {
      module: 'ENTITY',
      message: `Parámetros de combate actualizados para ${this.currentEntity.name}`,
      status: 'Sandbox OK'
    });

    ToastNotification.success(`Parámetros de combate guardados para ${this.currentEntity.name}. Atributos actualizados en memoria.`);
  }

  public updateLiveCombatStats(): void {
    this.calculator.updateHudFromInputs();
  }

  public init(): void {
    document.addEventListener('click', (e: MouseEvent) => {
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

    document.addEventListener('input', (e: Event) => {
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

    GlobalEventHub.subscribe('entity:reload', () => {
      this.loadCatalog();
    });

    this.loadCatalog();
  }
}

export const GlobalEntityEditor = new EntityEditor();

declare global {
  interface Window {
    EntityEditorModule?: EntityEditor;
  }
}

if (typeof window !== 'undefined') {
  window.EntityEditorModule = GlobalEntityEditor;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GlobalEntityEditor.init());
  } else {
    setTimeout(() => GlobalEntityEditor.init(), 20);
  }
}
