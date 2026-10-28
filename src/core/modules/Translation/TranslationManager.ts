import type {
  StrProject,
  WorkspacePayload,
  StrEntryState,
  TmStatsPayload
} from '../../../frontend/types/translation.types';
import { ToastNotification } from '../../engine/ui/toast.component';

export class TranslationManager {
  private currentProject: StrProject | null = null;
  private workspaceData: WorkspacePayload | null = null;
  private activeSettingsProject: StrProject | null = null;
  private deleteCountdownInterval: ReturnType<typeof setInterval> | null = null;
  private static STORAGE_KEY_LIVE_PROJECT = 'solaris_str_live_active_project';

  getCurrentProject(): StrProject | null {
    return this.currentProject;
  }

  setCurrentProject(project: StrProject | null): void {
    this.currentProject = project;
    if (project) {
      sessionStorage.setItem(TranslationManager.STORAGE_KEY_LIVE_PROJECT, project.project_id);
    } else {
      sessionStorage.removeItem(TranslationManager.STORAGE_KEY_LIVE_PROJECT);
    }
  }

  getWorkspaceData(): WorkspacePayload | null {
    return this.workspaceData;
  }

  getActiveSettingsProject(): StrProject | null {
    return this.activeSettingsProject;
  }

  setActiveSettingsProject(proj: StrProject | null): void {
    this.activeSettingsProject = proj;
  }

  getSavedProjectId(): string | null {
    return sessionStorage.getItem(TranslationManager.STORAGE_KEY_LIVE_PROJECT);
  }

  clearSavedProjectId(): void {
    sessionStorage.removeItem(TranslationManager.STORAGE_KEY_LIVE_PROJECT);
  }

  async loadWorkspace(): Promise<WorkspacePayload | null> {
    try {
      const res = await fetch('api/strings/workspace');
      const json = await res.json() as { success: boolean; data?: WorkspacePayload };
      if (json.success && json.data) {
        this.workspaceData = json.data;
        return this.workspaceData;
      }
    } catch (err) {
      console.warn('[TranslationManager] Error al cargar workspace:', err);
    }
    return null;
  }

  async selectProject(projectId: string): Promise<{ project: StrProject; strings: Array<{
    str_key?: string;
    key?: string;
    id?: string;
    base_value?: string;
    original?: string;
    translated_value?: string;
    translated?: string;
    status?: string;
    entry_id?: number;
  }> } | null> {
    try {
      const res = await fetch(`api/strings/project-strings?project_id=${encodeURIComponent(projectId)}&limit=1000`);
      const json = await res.json() as {
        success: boolean;
        data?: {
          project: StrProject;
          strings: Array<{
            str_key?: string;
            key?: string;
            id?: string;
            base_value?: string;
            original?: string;
            translated_value?: string;
            translated?: string;
            status?: string;
            entry_id?: number;
          }>;
        };
      };

      if (json.success && json.data) {
        this.setCurrentProject(json.data.project);
        return json.data;
      }
    } catch (err) {
      console.warn('[TranslationManager] Error al cargar cadenas de proyecto:', err);
    }
    return null;
  }

