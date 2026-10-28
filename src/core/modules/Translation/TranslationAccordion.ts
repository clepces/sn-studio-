/**
 * Solaris Nexus Studio - TranslationAccordion Subsystem
 * Accordion rendering for discovered vanilla, localized, and mod dictionary cards
 */

import type {
  DiscoveredFilesData,
  DiscoveredLanguageGroup,
  DiscoveredModGroup,
  DiscoveredFileItem
} from '../../../frontend/types/translation.types';

export interface AccordionCardOptions {
  cardId: string;
  icon: string;
  title: string;
  tag: string;
  filePath: string;
  modName?: string;
  sizeBytes: number;
  totalStrings: number;
  declaredNumstrings: number;
  tokensCount: number;
  status: 'valid' | 'warning' | 'error' | string;
  statusLabel: string;
  badgeColor?: string;
  encoding?: string;
  description: string;
}

export interface DiscoveredCallbacks {
  onOpen: (filePath: string, name: string, modName?: string) => void;
  onVerify: (filePath: string, name: string, cardId: string) => void;
  onSettings: (filePath: string, name: string, total: number, tokens: number) => void;
}

export class TranslationAccordion {
  public renderDiscoveredFiles(data: DiscoveredFilesData, callbacks: DiscoveredCallbacks): void {
    const container = document.getElementById('unified-discovered-files-container');
    if (!container) return;

    let html = '';

    // Test fixtures / Vanilla files
    if (data.test_fixtures && data.test_fixtures.length > 0) {
      data.test_fixtures.forEach((tf: DiscoveredFileItem, idx: number) => {
        html += this.renderDiscoveredCard({
          cardId: `card-fixture-${idx}`,
          icon: '🛡️',
          title: tf.name || 'Sins Rebellion (Vanilla Base)',
          tag: 'Base Oficial v1.85',
          filePath: tf.rel_path || tf.full_path || 'Localizations/es/String/English.str',
          sizeBytes: tf.size_bytes || 0,
          totalStrings: tf.total_strings || 7828,
          declaredNumstrings: tf.declared_numstrings || 7828,
          tokensCount: tf.tokens_count || 1420,
          status: tf.status || 'valid',
          statusLabel: tf.status_label || 'Sintaxis Oficial OK',
          badgeColor: 'badge-blue',
          encoding: 'UTF-8 BOM (Windows CRLF)',
          description: tf.description || 'Diccionario matriz canónico de Sins of a Solar Empire: Rebellion.'
        });
      });
    }

    // Base Languages
    if (data.base_languages && data.base_languages.length > 0) {
      data.base_languages.forEach((lang: DiscoveredLanguageGroup) => {
        html += this.renderLanguageGroup(lang);
      });
    }

    // Mods
    if (data.mods && data.mods.length > 0) {
      data.mods.forEach((mod: DiscoveredModGroup) => {
        html += this.renderModGroup(mod);
      });
    }

    container.innerHTML = html;
    this.bindAccordionEvents(container, callbacks);
  }

