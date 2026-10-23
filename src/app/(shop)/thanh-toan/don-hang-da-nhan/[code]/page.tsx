import type { Metadata } from "next";
import { OrderView } from "../../../don-hang/[code]/order-view";

/**
 * Trang "đơn hàng đã nhận" ngay sau khi đặt hàng. Giữ đường dẫn giống WooCommerce cũ
 * (/thanh-toan/don-hang-da-nhan/...); GA4 ghi sự kiện mua hàng khi trang này tải.
 */
export const metadata: Metadata = { title: "Đặt hàng thành công", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderReceivedPage({ params, searchParams }: PageProps<"/thanh-toan/don-hang-da-nhan/[code]">) {
  const { code } = await params;
  const { t } = await searchParams;
  return <OrderView code={code} token={t} trackPurchase />;
}
