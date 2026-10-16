import type { Metadata } from "next";
import { OrderView } from "./order-view";

export const metadata: Metadata = { title: "Đơn hàng", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params, searchParams }: PageProps<"/don-hang/[code]">) {
  const { code } = await params;
  const { t } = await searchParams;
  return <OrderView code={code} token={t} />;
}
