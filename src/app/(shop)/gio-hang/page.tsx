import type { Metadata } from "next";
import { seoMetadata } from "@/lib/seo";
import { CartView } from "./cart-view";

export function generateMetadata(): Promise<Metadata> {
  return seoMetadata("/gio-hang/", { title: "Giỏ hàng", noindex: true });
}

export default function CartPage() {
  return (
    <div className="container-x py-10">
      <h1 className="heading-display text-4xl sm:text-5xl">Giỏ hàng</h1>
      <CartView />
    </div>
  );
}
