import { apiUrl } from "../config";

type SseListener = (event: { type: string; data: Record<string, unknown>; channel: string }) => void;

class SseManager {
  private eventSource: EventSource | null = null;
  private handlers = new Map<string, Set<SseListener>>();
  private _connected = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  get connected() { return this._connected; }

  connect(_channels?: string): void {
    if (this.pollTimer) return;
    this._connected = true;
    this.pollTimer = setInterval(() => {
      this.notify("alert_generated", {});
      this.notify("pipeline_forecast_complete", {});
      this.notify("forecast_bubble_warning", {});
      this.notify("forecast_crash_warning", {});
      this.notify("forecast_major_reversal", {});
    }, 30000);
  }

  disconnect(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
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
