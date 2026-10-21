/**
 * Mã Google của hoathanhnha.com, giữ nguyên như website WordPress cũ để Analytics, Search Console
 * và chuyển đổi Google Ads (trong GTM) chạy liên tục khi chuyển sang website mới.
 * Có thể đổi bằng biến môi trường; đặt rỗng ("") để tắt.
 */
export const googleConfig = {
  /** Google Analytics 4 */
  gaId: process.env.NEXT_PUBLIC_GA_ID ?? "G-5DQSG3PGJ2",
  /** Google Tag Manager — chứa các thẻ chuyển đổi Google Ads (gọi điện, Zalo, Messenger, đặt hàng) */
  gtmId: process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-N6JH36R",
  /** Chỉ gửi số liệu trên website thật, không gửi khi chạy thử trên máy */
  enabled: process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "1",
};

/** Mã xác minh Google Search Console / Merchant Center (thẻ meta google-site-verification), cách nhau bằng dấu phẩy.
 *  Chỉ giữ mã của chủ shop; mã của tài khoản khác (khoinguyenyi, gỡ 21/10/2026) không đặt lại. */
export function googleVerification() {
  const raw = process.env.GOOGLE_SITE_VERIFICATION ?? "_27xAZ-TC_egrtPKL-gZGwfvvllJ2D1bWyApNW9ZeeQ";
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
