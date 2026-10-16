"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Heart, Trash2 } from "lucide-react";
import { formatVND } from "@/lib/format";

export type WishItem = { id: number; slug: string; name: string; image: string | null; price: number };

const STORAGE_KEY = "htn_wishlist_v1";
const EMPTY: WishItem[] = [];
const listeners = new Set<() => void>();
let cache: WishItem[] | null = null;

function read(): WishItem[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as WishItem[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: WishItem[]) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
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

const noopSubscribe = () => () => {};

function useWishlist() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return {
    items,
    ready,
    has: (id: number) => items.some((i) => i.id === id),
    toggle: (item: WishItem) => write(read().some((i) => i.id === item.id) ? read().filter((i) => i.id !== item.id) : [item, ...read()]),
    remove: (id: number) => write(read().filter((i) => i.id !== id)),
  };
}

/** Nút lưu sản phẩm vào danh sách yêu thích (lưu trên trình duyệt). */
export function WishlistButton({ item }: { item: WishItem }) {
  const { has, toggle, ready } = useWishlist();
  const saved = ready && has(item.id);
  return (
    <button
      type="button"
      onClick={() => toggle(item)}
      aria-pressed={saved}
      className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted transition-colors hover:text-danger"
    >
      <Heart className={`size-5 ${saved ? "fill-danger text-danger" : ""}`} aria-hidden />
      {saved ? "Đã lưu vào danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
    </button>
  );
}

export function WishlistView() {
  const { items, ready, remove } = useWishlist();
  if (!ready) return <div className="mt-8 h-40 animate-pulse rounded-3xl bg-surface-muted" />;
  if (items.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl bg-surface p-12 text-center">
        <Heart className="size-10 text-muted" aria-hidden />
        <p className="text-muted">Bạn chưa lưu mẫu hoa nào. Bấm biểu tượng trái tim ở trang sản phẩm để lưu lại.</p>
        <Link href="/cua-hang/" className="btn-primary">
          Xem tất cả mẫu hoa
        </Link>
      </div>
    );
  }
  return (
    <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <li key={p.id} className="relative overflow-hidden rounded-2xl border border-border bg-surface">
          <Link href={`/${p.slug}/`} className="block">
            <div className="relative aspect-[4/5] bg-surface-muted">
              {p.image && <Image src={p.image} alt={p.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />}
            </div>
            <div className="p-3 sm:p-4">
              <h2 className="line-clamp-2 text-sm font-medium">{p.name}</h2>
              <p className="mt-1 font-semibold text-brand-strong">{p.price > 0 ? formatVND(p.price) : "Liên hệ"}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => remove(p.id)}
            aria-label={`Bỏ ${p.name} khỏi danh sách`}
            className="absolute right-2 top-2 grid size-11 cursor-pointer place-items-center rounded-full bg-white/90 text-muted shadow hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
