import type { StrEntryState } from '../../../frontend/types/translation.types';
import { TranslationValidator } from './TranslationValidator';
import { ToastNotification } from '../../engine/ui/toast.component';

export class TranslationEditor {
  private allEntries: StrEntryState[] = [];
  private filteredEntries: StrEntryState[] = [];
  private page = 1;
  private pageSize: number | string = 25;
  private currentFilter = 'all';
  private editingIndex: number | null = null;
  private validator = new TranslationValidator();

  getAllEntries(): StrEntryState[] {
    return this.allEntries;
  }

  setAllEntries(entries: StrEntryState[]): void {
    this.allEntries = entries;
    this.filteredEntries = entries;
    this.page = 1;
  }

  getFilteredEntries(): StrEntryState[] {
    return this.filteredEntries;
  }

  getPage(): number {
    return this.page;
  }

  setPage(page: number): void {
    this.page = page;
  }

  getPageSize(): number | string {
    return this.pageSize;
  }

  setPageSize(pageSize: number | string): void {
    this.pageSize = pageSize;
  }

  getCurrentFilter(): string {
    return this.currentFilter;
  }

  setCurrentFilter(filter: string): void {
    this.currentFilter = filter;
  }

  renderVirtualGrid(): void {
    const runway = document.getElementById('virtual-runway');
    if (!runway) return;

    const total = this.filteredEntries.length;

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
      this.renderPagination(0);
      return;
    }

    const pageSizeNum = this.pageSize === 'all' ? total : (parseInt(String(this.pageSize), 10) || 25);
    const totalPages = Math.ceil(total / pageSizeNum);
    if (!this.page || this.page < 1) this.page = 1;
    if (this.page > totalPages) this.page = totalPages;

    const startIndex = (this.page - 1) * pageSizeNum;
    const endIndex = Math.min(total, startIndex + pageSizeNum);

    runway.style.display = 'flex';
    runway.style.flexDirection = 'column';
    runway.style.height = 'auto';
    runway.innerHTML = '';

    const hudText = document.getElementById('hud-status-text');
    if (hudText) {
      hudText.innerText = `Mostrando ${(startIndex + 1).toLocaleString()} - ${endIndex.toLocaleString()} de ${total.toLocaleString()} cadenas reales`;
    }

    for (let i = startIndex; i < endIndex; i++) {
      const item = this.filteredEntries[i];
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

    this.renderPagination(totalPages);
  }

