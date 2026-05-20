import { useState, useEffect } from "react";
import { sseManager } from "../services/sse";

export function useSseConnected() {
  const [connected, setConnected] = useState(sseManager.connected);
  useEffect(() => {
    sseManager.connect();
    const id = setInterval(() => setConnected(sseManager.connected), 2000);
    return () => clearInterval(id);
  }, []);
  return connected;
}

export function useSseEvent<T = Record<string, unknown>>(type: string, handler: (data: T) => void) {
  useEffect(() => {
    return sseManager.on(type, (ev) => handler(ev.data as T));
  }, [type]);
}
