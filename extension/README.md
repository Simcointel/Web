# SimcoIntel Browser Extension

Real-time SimCompanies market data in your browser. Works on **Chrome**, **Edge**, **Brave**, and **Firefox**.

## Features

- **Popup dashboard** — top 5 most profitable resources, biggest losses, retail saturation, and realm dashboard scores
- **Content overlay** — injects a small market data widget into SimCompanies pages
- **Auto-refresh** — background service worker updates every 5 minutes
- **Realm selector** — switch between Realm 0 and Realm 1
- **Badge count** — shows number of resources with pricing data

## Install

### Chrome / Edge / Brave

1. Download the extension zip: [simcointel-extension.zip](https://github.com/Simcointel/Web/raw/main/extension/simcointel-extension.zip)
2. Unzip the file
3. Open `chrome://extensions` (or `edge://extensions`)
4. Enable **Developer mode** (top right)
5. Click **Load unpacked** and select the unzipped folder
6. Pin the extension to your toolbar

### Firefox

1. Download the extension zip: [simcointel-extension.zip](https://github.com/SimcoIntel/Web/raw/main/extension/simcointel-extension.zip)
2. Unzip the file
3. Open `about:debugging`
4. Click **This Firefox** → **Load Temporary Add-on**
5. Select the `manifest.json` from the unzipped folder

For permanent Firefox install, submit to [Firefox Add-ons](https://addons.mozilla.org/developers/).

## Data Source

All data comes from the [SimcoIntel Data](https://github.com/SimcoIntel/Data) repository on GitHub, updated every 5 minutes by the backend pipeline.

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (MV3, cross-browser) |
| `popup.html` | Popup UI |
| `popup.js` | Popup logic — fetches and renders market data |
| `background.js` | Service worker — periodic refresh + badge |
| `content.js` | Content script — overlay on SimCompanies pages |
| `content.css` | Overlay styles |
| `icons/` | Extension icons (16/32/48/128px) |
