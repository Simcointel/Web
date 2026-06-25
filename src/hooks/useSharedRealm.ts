import { useState, useEffect } from "react";

export function useSharedRealm() {
  const [realm, setRealm] = useState(() => {
    const saved = localStorage.getItem("simco_realm");
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem("simco_realm", realm.toString());
    // Dispatch custom event for cross-component sync in same tab if needed
    window.dispatchEvent(new CustomEvent("realm_change", { detail: realm }));
  }, [realm]);

  useEffect(() => {
    const handler = (e: any) => setRealm(e.detail);
    window.addEventListener("realm_change", handler);
    return () => window.removeEventListener("realm_change", handler);
  }, []);

  return [realm, setRealm] as const;
}
