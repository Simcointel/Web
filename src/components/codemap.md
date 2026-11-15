# src/components/

## Responsibility
Shared, feature-agnostic UI layer: the app shell chrome (sidebar, mobile nav, footer, error boundary) and small presentational primitives reused by pages.

## Design
- **Composition over configuration**: every component is a plain function component with an explicit prop interface (no context, no global store).
- **Layout shell is owned by `App.tsx`**, not these files: `Sidebar`/`MobileNav`/`Footer` are rendered by `AppShell`, which decides visibility for widget and corporate-suite routes.
- **Router primitives are injected**: navigation uses `Link`/`useLocation` from `src/router.tsx`, keeping components router-agnostic.
- **Guard component**: `PageErrorBoundary` is a class-based React error boundary wrapping each lazily loaded page.
- **Design tokens**: Tailwind classes only (`brand-*`, `surface-*`, `dark:` variants); no CSS modules.

## Flow
1. `main.tsx` → `createRouter()` → `RouterProvider` → `AppShell`.
2. `AppShell` renders `Sidebar` (desktop, hidden on `/corporate-suite`) and `MobileNav` (mobile), wraps the page in `Suspense` + `PageErrorBoundary`, and appends `Footer`.
3. A page composes primitives (e.g. `StatCard`, `ScoreBar`, `SeverityBadge`) and section wrappers.

## Files
- `Sidebar.tsx` — `Sidebar({isOpen,setIsOpen})`: grouped nav (`ANALYZE`, `MANAGE`, `INTEL`, `TOOLS`) with theme toggle; active state from `useLocation()`.
- `MobileNav.tsx` — `MobileNav()`: bottom tab bar for small screens.
- `Footer.tsx` — `Footer()`: static footer.
- `Layout.tsx` — `Section`, `CardGrid`, `Tooltip`: page layout helpers (distinct from `ui/Common`'s section styling).
- `PageErrorBoundary.tsx` — `PageErrorBoundary`: catches render errors per page.
- `StatCard.tsx` — `StatCard({title,value,subtitle,color,icon,trend,trendLabel})`: KPI card.
- `ScoreBar.tsx` — `ScoreBar({value,label,color})`: horizontal score meter.
- `SeverityBadge.tsx` — `SeverityBadge({severity})`: colored severity pill.
- `States.tsx` — `LoadingState`, `ErrorState(message,onRetry)`, `EmptyState(message)`: async-state placeholders.
- `InputNode.tsx` — `InputNode({label,value,onChange,unit,min,max,step})`: inline numeric input used by calculator pages.

## Integration
- Consumers: `src/App.tsx` (shell components), all `src/pages/*`.
- Depends on: `src/router.tsx` (`Link`, `useLocation`), `src/hooks/useTheme.ts`, `lucide-react`.
- Sub-maps: `ui/codemap.md` (page-level primitives), `widgets/codemap.md` (embeddable cards).
