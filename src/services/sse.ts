type SseListener = (event: { type: string; data: Record<string, unknown>; channel: string }) => void;

class SseManager {
  private eventSource: EventSource | null = null;
  private handlers = new Map<string, Set<SseListener>>();
  private _connected = false;

  get connected() { return this._connected; }

  connect(channels = "dashboard,alerts,events,regimes,sectors,operational"): void {
    if (this.eventSource) this.disconnect();
    this.eventSource = new EventSource(`${window.location.origin}/api/sse?channels=${channels}`);

    this.eventSource.onopen = () => { this._connected = true; };
    this.eventSource.onerror = () => {
      this._connected = false;
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        setTimeout(() => this.connect(channels), 3000);
      }
    };

    this.eventSource.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        const type = ev.type.replace(/_/g, ":");
        this.notify(type, payload);
        if (payload.ch) this.notify(`ch:${payload.ch}`, payload);
      } catch { /**/ }
    };
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
