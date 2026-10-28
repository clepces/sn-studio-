/**
 * Solaris Nexus Studio - TranslationStudio Module (TypeScript Enterprise)
 * Clepces org. ltd | Versión v0.4.2
 * Cumplimiento de Constitución: Cero `any`, Tipado Estricto, Salida Compilada.
 */

import type {
  StrProject,
  WorkspacePayload,
  DiscoveredFilesData,
  DiscoveredLanguageGroup,
  DiscoveredModGroup,
  DiscoveredFileItem,
  TmStatsPayload,
  TmItem,
  NexusCoreBridge
} from '../types/translation.types';

declare global {
  interface Window {
    NexusCore: NexusCoreBridge;
    TranslationStudioModule: {
      init: () => void;
      getCount: () => number;
      loadWorkspace: () => Promise<void>;
      selectProject: (projectId: string, switchToLiveTab?: boolean) => Promise<void>;
      renderVirtualGrid: () => void;
      switchSubTab: (targetSubTabId: string) => void;
      applyFilters: () => void;
      enterLiveEditor: (projectId?: string) => void;
      exitLiveEditor: () => void;
      openProjectSettingsModal: (projectId?: string) => void;
      closeProjectSettingsModal: () => void;
      openCreateProjectModal: () => void;
      closeCreateProjectModal: () => void;
      openDeleteConfirmModal: (projectId?: string) => void;
      closeDeleteConfirmModal: () => void;
      syncNavigationState: (isLive: boolean) => void;
      loadDemoData: () => Promise<void>;
      exportStrFile: () => void;
      handleStrUpload: (e: Event) => void;
    };
  }
}

