import { useState, useEffect, useCallback, createContext, useContext } from "react";

type RouterContext = { path: string; navigate: (to: string) => void };
const Ctx = createContext<RouterContext>({ path: "/", navigate: () => {} });
export const RouterProvider = Ctx.Provider;

export function useLocation() {
  return useContext(Ctx).path;
}

export function useNavigate() {
  return useContext(Ctx).navigate;
}

export type SearchParams = { get: (key: string) => string | null; has: (key: string) => boolean };

export function useSearchParams(): SearchParams {
  const loc = useLocation();
  const qs = loc.includes("?") ? loc.split("?")[1] : "";
  const params = new URLSearchParams(qs);
  return { get: (k: string) => params.get(k), has: (k: string) => params.has(k) };
}

export function Link({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  const nav = useNavigate();
  return (
    <a href={to} onClick={(e) => { e.preventDefault(); nav(to); }} className={className}>
      {children}
    </a>
  );
}

export function createRouter() {
  const initialPath = (() => {
    const redirect = sessionStorage.redirect;
    if (redirect) {
      sessionStorage.removeItem("redirect");
      try {
        const url = new URL(redirect);
        return url.pathname || "/";
      } catch { /* fall through */ }
    }
    return window.location.pathname || "/";
  })();

  const [path, setPath] = useState(initialPath);

  useEffect(() => {
    const handler = () => {
      setPath(window.location.pathname || "/");
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const navigate = useCallback((to: string) => {
    window.history.pushState({}, "", to);
    setPath(to);
  }, []);

  return { path, navigate };
}