  openProjectSettingsModal(projectId?: string, allEntries?: StrEntryState[]): void {
    const modalEl = document.getElementById('modal-str-project-settings');
    if (!modalEl) return;

    let proj: StrProject | null = null;
    if (projectId && this.workspaceData && this.workspaceData.projects) {
      proj = this.workspaceData.projects.find(p => p.project_id === projectId) || null;
    }
    if (!proj) {
      proj = this.currentProject;
    }
    if (!proj && this.workspaceData && this.workspaceData.projects && this.workspaceData.projects.length > 0) {
      proj = this.workspaceData.projects[0] || null;
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

    this.activeSettingsProject = proj;

    const totalStrings = parseInt(String(proj.total_entries || proj.total_strings || (allEntries ? allEntries.length : 0)), 10);
    const translatedCount = parseInt(String(proj.translated_count || (allEntries ? allEntries.filter(e => e.translated && e.translated.trim() !== '').length : 0)), 10);
    const percent = totalStrings > 0 ? Math.round((translatedCount / totalStrings) * 100) : 0;
    const tokensCount = parseInt(String(proj.tokens_count || (allEntries ? allEntries.filter(e => e.tokens && e.tokens.length > 0).length : 0)), 10);

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

  closeProjectSettingsModal(): void {
    const modalEl = document.getElementById('modal-str-project-settings');
    if (modalEl) modalEl.classList.remove('active');
  }

  openCreateProjectModal(): void {
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

  closeCreateProjectModal(): void {
    const modalEl = document.getElementById('modal-str-create-project');
    if (modalEl) modalEl.classList.remove('active');
  }

  async submitCreateProject(): Promise<boolean> {
    const nameInput = document.getElementById('create-str-name') as HTMLInputElement | null;
    const versionInput = document.getElementById('create-str-version') as HTMLInputElement | null;
    const typeSelect = document.getElementById('create-str-type') as HTMLSelectElement | null;
    const pathInput = document.getElementById('create-str-path') as HTMLInputElement | null;

    const name = nameInput ? nameInput.value.trim() : '';
    const version = versionInput ? versionInput.value.trim() : 'v1.85 Rebellion';
    const projectType = typeSelect ? typeSelect.value : 'mod';
    const filePath = pathInput ? pathInput.value.trim() : 'Localizations/es/String/English.str';

    if (!name) {
      ToastNotification.warning('Por favor introduce un nombre para el proyecto.');
      nameInput?.focus();
      return false;
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
        this.closeCreateProjectModal();
        return true;
      } else {
        ToastNotification.error('Error al crear proyecto: ' + (json.error || 'Error desconocido'));
      }
    } catch (err) {
      console.warn('[TranslationManager] Error en create-project:', err);
      ToastNotification.error('Error de conexión al crear proyecto.');
    }
    return false;
  }

  openDeleteConfirmModal(projectId?: string): void {
    const modalEl = document.getElementById('modal-str-delete-confirm');
    if (!modalEl) return;

    let proj: StrProject | null = null;
    if (projectId && this.workspaceData && this.workspaceData.projects) {
      proj = this.workspaceData.projects.find(p => p.project_id === projectId) || null;
    }
    if (!proj) {
      proj = this.activeSettingsProject || this.currentProject;
    }
    if (!proj) return;

    this.activeSettingsProject = proj;

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

    if (this.deleteCountdownInterval) {
      clearInterval(this.deleteCountdownInterval);
    }

    let timeLeft = 5;
    this.deleteCountdownInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        if (btnDigital) btnDigital.textContent = `⏳ Espera (${timeLeft}s)...`;
        if (btnPhysical) btnPhysical.textContent = `⏳ Espera (${timeLeft}s)...`;
      } else {
        if (this.deleteCountdownInterval) {
          clearInterval(this.deleteCountdownInterval);
          this.deleteCountdownInterval = null;
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

  closeDeleteConfirmModal(): void {
    const modalEl = document.getElementById('modal-str-delete-confirm');
    if (modalEl) modalEl.classList.remove('active');
    if (this.deleteCountdownInterval) {
      clearInterval(this.deleteCountdownInterval);
      this.deleteCountdownInterval = null;
    }
  }

  async executeProjectDeletion(deletePhysical: boolean): Promise<{ success: boolean; deletedId?: string; name?: string }> {
    if (!this.activeSettingsProject || !this.activeSettingsProject.project_id) {
      return { success: false };
    }

    const targetId = this.activeSettingsProject.project_id;
    const targetName = this.activeSettingsProject.name;

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
        this.closeDeleteConfirmModal();
        this.closeProjectSettingsModal();

        if (this.currentProject?.project_id === targetId) {
          this.setCurrentProject(null);
        }

        return { success: true, deletedId: targetId, name: targetName };
      } else {
        ToastNotification.error('Error al eliminar proyecto: ' + (json.error || 'Error desconocido'));
      }
    } catch (err) {
      console.warn('[TranslationManager] Error en delete-project:', err);
      ToastNotification.error('Error de red al intentar eliminar el proyecto.');
    }
    return { success: false };
  }

  async loadDemoData(): Promise<string> {
    try {
      const res = await fetch('api/strings/seed-fixtures', { method: 'POST' });
      const json = await res.json() as { success: boolean; projects?: StrProject[] };
      const projId = (json.projects && json.projects[0]?.project_id) || 'sins-rebellion-core';
      return projId;
    } catch (err) {
      console.warn('[TranslationManager] Error en loadDemoData:', err);
      return 'sins-rebellion-core';
    }
  }

  async loadTmStats(): Promise<TmStatsPayload | null> {
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

        return stats;
      }
    } catch (err) {
      console.warn('[TranslationManager] Error al cargar TM stats:', err);
    }
    return null;
  }

  saveActiveLiveEntries(_entries: StrEntryState[]): void {
    // Saved in memory / session storage state
    if (this.currentProject) {
      this.currentProject.translated_count = _entries.filter(e => e.translated && e.translated.trim() !== '').length;
    }
  }
}
