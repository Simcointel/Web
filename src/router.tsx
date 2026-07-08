import React, { useState, useEffect, useCallback, createContext, useContext } from "react";

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

export function Link({
  to,
  children,
  className,
  onClick,
  style,
  ...props
}: {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const nav = useNavigate();
  return (
    <a
      href={to}
      style={style}
      onClick={(e) => {
        const isModifiedClick = !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
        if (!isModifiedClick && e.button === 0) {
          e.preventDefault();
          onClick?.();
          nav(to);
        }
      }}
      className={className}
      {...props}
    >
      {children}
    </a>
  );
}

const BASE = import.meta.env.BASE_URL; // "/Web/"
const stripBase = (p: string) => p.replace(new RegExp("^" + BASE.replace(/\/$/, "") + "(/|$|\\?)"), "$1") || "/";

export function createRouter() {
  const initialPath = (() => {
    const redirect = sessionStorage.redirect;
    if (redirect) {
      sessionStorage.removeItem("redirect");
      try {
        const url = new URL(redirect);
        return stripBase(url.pathname);
      } catch { /* fall through */ }
    }
    return stripBase(window.location.pathname);
  })();

  const [path, setPath] = useState(initialPath);

  useEffect(() => {
    const handler = () => {
      setPath(stripBase(window.location.pathname));
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const navigate = useCallback((to: string) => {
    const full = to.startsWith("/") ? BASE.replace(/\/$/, "") + to : to;
    window.history.pushState({}, "", full);
    setPath(to);
  }, []);

  return { path, navigate };
}
