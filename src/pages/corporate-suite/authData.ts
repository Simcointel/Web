import type { AuthDataPayload } from "../../types/api";
import type { SuiteStateV6 } from "./types";

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

export function applyAuthData(
  prev: SuiteStateV6,
  payload: AuthDataPayload,
  now: Date = new Date(),
): SuiteStateV6 {
  const c = payload.authCompany ?? {};
  const settings = { ...prev.settings };

  const productionModifier = num(c.productionModifier);
  if (productionModifier !== undefined) settings.prodBonus = 12 + productionModifier;
  const salesModifier = num(c.salesModifier);
  if (salesModifier !== undefined) settings.profileSalesBonus = salesModifier;
  const money = num(c.money);
  if (money !== undefined) settings.cash = money;

  return {
    ...prev,
    companyId: c.companyId != null ? String(c.companyId) : prev.companyId,
    companyName: c.company || prev.companyName,
    companyLogo: c.logo || prev.companyLogo,
    companyLevel: num(c.level) ?? prev.companyLevel,
    companyRank: num(c.rank) ?? prev.companyRank,
    extraSlots: num(c.extraBuildingSlots) ?? prev.extraSlots,
    settings,
    lastSynced: now.toLocaleTimeString(),
  };
}
