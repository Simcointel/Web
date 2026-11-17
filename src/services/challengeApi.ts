import { fetchPublicApi } from "./dataRepo";

export interface ChallengeInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "ended";
  realmId: number;
  objective: string;
  startingCash: number;
  startingSlots: number;
  targetTrucks: number;  // The goal: how many trucks to produce
  startingBuildings: Array<{
    type: string;
    level: number;
    buildingId: string;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  companyId: number;
  companyName: string;
  companyLogo?: string;
  level: number;
  trucksProduced: number;
  trucksSold: number;
  cash: number;
  score: number;
  buildingCount: number;
}

export interface ChallengeLeaderboard {
  challengeId: string;
  challengeName: string;
  entries: LeaderboardEntry[];
  updatedAt: string;
  totalParticipants: number;
}

export interface PlayerBuilding {
  id: number;
  kind: string;
  level: number;
  size: number;
  slot?: number;
  busy?: Record<string, number>;
}

export interface PlayerCompany {
  id: number;
  username: string;
  name: string;
  logo?: string;
  level: number;
  rank: number;
  online: string;
  productionModifier: number;
  salesModifier: number;
  extraBuildingSlots: number;
  value: number;
  bondsPayable: number;
  cash: number;
  workers: number;
  happiness: number;
  recreationBonus: number;
  administrationOverhead: number;
  governmentOrderTierIndex: number;
  buildings: PlayerBuilding[];
  storage: {
    capacity: number;
    used: number;
    items: Array<{
      resourceId: number;
      resourceName: string;
      quality: number;
      amount: number;
    }>;
  };
  contracts: Array<{
    id: number;
    type: "sale" | "purchase";
    resourceId: number;
    resourceName: string;
    quality: number;
    amount: number;
    price: number;
    remaining: number;
  }>;
}

export interface ChallengeApiError {
  requiresAuth: boolean;
  message: string;
  endpoint: string;
}

function isAuthError(data: unknown): data is { error: string; message?: string } {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return d.ok === false && (typeof d.error === "string" && d.error.includes("Unexpected token"));
}

async function fetchWithAuthHandling<T>(
  path: string,
  endpointName: string
): Promise<{ data: T | null; error: ChallengeApiError | null }> {
  try {
    const result = await fetchPublicApi<T>(path);
    
    // Check if we got an auth error (login page HTML instead of JSON)
    if (isAuthError(result)) {
      return {
        data: null,
        error: {
          requiresAuth: true,
          message: `This endpoint requires authentication. Log in to SimCompanies to access ${endpointName}.`,
          endpoint: path,
        },
      };
    }
    
    return { data: result, error: null };
  } catch (err) {
    return {
      data: null,
      error: {
        requiresAuth: false,
        message: err instanceof Error ? err.message : "Unknown error",
        endpoint: path,
      },
    };
  }
}

export async function fetchChallengeCurrent(): Promise<{
  data: ChallengeInfo | null;
  error: ChallengeApiError | null;
}> {
  return fetchWithAuthHandling<ChallengeInfo>(
    "/public/simcompanies/challenges/current",
    "current challenge info"
  );
}

export async function fetchChallengeLeaderboard(challengeId: string): Promise<{
  data: ChallengeLeaderboard | null;
  error: ChallengeApiError | null;
}> {
  return fetchWithAuthHandling<ChallengeLeaderboard>(
    `/public/simcompanies/challenges/${encodeURIComponent(challengeId)}/leaderboard`,
    "challenge leaderboard"
  );
}

export async function fetchPlayerCompany(companyId: string | number, realm: 0 | 1 | 2 = 0): Promise<{
  data: PlayerCompany | null;
  error: ChallengeApiError | null;
}> {
  return fetchWithAuthHandling<PlayerCompany>(
    `/public/simcompanies/company/${encodeURIComponent(String(companyId))}?realm=${realm}`,
    "player company data"
  );
}

// Helper to get player company ID from localStorage or config
export function getStoredCompanyId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("simco_company_id") || localStorage.getItem("simco_challenge_company_id");
}

export function setStoredCompanyId(companyId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("simco_challenge_company_id", companyId);
}

// Mock data for development/testing when APIs require auth
export const MOCK_CHALLENGE_INFO: ChallengeInfo = {
  id: "bankrupt-car-manufacturer",
  name: "Bankrupt Car Manufacturer",
  slug: "bankrupt-car-manufacturer",
  description: "Turn around a failing car company and produce maximum trucks in minimum time",
  startDate: "2024-01-01T00:00:00Z",
  endDate: "2025-12-31T23:59:59Z",
  status: "active",
  realmId: 2,
  objective: "Produce and sell 1,000 trucks while maintaining profit",
  startingCash: 1_300_000,
  startingSlots: 9,
  targetTrucks: 1000,
  startingBuildings: [
    { type: "Car Factory", level: 2, buildingId: "1" },
    { type: "Car Dealership", level: 2, buildingId: "2" },
    { type: "Propulsion Factory", level: 3, buildingId: "D" },
    { type: "Power Plant", level: 1, buildingId: "E" },
    { type: "Fashion Factory", level: 1, buildingId: "T" },
    { type: "Refinery", level: 1, buildingId: "R" },
  ],
};

export const MOCK_LEADERBOARD: ChallengeLeaderboard = {
  challengeId: "bankrupt-car-manufacturer",
  challengeName: "Bankrupt Car Manufacturer",
  entries: [],
  updatedAt: new Date().toISOString(),
  totalParticipants: 0,
};

export function getChallengeInfoWithFallback(): Promise<{
  data: ChallengeInfo;
  error: ChallengeApiError | null;
  isMock: boolean;
}> {
  return fetchChallengeCurrent().then(({ data, error }) => {
    if (data) return { data, error: null, isMock: false };
    return { data: MOCK_CHALLENGE_INFO, error, isMock: true };
  });
}

export function getLeaderboardWithFallback(challengeId: string): Promise<{
  data: ChallengeLeaderboard;
  error: ChallengeApiError | null;
  isMock: boolean;
}> {
  return fetchChallengeLeaderboard(challengeId).then(({ data, error }) => {
    if (data) return { data, error: null, isMock: false };
    return { data: MOCK_LEADERBOARD, error, isMock: true };
  });
}