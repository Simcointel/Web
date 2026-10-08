import { useEffect } from 'react';

/**
 * Hook to set document title
 */
export function usePageTitle(title: string, suffix = ' - SimcoIntel') {
  useEffect(() => {
    document.title = `${title}${suffix}`;
    return () => {
      document.title = `SimcoIntel${suffix}`;
    };
  }, [title, suffix]);
}

/**
 * Predefined page titles
 */
export const PAGE_TITLES = {
  home: 'Home',
  macro: 'Macro Intelligence',
  alerts: 'Alerts',
  profitMargins: 'Profit Matrix',
  encyclopedia: 'Encyclopedia',
  productionFlow: 'Production Flow',
  marketIntel: 'Market Intel',
  marketOrders: 'Market Orders',
  profitCalculator: 'Profit Calculator',
  constructionCalculator: 'Construction Calculator',
  retailCalculator: 'Retail Calculator',
  vwapInflation: 'VWAP Inflation',
  corporateSuite: 'Corporate Suite',
  boardRoom: 'Board Room',
  government: 'Government',
  about: 'About',
  widgets: 'Widgets',
} as const;

export type PageTitleKey = keyof typeof PAGE_TITLES;

/**
 * Hook to set page title from predefined keys
 */
export function usePageTitleKey(key: PageTitleKey) {
  usePageTitle(PAGE_TITLES[key]);
}