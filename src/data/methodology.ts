export const methodology = {
  economicHealth: {
    title: "Economic Health Score",
    summary: "A composite measure of the overall economic well-being of a realm, combining GDP output, inflation stability, employment (active companies), and trade (bonds sold).",
    formula: "Weighted combination: GDP (40%) + Inflation (25%) + Active Companies (20%) + Bonds Sold (15%). Each sub-score is normalized 0-100 relative to historical range.",
    interpretation: "Above 70 = healthy expansion, 40-70 = moderate/stagnant, below 40 = contraction or recession risk.",
  },
  marketSentiment: {
    title: "Market Sentiment",
    summary: "Measures the directional confidence of market participants by analyzing momentum strength, volatility calmness, and cross-category correlation coherence.",
    formula: "Aggregated from momentum direction/strength (40%), inverse of volatility (35%), and average correlation (25%). Normalized 0-100.",
    interpretation: "Above 70 = bullish confidence, 40-70 = neutral/cautious, below 40 = bearish fear or uncertainty.",
  },
  stability: {
    title: "Stability Index",
    summary: "Reflects how orderly and predictable the market is by measuring the inverse of volatility, divergence intensity, and sector stress.",
    formula: "Inverse volatility (40%) + inverse divergence (35%) + inverse stress (25%). Higher values indicate calmer, more stable conditions.",
    interpretation: "Above 70 = stable and predictable, 40-70 = moderate fluctuations, below 40 = volatile or chaotic.",
  },
  inflationPressure: {
    title: "Inflation Pressure",
    summary: "Tracks whether the economy is experiencing above-normal price increases using CPI, Core CPI, and GDP-driven demand pressure.",
    formula: "CPI deviation (50%) + Core CPI deviation (30%) + GDP growth pressure (20%). Scored where 0 = no pressure, 100 = maximum historical pressure.",
    interpretation: "Above 70 = high inflation risk, 40-70 = moderate pressure, below 40 = low or no inflation concern. Values near 0 indicate deflationary conditions.",
  },
  systemicRisk: {
    title: "Systemic Risk Score",
    summary: "Assesses the probability of a cascading market failure by monitoring contagion spread risk, divergence severity, and anomaly frequency.",
    formula: "Contagion risk (50%) + divergence severity (30%) + anomaly z-score frequency (20%). Higher values indicate greater systemic fragility.",
    interpretation: "Above 50 = elevated systemic risk, 25-50 = moderate concerns, below 25 = low systemic risk. Values below 15 indicate normal market function.",
  },
  regime: {
    title: "Economic Regime",
    summary: "A classification of the current macroeconomic phase based on a rule-based analysis of momentum, volatility, stress, and historical transitions.",
    types: [
      { name: "Expansion", description: "Rising momentum, low volatility, positive stress spread. Economic activity increasing." },
      { name: "Stagnation", description: "Flat or declining momentum, moderate volatility. Economic activity plateaued." },
      { name: "Recession", description: "Declining momentum, high volatility, negative stress. Economic contraction underway." },
      { name: "Recovery", description: "Improving momentum from low base, elevated but falling volatility. Early stage of rebound." },
      { name: "Volatile", description: "Conflicting signals, high cross-category variance. No clear directional trend." },
    ],
  },
  cpiInflation: {
    title: "CPI & Inflation Calculation",
    summary: "The Consumer Price Index tracks the weighted average price change of commodities in the realm. Inflation is the period-over-period change.",
    method: "CPI is calculated as a weighted basket of commodity prices (food, materials, energy, metals) where each category is weighted by its economic significance. The base period (index = 100) is configurable. Inflation = (CPI_current - CPI_previous) / CPI_previous * 100.",
    interpretation: "CPI above 100 indicates price increases since base period. Inflation rate of 2-4% is considered healthy; above 6% is concerning; above 10% indicates severe inflation.",
  },
  gdpTracking: {
    title: "GDP & Economic Output",
    summary: "SimcoIntel tracks a proxy for Gross Domestic Product using companies value as a measure of productive capital and output capacity.",
    method: "Companies Value represents the total capitalized value of all active business entities in the realm. Changes in companies value, combined with bonds sold (investment proxy) and active companies (employment proxy), provide a multidimensional view of economic output.",
    interpretation: "Rising companies value + rising active companies + stable bonds = healthy growth. Divergence between these indicators (e.g., rising value but falling companies) can signal structural issues.",
  },
  dataSources: {
    title: "Data Sources & Methodology",
    sources: [
      { name: "SimcoTools API", description: "Primary real-time data source for commodity prices, realm metrics, and economic indicators. Data fetched at configurable intervals." },
      { name: "Derived Computations", description: "Momentum, volatility, correlations, anomalies, regime classification, and composite scores are computed from raw data using deterministic, rule-based engines." },
      { name: "Historical Archives", description: "Raw snapshots are periodically archived and compressed for long-term trend analysis. No external third-party data sources are used." },
    ],
    note: "All scores, classifications, and alerts are generated solely from the SimcoTools API data using deterministic algorithms. No machine learning, AI, or external data providers are involved in the analysis pipeline.",
  },
};
