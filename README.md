# SimcoIntel Web

SimcoIntel Web is the professional frontend interface for the SimcoIntel economic intelligence suite, designed for players of [Sim Companies](https://www.simcompanies.com/). It provides real-time market analysis, corporate management tools, and supply chain visualization using a clean, "Straight Enterprise" design language.

## Core Features

*   **Corporate Suite**: A modular workstation for enterprise-wide synchronization. Features include:
    *   **Live Link**: Direct sync of infrastructure, skills, and debt using the SimCompanies API.
    *   **Executive Board**: Advanced efficiency formulas for AO reduction and bonus tracking.
    *   **Finance & Logistics**: Tax-free threshold calculators and warehouse liquidity analysis.
*   **Profit Matrix**: Real-time margin analysis for all production and extraction resources, factoring in current market VWAPs.
*   **Macro Intelligence**: Analysis of economic phases, regime transitions, and price index movements.
*   **Production Flow**: Recursive supply chain mapper to visualize multi-tier input requirements.

## Architecture: "Frontend as Static Consumer"

This application is designed to be highly scalable and cost-effective by consuming pre-processed data from the [SimcoIntel Data Repo](https://github.com/SimcoIntel/Data).

1.  **Static Data Pipelines**: The backend data pipeline processes millions of market data points and exports them as optimized JSON snapshots.
2.  **CDN-First Fetching**: The frontend fetches these snapshots directly from GitHub Pages/CDN, bypassing the need for a live database and ensuring high performance even during peak traffic.
3.  **Local Intelligence**: Heavy calculations (like tax modeling and executive efficiency) are performed client-side using React's `useMemo` for instant feedback without additional server requests.

## Technical Stack

*   **Framework**: React 18 with TypeScript
*   **Styling**: Tailwind CSS (Enterprise Slate/Sky theme)
*   **Icons**: Lucide React
*   **Charts**: Recharts & Framer Motion for high-performance visualizations
*   **Build Tool**: Vite

## Development

### Prerequisites
*   Node.js (v24+ recommended)
*   npm

### Getting Started
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Quality Assurance
Run unit tests using Vitest:
```bash
npm test
```

## Maintenance

The frontend is versioned as `v3.0.0-STRAIGHT`, reflecting the transition from a terminal-style high-density UI to a professional enterprise design system.
