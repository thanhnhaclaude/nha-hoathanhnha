/**
 * Mã Google của hoathanhnha.com: chỉ Google Analytics 4 và thẻ xác minh Search Console.
 * Đã bỏ Google Tag Manager (GTM-N6JH36R, chứa 8 mã chuyển đổi Google Ads) theo yêu cầu chủ shop 23/10/2026.
 * Có thể đổi bằng biến môi trường; đặt rỗng ("") để tắt.
 */
export const googleConfig = {
  /** Google Analytics 4 */
  gaId: process.env.NEXT_PUBLIC_GA_ID ?? "G-48L4JHB0VM",
  /** Chỉ gửi số liệu trên website thật, không gửi khi chạy thử trên máy */
  enabled: process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "1",
};

/** Mã xác minh Google Search Console / Merchant Center (thẻ meta google-site-verification), cách nhau bằng dấu phẩy.
 *  Chỉ giữ mã của chủ shop; mã của tài khoản khác (khoinguyenyi, gỡ 21/10/2026) không đặt lại. */
export function googleVerification() {
  const raw = process.env.GOOGLE_SITE_VERIFICATION ?? "0BL41Q2-kGGdFLnpWpfs2piKKesoA-i-M_zwugBOqI4";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type GaItem = { item_id: string; item_name: string; price: number; quantity: number };

type Gtag = (command: "event", name: string, params: Record<string, unknown>) => void;

/** Gửi sự kiện thương mại điện tử GA4 (view_item, add_to_cart, begin_checkout, purchase). */
export function trackEvent(name: string, params: Record<string, unknown>) {
  if (typeof window === "undefined" || !googleConfig.enabled) return;
  // gtag.js được tải trì hoãn (DeferredTagLoader): lệnh gọi trước đó vào hàng đợi dataLayer và được gửi khi file tải xong
  const w = window as unknown as { gtag?: Gtag; dataLayer?: unknown[] };
  w.dataLayer ??= [];
  w.gtag ??= function () {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  } as Gtag;
  w.gtag("event", name, { currency: "VND", ...params });
}

export function gaItem(p: { id: number; name: string; price: number; quantity?: number }): GaItem {
  return { item_id: String(p.id), item_name: p.name, price: p.price, quantity: p.quantity ?? 1 };
}
