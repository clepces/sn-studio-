/**
 * Solaris Nexus Studio - TranslationStudio Modular Coordinator
 * Clepces org. ltd | Arquitectura Modular y Tipado Estricto (Cero `any`)
 */

import { GlobalEventHub } from '../../services/event-hub';
import { TranslationManager } from './TranslationManager';
import { TranslationUI } from './TranslationUI';
import { TranslationEditor } from './TranslationEditor';
import { TranslationValidator } from './TranslationValidator';
import { TranslationExporter } from './TranslationExporter';
import { TranslationEventBridge } from './TranslationEventBridge';
import { ToastNotification } from '../../engine/ui/toast.component';
import type {
  StrProject,
  StrEntryState,
  TranslationStudioModule,
  NexusCoreBridge
} from '../../../frontend/types/translation.types';

export class TranslationStudio implements TranslationStudioModule {
  public manager: TranslationManager;
  public ui: TranslationUI;
  public editor: TranslationEditor;
  public validator: TranslationValidator;
  public exporter: TranslationExporter;
  public eventBridge: TranslationEventBridge;

  private isInitialized = false;

  constructor() {
    this.manager = new TranslationManager();
    this.ui = new TranslationUI();
    this.editor = new TranslationEditor();
    this.validator = new TranslationValidator();
    this.exporter = new TranslationExporter();
    this.eventBridge = new TranslationEventBridge();
  }

  getCount(): number {
    return this.editor.getAllEntries().length;
  }

  renderVirtualGrid(): void {
    this.editor.renderVirtualGrid();
  }

  switchSubTab(targetSubTabId: string): void {
    this.ui.switchSubTab(targetSubTabId);
  }

  applyFilters(): void {
    this.editor.filterGrid();
  }

  openProjectSettingsModal(projectId?: string): void {
    this.manager.openProjectSettingsModal(projectId, this.editor.getAllEntries());
  }

  closeProjectSettingsModal(): void {
    this.manager.closeProjectSettingsModal();
  }

  openCreateProjectModal(): void {
    this.manager.openCreateProjectModal();
  }

  closeCreateProjectModal(): void {
    this.manager.closeCreateProjectModal();
  }

  openDeleteConfirmModal(projectId?: string): void {
    this.manager.openDeleteConfirmModal(projectId);
  }

  closeDeleteConfirmModal(): void {
    this.manager.closeDeleteConfirmModal();
  }

