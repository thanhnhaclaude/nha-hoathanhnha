import type { Metadata } from "next";
import { seoMetadata } from "@/lib/seo";
import { shippingConfig } from "@/lib/site";
import { CheckoutForm } from "./checkout-form";

export function generateMetadata(): Promise<Metadata> {
  return seoMetadata("/thanh-toan/", { title: "Thanh toán", noindex: true });
}
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const shipping = shippingConfig();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  return (
    <div className="container-x py-10">
      <h1 className="heading-display text-4xl sm:text-5xl">Thông tin đặt hoa</h1>
      <p className="mt-2 text-muted">Điền thông tin người gửi, người nhận và lời nhắn trên thiệp. Shop sẽ gọi xác nhận trong ít phút.</p>
      <CheckoutForm shipping={shipping} today={today} />
    </div>
  );
}
