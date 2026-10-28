/**
 * Solaris Nexus Studio - SidebarTree Module (TypeScript)
 * Clepces org. ltd
 */

export class SidebarTreeModule {
  private currentTreeTarget: string | null = null;
  private currentTreeType: string | null = null;

  public openTreeItem(type: string | null, _target: string | null): void {
    if (type === 'str') {
      window.ViewNavigator?.switchTab('tab-translation');
      if (window.TranslationStudioModule && window.TranslationStudioModule.getCount() === 0) {
        window.TranslationStudioModule.loadDemoData();
      }
    } else if (type === 'mods' || type === 'enabled') {
      window.ViewNavigator?.switchTab('tab-mods');
      if (window.ModManagerModule) window.ModManagerModule.scanMods();
    } else if (type === 'entities') {
      window.ViewNavigator?.switchTab('tab-entities');
      if (window.EntityEditorModule) window.EntityEditorModule.loadCatalog();
    } else if (type === 'galaxy') {
      window.ViewNavigator?.switchTab('tab-galaxy');
      if (window.GalaxyForgeModule) window.GalaxyForgeModule.generate(12);
    }
  }

  public init(): void {
    document.querySelectorAll<HTMLElement>('.tree-folder-toggle').forEach(folderNode => {
      folderNode.addEventListener('click', (e) => {
        e.stopPropagation();
        folderNode.classList.toggle('active');
        const folderKey = folderNode.getAttribute('data-folder');
        const subGroup = document.getElementById(`tree-group-${folderKey}`);
        const caret = folderNode.querySelector<HTMLElement>('.tree-caret');
        const isOpen = folderNode.classList.contains('active');
        if (subGroup) {
          subGroup.style.display = isOpen ? 'block' : 'none';
        }
        if (caret) {
          caret.innerText = isOpen ? '▼' : '▶';
        }
      });
    });

    const inspector = document.getElementById('tree-selection-inspector');
    const selName = document.getElementById('tree-sel-name');
    const selType = document.getElementById('tree-sel-type');
    const btnOpen = document.getElementById('btn-tree-open-target');

    document.querySelectorAll<HTMLElement>('.tree-file[data-target]').forEach(fileNode => {
      fileNode.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.tree-file').forEach(f => f.classList.remove('selected'));
        fileNode.classList.add('selected');

        const target = fileNode.getAttribute('data-target');
        const type = fileNode.getAttribute('data-type');
        const label = fileNode.querySelector<HTMLElement>('span:last-child')?.innerText || target || '';

        this.currentTreeTarget = target;
        this.currentTreeType = type;

        if (inspector && selName && selType) {
          inspector.style.display = 'block';
          selName.innerText = label;
          selType.innerText = `[${(type || 'FILE').toUpperCase()}] · ${target}`;
        }
      });

      fileNode.addEventListener('dblclick', () => {
        const target = fileNode.getAttribute('data-target');
        const type = fileNode.getAttribute('data-type');
        this.openTreeItem(type, target);
      });
    });

    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        if (this.currentTreeType && this.currentTreeTarget) {
          this.openTreeItem(this.currentTreeType, this.currentTreeTarget);
        }
      });
    }

    const vfsSearch = document.getElementById('vfs-tree-search-input') as HTMLInputElement | null;
    if (vfsSearch) {
      vfsSearch.addEventListener('input', () => {
        const q = vfsSearch.value.toLowerCase().trim();
        document.querySelectorAll<HTMLElement>('.tree-file').forEach(fileNode => {
          const text = fileNode.innerText.toLowerCase();
          fileNode.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
        });
      });
    }
  }
}

export const GlobalSidebarTree = new SidebarTreeModule();

declare global {
  interface Window {
    SidebarTree: SidebarTreeModule;
  }
}

if (typeof window !== 'undefined') {
  window.SidebarTree = GlobalSidebarTree;
}
