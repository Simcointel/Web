# Extension Store Submission Guide

## Chrome Web Store

### Prerequisites
- Google account
- One-time $5 developer registration fee
- Extension zip: `extension/simcointel-extension.zip`

### Steps

1. Go to https://chrome.google.com/webstore/devconsole
2. Click **New Item**
3. Upload `simcointel-extension.zip`
4. Fill in listing:

**Store Listing:**
- **Name:** SimcoIntel — SimCo Market Data
- **Short description (132 chars):** Real-time SimCompanies market data, profit margins, and company sync in your browser
- **Detailed description:**
```
Real-time SimCompanies market data in your browser.

FEATURES:
• Popup dashboard with top profitable resources, retail saturation, and realm scores
• Auto-sync company data from SimCompanies pages to the web dashboard
• Realm selector (Realm 0 / Realm 1)
• Auto-refresh every 5 minutes
• Content overlay on SimCompanies pages
• No tracking, no accounts, no POST requests

DATA:
All data stays in your browser (chrome.storage.local). We do not collect personal information, browsing history, or analytics.

DATA SOURCE:
Public GitHub CDN (raw.githubusercontent.com/SimcoIntel/Data)
```

5. **Screenshots:** 1280x800 or 640x480 (see screenshot guide below)
6. **Promotional images:** Optional (440x280 small, 1280x800 large)
7. **Privacy policy URL:** `https://simcointel.github.io/Web/privacy.html`
8. **Category:** Productivity
9. **Language:** English
10. Click **Submit for Review**

### Screenshots to Capture
1. Popup with market data visible
2. Corporate Suite "Import from Extension" button
3. SimCompanies page with sync button overlay
4. Extension loaded in chrome://extensions

---

## Firefox Add-ons (AMO)

### Prerequisites
- Firefox account (free)
- Extension zip: `extension/simcointel-extension.zip`

### Steps

1. Go to https://addons.mozilla.org/developers/
2. Sign in with Firefox account
3. Click **Submit a New Add-on**
4. Choose **On your own** (self-distributed) or **On this site** (listed)
5. Upload `simcointel-extension.zip`
6. Fill in listing:

**Listing:**
- **Name:** SimcoIntel — SimCo Market Data
- **Summary:** Real-time SimCompanies market data, profit margins, and company sync
- **Description:** (same as Chrome)
- **Categories:** Productivity
- **Privacy policy URL:** `https://simcointel.github.io/Web/privacy.html`

7. Upload screenshots (same as Chrome)
8. Click **Submit**

### Notes
- Firefox review is usually faster than Chrome (hours vs days)
- Listed extensions get a permanent URL like `addons.mozilla.org/en-US/firefox/addon/simcointel/`
- Self-distributed requires users to install via `about:debugging` or direct link

---

## Price Monitor Extension

Same process, use `price-monitor/simcointel-price-monitor.zip`

**Name:** SimcoIntel — Price Monitor
**Summary:** Alerts when SimCompanies orders are 4%+ below lowest price
