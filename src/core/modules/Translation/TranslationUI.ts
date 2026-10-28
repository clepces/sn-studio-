import type {
  StrProject,
  StrEntryState,
  DiscoveredFilesData,
  TmItem
} from '../../../frontend/types/translation.types';
import { TranslationAccordion, type DiscoveredCallbacks } from './TranslationAccordion';

export class TranslationUI {
  public accordion: TranslationAccordion;

  constructor() {
    this.accordion = new TranslationAccordion();
  }

  renderWorkspaceProjects(
    projects: StrProject[],
    containerId: string,
    currentProjectId: string | null,
    onEdit: (projectId: string) => void,
    onAudit: (projectId: string) => void,
    onExport: (projectId: string) => void,
    onSettings: (projectId: string) => void
  ): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <div class="str-project-card str-empty-card-state">
          <div class="empty-icon-lg">📂</div>
          <div class="empty-title">No hay proyectos de traducción</div>
          <div class="empty-desc">
            El espacio de trabajo está limpio. Crea uno nuevo o restaura el proyecto canónico de ejemplo.
          </div>
          <div class="empty-actions-row">
            <button class="btn-reagle btn-reagle-primary" data-action="workspace:new-str">
              ✨ Crear Nuevo Proyecto .str
            </button>
            <button class="btn-reagle btn-accent-blue" data-action="workspace:seed-fixtures">
              ⚡ Cargar Demo Canónico
            </button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    projects.forEach(p => {
      const isLive = currentProjectId === p.project_id;
      const card = document.createElement('div');
      card.className = `str-project-card ${isLive ? 'is-live-project' : ''}`;
      card.setAttribute('data-id', p.project_id);

      const totalNum = typeof p.total_strings === 'number' ? p.total_strings : parseInt(String(p.total_strings || 0), 10) || 0;
      const transNum = typeof p.translated_count === 'number' ? p.translated_count : parseInt(String(p.translated_count || 0), 10) || 0;
      const coverage = totalNum > 0 ? Math.round((transNum / totalNum) * 100) : 0;
      const targetPath = p.target_file_path || 'Localizations/es/String/English.str';
      const isBase = p.base_file_path?.includes('Rebellion') || p.name.includes('Vanilla');

      card.innerHTML = `
        <div class="str-card-header">
          <div class="str-card-title-group">
            <span class="str-project-type-pill ${isBase ? 'pill--base' : 'pill--mod'}">
              ${isBase ? 'Oficial Vanilla' : 'Mod VFS'}
            </span>
            <div class="str-card-title-row">
              <h4 class="str-card-name">${p.name}</h4>
              ${isLive ? '<span class="str-badge-live">● EN VIVO</span>' : ''}
            </div>
            <div class="str-card-target-path">${targetPath}</div>
          </div>
        </div>

        <div class="str-card-metrics-grid">
          <div class="metric-item">
            <span class="metric-val">${totalNum.toLocaleString()}</span>
            <span class="metric-lbl">Total Cadenas</span>
          </div>
          <div class="metric-item">
            <span class="metric-val value--success">${transNum.toLocaleString()}</span>
            <span class="metric-lbl">Traducidas</span>
          </div>
          <div class="metric-item">
            <span class="metric-val value--blue">${coverage}%</span>
            <span class="metric-lbl">Completado</span>
          </div>
          <div class="metric-item">
            <span class="metric-val">${Number(p.tokens_count || 0).toLocaleString()}</span>
            <span class="metric-lbl">Tokens Protegidos</span>
          </div>
        </div>

        <div class="str-card-progress-bar">
          <div class="progress-fill" style="width: ${coverage}%"></div>
        </div>

        <div class="str-card-footer">
          <div class="str-card-footer-info">
            <span class="str-time-tag">Modificado: ${p.updated_at || 'Reciente'}</span>
          </div>
          <div class="str-card-actions">
            <button class="btn-reagle btn-reagle-primary btn-card-edit" data-id="${p.project_id}">
              ✏️ Editar
            </button>
            <button class="btn-reagle btn-accent-blue btn-card-audit" data-id="${p.project_id}">
              🛡️ Auditar
            </button>
            <button class="btn-reagle btn-accent-purple btn-card-export" data-id="${p.project_id}">
              💾 Exportar .str
            </button>
            <button class="btn-icon-reagle btn-card-settings" data-id="${p.project_id}" title="Ajustes">
              ⚙️
            </button>
          </div>
        </div>
      `;

      card.querySelector('.btn-card-edit')?.addEventListener('click', () => onEdit(p.project_id));
      card.querySelector('.btn-card-audit')?.addEventListener('click', () => onAudit(p.project_id));
      card.querySelector('.btn-card-export')?.addEventListener('click', () => onExport(p.project_id));
      card.querySelector('.btn-card-settings')?.addEventListener('click', () => onSettings(p.project_id));

      container.appendChild(card);
    });
  }

  renderDiscoveredFiles(data: DiscoveredFilesData, callbacks: DiscoveredCallbacks): void {
    this.accordion.renderDiscoveredFiles(data, callbacks);
  }

  renderVerificationResult(slotId: string, result: { isValid: boolean; numStringsMatch: boolean; errors?: string[] }): void {
    const slot = document.getElementById(slotId);
    if (!slot) return;

    const isOk = result.isValid && result.numStringsMatch;
    const title = isOk ? 'Auditoría Canónica Exitosa' : 'Anomalías Detectadas';
    const desc = isOk
      ? 'Encabezado NumStrings coincide con el recuento físico de cadenas y no hay colisiones de IDs.'
      : (result.errors && result.errors.length > 0 ? result.errors.join(' | ') : 'Se detectaron discrepancias sintácticas.');

    slot.innerHTML = `
      <div class="verify-banner ${isOk ? 'is-valid' : 'is-error'}">
        <div class="verify-banner-icon">${isOk ? '✓' : '⚠️'}</div>
        <div class="verify-banner-content">
          <div class="verify-banner-title">${title}</div>
          <div class="verify-banner-desc">${desc}</div>
        </div>
      </div>
    `;
  }

  updateVerificationStatusBadge(cardId: string, status: string, label: string): void {
    const statusBadge = document.getElementById(`${cardId}-status-badge`);
    if (!statusBadge) return;
    
    const colorClass = status === 'valid' ? 'success' : status === 'error' ? 'danger' : 'warning';
    statusBadge.className = `metric-badge-pill str-badge-status ${colorClass}`;
    statusBadge.textContent = label;
  }

  syncNavigationState(isLive: boolean): void {
    const subtabBar = document.getElementById('str-subtab-bar');
    const normalGroup = document.getElementById('str-nav-normal-group');
    const contextualGroup = document.getElementById('str-nav-contextual-group');

    if (subtabBar) {
      subtabBar.classList.toggle('is-live-mode', isLive);
    }
    if (normalGroup) {
      normalGroup.style.display = isLive ? 'none' : 'flex';
    }
    if (contextualGroup) {
      contextualGroup.style.display = isLive ? 'flex' : 'none';
    }
  }

  switchSubTab(targetSubTabId: string, onActiveTab?: (tabId: string) => void): void {
    document.querySelectorAll('.str-subtab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-subtab') === targetSubTabId);
    });
    document.querySelectorAll('.str-subtab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === targetSubTabId);
    });

    if (onActiveTab) {
      onActiveTab(targetSubTabId);
    }
  }

  renderTmRecent(items: TmItem[]): void {
    const resultsContainer = document.getElementById('tm-search-results');
    if (!resultsContainer) return;

    if (!items || items.length === 0) {
      resultsContainer.innerHTML = `<div class="str-empty-list-msg">No hay segmentos registrados en la memoria de traducción.</div>`;
      return;
    }

    resultsContainer.innerHTML = items.map(item => `
      <div class="tm-result-card">
        <div class="tm-result-top">
          <strong>${item.source_text}</strong>
          <span class="metric-badge-pill tm-result-usage">Reuso: ${item.usage_count}</span>
        </div>
        <div class="tm-result-trans">↳ ${item.translated_text}</div>
      </div>
    `).join('');
  }

  async updateTelemetry(_currentProject: StrProject | null, allEntries: StrEntryState[]): Promise<void> {
    const numStringsEl = document.getElementById('telemetry-total-strings');
    const coverageEl = document.getElementById('telemetry-coverage-percent');
    const coverageDesc = document.getElementById('telemetry-coverage-desc');
    const tokensEl = document.getElementById('telemetry-tokens-count');
    const tokensDesc = document.getElementById('telemetry-tokens-desc');
    const hashEl = document.getElementById('telemetry-hash-val');

    const total = allEntries.length;
    const translated = allEntries.filter(e => e.translated && e.translated.trim() !== '').length;
    const pct = total > 0 ? Math.round((translated / total) * 100) : 0;

    let tokens = 0;
    allEntries.forEach(e => {
      const match = (e.original || '').match(/%[sdf]|\[\/?\w+\]|\{[0-9]+\}/g);
      if (match) tokens += match.length;
    });

    if (numStringsEl) numStringsEl.innerText = total.toLocaleString();
    if (coverageEl) coverageEl.innerText = `${pct}%`;
    if (coverageDesc) coverageDesc.innerText = `${translated.toLocaleString()} de ${total.toLocaleString()} traducidas`;
    if (tokensEl) tokensEl.innerText = tokens.toLocaleString();
    if (tokensDesc) tokensDesc.innerText = 'Preservados en memoria';

    if (hashEl) {
      const sample = allEntries.slice(0, 10).map(e => e.id).join('');
      let h = 0;
      for (let i = 0; i < sample.length; i++) {
        h = ((h << 5) - h) + sample.charCodeAt(i);
        h |= 0;
      }
      hashEl.innerText = Math.abs(h).toString(16).toUpperCase();
    }
  }
}
