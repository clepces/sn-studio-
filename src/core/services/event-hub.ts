
import { Logger } from '../services/logger';

type EventCallback = (payload?: any) => void;

class EventHub {
  private events: Map<string, EventCallback[]> = new Map();

  public subscribe(eventName: string, callback: EventCallback): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.push(callback);
    Logger.debug(`EventHub: Subscribed to ${eventName}`);
  }

  public publish(eventName: string, payload?: any): void {
    if (!this.events.has(eventName)) return;
    Logger.info(`EventHub: Publishing ${eventName}`, payload);
    this.events.get(eventName)!.forEach(callback => callback(payload));
  }
}

export const GlobalEventHub = new EventHub();