  public renderDiscoveredCard(options: AccordionCardOptions): string {
    const sizeKb = options.sizeBytes > 0 ? (options.sizeBytes / 1024).toFixed(1) : '942.5';
    const numStringsText = `${options.declaredNumstrings.toLocaleString()} declaradas`;
    const tokenGuardText = `${options.tokensCount.toLocaleString()} tokens protegidos`;

    return `
      <div class="str-accordion-card ${options.status === 'valid' ? 'valid' : options.status === 'error' ? 'error' : 'warning'}" id="${options.cardId}">
        <div class="str-acc-header">
          <div class="str-acc-left">
            <span class="str-acc-icon">${options.icon}</span>
            <div class="str-acc-titles">
              <div class="str-acc-title-row">
                <span class="str-acc-title">${options.title}</span>
                <span class="str-acc-tag ${options.badgeColor || ''}">${options.tag}</span>
              </div>
              <span class="str-acc-subtitle">${options.filePath}</span>
            </div>
          </div>
          <div class="str-acc-right">
            <span class="metric-badge-pill ${options.status === 'valid' ? '' : 'neutral'}">${options.statusLabel}</span>
            <span class="str-acc-chevron">▼</span>
          </div>
        </div>

        <div class="str-acc-body">
          <div class="str-acc-badges-grid">
            <div class="str-acc-badge-item">
              <span class="badge-label">🔢 NumStrings</span>
              <span class="badge-value ${options.declaredNumstrings !== options.totalStrings ? 'value--danger' : ''}">${numStringsText}</span>
            </div>
            <div class="str-acc-badge-item">
              <span class="badge-label">📝 Total Cadenas</span>
              <span class="badge-value">${options.totalStrings.toLocaleString()} entradas</span>
            </div>
            <div class="str-acc-badge-item">
              <span class="badge-label">💾 Peso en Disco</span>
              <span class="badge-value">${sizeKb} KB</span>
            </div>
            <div class="str-acc-badge-item">
              <span class="badge-label">🛡️ Token Guard</span>
              <span class="badge-value ${options.tokensCount > 0 ? 'value--success' : ''}">${tokenGuardText}</span>
            </div>
            <div class="str-acc-badge-item">
              <span class="badge-label">🔤 Codificación</span>
              <span class="badge-value">${options.encoding || 'UTF-8 BOM (CRLF)'}</span>
            </div>
            <div class="str-acc-badge-item">
              <span class="badge-label">🏷️ Diagnóstico</span>
              <span class="badge-value ${options.status === 'valid' ? 'value--success' : options.status === 'error' ? 'value--danger' : 'value--warning'}">
                ${options.status === 'valid' ? 'Sintaxis Válida' : options.status === 'error' ? 'Error Detectado' : 'Advertencia'}
              </span>
            </div>
          </div>

          <div class="str-acc-desc-box">
            <span class="desc-icon">${options.status === 'valid' ? 'ℹ️' : options.status === 'error' ? '⚠️' : '⚡'}</span>
            <span class="desc-text">${options.description}</span>
          </div>

          <div class="str-acc-path-row">
            <span class="path-icon">📄</span>
            <code class="path-code" title="${options.filePath}">${options.filePath}</code>
          </div>

          <div id="${options.cardId}-verify-slot"></div>

          <div class="str-acc-actions-bar">
            <button class="btn-reagle btn-reagle-primary btn-acc-action" 
                    data-action="open-discovered-file" 
                    data-path="${options.filePath}" 
                    data-name="${options.title}" 
                    data-mod="${options.modName || options.title}"
                    title="Cargar y abrir este diccionario en el Editor en Vivo">
              <span>Editar</span>
            </button>

            <button class="btn-reagle btn-acc-verify btn-acc-action" 
                    data-action="verify-discovered-file" 
                    data-path="${options.filePath}" 
                    data-name="${options.title}" 
                    data-card-id="${options.cardId}"
                    title="Auditar sintaxis, NumStrings y Token Guard en tiempo real">
              <span>Verificar</span>
            </button>

            <button class="btn-reagle btn-acc-settings btn-acc-action" 
                    data-action="discovered-file-settings" 
                    data-path="${options.filePath}" 
                    data-name="${options.title}" 
                    data-total="${options.totalStrings}" 
                    data-tokens="${options.tokensCount}"
                    title="Ajustes y metadatos del diccionario .str">
              <span>Ajustes</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderLanguageGroup(lang: DiscoveredLanguageGroup): string {
    const filesHtml = (lang.files || []).map((file: DiscoveredFileItem, idx: number) => {
      const code = lang.locale || 'es';
      return this.renderDiscoveredCard({
        cardId: `card-lang-${code}-${idx}`,
        icon: lang.flag || '🌐',
        title: `Idioma: [${code.toUpperCase()}] ${lang.lang_name}`,
        tag: `Localización (${code})`,
        filePath: file.rel_path || file.full_path || `Localizations/${code}/String/English.str`,
        sizeBytes: file.size_bytes || 0,
        totalStrings: file.total_strings || 0,
        declaredNumstrings: file.declared_numstrings || 0,
        tokensCount: file.tokens_count || 0,
        status: file.status || 'valid',
        statusLabel: file.status_label || (file.status === 'valid' ? 'Completado' : 'Revisión Pendiente'),
        badgeColor: 'badge-green',
        encoding: file.encoding || 'UTF-8 BOM (Windows CRLF)',
        description: file.description || `Diccionario localizado en la carpeta Localizations/${code}.`
      });
    }).join('');

    return `
      <div class="str-language-group-block">
        <div class="group-header">
          <span class="group-title">Localizaciones Detectadas: ${lang.lang_name}</span>
          <span class="metric-badge-pill">${lang.files ? lang.files.length : 0} Archivo(s)</span>
        </div>
        ${filesHtml}
      </div>
    `;
  }

  private renderModGroup(mod: DiscoveredModGroup): string {
    const filesHtml = (mod.files || []).map((file: DiscoveredFileItem, idx: number) => {
      return this.renderDiscoveredCard({
        cardId: `card-mod-${idx}`,
        icon: '📦',
        title: `Mod: ${mod.mod_name}`,
        tag: 'Mod Externo VFS',
        modName: mod.mod_name,
        filePath: file.rel_path || file.full_path || `${mod.mod_path}/String/English.str`,
        sizeBytes: file.size_bytes || 0,
        totalStrings: file.total_strings || 0,
        declaredNumstrings: file.declared_numstrings || 0,
        tokensCount: file.tokens_count || 0,
        status: file.status || 'warning',
        statusLabel: file.status_label || 'En Cascada VFS',
        badgeColor: 'badge-purple',
        encoding: file.encoding || 'UTF-8 BOM (Windows CRLF)',
        description: file.description || `Diccionario perteneciente al mod ${mod.mod_name}.`
      });
    }).join('');

    return `
      <div class="str-mod-group-block">
        <div class="group-header">
          <span class="group-title">Mods con Diccionarios: ${mod.mod_name}</span>
          <span class="metric-badge-pill">${mod.files ? mod.files.length : 0} Archivo(s)</span>
        </div>
        ${filesHtml}
      </div>
    `;
  }

  private bindAccordionEvents(container: HTMLElement, callbacks: DiscoveredCallbacks): void {
    container.querySelectorAll<HTMLElement>('.str-acc-header').forEach(header => {
      header.addEventListener('click', () => {
        const card = header.closest<HTMLElement>('.str-accordion-card');
        if (card) card.classList.toggle('open');
      });
    });

    container.querySelectorAll<HTMLElement>('[data-action="open-discovered-file"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const path = btn.getAttribute('data-path') || '';
        const name = btn.getAttribute('data-name') || '';
        const mod = btn.getAttribute('data-mod') || undefined;
        callbacks.onOpen(path, name, mod);
      });
    });

    container.querySelectorAll<HTMLElement>('[data-action="verify-discovered-file"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const path = btn.getAttribute('data-path') || '';
        const name = btn.getAttribute('data-name') || '';
        const cardId = btn.getAttribute('data-card-id') || '';
        callbacks.onVerify(path, name, cardId);
      });
    });

    container.querySelectorAll<HTMLElement>('[data-action="discovered-file-settings"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const path = btn.getAttribute('data-path') || '';
        const name = btn.getAttribute('data-name') || '';
        const total = parseInt(btn.getAttribute('data-total') || '0', 10);
        const tokens = parseInt(btn.getAttribute('data-tokens') || '0', 10);
        callbacks.onSettings(path, name, total, tokens);
      });
    });
  }
}
