"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart, type CartLine } from "./cart";

export function AddToCart({ product }: { product: Omit<CartLine, "quantity"> }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="inline-flex h-12 items-center self-start rounded-full border border-border bg-surface">
        <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-12 cursor-pointer place-items-center rounded-full hover:bg-surface-muted" aria-label="Giảm số lượng">
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="w-8 text-center font-semibold" aria-live="polite" aria-label={`Số lượng ${qty}`}>
          {qty}
        </span>
        <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} className="grid size-12 cursor-pointer place-items-center rounded-full hover:bg-surface-muted" aria-label="Tăng số lượng">
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
      <button type="button" onClick={handleAdd} className="btn-outline h-12 flex-1">
        {added ? <Check className="size-4 text-leaf" aria-hidden /> : <ShoppingBag className="size-4" aria-hidden />}
        <span aria-live="polite">{added ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}</span>
      </button>
      <button
        type="button"
        onClick={() => {
          add(product, qty);
          router.push("/thanh-toan");
        }}
        className="btn-primary h-12 flex-1"
      >
        Đặt hoa ngay
      </button>
    </div>
  );
}
