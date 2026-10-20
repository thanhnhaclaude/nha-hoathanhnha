import { googleConfig } from "@/lib/google";
import { DeferredTagLoader } from "./deferred-tag-loader";

/**
 * Google Analytics 4 + Google Tag Manager (đặt trong <body> của layout gốc).
 *
 * Tốc độ: GTM của shop chứa 8 mã chuyển đổi Google Ads, mỗi mã tải riêng một gtag.js (~160 KB),
 * cộng GA4 và GTM là ~1,6 MB JavaScript, chặn điện thoại ~2,4 giây (PageSpeed 10/2026).
 * Vì vậy chỉ phần khởi tạo rất nhỏ chạy ngay (hàng đợi dataLayer/gtag, không sự kiện nào bị mất);
 * file của Google được tải khi khách bắt đầu thao tác (DeferredTagLoader), riêng trang
 * "đặt hàng thành công" tải ngay để không mất chuyển đổi mua hàng.
 */
export function GoogleTags() {
  const { gaId, gtmId, enabled } = googleConfig;
  if (!enabled || (!gaId && !gtmId)) return null;
  const init = [
    "window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments)};",
    gtmId ? "dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});" : "",
    gaId ? `gtag('js',new Date());gtag('config','${gaId}');` : "",
  ].join("");
  return (
    <>
      {gtmId && (
        <noscript>
          <iframe src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} title="Google Tag Manager" />
        </noscript>
      )}
      <script dangerouslySetInnerHTML={{ __html: init }} />
      <DeferredTagLoader gaId={gaId} gtmId={gtmId} />
    </>
  );
}
