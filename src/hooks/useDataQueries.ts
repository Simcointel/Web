import { useCallback } from 'react';
import { useDataRepo, useDataRepoPoll } from './useDataRepo';
import * as dataRepo from '../services/dataRepo';
import { useSharedRealm } from './useSharedRealm';

/**
 * Hook for fetching dashboard state with standard 60s polling
 */
export function useDashboardState() {
  const [realm] = useSharedRealm();
  return useDataRepoPoll(
    useCallback(() => dataRepo.fetchDashboardState(realm), [realm]),
    60000,
    [realm]
  );
}

/**
 * Hook for fetching macro latest with standard 60s polling
 */
export function useMacroLatest() {
  const [realm] = useSharedRealm();
  return useDataRepoPoll(
    useCallback(() => dataRepo.fetchMacroLatest(realm), [realm]),
    60000,
    [realm]
  );
}

/**
 * Hook for fetching macro history with standard 120s polling
 */
export function useMacroHistory(limit = 120) {
  const [realm] = useSharedRealm();
  return useDataRepoPoll(
    useCallback(() => dataRepo.fetchMacroHistory(realm, limit), [realm, limit]),
    120000,
    [realm, limit]
  );
}

/**
 * Hook for fetching macro indexes with standard 120s polling
 */
export function useMacroIndexes(limit = 200) {
  const [realm] = useSharedRealm();
  return useDataRepoPoll(
    useCallback(() => dataRepo.fetchMacroIndexes(realm, limit), [realm, limit]),
    120000,
    [realm, limit]
  );
}

/**
 * Hook for fetching macro inflation with standard 120s polling
 */
export function useMacroInflation(limit = 200) {
  const [realm] = useSharedRealm();
  return useDataRepoPoll(
    useCallback(() => dataRepo.fetchMacroInflation(realm, limit), [realm, limit]),
    120000,
    [realm, limit]
  );
}

/**
 * Hook for fetching macro phases with standard 120s polling
 */
export function useMacroPhases() {
  const [realm] = useSharedRealm();
  return useDataRepoPoll(
    useCallback(() => dataRepo.fetchMacroPhases(realm), [realm]),
    120000,
    [realm]
  );
}

/**
 * Hook for fetching profit margins with configurable interval
 */
export function useProfitMargins(intervalMs = 60000) {
  const [realm] = useSharedRealm();
  return useDataRepoPoll(
    useCallback(() => dataRepo.fetchProfitMargins(realm), [realm]),
    intervalMs,
    [realm]
  );
}

/**
 * Hook for fetching retail data with standard 120s polling
 */
export function useRetailData() {
  const [realm] = useSharedRealm();
  return useDataRepoPoll(
    useCallback(() => dataRepo.fetchRetailData(realm), [realm]),
    120000,
    [realm]
  );
}

/**
 * Hook for fetching company data (one-time, not polling)
 */
export function useCompanyData(companyId: string | number, realm = 0) {
  return useDataRepo(
    useCallback(() => dataRepo.fetchCompanyData(companyId, realm), [companyId, realm]),
    [companyId, realm]
  );
}

/**
 * Hook for fetching resource price history
 */
export function useResourcePriceHistory(resourceId: number, limit = 20) {
  const [realm] = useSharedRealm();
  return useDataRepo(
    useCallback(() => dataRepo.fetchResourcePriceHistory(realm, resourceId, limit), [realm, resourceId, limit]),
    [realm, resourceId, limit]
  );
}