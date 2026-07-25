import { useEffect, useState } from "react";

export interface BasketReservation {
  token: string;
  slug: string;
  numbers: number[];
  expires: number;
}

const KEY = "lgc:reservation";
const EVENT = "lgc:basket-change";

function read(): BasketReservation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as BasketReservation;
    if (!r || typeof r !== "object" || !Array.isArray(r.numbers)) return null;
    if (typeof r.expires === "number" && r.expires < Date.now()) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return r;
  } catch {
    return null;
  }
}

/** Fire after writing/removing `lgc:reservation` so nav badge updates immediately. */
export function emitBasketChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
}

export function useBasket() {
  const [basket, setBasket] = useState<BasketReservation | null>(null);

  useEffect(() => {
    const sync = () => setBasket(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    // Expire tick — if items exist, re-check every 30s.
    const id = window.setInterval(sync, 30_000);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.clearInterval(id);
    };
  }, []);

  return {
    count: basket?.numbers.length ?? 0,
    slug: basket?.slug ?? null,
    basket,
  };
}