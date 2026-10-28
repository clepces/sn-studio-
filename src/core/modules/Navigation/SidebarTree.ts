/**
 * Solaris Nexus Studio - SidebarTree Subsystem
 * Project explorer file tree, folder toggling, and file target navigation
 */

import { GlobalEventHub } from '../../services/event-hub';

export class SidebarTree {
  private currentTreeTarget: string | null = null;
  private currentTreeType: string | null = null;

  public openTreeItem(type: string | null, _target: string | null): void {
    if (type === 'str') {
      GlobalEventHub.publish('navigation:switch-tab', 'tab-translation');
    } else if (type === 'mods' || type === 'enabled') {
      GlobalEventHub.publish('navigation:switch-tab', 'tab-mods');
    } else if (type === 'entities') {
      GlobalEventHub.publish('navigation:switch-tab', 'tab-entities');
    } else if (type === 'galaxy') {
      GlobalEventHub.publish('navigation:switch-tab', 'tab-galaxy');
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

        if (inspector) {
          inspector.style.display = 'block';
          if (selName) selName.innerText = label;
          if (selType) selType.innerText = (type || 'file').toUpperCase();
        }
      });
    });

    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        if (this.currentTreeType) {
          this.openTreeItem(this.currentTreeType, this.currentTreeTarget);
        }
      });
    }
  }
}

export const GlobalSidebarTree = new SidebarTree();

declare global {
  interface Window {
    SidebarTree?: SidebarTree;
  }
}

if (typeof window !== 'undefined') {
  window.SidebarTree = GlobalSidebarTree;
}
