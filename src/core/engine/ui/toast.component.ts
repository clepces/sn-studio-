/**
 * Solaris Nexus Studio - Toast Notification Component
 * Non-blocking, modern UI notification replacement for window.alert
 */

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  title?: string;
}

export class ToastComponent {
  private static container: HTMLElement | null = null;

  private static ensureContainer(): HTMLElement {
    if (!this.container || !document.body.contains(this.container)) {
      let existing = document.getElementById('nexus-toast-container');
      if (!existing) {
        existing = document.createElement('div');
        existing.id = 'nexus-toast-container';
        existing.setAttribute('aria-live', 'polite');
        existing.setAttribute('role', 'region');
        existing.setAttribute('aria-label', 'Notificaciones del sistema');
        Object.assign(existing.style, {
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: '99999',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          width: 'calc(100% - 40px)',
          pointerEvents: 'none'
        });
        document.body.appendChild(existing);
      }
      this.container = existing;
    }
    return this.container;
  }

  public static show(options: ToastOptions | string, type: ToastType = 'info'): void {
    if (typeof window === 'undefined') return;

    const config: ToastOptions = typeof options === 'string'
      ? { message: options, type, duration: 4000 }
      : { duration: 4000, type: 'info', ...options };

    const container = this.ensureContainer();

    const toast = document.createElement('div');
    toast.className = `nexus-toast nexus-toast-${config.type}`;

    const colorMap: Record<ToastType, { bg: string; border: string; text: string; icon: string; title: string }> = {
      info: {
        bg: '#eff6ff',
        border: '#93c5fd',
        text: '#1e40af',
        icon: 'ℹ️',
        title: config.title || 'Información'
      },
      success: {
        bg: '#ecfdf5',
        border: '#a7f3d0',
        text: '#065f46',
        icon: '✓',
        title: config.title || 'Operación Exitosa'
      },
      warning: {
        bg: '#fffbeb',
        border: '#fde68a',
        text: '#92400e',
        icon: '⚠️',
        title: config.title || 'Advertencia'
      },
      error: {
        bg: '#fef2f2',
        border: '#fecaca',
        text: '#991b1b',
        icon: '✕',
        title: config.title || 'Error del Sistema'
      }
    };

    const c = colorMap[config.type || 'info'];

    Object.assign(toast.style, {
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      borderRadius: '10px',
      padding: '12px 16px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      pointerEvents: 'auto',
      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      opacity: '0',
      transform: 'translateY(-12px) scale(0.96)',
      fontSize: '0.85rem',
      lineHeight: '1.4'
    });

    toast.innerHTML = `
      <div style="font-size: 1.1rem; line-height: 1; flex-shrink: 0; margin-top: 1px;">${c.icon}</div>
      <div style="flex-grow: 1;">
        <div style="font-weight: 700; margin-bottom: 2px;">${c.title}</div>
        <div style="opacity: 0.95;">${config.message}</div>
      </div>
      <button type="button" aria-label="Cerrar notificación" style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: inherit; opacity: 0.6; line-height: 1; padding: 0; margin-left: 4px;">&times;</button>
    `;

    const closeBtn = toast.querySelector('button');
    const dismiss = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-12px) scale(0.96)';
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 250);
    };

    if (closeBtn) {
      closeBtn.addEventListener('click', dismiss);
    }

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0) scale(1)';
    });

    if (config.duration && config.duration > 0) {
      setTimeout(dismiss, config.duration);
    }
  }

  public static info(message: string, duration?: number): void {
    this.show({ message, type: 'info', duration });
  }

  public static success(message: string, duration?: number): void {
    this.show({ message, type: 'success', duration });
  }

  public static warning(message: string, duration?: number): void {
    this.show({ message, type: 'warning', duration });
  }

  public static error(message: string, duration?: number): void {
    this.show({ message, type: 'error', duration });
  }
}

export const ToastNotification = ToastComponent;
