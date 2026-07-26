# SimcoIntel Web - API Integration Guide

## Overview

This document describes the enhanced API integrations in SimcoIntel Web, including the official SimCompanies.com API v3 and the SimcoIntel Data repository.

## API Sources

### 1. SimCompanies Official API v3

**Base URL:** `https://www.simcompanies.com/api/v3`

The official API provides real-time access to game data including:
- Company profiles and statistics
- Resources and production chains
- Building types and construction costs
- Market orders and exchange rates
- Government contracts
- News and league information
- Rankings and achievements

#### New Endpoints Implemented

##### Company Management
- `fetchCompanyProfile(identifier, realm)` - Get detailed company profile
- `fetchCompanyBuildings(identifier, realm)` - Get company buildings
- `fetchCompanyStorage(identifier, realm)` - Get storage contents
- `searchCompanies(query, realm)` - Search companies (placeholder)
- `fetchRankings(limit, realm)` - Get top company rankings

##### Resources & Production
- `fetchAllResources()` - Get all resources with production chains
- `fetchResource(resourceId)` - Get single resource details

##### Buildings
- `fetchAllBuildings()` - Get all building types
- `fetchBuildingType(buildingId)` - Get building type details

##### Market & Exchange
- `fetchMarketOrders(resourceId, type)` - Get market orders
- `fetchExchangeRates()` - Get exchange rates between resources

##### Government
- `fetchGovernmentContracts(tier)` - Get available government contracts

##### Information
- `fetchNews(category)` - Get game news
- `fetchLeagues()` - Get league information
- `fetchAchievements(companyId)` - Get player achievements

##### Financial Metrics
- `calculateProductionEfficiency(company)` - Calculate efficiency %
- `estimateWACC(company)` - Estimate Weighted Average Cost of Capital
- `calculateROIC(company, hourlyProfit)` - Calculate Return on Invested Capital
- `calculateEVA(company, hourlyProfit)` - Calculate Economic Value Added

### 2. SimcoIntel Data Repository

**Repository:** `SimcoIntel/Data` on GitHub  
**Raw CDN:** `https://raw.githubusercontent.com/SimcoIntel/Data/main/`

Provides aggregated analytics and historical data:
- Real-time VWAPs and profit margins
- Economic indicators (CPI, GDP, inflation)
- Market dashboards and sector analysis
- Historical macro data
- Retail saturation data

#### Key Functions

```typescript
// Dashboard data
fetchDashboardState(realm: number)

// Macro economics
fetchMacroLatest(realm: number)
fetchMacroHistory(realm: number, limit?: number)
fetchMacroIndexes(realm: number, limit?: number)
fetchMacroInflation(realm: number, limit?: number)
fetchMacroPhases(realm: number)

// Profit margins
fetchProfitMargins(realm: number)
fetchResourcePriceHistory(realm: number, resourceId: number, limit?: number)

// Retail
fetchRetailData(realm: number)
```

### 3. Enhanced Company API (Legacy Support)

The existing `fetchCompanyData()` function has been enhanced with:
- 3 retry attempts with exponential backoff
- Rate limit (429) detection and handling
- 10-second timeout protection
- Realm-aware URL routing

## Caching Strategy

All API calls implement intelligent caching:

| Data Type | Cache Duration | Rationale |
|-----------|---------------|-----------|
| Company Profile | 5 minutes | Balance between freshness and API limits |
| Resources | 15 minutes | Static game mechanics |
| Buildings | 30 minutes | Rarely changes |
| Market Orders | 2 minutes | Highly dynamic |
| Exchange Rates | 5 minutes | Moderate volatility |
| Gov Contracts | 10 minutes | Updates periodically |
| News | 30 minutes | Content doesn't change rapidly |
| Leagues | 1 hour | Very stable |
| Macro Data | 5 minutes | Economic indicators |
| Profit Margins | 5 minutes | Market-driven |

## Error Handling

All fetch functions include:
- **Retry Logic**: Up to 3 attempts with exponential backoff
- **Timeout Protection**: Adaptive timeouts (5-15 seconds)
- **Rate Limit Detection**: Special handling for HTTP 429
- **Graceful Degradation**: Fallback to cached data when available
- **Clear Error Messages**: User-friendly error reporting

## Usage Examples

### Fetch Company Profile with Financial Metrics

```typescript
import { 
  fetchCompanyProfile, 
  calculateEVA,
  estimateWACC 
} from './services/dataRepo';

async function analyzeCompany(username: string) {
  const company = await fetchCompanyProfile(username);
  
  // Calculate financial metrics
  const wacc = estimateWACC(company);
  const roic = calculateROIC(company, estimatedHourlyProfit);
  const eva = calculateEVA(company, estimatedHourlyProfit);
  
  return {
    name: company.name,
    value: company.value,
    efficiency: calculateProductionEfficiency(company),
    wacc,
    roic,
    eva,
  };
}
```

### Fetch Market Data

```typescript
import { 
  fetchProfitMargins,
  fetchMarketOrders,
  fetchExchangeRates 
} from './services/dataRepo';

async function getMarketOverview(realm: number) {
  const [margins, orders, rates] = await Promise.all([
    fetchProfitMargins(realm),
    fetchMarketOrders(targetResourceId),
    fetchExchangeRates(),
  ]);
  
  return { margins, orders, rates };
}
```

### Fetch Economic Indicators

```typescript
import { 
  fetchMacroLatest,
  fetchMacroInflation,
  fetchMacroPhases 
} from './services/dataRepo';

async function getEconomicOutlook(realm: number) {
  const [latest, inflation, phases] = await Promise.all([
    fetchMacroLatest(realm),
    fetchMacroInflation(realm, 30),
    fetchMacroPhases(realm),
  ]);
  
  return {
    currentPhase: phases.currentPhase,
    gdpGrowth: latest.latestInflation?.gdpGrowth,
    cpiRate: inflation.inflation[0]?.cpiRate,
  };
}
```

## API Limitations

### SimCompanies Official API
- Requires exact company username or ID
- No search by name fragments (without web scraping)
- Rate limiting on frequent requests
- Some endpoints require authentication

### SimcoIntel Data Repository
- Depends on GitHub availability
- Data freshness depends on update frequency
- Limited to aggregated/anonymized data

## Best Practices

1. **Use Caching**: Always leverage the built-in caching
2. **Batch Requests**: Use `Promise.all()` for parallel fetching
3. **Error Handling**: Always wrap API calls in try-catch
4. **Realm Awareness**: Specify correct realm (0 or 1)
5. **Rate Limiting**: Respect API rate limits with delays
6. **Data Validation**: Validate responses before use

## Migration from Legacy Code

The new API is backward compatible. Existing code continues to work:

```typescript
// Old way (still works)
const data = await fetchCompanyData('username');

// New way (recommended)
const profile = await fetchCompanyProfile('username');
const metrics = calculateEVA(profile, hourlyProfit);
```

## Future Enhancements

Planned improvements:
- WebSocket support for real-time updates
- GraphQL endpoint for flexible queries
- Enhanced search functionality
- Historical price charts
- Predictive analytics
- Custom alerts and notifications
