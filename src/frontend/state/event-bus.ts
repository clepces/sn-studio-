/**
 * Bus central de eventos Pub/Sub desacoplado con tipado estricto (cero `any`).
 */

export type EventHandler<T = unknown> = (payload: T) => void;

export class TypedEventBus {
  private readonly listeners: Map<string, Set<EventHandler<never>>> = new Map();

  public on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const set = this.listeners.get(event)!;
    const castedHandler = handler as EventHandler<never>;
    set.add(castedHandler);

    return () => this.off(event, handler);
  }

  public off<T>(event: string, handler: EventHandler<T>): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(handler as EventHandler<never>);
  }

  public emit<T>(event: string, payload: T): void {
    const set = this.listeners.get(event);
    if (!set) return;

    for (const handler of set) {
      try {
        (handler as EventHandler<T>)(payload);
      } catch (err) {
        console.error(`[EventBus] Error al procesar evento "${event}":`, err);
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const GlobalEventBus = new TypedEventBus();
