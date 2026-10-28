/**
 * Solaris Nexus Studio - UI Components Kit (TypeScript Enterprise)
 * Reusable Components: EmptyState, Pagination, TabCarousel
 * Clepces org. ltd
 */

export interface EmptyStateOptions {
  title: string;
  description: string;
  icon?: string;
  actionText?: string | null;
  actionCallback?: string | null;
}

export function renderEmptyState(options: EmptyStateOptions): string {
  const { title, description, icon = 'search', actionText = null, actionCallback = null } = options;
  let iconSvg = '';
  if (icon === 'search') {
    iconSvg = `<svg viewBox="0 0 24 24" class="nexus-empty-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
  } else if (icon === 'folder') {
    iconSvg = `<svg viewBox="0 0 24 24" class="nexus-empty-icon"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
  } else if (icon === 'inbox') {
    iconSvg = `<svg viewBox="0 0 24 24" class="nexus-empty-icon"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>`;
  } else {
    iconSvg = `<div class="nexus-empty-glyph">${icon}</div>`;
  }

  const actionBtn = actionText && actionCallback
    ? `<button class="btn-row-action nexus-empty-btn" onclick="${actionCallback}">
         ${actionText}
       </button>`
    : '';

  return `
    <div class="nexus-empty-state">
      <div class="nexus-empty-icon-wrap">${iconSvg}</div>
      <div class="nexus-empty-title">${title}</div>
      <div class="nexus-empty-desc">${description}</div>
      ${actionBtn}
    </div>
  `;
}

export interface PaginationOptions {
  container: HTMLElement | string;
  totalItems: number;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number, slice: { start: number; end: number }) => void;
  idPrefix?: string;
}

export class Pagination {
  public container: HTMLElement | null;
  public totalItems: number;
  public itemsPerPage: number;
  public currentPage: number;
  public onPageChange?: (page: number, slice: { start: number; end: number }) => void;
  public idPrefix: string;

  constructor(options: PaginationOptions) {
    this.container = typeof options.container === 'string'
      ? document.getElementById(options.container)
      : options.container;
    this.totalItems = options.totalItems;
    this.itemsPerPage = options.itemsPerPage || 10;
    this.currentPage = options.currentPage || 1;
    this.onPageChange = options.onPageChange;
    this.idPrefix = options.idPrefix || 'pg';
  }

  public setTotal(total: number, resetPage = false): void {
    this.totalItems = total;
    if (resetPage) this.currentPage = 1;
    const totalPages = this.getTotalPages();
    if (this.currentPage > totalPages) this.currentPage = Math.max(1, totalPages);
    this.render();
  }

  public setPage(page: number): void {
    const totalPages = this.getTotalPages();
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    if (page === this.currentPage) return;
    this.currentPage = page;
    this.render();
    if (typeof this.onPageChange === 'function') {
      this.onPageChange(this.currentPage, this.getSliceRange());
    }
  }

  public getTotalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
  }

  public getSliceRange(): { start: number; end: number } {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = Math.min(this.totalItems, start + this.itemsPerPage);
    return { start, end };
  }

  public render(): void {
    if (!this.container) return;
    const totalPages = this.getTotalPages();

    if (this.totalItems <= this.itemsPerPage) {
      this.container.innerHTML = `
        <div class="nexus-pagination-bar single-page">
          <span class="nexus-pagination-info">Mostrando ${this.totalItems} de ${this.totalItems} registros</span>
        </div>
      `;
      return;
    }

    const { start, end } = this.getSliceRange();
    const infoText = `Mostrando ${start + 1} - ${end} de ${this.totalItems}`;

    let pagesHtml = '';
    const range = 2;
    let prevPage = 0;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.currentPage - range && i <= this.currentPage + range)) {
        if (prevPage && i - prevPage > 1) {
          pagesHtml += `<span class="nexus-pagination-ellipsis">…</span>`;
        }
        const isActive = i === this.currentPage ? 'active' : '';
        pagesHtml += `<button type="button" class="nexus-pagination-page ${isActive}" data-page="${i}">${i}</button>`;
        prevPage = i;
      }
    }

    this.container.innerHTML = `
      <div class="nexus-pagination-bar">
        <span class="nexus-pagination-info">${infoText}</span>
        <div class="nexus-pagination-controls">
          <button type="button" class="nexus-pagination-btn prev" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>Anterior</span>
          </button>
          <div class="nexus-pagination-pages">
            ${pagesHtml}
          </div>
          <button type="button" class="nexus-pagination-btn next" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
            <span>Siguiente</span>
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    `;

    this.container.querySelectorAll<HTMLElement>('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = parseInt(el.getAttribute('data-page') || '', 10);
        if (!isNaN(targetPage)) {
          this.setPage(targetPage);
        }
      });
    });
  }
}