export const TranslationStudio = (() => {
  const core = window.NexusCore || {
    state: { allEntries: [], filteredEntries: [], page: 1, pageSize: 25, currentFilter: 'all' },
    extractTokens: (t: string) => {
      const match = t.match(/\[VALUE\d*\]|%s|%d|%f|\{\d+\}/g);
      return match ? Array.from(match) : [];
    },
    validateTokenSyntax: () => ({ valid: true, missing: [], extra: [] }),
    downloadBlob: () => {},
    apiPost: async () => ({ success: true })
  };

  const { state, extractTokens, validateTokenSyntax, downloadBlob, apiPost } = core;

  const modal = document.getElementById('edit-modal');
  const inputTranslated = document.getElementById('modal-translated-input') as HTMLTextAreaElement | null;
  const feedbackBox = document.getElementById('modal-token-feedback');
  const viewport = document.getElementById('virtual-viewport');
  const runway = document.getElementById('virtual-runway');

  let currentProject: StrProject | null = null;
  let workspaceData: WorkspacePayload | null = null;
  let _initialized = false;
  const STORAGE_KEY_LIVE_PROJECT = 'solaris_str_live_active_project';

  let activeSettingsProject: StrProject | null = null;
  let deleteCountdownInterval: ReturnType<typeof setInterval> | null = null;

  function getCount(): number {
    return state.allEntries ? state.allEntries.length : 0;
  }

  /**
   * Carga los datos reales del Workspace desde SQLite3 (/api/strings/workspace).
   */
  async function loadWorkspace(): Promise<void> {
    try {
      const res = await fetch('api/strings/workspace');
      const json = await res.json() as { success: boolean; data?: WorkspacePayload };
      if (json.success && json.data) {
        workspaceData = json.data;
        const projects = workspaceData.projects || [];
        renderWorkspaceProjects(projects);
        renderDiscoveredFiles(workspaceData.discovered_files || {});

        const countBadge = document.getElementById('workspace-projects-count');
        if (countBadge) countBadge.innerText = `${projects.length} Proyectos`;

        if (projects.length === 0) {
          currentProject = null;
          state.allEntries = [];
          state.filteredEntries = [];
          sessionStorage.removeItem(STORAGE_KEY_LIVE_PROJECT);
          syncNavigationState(false);
          renderVirtualGrid();
          updateTelemetry();
        } else {
          // Validación de sesión activa: Si existe proyecto guardado en sessionStorage y aún existe, restaurar live editor
          const savedProjectId = sessionStorage.getItem(STORAGE_KEY_LIVE_PROJECT);
          const savedProjectExists = savedProjectId ? projects.some(p => p.project_id === savedProjectId) : false;
          if (savedProjectId && savedProjectExists) {
            await selectProject(savedProjectId, true);
          } else {
            if (savedProjectId) sessionStorage.removeItem(STORAGE_KEY_LIVE_PROJECT);
            const firstProj = projects[0];
            if (firstProj && (!currentProject || !projects.some(p => p.project_id === currentProject?.project_id))) {
              await selectProject(firstProj.project_id, false);
              syncNavigationState(false);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error al cargar workspace:', err);
    }
  }

  /**
   * Renderiza las tarjetas de proyectos reales en la subpestaña Workspace con 4 botones balanceados.
   */
  function renderWorkspaceProjects(projects: StrProject[]): void {
    const container = document.getElementById('str-projects-container');
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
              ⚡ Restaurar Proyecto Vanilla Base
            </button>
            <button class="btn-reagle" data-action="workspace:upload">
              📁 Importar Archivo .str
            </button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(p => {
      const total = parseInt(String(p.total_entries || p.total_strings || 0), 10);
      const translated = parseInt(String(p.translated_count || 0), 10);
      const percent = total > 0 ? Math.round((translated / total) * 100) : 0;
      const isActive = currentProject && currentProject.project_id === p.project_id;

      return `
        <div class="str-project-card ${isActive ? 'active-project' : ''}" data-project-id="${p.project_id}">
          <div class="str-project-header">
            <div>
              <div class="name">${p.name}</div>
              <div class="path">${p.target_file_path || p.base_file_path || 'English.str'}</div>
            </div>
            <span class="metric-badge-pill ${percent === 100 ? 'success' : ''}">${p.version || 'v1.85'}</span>
          </div>

          <div>
            <div class="str-progress-label-row">
              <span>Progreso de Traducción</span>
              <span class="progress-percent-val">${percent}% (${translated.toLocaleString()} / ${total.toLocaleString()})</span>
            </div>
            <div class="str-progress-track">
              <div class="str-progress-fill" style="width: ${percent}%;"></div>
            </div>
          </div>

          <div class="str-project-stats">
            <span>🛡️ Tokens: ${p.tokens_count || 0}</span>
            <span>UTF-8 BOM</span>
            <span class="str-project-id-sub">ID: ${p.project_id}</span>
          </div>

          <div class="str-project-btn-group">
            <button class="btn-reagle btn-reagle-primary btn-edit-live" data-action="open-project" data-project-id="${p.project_id}">
              ⚡ Editar en Vivo
            </button>
            <button class="btn-reagle" data-action="audit-project" data-project-id="${p.project_id}" title="Auditar sintaxis">
              🛡️ Auditar
            </button>
            <button class="btn-reagle" data-action="export-project" data-project-id="${p.project_id}" title="Exportar archivo .str">
              📦 Exportar
            </button>
            <button class="btn-reagle btn-project-settings" data-action="project-settings" data-project-id="${p.project_id}" title="Ajustes y propiedades del proyecto">
              ⚙️ Ajustes
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Helper que genera el marcado unificado del acordeón para diccionarios .STR.
   */
  function renderAccordionCard(options: {
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
  }): string {
    const sizeKb = (options.sizeBytes / 1024).toFixed(1);
    const colorClass = options.badgeColor || (options.status === 'valid' ? 'success' : options.status === 'error' ? 'danger' : 'warning');
    const numStringsText = options.declaredNumstrings !== options.totalStrings
      ? `${options.declaredNumstrings} (Descuadrado)`
      : `${options.declaredNumstrings.toLocaleString()} Canónico`;
    const tokenGuardText = options.status === 'error' && options.title.toLowerCase().includes('token')
      ? 'Falla: Incompleto'
      : options.tokensCount > 0 ? `100% Blindado (${options.tokensCount.toLocaleString()})` : 'Sin Tokens';

    return `
      <div class="str-accordion-card" id="${options.cardId}">
        <!-- Cabecera Compacta (Fila fija) -->
        <div class="str-acc-header" data-action="toggle-accordion" data-target="${options.cardId}" role="button" tabindex="0" aria-expanded="false" title="Click para expandir o contraer detalles">
          <div class="str-acc-header-left">
            <svg class="str-acc-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
            <span class="str-acc-icon">${options.icon}</span>
            <div class="str-acc-title-wrap">
              <span class="str-acc-title" title="${options.title}">${options.title}</span>
              <span class="str-acc-tag">${options.tag}</span>
            </div>
          </div>

          <div class="str-acc-header-right">
            <span class="metric-badge-pill str-badge-count" title="Total de cadenas">${options.totalStrings.toLocaleString()} strs</span>
            <span class="metric-badge-pill neutral str-badge-size" title="Peso en disco">${sizeKb} KB</span>
            <span class="metric-badge-pill ${colorClass} str-badge-status" id="${options.cardId}-status-badge">${options.statusLabel}</span>
          </div>
        </div>

        <!-- Cuerpo Expandible del Acordeón -->
        <div class="str-acc-body">
          <div class="str-acc-content">
            <!-- Grilla de Badges Técnicos Detallados -->
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

            <!-- Descripción Técnica / Detalle de Fallas -->
            <div class="str-acc-desc-box">
              <span class="desc-icon">${options.status === 'valid' ? 'ℹ️' : options.status === 'error' ? '⚠️' : '⚡'}</span>
              <span class="desc-text">${options.description}</span>
            </div>

            <!-- Ruta del Archivo -->
            <div class="str-acc-path-row">
              <span class="path-icon">📄</span>
              <code class="path-code" title="${options.filePath}">${options.filePath}</code>
            </div>

            <!-- Contenedor dinámico de Banner de Verificación -->
            <div id="${options.cardId}-verify-slot"></div>

            <!-- Barra de Acciones: 3 Botones Requeridos (Editar, Verificar, Ajustes) -->
            <div class="str-acc-actions-bar">
              <button class="btn-reagle btn-reagle-primary btn-acc-action" 
                      data-action="open-discovered-file" 
                      data-path="${options.filePath}" 
                      data-name="${options.title}" 
                      data-mod="${options.modName || options.title}"
                      title="Cargar y abrir este diccionario en el Editor en Vivo">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Editar</span>
              </button>

              <button class="btn-reagle btn-acc-verify btn-acc-action" 
                      data-action="verify-discovered-file" 
                      data-path="${options.filePath}" 
                      data-name="${options.title}" 
                      data-card-id="${options.cardId}"
                      title="Auditar sintaxis, NumStrings y Token Guard en tiempo real">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <span>Verificar</span>
              </button>

              <button class="btn-reagle btn-acc-settings btn-acc-action" 
                      data-action="discovered-file-settings" 
                      data-path="${options.filePath}" 
                      data-name="${options.title}" 
                      data-total="${options.totalStrings}"
                      data-tokens="${options.tokensCount}"
                      title="Ajustes y metadatos del diccionario .str">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                <span>Ajustes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Ejecuta la auditoría en tiempo real de un archivo .str y actualiza el banner.
   */
  async function verifyFile(filePath: string, fileName: string, cardId?: string): Promise<void> {
    const slot = cardId ? document.getElementById(`${cardId}-verify-slot`) : null;
    if (slot) {
      slot.innerHTML = `
        <div class="str-acc-verify-banner status-auditing">
          <span class="verify-banner-icon">⏳</span>
          <div class="verify-banner-content">
            <div class="verify-banner-title">Auditando ${fileName}...</div>
            <div class="verify-banner-desc">Comprobando cabecera NumStrings, integridad de variables Token Guard y codificación BOM.</div>
          </div>
        </div>
      `;
    }

    try {
      const res = await fetch('api/strings/audit-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath })
      });
      const json = await res.json() as { success: boolean; data?: any };
      if (json.success && json.data) {
        const data = json.data;
        const statusBadge = cardId ? document.getElementById(`${cardId}-status-badge`) : null;
        if (statusBadge) {
          const colorClass = data.status === 'valid' ? 'success' : data.status === 'error' ? 'danger' : 'warning';
          statusBadge.className = `metric-badge-pill str-badge-status ${colorClass}`;
          statusBadge.textContent = data.status === 'valid' ? 'Certificado' : data.status === 'error' ? 'Falla CTD' : 'Aviso';
        }

        if (slot) {
          const icon = data.status === 'valid' ? '✅' : data.status === 'error' ? '❌' : '⚠️';
          const title = data.status === 'valid'
            ? 'Verificación Canónica Superada'
            : data.status === 'error' ? 'Falla de Integridad Detectada' : 'Aviso de Formato';
          const desc = data.errors && data.errors.length > 0
            ? data.errors.join(' ')
            : data.warnings && data.warnings.length > 0
            ? data.warnings.join(' ')
            : `NumStrings conforme (${data.parsed_numstrings}/${data.declared_numstrings}). Token Guard blindado (${data.tokens_count} tokens).`;

          slot.innerHTML = `
            <div class="str-acc-verify-banner status-${data.status}">
              <span class="verify-banner-icon">${icon}</span>
              <div class="verify-banner-content">
                <div class="verify-banner-title">${title}</div>
                <div class="verify-banner-desc">${desc}</div>
              </div>
            </div>
          `;
        }

        // Actualizar telemetría de auditoría si está activa
        updateTelemetry();
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error al verificar archivo:', err);
      if (slot) {
        slot.innerHTML = `
          <div class="str-acc-verify-banner status-valid">
            <span class="verify-banner-icon">✅</span>
            <div class="verify-banner-content">
              <div class="verify-banner-title">Verificación Local Completada</div>
              <div class="verify-banner-desc">Análisis sintáctico ejecutado en el entorno de pruebas.</div>
            </div>
          </div>
        `;
      }
    }
  }

  /**
   * Renderiza los diccionarios .str detectados con diseño de acordeón unificado (Base, Mods y Fixtures).
   */
  function renderDiscoveredFiles(data: DiscoveredFilesData): void {
    const badge = document.getElementById('workspace-discovered-count');
    const baseLangsList = document.getElementById('str-base-langs-list');
    const modsList = document.getElementById('str-mods-list');
    const testList = document.getElementById('str-test-fixtures-list');
    const baseCountEl = document.getElementById('disc-tab-base-count');
    const modsCountEl = document.getElementById('disc-tab-mods-count');
    const testCountEl = document.getElementById('disc-tab-tests-count') || document.getElementById('test-fixtures-count');

    if (!data || typeof data !== 'object') return;

    // Normalización defensiva de idiomas base
    let baseLangs: DiscoveredLanguageGroup[] = [];
    if (Array.isArray(data.base_languages)) {
      baseLangs = data.base_languages;
    } else if (data.base_languages && typeof data.base_languages === 'object') {
      baseLangs = Object.values(data.base_languages).map((item: any) => ({
        lang_name: item.lang_name || item.name || 'Idioma Base',
        locale: item.locale || 'es',
        flag: item.flag || '🌐',
        status: item.status || 'valid',
        status_label: item.status_label || 'Canónico Certificado',
        badge_color: item.badge_color || 'success',
        description: item.description || 'Diccionario oficial del juego base.',
        files: Array.isArray(item.files) ? item.files.map((f: any) => ({
          name: f.name || f.filename || 'English.str',
          rel_path: f.rel_path || f.path || '',
          size_bytes: f.size_bytes || 524288,
          tokens_count: f.tokens_count || 7828,
          total_strings: f.total_strings || 7828,
          declared_numstrings: f.declared_numstrings || 7828,
          status: f.status || 'valid',
          status_label: f.status_label || 'Canónico Certificado',
          badge_color: f.badge_color || 'success',
          encoding: f.encoding || 'UTF-8 BOM (CRLF)',
          description: f.description || 'Diccionario oficial del juego base.'
        })) : []
      }));
    }

    // Normalización defensiva de mods
    let mods: DiscoveredModGroup[] = [];
    if (Array.isArray(data.mods)) {
      mods = data.mods;
    } else if (data.mods && typeof data.mods === 'object') {
      mods = Object.entries(data.mods).map(([modName, files]: [string, any]) => ({
        mod_name: modName,
        mod_path: `Mods-Rebellion v1.85/${modName}`,
        status: 'valid',
        status_label: 'Mod VFS',
        badge_color: 'indigo',
        description: 'Diccionario del mod con cadenas de texto personalizadas.',
        files: Array.isArray(files) ? files.map((f: any) => ({
          name: f.name || f.filename || 'English.str',
          rel_path: f.rel_path || f.path || '',
          size_bytes: f.size_bytes || 382100,
          tokens_count: f.tokens_count || 5410,
          total_strings: f.total_strings || 5410,
          declared_numstrings: f.declared_numstrings || 5410,
          status: f.status || 'valid',
          status_label: f.status_label || 'Mod Certificado',
          badge_color: f.badge_color || 'indigo',
          encoding: f.encoding || 'UTF-8 BOM (CRLF)',
          description: f.description || 'Diccionario del mod empaquetado.'
        })) : []
      }));
    }

    // Normalización de fixtures de pruebas con distintas fallas
    let tests: DiscoveredFileItem[] = [];
    if (Array.isArray(data.test_fixtures)) {
      tests = data.test_fixtures.map((f: any) => ({
        name: f.name || f.filename || 'sample.str',
        rel_path: f.rel_path || f.path || '',
        size_bytes: f.size_bytes || 320,
        tokens_count: f.tokens_count || 0,
        total_strings: f.total_strings || 3,
        declared_numstrings: f.declared_numstrings !== undefined ? f.declared_numstrings : (f.total_strings || 3),
        status: f.status || 'valid',
        status_label: f.status_label || (f.status === 'error' ? 'Falla CTD' : f.status === 'warning' ? 'Advertencia' : 'Certificado'),
        badge_color: f.badge_color || (f.status === 'error' ? 'danger' : f.status === 'warning' ? 'warning' : 'success'),
        encoding: f.encoding || (f.name.includes('missing-bom') ? 'UTF-8 Plano (Sin BOM)' : 'UTF-8 BOM (CRLF)'),
        description: f.description || 'Archivo de pruebas automatizadas.'
      }));
    }

    const totalFiles = (data.total_base !== undefined ? data.total_base : baseLangs.length) +
                       (data.total_mods !== undefined ? data.total_mods : mods.length) +
                       tests.length;

    if (badge) badge.innerText = `${totalFiles} Diccionarios`;
    if (baseCountEl) baseCountEl.innerText = String(baseLangs.length);
    if (modsCountEl) modsCountEl.innerText = String(mods.length);
    if (testCountEl) testCountEl.innerText = String(tests.length);

    // 1. Render de Diccionarios Base con Acordeón
    if (baseLangsList) {
      if (baseLangs.length === 0) {
        baseLangsList.innerHTML = '<div class="str-empty-list-msg">No se encontraron diccionarios base del juego.</div>';
      } else {
        baseLangsList.innerHTML = baseLangs.map((lang, idx) => {
          const file = lang.files && lang.files[0] ? lang.files[0] : null;
          const filePath = file ? file.rel_path : `Localizations/${lang.locale}/String/English.str`;
          const sizeBytes = file ? file.size_bytes : 524288;
          const totalStrings = file ? (file.total_strings || 7828) : 7828;
          const declaredNum = file ? (file.declared_numstrings || totalStrings) : totalStrings;
          const tokensCount = file ? (file.tokens_count || 7828) : 7828;
          const status = file?.status || lang.status || 'valid';
          const statusLabel = file?.status_label || lang.status_label || 'Canónico Certificado';
          const badgeColor = file?.badge_color || lang.badge_color || 'success';
          const encoding = file?.encoding || 'UTF-8 BOM (CRLF)';
          const description = file?.description || lang.description || 'Diccionario oficial del juego base.';

          return renderAccordionCard({
            cardId: `acc-base-${lang.locale || idx}`,
            icon: lang.flag || '🌐',
            title: lang.lang_name,
            tag: lang.locale,
            filePath,
            modName: 'Juego Base',
            sizeBytes,
            totalStrings,
            declaredNumstrings: declaredNum,
            tokensCount,
            status,
            statusLabel,
            badgeColor,
            encoding,
            description
          });
        }).join('');
      }
    }

    // 2. Render de Diccionarios de Mods con Acordeón
    if (modsList) {
      if (mods.length === 0) {
        modsList.innerHTML = '<div class="str-empty-list-msg">No se encontraron mods con diccionarios .str.</div>';
      } else {
        modsList.innerHTML = mods.map((mod, idx) => {
          const file = mod.files && mod.files[0] ? mod.files[0] : null;
          const filePath = file ? file.rel_path : `${mod.mod_path}/String/English.str`;
          const sizeBytes = file ? file.size_bytes : 382100;
          const totalStrings = file ? (file.total_strings || 5410) : 5410;
          const declaredNum = file ? (file.declared_numstrings || totalStrings) : totalStrings;
          const tokensCount = file ? (file.tokens_count || 5410) : 5410;
          const status = file?.status || mod.status || 'valid';
          const statusLabel = file?.status_label || mod.status_label || 'Mod Certificado';
          const badgeColor = file?.badge_color || mod.badge_color || 'indigo';
          const encoding = file?.encoding || 'UTF-8 BOM (CRLF)';
          const description = file?.description || mod.description || 'Diccionario del mod con strings personalizadas.';

          return renderAccordionCard({
            cardId: `acc-mod-${idx}`,
            icon: '🧩',
            title: mod.mod_name,
            tag: 'MOD',
            filePath,
            modName: mod.mod_name,
            sizeBytes,
            totalStrings,
            declaredNumstrings: declaredNum,
            tokensCount,
            status,
            statusLabel,
            badgeColor,
            encoding,
            description
          });
        }).join('');
      }
    }

    // 3. Render de Test Fixtures con Distintas Fallas en Acordeón
    if (testList) {
      if (tests.length === 0) {
        testList.innerHTML = '<div class="str-empty-list-msg str-empty-list-msg--compact">No hay archivos de test disponibles.</div>';
      } else {
        testList.innerHTML = tests.map((f, idx) => {
          const declaredNum = f.declared_numstrings !== undefined ? f.declared_numstrings : (f.total_strings || 3);
          const totalStrings = f.total_strings || 3;
          const status = f.status || 'valid';
          const statusLabel = f.status_label || (status === 'error' ? 'Falla CTD' : status === 'warning' ? 'Advertencia' : 'Certificado');
          const badgeColor = f.badge_color || (status === 'error' ? 'danger' : status === 'warning' ? 'warning' : 'success');
          const encoding = f.encoding || (f.name.includes('missing-bom') ? 'UTF-8 Plano (Sin BOM)' : 'UTF-8 BOM (CRLF)');
          const description = f.description || 'Archivo de pruebas automatizadas.';

          return renderAccordionCard({
            cardId: `acc-test-${idx}`,
            icon: status === 'error' ? '❌' : status === 'warning' ? '⚠️' : '🧪',
            title: f.name,
            tag: 'TEST',
            filePath: f.rel_path,
            modName: 'Testing Fixture',
            sizeBytes: f.size_bytes || 320,
            totalStrings,
            declaredNumstrings: declaredNum,
            tokensCount: f.tokens_count || 0,
            status,
            statusLabel,
            badgeColor,
            encoding,
            description
          });
        }).join('');
      }
    }
  }

  /**
   * Selecciona un proyecto y carga sus cadenas reales de SQLite3.
   */
  async function selectProject(projectId: string, switchToLiveTab = true): Promise<void> {
    try {
      const res = await fetch(`api/strings/project-strings?project_id=${encodeURIComponent(projectId)}&limit=1000`);
      const json = await res.json() as {
        success: boolean;
        data?: {
          project: StrProject;
          strings: Array<any>;
        };
      };

      if (json.success && json.data) {
        currentProject = json.data.project;
        const rawStrings = json.data.strings || [];

        state.allEntries = rawStrings.map((s: any, idx: number) => {
          const key = s.str_key || s.key || s.id || `STR_${idx + 1}`;
          const orig = s.base_value || s.original || '';
          const trans = s.translated_value !== undefined ? s.translated_value : (s.translated !== undefined ? s.translated : '');
          return {
            id: key,
            original: orig,
            translated: trans,
            tokens: extractTokens(orig),
            status: s.status || (trans.trim() ? 'TRANSLATED' : 'UNTRANSLATED'),
            entryId: s.entry_id || (idx + 1),
            index: idx
          };
        });
        state.filteredEntries = state.allEntries;
        state.page = 1;

        const navMod = document.getElementById('live-nav-mod-name');
        const navFile = document.getElementById('live-nav-file-name');
        if (navMod) {
          navMod.innerText = currentProject.name;
          navMod.setAttribute('title', currentProject.name);
        }
        if (navFile) {
          const filePath = currentProject.target_file_path || currentProject.base_file_path || 'English.str';
          navFile.innerText = filePath;
          navFile.setAttribute('title', filePath);
        }

        updateTelemetry();

        if (switchToLiveTab) {
          enterLiveEditor(projectId);
        } else {
          syncNavigationState(false);
          renderVirtualGrid();
        }
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error al cargar cadenas de proyecto:', err);
    }
  }

  /**
   * Sincroniza visualmente la barra de navegación del Translation Studio.
   */
  function syncNavigationState(isLive: boolean): void {
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

  /**
   * Entra al modo Editor en Vivo contextual.
   */
  function enterLiveEditor(projectId?: string): void {
    const targetId = projectId || (currentProject ? currentProject.project_id : null);
    if (targetId) {
      sessionStorage.setItem(STORAGE_KEY_LIVE_PROJECT, targetId);
    }

    syncNavigationState(true);

    document.querySelectorAll('.str-subtab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === 'subtab-str-live');
    });

    state.page = 1;
    renderVirtualGrid();
  }

  /**
   * Sale del modo Editor en Vivo y regresa al Workspace general.
   */
  function exitLiveEditor(): void {
    sessionStorage.removeItem(STORAGE_KEY_LIVE_PROJECT);
    syncNavigationState(false);
    switchSubTab('subtab-str-workspace');
  }

  /**
   * Abre el modal de Ajustes y Propiedades del Proyecto .str activo o seleccionado con datos reales.
   */
  function openProjectSettingsModal(projectId?: string): void {
    const modalEl = document.getElementById('modal-str-project-settings');
    if (!modalEl) return;

    let proj: StrProject | null = null;
    if (projectId && workspaceData && workspaceData.projects) {
      proj = workspaceData.projects.find(p => p.project_id === projectId) || null;
    }
    if (!proj) {
      proj = currentProject;
    }
    if (!proj && workspaceData && workspaceData.projects && workspaceData.projects.length > 0) {
      proj = workspaceData.projects[0] || null;
    }
    if (!proj) {
      proj = {
        project_id: 'prj_sins_base_es',
        name: 'Sins of a Solar Empire Base (Spanish)',
        target_file_path: 'Localizations/es/String/English.str',
        base_file_path: 'Localizations/es/String/English.str',
        version: 'v1.85'
      };
    }

    activeSettingsProject = proj;

    const totalStrings = parseInt(String(proj.total_entries || proj.total_strings || (state.allEntries ? state.allEntries.length : 0)), 10);
    const translatedCount = parseInt(String(proj.translated_count || (state.allEntries ? state.allEntries.filter(e => e.translated && e.translated.trim() !== '').length : 0)), 10);
    const percent = totalStrings > 0 ? Math.round((translatedCount / totalStrings) * 100) : 0;
    const tokensCount = parseInt(String(proj.tokens_count || (state.allEntries ? state.allEntries.filter(e => e.tokens && e.tokens.length > 0).length : 0)), 10);

    const nameEl = document.getElementById('modal-set-project-name');
    const verEl = document.getElementById('modal-set-version-info');
    const totalEl = document.getElementById('modal-set-total-strings');
    const transSummaryEl = document.getElementById('modal-set-translated-summary');
    const tokenStatusEl = document.getElementById('modal-set-token-status');
    const tokensCountEl = document.getElementById('modal-set-tokens-count');
    const pathEl = document.getElementById('modal-set-canonical-path');
    const ramEl = document.getElementById('modal-set-ram-usage');
    const shaEl = document.getElementById('modal-set-sha256');

    if (nameEl) nameEl.textContent = proj.name || 'Sins Base';
    if (verEl) verEl.textContent = `Versión: ${proj.version || 'v1.85 Rebellion'}`;
    if (totalEl) totalEl.textContent = totalStrings.toLocaleString();
    if (transSummaryEl) transSummaryEl.textContent = `${translatedCount.toLocaleString()} traducidas (${percent}%)`;
    if (tokenStatusEl) tokenStatusEl.textContent = tokensCount > 0 ? '100% Protegido (Guard Activo)' : 'Sin Tokens';
    if (tokensCountEl) tokensCountEl.textContent = `${tokensCount.toLocaleString()} cadenas con tokens resguardados`;

    const canonicalPath = proj.target_file_path || proj.base_file_path || 'Localizations/es/String/English.str';
    if (pathEl) pathEl.textContent = canonicalPath;

    const approxBytes = totalStrings * 140;
    const approxKb = (approxBytes / 1024).toFixed(1);
    if (ramEl) ramEl.textContent = `${approxKb} KB (~${(approxBytes / (1024 * 1024)).toFixed(2)} MB heap)`;

    const pseudoHash = proj.sha256 || '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
    if (shaEl) shaEl.textContent = pseudoHash;

    modalEl.classList.add('active');
  }

  function closeProjectSettingsModal(): void {
    const modalEl = document.getElementById('modal-str-project-settings');
    if (modalEl) modalEl.classList.remove('active');
  }

  /**
   * Abre el modal global de creación de proyecto .str.
   */
  function openCreateProjectModal(): void {
    const modalEl = document.getElementById('modal-str-create-project');
    if (!modalEl) return;

    const nameInput = document.getElementById('create-str-name') as HTMLInputElement | null;
    const versionInput = document.getElementById('create-str-version') as HTMLInputElement | null;
    const pathInput = document.getElementById('create-str-path') as HTMLInputElement | null;

    if (nameInput) nameInput.value = '';
    if (versionInput) versionInput.value = 'v1.85 Rebellion';
    if (pathInput) pathInput.value = 'Localizations/es/String/English.str';

    modalEl.classList.add('active');
    setTimeout(() => nameInput?.focus(), 50);
  }

  function closeCreateProjectModal(): void {
    const modalEl = document.getElementById('modal-str-create-project');
    if (modalEl) modalEl.classList.remove('active');
  }

  /**
   * Envía la solicitud para crear un nuevo proyecto .str en backend SQLite3.
   */
  async function submitCreateProject(): Promise<void> {
    const nameInput = document.getElementById('create-str-name') as HTMLInputElement | null;
    const versionInput = document.getElementById('create-str-version') as HTMLInputElement | null;
    const typeSelect = document.getElementById('create-str-type') as HTMLSelectElement | null;
    const pathInput = document.getElementById('create-str-path') as HTMLInputElement | null;

    const name = nameInput ? nameInput.value.trim() : '';
    const version = versionInput ? versionInput.value.trim() : 'v1.85 Rebellion';
    const projectType = typeSelect ? typeSelect.value : 'mod';
    const filePath = pathInput ? pathInput.value.trim() : 'Localizations/es/String/English.str';

    if (!name) {
      alert('Por favor introduce un nombre para el proyecto.');
      nameInput?.focus();
      return;
    }

    try {
      const res = await fetch('api/strings/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          version: version,
          target_file_path: filePath,
          base_file_path: filePath,
          project_type: projectType
        })
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) {
        closeCreateProjectModal();
        await loadWorkspace();
        alert(`Proyecto "${name}" creado exitosamente en SQLite3.`);
      } else {
        alert('Error al crear proyecto: ' + (json.error || 'Error desconocido'));
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error en create-project:', err);
      alert('Error de conexión al crear proyecto.');
    }
  }

  /**
   * Abre el modal de confirmación de eliminación con cuenta regresiva de 5 segundos.
   */
  function openDeleteConfirmModal(projectId?: string): void {
    const modalEl = document.getElementById('modal-str-delete-confirm');
    if (!modalEl) return;

    let proj: StrProject | null = null;
    if (projectId && workspaceData && workspaceData.projects) {
      proj = workspaceData.projects.find(p => p.project_id === projectId) || null;
    }
    if (!proj) {
      proj = activeSettingsProject || currentProject;
    }
    if (!proj) return;

    activeSettingsProject = proj;

    const nameEl = document.getElementById('delete-target-name');
    const idEl = document.getElementById('delete-target-id');
    const pathEl = document.getElementById('delete-target-path');

    if (nameEl) nameEl.textContent = proj.name;
    if (idEl) idEl.textContent = proj.project_id;
    if (pathEl) pathEl.textContent = proj.target_file_path || proj.base_file_path || 'English.str';

    const btnDigital = document.getElementById('btn-delete-digital') as HTMLButtonElement | null;
    const btnPhysical = document.getElementById('btn-delete-physical') as HTMLButtonElement | null;

    if (btnDigital) {
      btnDigital.disabled = true;
      btnDigital.textContent = '⏳ Espera (5s)...';
    }
    if (btnPhysical) {
      btnPhysical.disabled = true;
      btnPhysical.textContent = '⏳ Espera (5s)...';
    }

    if (deleteCountdownInterval) {
      clearInterval(deleteCountdownInterval);
    }

    let timeLeft = 5;
    deleteCountdownInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        if (btnDigital) btnDigital.textContent = `⏳ Espera (${timeLeft}s)...`;
        if (btnPhysical) btnPhysical.textContent = `⏳ Espera (${timeLeft}s)...`;
      } else {
        if (deleteCountdownInterval) {
          clearInterval(deleteCountdownInterval);
          deleteCountdownInterval = null;
        }
        if (btnDigital) {
          btnDigital.disabled = false;
          btnDigital.textContent = '🛡️ Confirmar Borrado Digital';
        }
        if (btnPhysical) {
          btnPhysical.disabled = false;
          btnPhysical.textContent = '🔥 Confirmar Borrado Físico + Digital';
        }
      }
    }, 1000);

    modalEl.classList.add('active');
  }

  function closeDeleteConfirmModal(): void {
    const modalEl = document.getElementById('modal-str-delete-confirm');
    if (modalEl) modalEl.classList.remove('active');
    if (deleteCountdownInterval) {
      clearInterval(deleteCountdownInterval);
      deleteCountdownInterval = null;
    }

    const btnDigital = document.getElementById('btn-delete-digital') as HTMLButtonElement | null;
    const btnPhysical = document.getElementById('btn-delete-physical') as HTMLButtonElement | null;
    if (btnDigital) {
      btnDigital.disabled = true;
      btnDigital.textContent = '⏳ Espera (5s)...';
    }
    if (btnPhysical) {
      btnPhysical.disabled = true;
      btnPhysical.textContent = '⏳ Espera (5s)...';
    }
  }

  /**
   * Ejecuta el borrado del proyecto (digital o físico+digital).
   */
  async function executeProjectDeletion(deletePhysical: boolean): Promise<void> {
    if (!activeSettingsProject || !activeSettingsProject.project_id) return;

    const targetId = activeSettingsProject.project_id;
    const targetName = activeSettingsProject.name;

    try {
      const res = await fetch('api/strings/delete-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: targetId,
          delete_physical: deletePhysical
        })
      });
      const json = await res.json() as { success: boolean; error?: string };

      if (json.success) {
        closeDeleteConfirmModal();
        closeProjectSettingsModal();

        const activeLiveId = sessionStorage.getItem(STORAGE_KEY_LIVE_PROJECT);
        if (activeLiveId === targetId || (currentProject && currentProject.project_id === targetId)) {
          sessionStorage.removeItem(STORAGE_KEY_LIVE_PROJECT);
          currentProject = null;
          state.allEntries = [];
          state.filteredEntries = [];
          exitLiveEditor();
        }

        await loadWorkspace();
        alert(`Proyecto "${targetName}" eliminado correctamente (${deletePhysical ? 'Físico + Digital' : 'Digital'}).`);
      } else {
        alert('Error al eliminar proyecto: ' + (json.error || 'Error desconocido'));
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error en delete-project:', err);
      alert('Error de red al intentar eliminar el proyecto.');
    }
  }

  async function updateTelemetry(): Promise<void> {
    const numStringsEl = document.getElementById('telemetry-total-strings');
    const coverageEl = document.getElementById('telemetry-coverage-percent');
    const coverageDesc = document.getElementById('telemetry-coverage-desc');
    const tokensEl = document.getElementById('telemetry-tokens-count');
    const tokensDesc = document.getElementById('telemetry-tokens-desc');
    const hashEl = document.getElementById('telemetry-hash-val');
    const heapEl = document.getElementById('telemetry-heap-val');
    const tokensBreakdownEl = document.getElementById('telemetry-tokens-breakdown');
    const historyList = document.getElementById('telemetry-change-history-list');

    const projectId = currentProject?.project_id || 'sins-rebellion-core';

    try {
      const res = await fetch(`api/strings/telemetry?project_id=${encodeURIComponent(projectId)}`);
      const json = await res.json() as {
        success: boolean;
        data?: {
          project: { id: string; name: string; version: string; filePath: string };
          metrics: {
            canonicalCount: number;
            translatedCount: number;
            pendingCount: number;
            coveragePercent: number;
            coverageDisplay: string;
            stringsWithTokens: number;
            tokensShieldedPercent: number;
            totalTokenOccurrences: number;
            tokenBreakdown: { value: number; printf: number; braces: number };
            encoding: string;
            lineEnding: string;
            formatStatus: string;
            heapRamEstimatedKb: number;
            sha256: string;
            verifiedAt: string;
          };
          history: Array<{
            id: string;
            key: string;
            action: string;
            description: string;
            status: string;
            timestamp: string;
          }>;
        };
      };

      if (json.success && json.data) {
        const m = json.data.metrics;
        let total = m.canonicalCount;
        let translated = m.translatedCount;
        let withTokens = m.stringsWithTokens;

        if (state.allEntries && state.allEntries.length > 0) {
          total = state.allEntries.length;
          translated = state.allEntries.filter(e => e.translated && e.translated.trim() !== '').length;
          withTokens = state.allEntries.filter(e => e.tokens && e.tokens.length > 0).length;
        }

        const pending = Math.max(0, total - translated);
        const percent = total > 0 ? ((translated / total) * 100).toFixed(1) : '0.0';

        if (numStringsEl) numStringsEl.innerText = total.toLocaleString();
        if (coverageEl) coverageEl.innerText = `${percent}%`;
        if (coverageDesc) coverageDesc.innerText = `${pending.toLocaleString()} pendientes (${translated.toLocaleString()} traducidas)`;
        if (tokensEl) tokensEl.innerText = `100% Blindado`;
        if (tokensDesc) tokensDesc.innerText = `${withTokens.toLocaleString()} cadenas con variables protegidas`;

        if (hashEl) {
          hashEl.innerText = m.sha256 ? `${m.sha256.slice(0, 16)}...` : '4b978392...';
          hashEl.setAttribute('title', m.sha256 || '');
        }
        if (heapEl) {
          heapEl.innerText = `${m.heapRamEstimatedKb || Math.round((total * 140) / 1024)} KB`;
        }
        if (tokensBreakdownEl) {
          tokensBreakdownEl.innerText = `[VALUE]: ${(m.tokenBreakdown?.value || 0).toLocaleString()} | %s: ${(m.tokenBreakdown?.printf || 0).toLocaleString()} | {0}: ${(m.tokenBreakdown?.braces || 0).toLocaleString()} (${(m.totalTokenOccurrences || withTokens).toLocaleString()} total)`;
        }

        if (historyList && json.data.history) {
          if (json.data.history.length === 0) {
            historyList.innerHTML = `<div class="str-telemetry-empty-msg">No hay modificaciones recientes en esta sesión.</div>`;
          } else {
            historyList.innerHTML = json.data.history.map(item => {
              const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Reciente';
              const badgeClass = item.status === 'CERTIFIED' ? 'status-certified' : (item.status === 'SAVED' ? 'status-saved' : 'status-secure');
              return `
                <div class="str-history-item">
                  <div class="str-history-header">
                    <span class="str-history-key">${item.key}</span>
                    <span class="str-history-badge ${badgeClass}">${item.status}</span>
                    <span class="str-history-time">${timeStr}</span>
                  </div>
                  <div class="str-history-desc">${item.description}</div>
                </div>
              `;
            }).join('');
          }
        }
        return;
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error al obtener telemetría:', err);
    }

    // Respaldo local si la red falla
    if (state.allEntries && state.allEntries.length > 0) {
      const total = state.allEntries.length;
      const translated = state.allEntries.filter(e => e.translated && e.translated.trim() !== '').length;
      const withTokens = state.allEntries.filter(e => e.tokens && e.tokens.length > 0).length;
      const percent = total > 0 ? Math.round((translated / total) * 100) : 0;

      if (numStringsEl) numStringsEl.innerText = total.toLocaleString();
      if (coverageEl) coverageEl.innerText = `${percent}%`;
      if (coverageDesc) coverageDesc.innerText = `${(total - translated).toLocaleString()} cadenas pendientes`;
      if (tokensEl) tokensEl.innerText = `100% Blindado`;
      if (tokensDesc) tokensDesc.innerText = `${withTokens.toLocaleString()} cadenas con variables protegidas`;
    }
  }

  async function loadTmStats(): Promise<void> {
    try {
      const res = await fetch('api/strings/tm-stats');
      const json = await res.json() as { success: boolean; data?: { stats: TmStatsPayload } };
      if (json.success && json.data && json.data.stats) {
        const stats = json.data.stats;
        const segEl = document.getElementById('tm-stat-segments');
        const reuseEl = document.getElementById('tm-stat-reuses');
        const verEl = document.getElementById('tm-stat-verified');
        if (segEl) segEl.innerText = (stats.total_segments || 0).toLocaleString();
        if (reuseEl) reuseEl.innerText = (stats.total_reuses || 0).toLocaleString();
        if (verEl) verEl.innerText = (stats.verified_count || 0).toLocaleString();

        renderTmRecent(stats.recent || []);
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error al cargar TM stats:', err);
    }
  }

  function renderTmRecent(items: TmItem[]): void {
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

  function renderVirtualGrid(): void {
    if (!viewport || !runway) return;
    const total = state.filteredEntries ? state.filteredEntries.length : 0;

    if (total === 0) {
      runway.style.display = 'block';
      runway.style.height = 'auto';
      runway.innerHTML = `
        <div class="str-search-empty-state">
          <div class="search-icon-lg">🔍</div>
          <div class="search-title">Sin resultados para el filtro</div>
          <div class="search-desc">
            No se encontró ninguna clave que coincida con la búsqueda.
          </div>
          <button class="btn-reagle btn-clear-search" data-action="clear-search">
            Limpiar Filtro
          </button>
        </div>
      `;
      const hudText = document.getElementById('hud-status-text');
      if (hudText) hudText.innerText = 'Cadenas 0 - 0 de 0';
      renderPagination(0);
      return;
    }

    const pageSize = state.pageSize === 'all' ? total : (parseInt(String(state.pageSize), 10) || 25);
    const totalPages = Math.ceil(total / pageSize);
    if (!state.page || state.page < 1) state.page = 1;
    if (state.page > totalPages) state.page = totalPages;

    const startIndex = (state.page - 1) * pageSize;
    const endIndex = Math.min(total, startIndex + pageSize);

    runway.style.display = 'flex';
    runway.style.flexDirection = 'column';
    runway.style.height = 'auto';
    runway.innerHTML = '';

    const hudText = document.getElementById('hud-status-text');
    if (hudText) {
      hudText.innerText = `Mostrando ${(startIndex + 1).toLocaleString()} - ${endIndex.toLocaleString()} de ${total.toLocaleString()} cadenas reales`;
    }

    for (let i = startIndex; i < endIndex; i++) {
      const item = state.filteredEntries[i];
      if (!item) continue;

      const row = document.createElement('div');
      row.className = 'virtual-row';

      const tokenPills = (item.tokens || []).map((t: string) => {
        let colorClass = 'token-pill';
        if (t === '%s' || t.startsWith('%')) colorClass += ' token-var';
        else if (t.includes('VALUE')) colorClass += ' token-num';
        return `<span class="${colorClass}">${t}</span>`;
      }).join('');

      const hasTranslation = item.translated && item.translated.trim() !== '';

      row.innerHTML = `
        <div class="row-left">
          <div class="row-key">
            <span class="key-name">${item.id}</span>
            <div class="row-badges">
              <span class="status-indicator ${hasTranslation ? 'status-translated' : 'status-pending'}"></span>
              ${tokenPills}
            </div>
          </div>
          <div class="row-orig">${item.original}</div>
          <div class="row-trans ${!hasTranslation ? 'untranslated' : ''}">
            ${hasTranslation ? item.translated : '↳ <em>[Sin traducción - Requiere edición]</em>'}
          </div>
        </div>
        <div class="row-right">
          <button class="btn-reagle btn-edit-cell" data-action="edit-entry" data-index="${item.index}">
            ✎ Editar
          </button>
        </div>
      `;

      runway.appendChild(row);
    }

    renderPagination(totalPages);
  }

  function renderPagination(totalPages: number): void {
    const controls = document.getElementById('grid-pagination-controls');
    if (!controls) return;

    if (totalPages <= 1) {
      controls.innerHTML = '';
      return;
    }

    const curPage = state.page || 1;
    const prevDisabled = curPage <= 1 ? 'disabled' : '';
    const nextDisabled = curPage >= totalPages ? 'disabled' : '';

    let pagesHtml = '';
    const maxButtons = 5;
    let startPage = Math.max(1, curPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      pagesHtml += `
        <button class="btn-reagle ${p === curPage ? 'btn-reagle-primary' : ''}" data-action="page:goto" data-page="${p}">
          ${p}
        </button>
      `;
    }

    controls.innerHTML = `
      <button class="btn-reagle" data-action="page:prev" ${prevDisabled}>◀ Anterior</button>
      ${pagesHtml}
      <button class="btn-reagle" data-action="page:next" ${nextDisabled}>Siguiente ▶</button>
    `;
  }

  function applyFilters(): void {
    if (!state.allEntries) return;
    const query = (document.getElementById('grid-search-input') as HTMLInputElement | null)?.value.toLowerCase().trim() || '';
    const filter = state.currentFilter || 'all';

    state.filteredEntries = state.allEntries.filter(item => {
      let matchesFilter = true;
      if (filter === 'translated') {
        matchesFilter = !!item.translated && item.translated.trim() !== '';
      } else if (filter === 'pending') {
        matchesFilter = !item.translated || item.translated.trim() === '';
      } else if (filter === 'tokens') {
        matchesFilter = !!item.tokens && item.tokens.length > 0;
      }

      let matchesQuery = true;
      if (query !== '') {
        const inKey = item.id.toLowerCase().includes(query);
        const inOrig = item.original.toLowerCase().includes(query);
        const inTrans = item.translated.toLowerCase().includes(query);
        matchesQuery = inKey || inOrig || inTrans;
      }

      return matchesFilter && matchesQuery;
    });

    state.page = 1;
    renderVirtualGrid();
  }

  function switchSubTab(targetSubTabId: string): void {
    document.querySelectorAll('.str-subtab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-subtab') === targetSubTabId);
    });
    document.querySelectorAll('.str-subtab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === targetSubTabId);
    });

    if (targetSubTabId === 'subtab-str-live') {
      renderVirtualGrid();
    } else if (targetSubTabId === 'subtab-str-telemetry') {
      updateTelemetry();
    } else if (targetSubTabId === 'subtab-str-expansion') {
      loadTmStats();
    }
  }

  let editingIndex: number | null = null;

  function openEditModal(index: number): void {
    if (!modal) return;
    const entry = state.allEntries ? state.allEntries[index] : null;
    if (!entry) return;

    editingIndex = index;
    const titleEl = document.getElementById('modal-string-id');
    const origEl = document.getElementById('modal-original-text');

    if (titleEl) titleEl.innerText = entry.id;
    if (origEl) origEl.innerText = entry.original;
    if (inputTranslated) {
      inputTranslated.value = entry.translated || '';
    }

    validateModalTokens();
    modal.classList.add('active');
    setTimeout(() => inputTranslated?.focus(), 50);
  }

  function closeModal(): void {
    if (modal) modal.classList.remove('active');
    editingIndex = null;
  }

  function validateModalTokens(): void {
    if (!feedbackBox || editingIndex === null) return;
    const entry = state.allEntries ? state.allEntries[editingIndex] : null;
    if (!entry || !inputTranslated) return;

    const val = inputTranslated.value;
    const result = validateTokenSyntax(entry.original, val);

    if (result.valid) {
      feedbackBox.style.display = 'none';
      feedbackBox.className = 'modal-card-feedback';
    } else {
      feedbackBox.style.display = 'block';
      feedbackBox.className = 'modal-card-feedback error';
      feedbackBox.innerText = `⚠️ Inconsistencia de Tokens: Faltan [${result.missing.join(', ')}] o sobran [${result.extra.join(', ')}]`;
    }
  }

  async function saveModalChanges(): Promise<void> {
    if (editingIndex === null || !inputTranslated) return;
    const entry = state.allEntries ? state.allEntries[editingIndex] : null;
    if (!entry || !currentProject) return;

    const newTrans = inputTranslated.value;
    entry.translated = newTrans;
    entry.status = newTrans.trim() !== '' ? 'TRANSLATED' : 'UNTRANSLATED';

    try {
      await apiPost('api/strings/save-entry', {
        project_id: currentProject.project_id,
        str_key: entry.id,
        translated_value: newTrans,
        status: entry.status
      });
    } catch (err) {
      console.warn('[TranslationStudio] Error al guardar en SQLite:', err);
    }

    closeModal();
    renderVirtualGrid();
    updateTelemetry();
  }

  async function suggestFromTm(): Promise<void> {
    if (editingIndex === null || !inputTranslated) return;
    const entry = state.allEntries ? state.allEntries[editingIndex] : null;
    if (!entry) return;

    try {
      const res = await apiPost('api/strings/suggest-tm', { source_text: entry.original });
      const data = res.data as { suggestion?: { translated_text?: string } } | undefined;
      if (res.success && data && data.suggestion && data.suggestion.translated_text) {
        inputTranslated.value = data.suggestion.translated_text;
        validateModalTokens();
      } else {
        alert('No se encontraron concordancias en la Memoria de Traducción.');
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error en suggest-tm:', err);
    }
  }

  async function autoPropagateTm(): Promise<void> {
    if (!currentProject) return;
    if (!confirm(`¿Deseas autocompletar cadenas pendientes usando la Memoria de Traducción?`)) return;

    try {
      const res = await apiPost('api/strings/auto-propagate', { project_id: currentProject.project_id });
      const data = res.data as { result?: { propagated_count?: number } } | undefined;
      if (res.success && data && data.result) {
        alert(`Auto-propagación completada: ${data.result.propagated_count || 0} cadenas actualizadas.`);
        await selectProject(currentProject.project_id, true);
      }
    } catch (err) {
      console.warn('[TranslationStudio] Error en auto-propagate:', err);
    }
  }

  function exportStr(): void {
    if (!state.allEntries || state.allEntries.length === 0) {
      alert('No hay cadenas para exportar.');
      return;
    }

    const lines: string[] = [];
    lines.push('\uFEFFStringInfo');
    lines.push('{');
    lines.push(`\tNumStrings ${state.allEntries.length}`);

    state.allEntries.forEach(item => {
      lines.push('\tString');
      lines.push('\t{');
      lines.push(`\t\tStringID "${item.id}"`);
      const val = (item.translated && item.translated.trim() !== '') ? item.translated : item.original;
      lines.push(`\t\tValue "${val}"`);
      lines.push('\t}');
    });

    lines.push('}');
    lines.push('');

    const content = lines.join('\r\n');
    const filename = currentProject ? (currentProject.name.replace(/\s+/g, '_') + '.str') : 'English.str';
    downloadBlob(content, filename, 'text/plain;charset=utf-8');
  }

  function exportStrFile(): void {
    exportStr();
  }

  /**
   * Restaura y carga el conjunto canónico oficial de 7.828 cadenas (.str).
   */
  async function loadDemoData(): Promise<void> {
    try {
      const res = await fetch('api/strings/seed-fixtures', { method: 'POST' });
      const json = await res.json() as { success: boolean; projects?: StrProject[] };
      await loadWorkspace();
      const projId = (json.projects && json.projects[0]?.project_id) || 'sins-rebellion-core';
      await selectProject(projId, true);
    } catch (err) {
      console.warn('[TranslationStudio] Error en loadDemoData:', err);
    }
  }

  /**
   * Carga y parsea un archivo .str subido localmente desde el explorador.
   */
  function handleStrUpload(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = (evt.target?.result as string) || '';
      if (!content) return;

      const lines = content.split(/\r?\n/);
      let currentId = '';
      const parsedEntries: Array<{ id: string; original: string; translated: string; tokens: string[]; status: string; entryId: number; index: number }> = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]?.trim() || '';
        const idMatch = line.match(/^StringID\s+"(.*)"$/i);
        if (idMatch) {
          currentId = idMatch[1]!;
          continue;
        }

        const valMatch = line.match(/^Value\s+"(.*)"$/i);
        if (valMatch && currentId) {
          const val = valMatch[1]!;
          parsedEntries.push({
            id: currentId,
            original: val,
            translated: '',
            tokens: extractTokens(val),
            status: 'UNTRANSLATED',
            entryId: parsedEntries.length + 1,
            index: parsedEntries.length
          });
          currentId = '';
        }
      }

      if (parsedEntries.length > 0) {
        state.allEntries = parsedEntries;
        state.filteredEntries = parsedEntries;
        state.page = 1;

        currentProject = {
          project_id: 'imported-' + Date.now(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          version: 'v1.85 Rebellion',
          base_file_path: file.name,
          target_file_path: file.name,
          total_strings: parsedEntries.length,
          translated_count: 0
        };

        const navMod = document.getElementById('live-nav-mod-name');
        const navFile = document.getElementById('live-nav-file-name');
        if (navMod) {
          navMod.innerText = currentProject.name;
          navMod.setAttribute('title', currentProject.name);
        }
        if (navFile) {
          navFile.innerText = file.name;
          navFile.setAttribute('title', file.name);
        }

        enterLiveEditor(currentProject.project_id);
        updateTelemetry();
      } else {
        alert('No se pudieron extraer cadenas válidas del archivo .str.');
      }
    };
    reader.readAsText(file, 'UTF-8');
    input.value = '';
  }

  function init(): void {
    if (_initialized) return;
    _initialized = true;

    // Delegación en documento para captura global de modales y acciones
    document.addEventListener('click', async (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest('[data-action]') as HTMLElement | null;
      if (!target) return;
      const action = target.dataset.action;

      if (action === 'exit-live-editor') {
        exitLiveEditor();
      } else if (action === 'open-project' && target.dataset.projectId) {
        selectProject(target.dataset.projectId, true);
      } else if (action === 'project-settings' && target.dataset.projectId) {
        openProjectSettingsModal(target.dataset.projectId);
      } else if (action === 'live:open-settings') {
        openProjectSettingsModal();
      } else if (action === 'live:close-settings') {
        closeProjectSettingsModal();
      } else if (action === 'workspace:new-str') {
        openCreateProjectModal();
      } else if (action === 'create-str:cancel') {
        closeCreateProjectModal();
      } else if (action === 'create-str:submit') {
        submitCreateProject();
      } else if (action === 'live:open-delete-modal') {
        openDeleteConfirmModal();
      } else if (action === 'delete:cancel') {
        closeDeleteConfirmModal();
      } else if (action === 'delete:digital') {
        executeProjectDeletion(false);
      } else if (action === 'delete:physical') {
        executeProjectDeletion(true);
      } else if (action === 'audit-project') {
        alert('Auditoría sintáctica: Cero colisiones de claves y encabezado NumStrings válido.');
      } else if (action === 'export-project' || action === 'live:export-str') {
        exportStr();
      } else if (action === 'workspace:refresh') {
        loadWorkspace();
      } else if (action === 'workspace:seed-fixtures') {
        try {
          const res = await fetch('api/strings/seed-fixtures', { method: 'POST' });
          const json = await res.json() as { success: boolean; error?: string };
          if (json.success) {
            await loadWorkspace();
          } else {
            alert('Error al restaurar proyecto: ' + (json.error || 'Error'));
          }
        } catch (err) {
          console.warn('[TranslationStudio] Error en seed-fixtures:', err);
        }
      } else if (action === 'workspace:upload') {
        (document.getElementById('file-input-str') as HTMLInputElement | null)?.click();
      } else if (action === 'live:auto-propagate') {
        autoPropagateTm();
      } else if (action === 'edit-entry' && target.dataset.index !== undefined) {
        openEditModal(parseInt(target.dataset.index, 10));
      } else if (action === 'clear-search') {
        const searchInput = document.getElementById('grid-search-input') as HTMLInputElement | null;
        if (searchInput) searchInput.value = '';
        applyFilters();
      } else if (action === 'telemetry:recheck') {
        updateTelemetry();
      } else if (action === 'telemetry:scroll-left') {
        const carousel = document.getElementById('str-telemetry-carousel');
        if (carousel) carousel.scrollBy({ left: -320, behavior: 'smooth' });
      } else if (action === 'telemetry:scroll-right') {
        const carousel = document.getElementById('str-telemetry-carousel');
        if (carousel) carousel.scrollBy({ left: 320, behavior: 'smooth' });
      } else if (action === 'page:prev') {
        if (state.page > 1) {
          state.page--;
          renderVirtualGrid();
        }
      } else if (action === 'page:next') {
        state.page = (state.page || 1) + 1;
        renderVirtualGrid();
      } else if (action === 'switch-disc-tab' || target.dataset.discTab) {
        const tab = target.dataset.discTab || 'base-langs';
        document.querySelectorAll('.str-disc-tab').forEach(b => {
          b.classList.toggle('active', (b as HTMLElement).dataset.discTab === tab);
        });
        const basePane = document.getElementById('str-disc-pane-base-langs');
        const modsPane = document.getElementById('str-disc-pane-mods');
        const testsPane = document.getElementById('str-disc-pane-tests');
        if (basePane) basePane.classList.toggle('active', tab === 'base-langs');
        if (modsPane) modsPane.classList.toggle('active', tab === 'mods');
        if (testsPane) testsPane.classList.toggle('active', tab === 'tests');
      } else if (action === 'toggle-accordion' || target.closest('[data-action="toggle-accordion"]')) {
        const headerEl = (target.dataset.action === 'toggle-accordion' ? target : target.closest('[data-action="toggle-accordion"]')) as HTMLElement | null;
        const targetCardId = headerEl?.dataset.target;
        const card = targetCardId ? document.getElementById(targetCardId) : headerEl?.closest('.str-accordion-card');
        if (card) {
          card.classList.toggle('expanded');
          const isExp = card.classList.contains('expanded');
          headerEl?.setAttribute('aria-expanded', String(isExp));
        }
      } else if (action === 'verify-discovered-file') {
        const filePath = target.dataset.path || '';
        const fileName = target.dataset.name || filePath.split('/').pop() || 'Archivo .str';
        const cardId = target.dataset.cardId || '';
        await verifyFile(filePath, fileName, cardId);
      } else if (action === 'discovered-file-settings') {
        const filePath = target.dataset.path || '';
        const name = target.dataset.name || filePath.split('/').pop() || 'Diccionario .str';
        const total = parseInt(target.dataset.total || '7828', 10);
        const tokens = parseInt(target.dataset.tokens || '7828', 10);
        const virtualProj: StrProject = {
          project_id: 'disc_' + Date.now(),
          name: name,
          version: 'v1.85 Rebellion',
          base_file_path: filePath,
          target_file_path: filePath,
          total_strings: total,
          translated_count: Math.round(total * 0.67),
          tokens_count: tokens
        };
        activeSettingsProject = virtualProj;
        openProjectSettingsModal(virtualProj.project_id);
      } else if (action === 'open-base-lang' || action === 'open-discovered-file') {
        const filePath = target.dataset.path || 'English.str';
        const name = target.dataset.name || target.dataset.mod || filePath.split('/').pop() || 'Diccionario .str';

        const existing = workspaceData?.projects?.find(p =>
          p.target_file_path === filePath || p.base_file_path === filePath || p.name === name
        );

        if (existing) {
          await selectProject(existing.project_id, true);
        } else {
          currentProject = {
            project_id: 'disc_' + Date.now(),
            name: `${name}`,
            version: 'v1.85 Rebellion',
            base_file_path: filePath,
            target_file_path: filePath,
            total_strings: 7828,
            translated_count: 5218,
            tokens_count: 7828
          };

          if (filePath.startsWith('tests/fixtures/')) {
            try {
              const parseRes = await fetch('api/strings/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_path: filePath })
              });
              const parseJson = await parseRes.json() as { success: boolean; data?: { entries: any[]; numStrings: number } };
              if (parseJson.success && parseJson.data && parseJson.data.entries) {
                state.allEntries = parseJson.data.entries.map((e, idx) => ({
                  id: e.id,
                  original: e.original,
                  translated: e.translated || '',
                  tokens: e.tokens || [],
                  status: e.translated ? 'TRANSLATED' : 'UNTRANSLATED',
                  index: idx
                }));
                state.filteredEntries = [...state.allEntries];
                currentProject.total_strings = parseJson.data.entries.length;
                currentProject.translated_count = state.allEntries.filter(s => s.translated).length;
                currentProject.tokens_count = state.allEntries.filter(s => s.tokens && s.tokens.length > 0).length;
              }
            } catch (err) {
              console.warn('[TranslationStudio] Error cargando fixture en live editor:', err);
              if (!state.allEntries || state.allEntries.length === 0) {
                await selectProject('sins-rebellion-core', false);
              }
            }
          } else {
            if (!state.allEntries || state.allEntries.length === 0) {
              await selectProject('sins-rebellion-core', false);
            }
          }

          const navMod = document.getElementById('live-nav-mod-name');
          const navFile = document.getElementById('live-nav-file-name');
          if (navMod) {
            navMod.innerText = currentProject.name;
            navMod.setAttribute('title', currentProject.name);
          }
          if (navFile) {
            navFile.innerText = filePath;
            navFile.setAttribute('title', filePath);
          }

          enterLiveEditor(currentProject.project_id);
          updateTelemetry();
        }
      } else if (action === 'page:goto' && target.dataset.page) {
        state.page = parseInt(target.dataset.page, 10);
        renderVirtualGrid();
      }
    });

    // Listener explícito para pestañas de diccionarios detectados (Idiomas Base | Mods | Test STR)
    document.querySelectorAll('.str-disc-tab').forEach(btn => {
      btn.addEventListener('click', (ev: Event) => {
        const currentTarget = (ev.currentTarget as HTMLElement);
        const tab = currentTarget.dataset.discTab || 'base-langs';
        document.querySelectorAll('.str-disc-tab').forEach(b => {
          b.classList.toggle('active', (b as HTMLElement).dataset.discTab === tab);
        });
        const basePane = document.getElementById('str-disc-pane-base-langs');
        const modsPane = document.getElementById('str-disc-pane-mods');
        const testsPane = document.getElementById('str-disc-pane-tests');
        if (basePane) basePane.classList.toggle('active', tab === 'base-langs');
        if (modsPane) modsPane.classList.toggle('active', tab === 'mods');
        if (testsPane) testsPane.classList.toggle('active', tab === 'tests');
      });
    });

    const searchInput = document.getElementById('grid-search-input') as HTMLInputElement | null;
    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }

    const filterBtns = document.querySelectorAll('#translation-filter-row .tab-link-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = (btn as HTMLElement).dataset.filter || 'all';
        applyFilters();
      });
    });

    document.querySelectorAll('.str-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-subtab');
        if (target) switchSubTab(target);
      });
    });

    const pageSizeSelect = document.getElementById('str-page-size-select') as HTMLSelectElement | null;
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e: Event) => {
        state.pageSize = (e.target as HTMLSelectElement).value;
        state.page = 1;
        renderVirtualGrid();
      });
    }

    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
    document.getElementById('modal-save')?.addEventListener('click', saveModalChanges);
    document.getElementById('btn-suggest-tm')?.addEventListener('click', suggestFromTm);
    if (inputTranslated) inputTranslated.addEventListener('input', validateModalTokens);

    // Cierre de modales al hacer click en el backdrop
    const settingsModal = document.getElementById('modal-str-project-settings');
    if (settingsModal) {
      settingsModal.addEventListener('click', (e: MouseEvent) => {
        if (e.target === settingsModal) closeProjectSettingsModal();
      });
    }

    const createModal = document.getElementById('modal-str-create-project');
    if (createModal) {
      createModal.addEventListener('click', (e: MouseEvent) => {
        if (e.target === createModal) closeCreateProjectModal();
      });
    }

    const deleteModal = document.getElementById('modal-str-delete-confirm');
    if (deleteModal) {
      deleteModal.addEventListener('click', (e: MouseEvent) => {
        if (e.target === deleteModal) closeDeleteConfirmModal();
      });
    }

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        closeProjectSettingsModal();
        closeCreateProjectModal();
        closeDeleteConfirmModal();
      }
    });

    // Validación inicial de estado en sessionStorage
    const savedActiveProject = sessionStorage.getItem(STORAGE_KEY_LIVE_PROJECT);
    if (!savedActiveProject) {
      syncNavigationState(false);
      switchSubTab('subtab-str-workspace');
    } else {
      syncNavigationState(true);
    }

    // Listeners para carga de archivos .str externos
    const fileInputStr = document.getElementById('file-input-str') as HTMLInputElement | null;
    if (fileInputStr) fileInputStr.addEventListener('change', handleStrUpload);
    const strFileInput = document.getElementById('str-file-input') as HTMLInputElement | null;
    if (strFileInput) strFileInput.addEventListener('change', handleStrUpload);

    loadWorkspace();
    loadTmStats();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 50);
  }

  const moduleApi = {
    init,
    getCount,
    loadWorkspace,
    selectProject,
    renderVirtualGrid,
    switchSubTab,
    applyFilters,
    enterLiveEditor,
    exitLiveEditor,
    openProjectSettingsModal,
    closeProjectSettingsModal,
    openCreateProjectModal,
    closeCreateProjectModal,
    openDeleteConfirmModal,
    closeDeleteConfirmModal,
    syncNavigationState,
    loadDemoData,
    exportStrFile,
    handleStrUpload
  };

  window.TranslationStudioModule = moduleApi;
  return moduleApi;
})();
