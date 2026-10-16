"use client";

import { gaItem, trackEvent } from "@/lib/google";
import { useMemo, useSyncExternalStore } from "react";

export type CartLine = {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
};

const STORAGE_KEY = "htn_cart_v1";
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
let cache: CartLine[] | null = null;

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as CartLine[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: CartLine[]) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Đồng bộ giỏ hàng giữa các tab
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const actions = {
  add(line: Omit<CartLine, "quantity">, quantity = 1) {
    trackEvent("add_to_cart", { value: line.price * quantity, items: [gaItem({ ...line, quantity })] });
    const prev = read();
    const existing = prev.find((l) => l.id === line.id);
    write(
      existing
        ? prev.map((l) => (l.id === line.id ? { ...l, ...line, quantity: Math.min(99, l.quantity + quantity) } : l))
        : [...prev, { ...line, quantity }],
    );
  },
  setQuantity(id: number, quantity: number) {
    const prev = read();
    write(quantity <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, quantity: Math.min(99, quantity) } : l)));
  },
  remove(id: number) {
    write(read().filter((l) => l.id !== id));
  },
  clear() {
    write(EMPTY);
  },
};

const noopSubscribe = () => () => {};

/** Giỏ hàng lưu trong localStorage. `ready` = false khi render phía server / trước khi hydrate. */
export function useCart() {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return useMemo(
    () => ({
      lines,
      ready,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + l.quantity * l.price, 0),
      ...actions,
    }),
    [lines, ready],
  );
}

/** Giữ để layout không phải đổi; giỏ hàng không cần provider. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  return children;
}