export class TabCarousel {
  public element: HTMLElement | null;
  public track: HTMLElement | null;
  public prevBtn: HTMLButtonElement | null;
  public nextBtn: HTMLButtonElement | null;

  constructor(elementOrSelector: HTMLElement | string) {
    this.element = typeof elementOrSelector === 'string'
      ? document.querySelector<HTMLElement>(elementOrSelector)
      : elementOrSelector;
    if (!this.element) {
      this.track = null;
      this.prevBtn = null;
      this.nextBtn = null;
      return;
    }
    this.track = this.element.querySelector<HTMLElement>('.tab-carousel-scroll') ||
                 this.element.querySelector<HTMLElement>('.reagle-segmented-tabs') ||
                 this.element.querySelector<HTMLElement>('.tabs-track') ||
                 this.element;
    this.prevBtn = this.element.querySelector<HTMLButtonElement>('.tab-carousel-nav-btn.prev') ||
                   this.element.querySelector<HTMLButtonElement>('.carousel-nav-btn.prev');
    this.nextBtn = this.element.querySelector<HTMLButtonElement>('.tab-carousel-nav-btn.next') ||
                   this.element.querySelector<HTMLButtonElement>('.carousel-nav-btn.next');
    this.init();
  }

  public init(): void {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.scroll(-180);
      });
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.scroll(180);
      });
    }
    const track = this.track;
    if (track) {
      track.addEventListener('wheel', (e: WheelEvent) => {
        if (e.deltaY !== 0 || e.deltaX !== 0) {
          e.preventDefault();
          track.scrollLeft += (e.deltaY || e.deltaX);
          this.updateArrows();
        }
      }, { passive: false });

      track.addEventListener('scroll', () => this.updateArrows());

      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => this.updateArrows());
        ro.observe(track);
        if (this.element) ro.observe(this.element);
      } else if (typeof window !== 'undefined') {
        window.addEventListener('resize', () => this.updateArrows());
      }
    }

    window.addEventListener('solaris:sidebar-toggled', () => {
      setTimeout(() => this.updateArrows(), 260);
    });

    this.updateArrows();
  }

  public scroll(offset: number): void {
    if (!this.track) return;
    this.track.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(() => this.updateArrows(), 240);
  }

  public updateArrows(): void {
    if (!this.track) return;
    const scrollWidth = this.track.scrollWidth;
    const clientWidth = this.track.clientWidth;
    const hasOverflow = scrollWidth > clientWidth + 3;

    if (this.element) {
      this.element.classList.toggle('has-overflow', hasOverflow);
    }

    if (!hasOverflow) {
      if (this.prevBtn) {
        this.prevBtn.disabled = true;
        this.prevBtn.style.opacity = '0.2';
        this.prevBtn.style.pointerEvents = 'none';
      }
      if (this.nextBtn) {
        this.nextBtn.disabled = true;
        this.nextBtn.style.opacity = '0.2';
        this.nextBtn.style.pointerEvents = 'none';
      }
      return;
    }

    const atStart = this.track.scrollLeft <= 2;
    const atEnd = this.track.scrollLeft + clientWidth >= scrollWidth - 3;

    if (this.prevBtn) {
      this.prevBtn.disabled = atStart;
      this.prevBtn.style.opacity = atStart ? '0.25' : '1';
      this.prevBtn.style.pointerEvents = atStart ? 'none' : 'auto';
    }
    if (this.nextBtn) {
      this.nextBtn.disabled = atEnd;
      this.nextBtn.style.opacity = atEnd ? '0.25' : '1';
      this.nextBtn.style.pointerEvents = atEnd ? 'none' : 'auto';
    }
  }

  public static initAll(): void {
    document.querySelectorAll<HTMLElement>('.tab-carousel-wrapper').forEach(wrapper => {
      const w = wrapper as any;
      if (!w.__tabCarousel) {
        w.__tabCarousel = new TabCarousel(wrapper);
      } else {
        w.__tabCarousel.updateArrows();
      }
    });
  }
}

export const GlobalNexusComponents = {
  renderEmptyState,
  Pagination,
  TabCarousel
};

declare global {
  interface Window {
    NexusComponents: typeof GlobalNexusComponents;
  }
}

if (typeof window !== 'undefined') {
  window.NexusComponents = GlobalNexusComponents;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TabCarousel.initAll());
  } else {
    setTimeout(() => TabCarousel.initAll(), 100);
  }
}
