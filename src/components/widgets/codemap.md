# src/components/widgets/

## Responsibility
Self-contained, embeddable cards rendered by the widget route (`/widgets?type=…&realm=…`). Each card fetches its own data and renders a compact, transparent-background surface.

## Design
- **Self-fetching widgets**: each card accepts `{ realm, compact? }` and calls `fetchWidget`/data-repo hooks internally, so the host page (`WidgetRenderer`) only switches on `type`.
- **Compact-by-default props** (`compact = true`, `limit = 5`) tuned for iframe embedding.
- **Shared mini primitives** in `WidgetParts.tsx` (`MiniScoreBar`, `MiniRegimeBadge`, `SeverityDot`) keep the visual language identical across cards.
- **Data path**: prefer `services/dataRepo.fetchDashboardState` (GitHub raw/CDN), fall back to the backend widget API (`services/widgetClient.fetchWidget`).

## Flow
`WidgetRenderer` reads `?type` → renders one card → card calls `fetchWidget(type, realm, compact)` → `widgetClient` first tries `dataRepo.fetchDashboardState(realm)` for `health`, otherwise `GET {API_BASE}/public/widget/{type}` → renders compact markup.

## Files
- `WidgetHealthCard.tsx` — `WidgetHealthCard({realm,compact})`: composite scores + regime + alert count.
- `WidgetAlertList.tsx` — `WidgetAlertList({realm,limit})`: recent alert list.
- `WidgetRegimeCard.tsx` — `WidgetRegimeCard({realm})`: current regime label/score.
- `WidgetForecastCard.tsx` — `WidgetForecastCard({realm,compact})`: forecast summary.
- `WidgetParts.tsx` — `MiniScoreBar`, `MiniRegimeBadge`, `SeverityDot`.

## Integration
- Consumers: `src/pages/WidgetRenderer.tsx`.
- Depends on: `src/services/widgetClient.ts`, `src/services/dataRepo.ts`, `src/types/api.ts`.
- Public URL shape: `createWidgetUrl(type, realm, params)` in `widgetClient.ts`.
