import type { Metadata } from "next";
import { OrderView } from "../../../don-hang/[code]/order-view";

/**
 * Trang "đơn hàng đã nhận" ngay sau khi đặt hàng. Giữ đường dẫn giống WooCommerce cũ
 * (/thanh-toan/don-hang-da-nhan/...) vì thẻ chuyển đổi Google Ads trong GTM kích hoạt theo URL này.
 */
export const metadata: Metadata = { title: "Đặt hàng thành công", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderReceivedPage({ params, searchParams }: PageProps<"/thanh-toan/don-hang-da-nhan/[code]">) {
  const { code } = await params;
  const { t } = await searchParams;
  return <OrderView code={code} token={t} trackPurchase />;
}
