import { apiUrl } from "../config";

type SseListener = (event: { type: string; data: Record<string, unknown>; channel: string }) => void;

class SseManager {
  private eventSource: EventSource | null = null;
  private handlers = new Map<string, Set<SseListener>>();
  private _connected = false;

  get connected() { return this._connected; }

  connect(_channels?: string): void {
    if (this.eventSource) return;
    this._connected = false;
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
    this._connected = false;
  }

  on(type: string, handler: SseListener): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  private notify(type: string, data: unknown) {
    this.handlers.get(type)?.forEach((h) => {
      try { h({ type, data: data as Record<string, unknown>, channel: (data as Record<string, unknown>)?.ch as string ?? "" }); }
      catch { /**/ }
    });
  }
}

export const sseManager = new SseManager();
