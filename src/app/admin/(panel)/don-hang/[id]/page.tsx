import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, Phone } from "lucide-react";
import { db, orders, orderItems, ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/db";
import { formatDateTime, formatVND } from "@/lib/format";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/orders";
import { updateOrder } from "../../actions";
import { StatusBadge } from "../../status-badge";

export default async function OrderDetail({ params, searchParams }: PageProps<"/admin/don-hang/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const [order] = await db.select().from(orders).where(eq(orders.id, Number(id))).limit(1);
  if (!order) notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  const info: [string, React.ReactNode][] = [
    ["Người đặt", <>{order.senderName} · <a className="text-brand-strong hover:underline" href={`tel:${order.senderPhone}`}>{order.senderPhone}</a>{order.senderEmail ? ` · ${order.senderEmail}` : ""}</>],
    ["Người nhận", <>{order.recipientName} · <a className="text-brand-strong hover:underline" href={`tel:${order.recipientPhone}`}>{order.recipientPhone}</a></>],
    ["Địa chỉ", `${order.address}, ${order.city}`],
    ["Giao lúc", `${new Date(order.deliveryDate).toLocaleDateString("vi-VN")} · ${order.deliveryTime}`],
    ["Thiệp", order.cardMessage || "—"],
    ["Băng rôn", order.bannerMessage || "—"],
    ["Ghi chú", order.note || "—"],
    ["Thanh toán", order.paymentMethod === "vietqr" ? `Chuyển khoản VietQR (nội dung: ${order.code})` : "Thanh toán khi nhận hoa (COD)"],
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/don-hang" className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand-strong">
        <ArrowLeft className="size-4" aria-hidden /> Danh sách đơn
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-3xl font-semibold">{order.code}</h1>
        <StatusBadge status={order.status} label={orderStatusLabel[order.status]} />
        <StatusBadge status={order.paymentStatus} label={paymentStatusLabel[order.paymentStatus]} />
        <span className="text-sm text-muted">Đặt lúc {formatDateTime(order.createdAt)}</span>
      </div>
      {saved && (
        <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm text-leaf">
          Đã lưu thay đổi.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-surface p-6 ring-1 ring-border">
            <h2 className="text-lg font-semibold">Thông tin giao hoa</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {info.map(([k, v]) => (
                <div key={k} className="grid gap-1 sm:grid-cols-[120px_1fr]">
                  <dt className="text-muted">{k}</dt>
                  <dd className="whitespace-pre-line">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-2xl bg-surface p-6 ring-1 ring-border">
            <h2 className="text-lg font-semibold">Sản phẩm</h2>
            <ul className="mt-4 divide-y divide-border">
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-4 py-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                    {it.image && <Image src={it.image} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <span className="flex-1 text-sm">
                    {it.name} <span className="text-muted">× {it.quantity}</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{formatVND(it.unitPrice * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Tạm tính</dt>
                <dd>{formatVND(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Phí giao</dt>
                <dd>{formatVND(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <dt>Tổng cộng</dt>
                <dd className="text-brand-strong">{formatVND(order.total)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <form action={updateOrder} className="h-fit space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-border">
          <h2 className="text-lg font-semibold">Cập nhật đơn</h2>
          <input type="hidden" name="id" value={order.id} />
          <div>
            <label htmlFor="status" className="label">
              Trạng thái đơn
            </label>
            <select id="status" name="status" defaultValue={order.status} className="field">
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {orderStatusLabel[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="paymentStatus" className="label">
              Thanh toán
            </label>
            <select id="paymentStatus" name="paymentStatus" defaultValue={order.paymentStatus} className="field">
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {paymentStatusLabel[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="adminNote" className="label">
              Ghi chú nội bộ
            </label>
            <textarea id="adminNote" name="adminNote" rows={4} defaultValue={order.adminNote ?? ""} className="field" />
          </div>
          <button className="btn-primary h-11 w-full">Lưu thay đổi</button>
          <a href={`tel:${order.senderPhone}`} className="btn-outline h-11 w-full">
            <Phone className="size-4" aria-hidden /> Gọi khách
          </a>
        </form>
      </div>
    </div>
  );
}
