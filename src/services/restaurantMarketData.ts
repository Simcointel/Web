/**
 * Restaurant Market Data Loader
 * Joins Data-repo sources safely; every fetch is optional and has a neutral fallback
 */

import { fetchProfitMargins, fetchRetailData, fetchMacroPhases } from "./dataRepo";
import { getRestaurantRetailInfo } from "./restaurantRetailInfo";
import type { RestaurantMenuItem } from "./restaurantMenu";

export interface RestaurantMarketData {
  vwapByName: Map<string, number>;
  resourceIdByName: Map<string, number>;
  saturationByResourceId: Map<number, number>;
  marketVolumeByResourceId: Map<number, number>;
  phase: string | null;
  pricesLoadedAt: string | null;
  retailLoadedAt: string | null;
  sources: {
    margins: boolean;
    retail: boolean;
    phase: boolean;
    snapshot: boolean;
  };
}

function latestVolumePerResource(data: Awaited<ReturnType<typeof getRestaurantRetailInfo>>): Map<number, number> {
  const volumes = new Map<number, number>();
  const menuResourceIds = new Set([
    117, 119, 121, 122, 123, 124, 125, 126, 129, 130, 131, 132, 134, 142, 143,
  ]);

  if (!Array.isArray(data)) return volumes;

  for (const entry of data) {
    const dbLetter = entry.dbLetter;
    if (!menuResourceIds.has(dbLetter)) continue;
    if (!Array.isArray(entry.retailData) || entry.retailData.length === 0) continue;

    // Take the latest retailData point by date
    const latest = [...entry.retailData].sort((a, b) => a.date.localeCompare(b.date)).pop();
    if (!latest || typeof latest.amountSoldRestaurant !== "number") continue;

    const existing = volumes.get(dbLetter) ?? 0;
    volumes.set(dbLetter, existing + latest.amountSoldRestaurant);
  }
  return volumes;
}

function saturationFromRetail(retail: Awaited<ReturnType<typeof fetchRetailData>>): Map<number, number> {
  const sat = new Map<number, number>();
  for (const [key, value] of Object.entries(retail.retail ?? {})) {
    const id = Number(key);
    const s = (value as { saturation?: number }).saturation;
    if (typeof s === "number" && Number.isFinite(s)) sat.set(id, s);
  }
  return sat;
}

export async function loadRestaurantMarketData(): Promise<RestaurantMarketData> {
  const results = await Promise.allSettled([
    fetchProfitMargins(0),
    fetchRetailData(0),
    fetchMacroPhases(0),
    getRestaurantRetailInfo(),
  ]);

  const [marginsRes, retailRes, macroRes, snapshotRes] = results;

  const vwapByName = new Map<string, number>();
  const resourceIdByName = new Map<string, number>();

  const menuItems: RestaurantMenuItem[] = (await import("./restaurantMenu")).RESTAURANT_MENU_ITEMS;

  let pricesLoadedAt: string | null = null;
  let sources = { margins: false, retail: false, phase: false, snapshot: false };

  if (marginsRes.status === "fulfilled" && marginsRes.value.resources.length > 0) {
    for (const r of marginsRes.value.resources) {
      if (typeof r.outputVwap === "number" && r.outputVwap > 0) {
        vwapByName.set(r.name, r.outputVwap);
        if (typeof r.id === "number") resourceIdByName.set(r.name, r.id);
      }
    }
    pricesLoadedAt = marginsRes.value.ts ?? new Date().toISOString();
    sources.margins = true;
  }

  let saturationByResourceId = new Map<number, number>();
  let retailLoadedAt: string | null = null;
  if (retailRes.status === "fulfilled") {
    saturationByResourceId = saturationFromRetail(retailRes.value);
    retailLoadedAt = new Date().toISOString();
    sources.retail = true;
  }

  let phase: string | null = null;
  if (macroRes.status === "fulfilled" && macroRes.value.phases.length > 0) {
    phase = macroRes.value.phases[0].phase ?? null;
    sources.phase = true;
  }

  let marketVolumeByResourceId = new Map<number, number>();
  if (snapshotRes.status === "fulfilled" && Array.isArray(snapshotRes.value) && snapshotRes.value.length > 0) {
    const volumes = latestVolumePerResource(snapshotRes.value);
    if (volumes.size > 0) {
      marketVolumeByResourceId = volumes;
      sources.snapshot = true;
    }
  }

  return {
    vwapByName,
    resourceIdByName,
    saturationByResourceId,
    marketVolumeByResourceId,
    phase,
    pricesLoadedAt,
    retailLoadedAt,
    sources,
  };
}

export function qualityPremiumCost(vwap: number, quality: number, premiumPct: number): number {
  if (!Number.isFinite(vwap) || vwap <= 0) return 0;
  const q = Math.max(0, Math.min(12, Math.floor(Number.isFinite(quality) ? quality : 0)));
  const pct = Math.max(0, Number.isFinite(premiumPct) ? premiumPct : 1);
  return vwap * Math.pow(1 + pct / 100, q);
}

export function normalizeMarketData(
  margins: Awaited<ReturnType<typeof fetchProfitMargins>>,
  retail: Awaited<ReturnType<typeof fetchRetailData>>,
  macro: Awaited<ReturnType<typeof fetchMacroPhases>>,
  snapshot: Awaited<ReturnType<typeof getRestaurantRetailInfo>>
): RestaurantMarketData {
  const vwapByName = new Map<string, number>();
  const resourceIdByName = new Map<string, number>();

  if (margins?.resources) {
    for (const r of margins.resources) {
      if (typeof r.outputVwap === "number" && r.outputVwap > 0) {
        vwapByName.set(r.name, r.outputVwap);
        if (typeof r.id === "number") resourceIdByName.set(r.name, r.id);
      }
    }
  }

  return {
    vwapByName,
    resourceIdByName,
    saturationByResourceId: saturationFromRetail(retail),
    marketVolumeByResourceId: latestVolumePerResource(snapshot),
    phase: macro?.phases?.[0]?.phase ?? null,
    pricesLoadedAt: margins?.ts ?? null,
    retailLoadedAt: new Date().toISOString(),
    sources: {
      margins: vwapByName.size > 0,
      retail: retail?.retail ? Object.keys(retail.retail).length > 0 : false,
      phase: !!macro?.phases?.length,
      snapshot: latestVolumePerResource(snapshot).size > 0,
    },
  };
}