export interface PaginationConfig {
  container: HTMLElement;
  totalItems: number;
  pageSize: number;
  currentPage?: number;
  onPageChange: (page: number) => void;
}

export class PaginationComponent {
  private currentPage: number;
  private totalPages: number;

  constructor(private readonly config: PaginationConfig) {
    this.currentPage = config.currentPage ?? 1;
    this.totalPages = Math.max(1, Math.ceil(config.totalItems / config.pageSize));
    this.render();
  }

  public update(totalItems: number, currentPage?: number): void {
    this.config.totalItems = totalItems;
    this.totalPages = Math.max(1, Math.ceil(totalItems / this.config.pageSize));
    if (currentPage !== undefined) {
      this.currentPage = Math.min(Math.max(1, currentPage), this.totalPages);
    } else if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    this.render();
  }

  public getCurrentPage(): number {
    return this.currentPage;
  }

  public setPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.render();
    this.config.onPageChange(this.currentPage);
  }

  private render(): void {
    const from = this.config.totalItems === 0 ? 0 : (this.currentPage - 1) * this.config.pageSize + 1;
    const to = Math.min(this.currentPage * this.config.pageSize, this.config.totalItems);

    this.config.container.innerHTML = `
      <div class="nexus-pagination-bar">
        <div class="nexus-pagination-info">
          Mostrando <strong>${from}</strong>-<strong>${to}</strong> de <strong>${this.config.totalItems}</strong>
        </div>
        <div class="nexus-pagination-controls">
          <button class="nexus-page-btn" id="pg-first" ${this.currentPage <= 1 ? 'disabled' : ''}>&laquo;</button>
          <button class="nexus-page-btn" id="pg-prev" ${this.currentPage <= 1 ? 'disabled' : ''}>&lsaquo;</button>
          <span class="nexus-page-current">Pág. ${this.currentPage} / ${this.totalPages}</span>
          <button class="nexus-page-btn" id="pg-next" ${this.currentPage >= this.totalPages ? 'disabled' : ''}>&rsaquo;</button>
          <button class="nexus-page-btn" id="pg-last" ${this.currentPage >= this.totalPages ? 'disabled' : ''}>&raquo;</button>
        </div>
      </div>
    `;

    this.config.container.querySelector('#pg-first')?.addEventListener('click', () => this.setPage(1));
    this.config.container.querySelector('#pg-prev')?.addEventListener('click', () => this.setPage(this.currentPage - 1));
    this.config.container.querySelector('#pg-next')?.addEventListener('click', () => this.setPage(this.currentPage + 1));
    this.config.container.querySelector('#pg-last')?.addEventListener('click', () => this.setPage(this.totalPages));
  }
}
