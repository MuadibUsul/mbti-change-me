"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const STORAGE_KEY = "persona_flux_anon_id";

function getAnonId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const value =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(STORAGE_KEY, value);
  return value;
}

export function TrafficTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!pathname) return;
    if (pathname.startsWith("/api")) return;
    if (pathname.startsWith("/_next")) return;

    const sessionKey = getAnonId();
    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        path,
        referrer: typeof document !== "undefined" ? document.referrer : "",
        sessionKey,
      }),
    }).catch(() => undefined);
  }, [pathname, searchParams]);

  return null;
}
