import { apiUrl } from "../config";

const API = apiUrl("/public/widget");

export interface WidgetScores {
  eh: number;
  ms: number;
  st: number;
  ip: number;
  sr: number;
}

export interface WidgetHealth {
  scores: WidgetScores;
  regime: { na: string; sc: number };
  alerts: number;
  sectors: number;
}

export async function fetchWidget<T>(type: string, realm = 0, compact = true): Promise<T> {
  const res = await fetch(`${API}/${type}?realm=${realm}&compact=${compact ? "1" : "0"}`);
  const body = await res.json();
  if (!body.ok && !body.w) throw new Error(body.error ?? "Widget fetch failed");
  return compact ? body as T : body.data as T;
}

export function createWidgetUrl(type: string, realm = 0, params?: Record<string, string>): string {
  const q = new URLSearchParams({ realm: String(realm), ...params });
  return `${API}/${type}?${q}`;
}
