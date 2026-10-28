export interface EmptyStateOptions {
  icon?: string;
  title: string;
  message: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export class EmptyStateComponent {
  public static render(options: EmptyStateOptions): string {
    const iconSvg = options.icon ?? `
      <svg viewBox="0 0 24 24" width="40" height="40" stroke="var(--text-muted)" fill="none" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
    `;

    return `
      <div class="nexus-empty-state">
        <div class="nexus-empty-state-icon">${iconSvg}</div>
        <div class="nexus-empty-state-title">${options.title}</div>
        <div class="nexus-empty-state-desc">${options.message}</div>
        ${options.actionButton ? `
          <button class="btn-reagle btn-reagle-primary nexus-empty-state-action" id="btn-empty-action">
            ${options.actionButton.label}
          </button>
        ` : ''}
      </div>
    `;
  }
}
