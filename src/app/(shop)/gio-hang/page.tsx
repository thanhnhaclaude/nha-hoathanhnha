import type { Metadata } from "next";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Giỏ hàng", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-x py-10">
      <h1 className="heading-display text-4xl sm:text-5xl">Giỏ hàng</h1>
      <CartView />
    </div>
  );
}
