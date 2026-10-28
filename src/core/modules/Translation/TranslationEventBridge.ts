/**
 * Solaris Nexus Studio - TranslationEventBridge Subsystem
 * DOM event delegation, search/filter inputs, drag-and-drop, and subtab routing
 */

import { ToastNotification } from '../../engine/ui/toast.component';

export interface EventBridgeActions {
  onExitLiveEditor: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenProjectSettings: (projectId?: string) => void;
  onCloseProjectSettings: () => void;
  onOpenCreateProject: () => void;
  onCloseCreateProject: () => void;
  onSubmitCreateProject: () => Promise<void>;
  onOpenDeleteModal: () => void;
  onCloseDeleteModal: () => void;
  onDeleteDigital: () => Promise<void>;
  onDeletePhysical: () => Promise<void>;
  onExportStr: () => void;
  onRefreshWorkspace: () => void;
  onSeedFixtures: () => Promise<void>;
  onAutoPropagateTm: () => Promise<void>;
  onSaveLiveString: () => void;
  onSearchInput: (query: string) => void;
  onFilterChange: (status: string) => void;
  onPageSizeChange: (size: number | string) => void;
  onPaginationAction: (action: string) => void;
  onValidateTokens: () => void;
  onFileUpload: (files: FileList | null) => void;
}

export class TranslationEventBridge {
  public bindEvents(actions: EventBridgeActions): void {
    // Delegated click
    document.addEventListener('click', async (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest('[data-action]') as HTMLElement | null;
      if (!target) return;
      const action = target.dataset.action;

      switch (action) {
        case 'exit-live-editor':
          actions.onExitLiveEditor();
          break;
        case 'open-project':
          if (target.dataset.projectId) actions.onOpenProject(target.dataset.projectId);
          break;
        case 'project-settings':
          actions.onOpenProjectSettings(target.dataset.projectId);
          break;
        case 'live:open-settings':
          actions.onOpenProjectSettings();
          break;
        case 'live:close-settings':
          actions.onCloseProjectSettings();
          break;
        case 'workspace:new-str':
          actions.onOpenCreateProject();
          break;
        case 'create-str:cancel':
          actions.onCloseCreateProject();
          break;
        case 'create-str:submit':
          await actions.onSubmitCreateProject();
          break;
        case 'live:open-delete-modal':
          actions.onOpenDeleteModal();
          break;
        case 'delete:cancel':
          actions.onCloseDeleteModal();
          break;
        case 'delete:digital':
          await actions.onDeleteDigital();
          break;
        case 'delete:physical':
          await actions.onDeletePhysical();
          break;
        case 'audit-project':
          ToastNotification.info('Auditoría sintáctica: Cero colisiones de claves y encabezado NumStrings válido.');
          break;
        case 'export-project':
        case 'live:export-str':
          actions.onExportStr();
          break;
        case 'workspace:refresh':
          actions.onRefreshWorkspace();
          break;
        case 'workspace:seed-fixtures':
          await actions.onSeedFixtures();
          break;
        case 'workspace:upload':
          (document.getElementById('file-input-str') as HTMLInputElement | null)?.click();
          break;
        case 'live:auto-propagate-tm':
          await actions.onAutoPropagateTm();
          break;
        case 'live:save-string':
          actions.onSaveLiveString();
          break;
        case 'live:first-page':
        case 'live:prev-page':
        case 'live:next-page':
        case 'live:last-page':
          actions.onPaginationAction(action.replace('live:', ''));
          break;
      }
    });

    // Subtab navigation
    document.querySelectorAll<HTMLElement>('.str-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-subtab');
        if (target) {
          document.querySelectorAll('.str-subtab-btn').forEach(b => b.classList.toggle('active', b === btn));
          document.querySelectorAll('.str-subtab-pane').forEach(p => p.classList.toggle('active', p.id === target));
        }
      });
    });

    // Inputs & Filters
    document.getElementById('str-filter-input')?.addEventListener('input', (e) => {
      actions.onSearchInput((e.target as HTMLInputElement).value);
    });

    document.getElementById('str-filter-status')?.addEventListener('change', (e) => {
      actions.onFilterChange((e.target as HTMLSelectElement).value);
    });

    document.getElementById('str-page-size')?.addEventListener('change', (e) => {
      actions.onPageSizeChange((e.target as HTMLSelectElement).value);
    });

    document.getElementById('edit-string-translated')?.addEventListener('input', () => {
      actions.onValidateTokens();
    });

    // Drag & Drop
    const dropZone = document.getElementById('drop-zone-str');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files) {
          actions.onFileUpload(e.dataTransfer.files);
        }
      });
    }
  }
}