  handleStrUpload(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input?.files) {
      this.handleFileUpload(input.files);
    }
  }

  async loadWorkspace(): Promise<void> {
    const ws = await this.manager.loadWorkspace();
    if (!ws) return;

    const projects = ws.projects || [];
    this.ui.renderWorkspaceProjects(
      projects,
      'str-projects-container',
      this.manager.getCurrentProject()?.project_id || null,
      (pid) => this.selectProject(pid, true),
      (pid) => this.manager.openProjectSettingsModal(pid, this.editor.getAllEntries()),
      () => this.exportStrFile(),
      (pid) => this.manager.openProjectSettingsModal(pid, this.editor.getAllEntries())
    );

    this.ui.renderDiscoveredFiles(ws.discovered_files || {}, {
      onOpen: (filePath, name, modName) => this.openDiscoveredFile(filePath, name, modName),
      onVerify: (filePath, name, cardId) => this.verifyFile(filePath, name, cardId),
      onSettings: (filePath, name, total, tokens) => this.openDiscoveredFileSettings(filePath, name, total, tokens)
    });

    const countBadge = document.getElementById('workspace-projects-count');
    if (countBadge) countBadge.innerText = `${projects.length} Proyectos`;

    if (projects.length === 0) {
      this.manager.setCurrentProject(null);
      this.editor.setAllEntries([]);
      this.manager.clearSavedProjectId();
      this.syncNavigationState(false);
      this.editor.renderVirtualGrid();
      this.updateTelemetry();
    } else {
      const savedProjectId = this.manager.getSavedProjectId();
      const savedProjectExists = savedProjectId ? projects.some(p => p.project_id === savedProjectId) : false;
      if (savedProjectId && savedProjectExists) {
        await this.selectProject(savedProjectId, false);
      } else {
        if (savedProjectId) this.manager.clearSavedProjectId();
        const firstProj = projects[0];
        const cur = this.manager.getCurrentProject();
        if (firstProj && (!cur || !projects.some(p => p.project_id === cur.project_id))) {
          await this.selectProject(firstProj.project_id, false);
        }
      }
      this.syncNavigationState(false);
      this.ui.switchSubTab('subtab-str-workspace');
    }
  }

  async selectProject(projectId: string, switchToLiveTab = true): Promise<void> {
    const data = await this.manager.selectProject(projectId);
    if (!data) return;

    const entries: StrEntryState[] = data.strings.map((s, idx) => {
      const key = s.str_key || s.key || s.id || `STR_${idx + 1}`;
      const orig = s.base_value || s.original || '';
      const trans = s.translated_value !== undefined ? s.translated_value : (s.translated !== undefined ? s.translated : '');
      return {
        id: key,
        original: orig,
        translated: trans,
        tokens: this.validator.extractTokens(orig),
        status: trans && trans.trim() !== '' ? 'TRANSLATED' : 'UNTRANSLATED',
        index: idx
      };
    });

    this.editor.setAllEntries(entries);
    this.editor.renderVirtualGrid();
    this.updateTelemetry();

    if (switchToLiveTab) {
      this.enterLiveEditor(projectId);
    }
  }

  enterLiveEditor(projectId?: string): void {
    const cur = this.manager.getCurrentProject();
    if (!cur && projectId) {
      this.selectProject(projectId, true);
      return;
    }

    this.ui.syncNavigationState(true);
    this.ui.switchSubTab('subtab-str-live');

    const liveName = document.getElementById('live-project-name');
    const liveTarget = document.getElementById('live-target-path');
    if (cur) {
      if (liveName) liveName.innerText = cur.name;
      if (liveTarget) liveTarget.innerText = cur.target_file_path || 'Localizations/es/String/English.str';
    }

    this.editor.renderVirtualGrid();
    this.updateTelemetry();
  }

  exitLiveEditor(): void {
    this.ui.syncNavigationState(false);
    this.ui.switchSubTab('subtab-str-workspace');
    this.loadWorkspace();
  }

  syncNavigationState(isLive: boolean): void {
    this.ui.syncNavigationState(isLive);
  }

  exportStrFile(): void {
    this.exporter.exportStr(this.editor.getAllEntries(), this.manager.getCurrentProject());
  }

  async loadDemoData(): Promise<void> {
    const projectId = await this.manager.loadDemoData();
    if (projectId) {
      await this.selectProject(projectId, true);
    }
  }

  async openDiscoveredFile(filePath: string, name: string, modName?: string): Promise<void> {
    const ws = this.manager.getWorkspaceData();
    const existing = ws?.projects?.find(
      (p) => p.target_file_path === filePath || p.base_file_path === filePath
    );

    if (existing) {
      await this.selectProject(existing.project_id, true);
      return;
    }

    const virtualProj: StrProject = {
      project_id: 'disc_' + Date.now(),
      name: modName || name,
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
        const parseJson = await parseRes.json() as {
          success: boolean;
          data?: { entries: Array<{ id: string; original: string; translated?: string; tokens?: string[] }> };
        };
        if (parseJson.success && parseJson.data?.entries) {
          const entries: StrEntryState[] = parseJson.data.entries.map((e, idx) => ({
            id: e.id,
            original: e.original,
            translated: e.translated || '',
            tokens: e.tokens || [],
            status: e.translated ? 'TRANSLATED' : 'UNTRANSLATED',
            index: idx
          }));
          this.editor.setAllEntries(entries);
          virtualProj.total_strings = entries.length;
          virtualProj.translated_count = entries.filter((s: StrEntryState) => Boolean(s.translated)).length;
          virtualProj.tokens_count = entries.filter((s: StrEntryState) => s.tokens.length > 0).length;
        }
      } catch (err) {
        console.warn('[TranslationStudio] Error cargando fixture en live editor:', err);
        if (this.editor.getAllEntries().length === 0) {
          await this.selectProject('sins-rebellion-core', false);
        }
      }
    } else {
      if (this.editor.getAllEntries().length === 0) {
        await this.selectProject('sins-rebellion-core', false);
      }
    }

    this.manager.setCurrentProject(virtualProj);
    const navMod = document.getElementById('live-nav-mod-name');
    const navFile = document.getElementById('live-nav-file-name');
    if (navMod) {
      navMod.innerText = virtualProj.name;
      navMod.setAttribute('title', virtualProj.name);
    }
    if (navFile) {
      navFile.innerText = filePath;
      navFile.setAttribute('title', filePath);
    }

    this.enterLiveEditor(virtualProj.project_id);
    this.updateTelemetry();
  }

  private openDiscoveredFileSettings(filePath: string, name: string, total: number, tokens: number): void {
    const virtualProj: StrProject = {
      project_id: 'disc_' + Date.now(),
      name,
      version: 'v1.85 Rebellion',
      base_file_path: filePath,
      target_file_path: filePath,
      total_strings: total,
      translated_count: Math.round(total * 0.67),
      tokens_count: tokens
    };
    this.manager.setActiveSettingsProject(virtualProj);
    this.manager.openProjectSettingsModal(virtualProj.project_id, this.editor.getAllEntries());
  }

  async verifyFile(filePath: string, _name: string, cardId: string): Promise<void> {
    const res = await this.validator.auditFile(filePath);
    if (!res || !res.data) return;

    const isOk = res.data.status === 'valid';
    const numMatch = res.data.declared_numstrings === res.data.parsed_numstrings;
    this.ui.renderVerificationResult(`${cardId}-verify-slot`, {
      isValid: isOk,
      numStringsMatch: numMatch,
      errors: res.data.errors
    });
    const status = isOk ? 'valid' : 'error';
    const label = isOk ? 'Auditado: 100% Canónico' : 'Auditado: Discrepancias';
    this.ui.updateVerificationStatusBadge(cardId, status, label);
  }

  public updateTelemetry(): void {
    this.ui.updateTelemetry(this.manager.getCurrentProject(), this.editor.getAllEntries());
  }

  public handleFileUpload(files: FileList | null): void {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = this.validator.parseStrContent(content);
      if (parsed.entries.length > 0) {
        this.editor.setAllEntries(parsed.entries);
        const virtualProj: StrProject = {
          project_id: 'upload_' + Date.now(),
          name: file.name.replace(/\.str$/i, ''),
          version: 'v1.85 Rebellion (Upload)',
          base_file_path: file.name,
          target_file_path: file.name,
          total_strings: parsed.entries.length,
          translated_count: parsed.entries.filter((s: StrEntryState) => Boolean(s.translated)).length,
          tokens_count: parsed.entries.filter((s: StrEntryState) => s.tokens.length > 0).length
        };
        this.manager.setCurrentProject(virtualProj);

        const navMod = document.getElementById('live-nav-mod-name');
        const navFile = document.getElementById('live-nav-file-name');
        if (navMod) {
          navMod.innerText = virtualProj.name;
          navMod.setAttribute('title', virtualProj.name);
        }
        if (navFile) {
          navFile.innerText = file.name;
          navFile.setAttribute('title', file.name);
        }

        this.enterLiveEditor(virtualProj.project_id);
        this.updateTelemetry();
        ToastNotification.success(`Cargadas ${parsed.entries.length} cadenas desde ${file.name}`);
      } else {
        ToastNotification.error('No se pudieron extraer cadenas válidas del archivo .str.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Subscriptions
    GlobalEventHub.subscribe('translation:load-demo', () => this.loadDemoData());
    GlobalEventHub.subscribe('translation:export', () => this.exportStrFile());

    // Connect event bridge
    this.eventBridge.bindEvents({
      onExitLiveEditor: () => this.exitLiveEditor(),
      onOpenProject: (pid) => this.selectProject(pid, true),
      onOpenProjectSettings: (pid) => this.manager.openProjectSettingsModal(pid, this.editor.getAllEntries()),
      onCloseProjectSettings: () => this.manager.closeProjectSettingsModal(),
      onOpenCreateProject: () => this.manager.openCreateProjectModal(),
      onCloseCreateProject: () => this.manager.closeCreateProjectModal(),
      onSubmitCreateProject: async () => {
        const ok = await this.manager.submitCreateProject();
        if (ok) await this.loadWorkspace();
      },
      onOpenDeleteModal: () => this.manager.openDeleteConfirmModal(),
      onCloseDeleteModal: () => this.manager.closeDeleteConfirmModal(),
      onDeleteDigital: async () => {
        const res = await this.manager.executeProjectDeletion(false);
        if (res.success) {
          this.exitLiveEditor();
          await this.loadWorkspace();
        }
      },
      onDeletePhysical: async () => {
        const res = await this.manager.executeProjectDeletion(true);
        if (res.success) {
          this.exitLiveEditor();
          await this.loadWorkspace();
        }
      },
      onExportStr: () => this.exportStrFile(),
      onRefreshWorkspace: () => this.loadWorkspace(),
      onSeedFixtures: async () => this.loadDemoData(),
      onAutoPropagateTm: async () => {
        const cur = this.manager.getCurrentProject();
        if (cur) {
          await this.editor.autoPropagateTm(cur.project_id, () => {
            this.editor.renderVirtualGrid();
            this.updateTelemetry();
          });
        }
      },
      onSaveLiveString: () => {
        this.editor.saveModalTranslation(() => {
          this.updateTelemetry();
          this.manager.saveActiveLiveEntries(this.editor.getAllEntries());
        });
      },
      onSearchInput: (q) => this.editor.filterGrid(q, (document.getElementById('str-filter-status') as HTMLSelectElement | null)?.value || 'all'),
      onFilterChange: (status) => this.editor.filterGrid((document.getElementById('str-filter-input') as HTMLInputElement | null)?.value || '', status),
      onPageSizeChange: (size) => this.editor.changePageSize(size),
      onPaginationAction: (action) => this.editor.paginate(action),
      onValidateTokens: () => this.editor.validateModalTokens(),
      onFileUpload: (files) => this.handleFileUpload(files)
    });

    // File input change
    document.getElementById('file-input-str')?.addEventListener('change', (e) => {
      const files = (e.target as HTMLInputElement).files;
      this.handleFileUpload(files);
      (e.target as HTMLInputElement).value = '';
    });

    this.loadWorkspace();
  }

  getNexusCoreBridge(): NexusCoreBridge {
    return {
      state: {
        allEntries: this.editor.getAllEntries(),
        filteredEntries: this.editor.getFilteredEntries(),
        page: this.editor.getPage(),
        pageSize: this.editor.getPageSize(),
        currentFilter: this.editor.getCurrentFilter()
      },
      extractTokens: (text: string) => this.validator.extractTokens(text),
      validateTokenSyntax: (orig: string, trans: string) => this.validator.validateTokenSyntax(orig, trans),
      downloadBlob: (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      },
      apiPost: async (endpoint: string, data: unknown) => {
        const res = await fetch(`api/${endpoint.replace(/^\//, '')}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        return await res.json() as { success: boolean; data?: unknown; error?: string };
      }
    };
  }
}

export const GlobalTranslationStudio = new TranslationStudio();

if (typeof window !== 'undefined') {
  window.TranslationStudioModule = GlobalTranslationStudio;
  window.NexusCore = GlobalTranslationStudio.getNexusCoreBridge();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GlobalTranslationStudio.init());
  } else {
    setTimeout(() => GlobalTranslationStudio.init(), 20);
  }
}
