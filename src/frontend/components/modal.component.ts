export interface ModalOptions {
  id: string;
  title: string;
  content: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export class ModalComponent {
  private element: HTMLElement | null = null;

  constructor(private readonly options: ModalOptions) {}

  public open(): void {
    let existing = document.getElementById(this.options.id);
    if (!existing) {
      const wrapper = document.createElement('div');
      wrapper.id = this.options.id;
      wrapper.className = 'modal-overlay';
      wrapper.innerHTML = `
        <div class="modal-card">
          <div class="modal-card-header">
            <h3 class="modal-card-title">${this.options.title}</h3>
            <button class="btn-icon-reagle modal-close-btn">&times;</button>
          </div>
          <div class="modal-body">${this.options.content}</div>
          <div class="modal-card-btn-group modal-card-btn-group--right">
            <button class="btn-reagle modal-cancel-btn">${this.options.cancelLabel ?? 'Cancelar'}</button>
            <button class="btn-reagle btn-reagle-primary modal-confirm-btn">${this.options.confirmLabel ?? 'Aceptar'}</button>
          </div>
        </div>
      `;
      document.body.appendChild(wrapper);
      existing = wrapper;

      existing.querySelector('.modal-close-btn')?.addEventListener('click', () => this.close());
      existing.querySelector('.modal-cancel-btn')?.addEventListener('click', () => {
        this.options.onCancel?.();
        this.close();
      });
      existing.querySelector('.modal-confirm-btn')?.addEventListener('click', () => {
        this.options.onConfirm?.();
        this.close();
      });
    }

    this.element = existing;
    this.element.classList.add('active');
  }

  public close(): void {
    if (this.element) {
      this.element.classList.remove('active');
    }
  }
}
