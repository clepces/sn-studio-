export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string;
}

export class TabCarouselComponent {
  private activeTabId: string;

  constructor(
    private readonly container: HTMLElement,
    private readonly tabs: readonly TabItem[],
    initialTabId: string,
    private readonly onSelect: (tabId: string) => void
  ) {
    this.activeTabId = initialTabId;
    this.render();
  }

  public setActiveTab(tabId: string): void {
    this.activeTabId = tabId;
    const buttons = this.container.querySelectorAll('.tab-carousel-btn');
    buttons.forEach((btn) => {
      const el = btn as HTMLElement;
      if (el.dataset.tabId === tabId) {
        el.classList.add('active');
        el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        el.classList.remove('active');
      }
    });
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="tab-carousel-wrapper">
        <button class="tab-carousel-arrow left" aria-label="Desplazar pestañas a la izquierda">&lsaquo;</button>
        <div class="tab-carousel-track">
          ${this.tabs
            .map(
              (tab) => `
            <button class="tab-carousel-btn ${tab.id === this.activeTabId ? 'active' : ''}" data-tab-id="${tab.id}">
              ${tab.icon ? `<span class="tab-icon">${tab.icon}</span>` : ''}
              <span class="tab-label">${tab.label}</span>
              ${tab.badge ? `<span class="metric-badge-pill">${tab.badge}</span>` : ''}
            </button>
          `
            )
            .join('')}
        </div>
        <button class="tab-carousel-arrow right" aria-label="Desplazar pestañas a la derecha">&rsaquo;</button>
      </div>
    `;

    const track = this.container.querySelector('.tab-carousel-track') as HTMLElement;
    this.container.querySelector('.tab-carousel-arrow.left')?.addEventListener('click', () => {
      track.scrollBy({ left: -180, behavior: 'smooth' });
    });
    this.container.querySelector('.tab-carousel-arrow.right')?.addEventListener('click', () => {
      track.scrollBy({ left: 180, behavior: 'smooth' });
    });

    this.container.querySelectorAll('.tab-carousel-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.tabId;
        if (id) {
          this.setActiveTab(id);
          this.onSelect(id);
        }
      });
    });
  }
}
