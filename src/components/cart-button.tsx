"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart";

export function CartButton() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/gio-hang/"
      className="relative grid size-11 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-strong"
      aria-label={`Giỏ hàng (${count} sản phẩm)`}
    >
      <ShoppingBag className="size-5" aria-hidden />
      {ready && count > 0 && (
        <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-leaf px-1 text-xs font-bold leading-5 text-white ring-2 ring-surface">
          {count}
        </span>
      )}
    </Link>
  );
}
