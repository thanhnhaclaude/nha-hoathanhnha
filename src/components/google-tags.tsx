import { googleConfig } from "@/lib/google";
import { DeferredTagLoader } from "./deferred-tag-loader";

/**
 * Google Analytics 4 (đặt trong <body> của layout gốc). Website chỉ dùng GA4 + thẻ xác minh Search Console.
 *
 * Tốc độ: chỉ phần khởi tạo rất nhỏ chạy ngay (hàng đợi dataLayer/gtag, không sự kiện nào bị mất);
 * gtag.js được tải khi khách bắt đầu thao tác (DeferredTagLoader), riêng trang "đặt hàng thành công"
 * tải ngay để không mất sự kiện mua hàng.
 */
export function GoogleTags() {
  const { gaId, enabled } = googleConfig;
  if (!enabled || !gaId) return null;
  const init = `window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${gaId}');`;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: init }} />
      <DeferredTagLoader gaId={gaId} />
    </>
  );
}