  renderPagination(totalPages: number): void {
    const controls = document.getElementById('grid-pagination-controls');
    if (!controls) return;

    if (totalPages <= 1) {
      controls.innerHTML = '';
      return;
    }

    const curPage = this.page || 1;
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

  applyFilters(): void {
    const searchInput = document.getElementById('grid-search-input') as HTMLInputElement | null;
    const query = searchInput?.value.toLowerCase().trim() || '';
    const filter = this.currentFilter;

    this.filteredEntries = this.allEntries.filter((item: StrEntryState) => {
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

    this.page = 1;
    this.renderVirtualGrid();
  }

  filterGrid(query?: string, filter?: string): void {
    if (filter !== undefined) this.currentFilter = filter;
    const q = query !== undefined ? query.toLowerCase().trim() : '';

    this.filteredEntries = this.allEntries.filter((item: StrEntryState) => {
      let matchesFilter = true;
      if (this.currentFilter === 'translated') {
        matchesFilter = !!item.translated && item.translated.trim() !== '';
      } else if (this.currentFilter === 'pending') {
        matchesFilter = !item.translated || item.translated.trim() === '';
      } else if (this.currentFilter === 'tokens') {
        matchesFilter = !!item.tokens && item.tokens.length > 0;
      }

      let matchesQuery = true;
      if (q !== '') {
        const inKey = item.id.toLowerCase().includes(q);
        const inOrig = item.original.toLowerCase().includes(q);
        const inTrans = item.translated.toLowerCase().includes(q);
        matchesQuery = inKey || inOrig || inTrans;
      }

      return matchesFilter && matchesQuery;
    });

    this.page = 1;
    this.renderVirtualGrid();
  }

  changePageSize(newSize: number | string): void {
    this.setPageSize(newSize);
    this.page = 1;
    this.renderVirtualGrid();
  }

  paginate(action: string): void {
    const total = this.filteredEntries.length;
    const size = this.pageSize === 'all' ? total : (typeof this.pageSize === 'number' ? this.pageSize : parseInt(this.pageSize, 10) || 25);
    const maxPages = size > 0 ? Math.ceil(total / size) : 1;
    if (action === 'prev' && this.page > 1) this.page--;
    else if (action === 'next' && this.page < maxPages) this.page++;
    else if (action === 'first') this.page = 1;
    else if (action === 'last') this.page = maxPages;
    this.renderVirtualGrid();
  }

  saveModalTranslation(onSaved?: () => void): void {
    const inputTranslated = document.getElementById('modal-translated-input') as HTMLTextAreaElement | null;
    if (this.editingIndex === null || !inputTranslated) return;
    const entry = this.allEntries[this.editingIndex];
    if (!entry) return;

    entry.translated = inputTranslated.value;
    entry.status = entry.translated.trim() !== '' ? 'TRANSLATED' : 'UNTRANSLATED';
    this.renderVirtualGrid();
    this.closeModal();
    if (onSaved) onSaved();
  }

  openEditModal(index: number): void {
    const modal = document.getElementById('edit-modal');
    const inputTranslated = document.getElementById('modal-translated-input') as HTMLTextAreaElement | null;
    if (!modal) return;

    const entry = this.allEntries[index];
    if (!entry) return;

    this.editingIndex = index;
    const titleEl = document.getElementById('modal-string-id');
    const origEl = document.getElementById('modal-original-text');

    if (titleEl) titleEl.innerText = entry.id;
    if (origEl) origEl.innerText = entry.original;
    if (inputTranslated) {
      inputTranslated.value = entry.translated || '';
    }

    this.validateModalTokens();
    modal.classList.add('active');
    setTimeout(() => inputTranslated?.focus(), 50);
  }

  closeModal(): void {
    const modal = document.getElementById('edit-modal');
    if (modal) modal.classList.remove('active');
    this.editingIndex = null;
  }

  validateModalTokens(): void {
    const feedbackBox = document.getElementById('modal-token-feedback');
    const inputTranslated = document.getElementById('modal-translated-input') as HTMLTextAreaElement | null;
    if (!feedbackBox || this.editingIndex === null) return;

    const entry = this.allEntries[this.editingIndex];
    if (!entry || !inputTranslated) return;

    const val = inputTranslated.value;
    const result = this.validator.validateTokenSyntax(entry.original, val);

    if (result.valid) {
      feedbackBox.style.display = 'none';
      feedbackBox.className = 'modal-card-feedback';
    } else {
      feedbackBox.style.display = 'block';
      feedbackBox.className = 'modal-card-feedback error';
      feedbackBox.innerText = `⚠️ Inconsistencia de Tokens: Faltan [${result.missing.join(', ')}] o sobran [${result.extra.join(', ')}]`;
    }
  }

  async saveModalChanges(projectId: string, onSaved: () => void): Promise<void> {
    const inputTranslated = document.getElementById('modal-translated-input') as HTMLTextAreaElement | null;
    if (this.editingIndex === null || !inputTranslated) return;
    const entry = this.allEntries[this.editingIndex];
    if (!entry) return;

    const newTrans = inputTranslated.value;
    entry.translated = newTrans;
    entry.status = newTrans.trim() !== '' ? 'TRANSLATED' : 'UNTRANSLATED';

    try {
      await fetch('api/strings/save-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          str_key: entry.id,
          translated_value: newTrans,
          status: entry.status
        })
      });
    } catch (err) {
      console.warn('[TranslationEditor] Error al guardar en SQLite:', err);
    }

    this.closeModal();
    this.renderVirtualGrid();
    onSaved();
  }

  async suggestFromTm(): Promise<void> {
    const inputTranslated = document.getElementById('modal-translated-input') as HTMLTextAreaElement | null;
    if (this.editingIndex === null || !inputTranslated) return;
    const entry = this.allEntries[this.editingIndex];
    if (!entry) return;

    try {
      const res = await fetch('api/strings/suggest-tm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_text: entry.original })
      });
      const data = await res.json() as { success: boolean; data?: { suggestion?: { translated_text?: string } } };
      if (data.success && data.data?.suggestion?.translated_text) {
        inputTranslated.value = data.data.suggestion.translated_text;
        this.validateModalTokens();
        ToastNotification.success('Sugerencia de memoria de traducción cargada.');
      } else {
        ToastNotification.info('No se encontraron concordancias en la Memoria de Traducción.');
      }
    } catch (err) {
      console.warn('[TranslationEditor] Error en suggest-tm:', err);
      ToastNotification.error('Error al consultar la Memoria de Traducción.');
    }
  }

  async autoPropagateTm(projectId: string, onPropagated: () => void): Promise<void> {
    try {
      const res = await fetch('api/strings/auto-propagate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId })
      });
      const data = await res.json() as { success: boolean; data?: { result?: { propagated_count?: number } } };
      if (data.success && data.data?.result) {
        ToastNotification.success(`Auto-propagación completada: ${data.data.result.propagated_count || 0} cadenas actualizadas.`);
        onPropagated();
      }
    } catch (err) {
      console.warn('[TranslationEditor] Error en auto-propagate:', err);
      ToastNotification.error('Error durante la auto-propagación.');
    }
  }
}
