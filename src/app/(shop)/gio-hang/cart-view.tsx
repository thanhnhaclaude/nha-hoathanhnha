"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart";
import { formatVND } from "@/lib/format";

export function CartView() {
  const { lines, subtotal, setQuantity, remove, ready } = useCart();

  if (!ready) return <div className="mt-8 h-40 animate-pulse rounded-3xl bg-surface-muted" />;

  if (lines.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl bg-surface p-12 text-center">
        <ShoppingBag className="size-10 text-muted" aria-hidden />
        <p className="text-muted">Giỏ hàng của bạn đang trống.</p>
        <Link href="/" className="btn-primary">
          Tiếp tục chọn hoa
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y divide-border rounded-3xl border border-border bg-surface">
        {lines.map((l) => (
          <li key={l.id} className="flex gap-4 p-4 sm:p-5">
            <Link href={`/${l.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-surface-muted sm:size-28">
              {l.image && <Image src={l.image} alt={l.name} fill sizes="112px" className="object-cover" />}
            </Link>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/${l.slug}`} className="font-medium hover:text-brand-strong">
                  {l.name}
                </Link>
                <button type="button" onClick={() => remove(l.id)} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-danger" aria-label={`Xóa ${l.name}`}>
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
              <p className="text-sm text-muted">{formatVND(l.price)}</p>
              <div className="mt-auto flex items-center justify-between">
                <div className="inline-flex items-center rounded-full border border-border">
                  <button type="button" onClick={() => setQuantity(l.id, l.quantity - 1)} className="grid size-11 cursor-pointer place-items-center" aria-label="Giảm số lượng">
                    <Minus className="size-4" aria-hidden />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold">{l.quantity}</span>
                  <button type="button" onClick={() => setQuantity(l.id, l.quantity + 1)} className="grid size-11 cursor-pointer place-items-center" aria-label="Tăng số lượng">
                    <Plus className="size-4" aria-hidden />
                  </button>
                </div>
                <span className="font-semibold text-brand-strong">{formatVND(l.price * l.quantity)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-3xl border border-border bg-surface p-6 lg:sticky lg:top-44">
        <h2 className="font-display text-2xl font-semibold">Tóm tắt</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Tạm tính</dt>
            <dd className="font-semibold">{formatVND(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Phí giao hoa</dt>
            <dd>Tính ở bước tiếp theo</dd>
          </div>
        </dl>
        <Link href="/thanh-toan" className="btn-primary mt-6 h-12 w-full">
          Tiến hành đặt hoa
        </Link>
        <Link href="/" className="mt-3 block text-center text-sm text-muted hover:text-brand-strong">
          Tiếp tục chọn hoa
        </Link>
      </aside>
    </div>
  );
}
