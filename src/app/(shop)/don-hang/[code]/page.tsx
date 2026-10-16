import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Phone } from "lucide-react";
import { formatVND } from "@/lib/format";
import { getOrderForCustomer, orderStatusLabel, paymentStatusLabel, vietQrUrl } from "@/lib/orders";
import { site } from "@/lib/site";
import { PaymentWatcher } from "./payment-watcher";

export const metadata: Metadata = { title: "Đơn hàng", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params, searchParams }: PageProps<"/don-hang/[code]">) {
  const { code } = await params;
  const { t } = await searchParams;
  if (typeof t !== "string") notFound();
  const data = await getOrderForCustomer(code, t);
  if (!data) notFound();
  const { order, items } = data;
  const qr = order.paymentMethod === "vietqr" && order.paymentStatus === "unpaid" ? vietQrUrl(order.total, order.code) : null;

  return (
    <div className="container-x max-w-4xl py-10">
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="size-14 text-leaf" aria-hidden />
        <h1 className="heading-display mt-4 text-4xl sm:text-5xl">Cảm ơn bạn đã đặt hoa!</h1>
        <p className="mt-3 max-w-xl text-muted">
          Mã đơn hàng <strong className="text-foreground">{order.code}</strong>. Shop sẽ gọi xác nhận tới số {order.senderPhone} trong ít phút. Hãy lưu lại trang này để theo dõi đơn.
        </p>
      </div>

      {order.paymentMethod === "vietqr" && order.paymentStatus === "paid" && (
        <p role="status" className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-2 rounded-2xl bg-leaf-soft p-4 text-center font-semibold text-leaf">
          <CheckCircle2 className="size-5 shrink-0" aria-hidden /> Shop đã nhận được tiền chuyển khoản. Cảm ơn bạn!
        </p>
      )}

      {qr && <PaymentWatcher />}
      {qr && (
        <section aria-labelledby="pay-h" className="mt-10 grid items-center gap-6 rounded-3xl border-2 border-brand bg-surface p-6 sm:grid-cols-[260px_1fr] sm:p-8">
          <Image src={qr} alt={`Mã VietQR thanh toán ${formatVND(order.total)} cho đơn ${order.code}`} width={260} height={300} unoptimized className="mx-auto rounded-2xl" />
          <div>
            <h2 id="pay-h" className="font-display text-2xl font-semibold">
              Quét mã để thanh toán
            </h2>
            <p className="mt-2 text-sm text-muted">Mở ứng dụng ngân hàng, chọn quét QR. Số tiền và nội dung đã được điền sẵn.</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Số tiền</dt>
                <dd className="font-semibold text-brand-strong">{formatVND(order.total)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Nội dung chuyển khoản</dt>
                <dd className="font-mono font-semibold">{order.code}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Chủ tài khoản</dt>
                <dd className="font-semibold">{process.env.VIETQR_ACCOUNT_NAME}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-xl bg-leaf-soft p-3 text-sm text-leaf">Trang này tự cập nhật “Đã thanh toán” trong vài giây sau khi tiền về tài khoản shop.</p>
          </div>
        </section>
      )}

      <section aria-labelledby="sum-h" className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-surface p-6">
          <h2 id="sum-h" className="font-display text-2xl font-semibold">
            Chi tiết đơn
          </h2>
          <ul className="mt-4 divide-y divide-border">
            {items.map((it) => (
              <li key={it.id} className="flex justify-between gap-3 py-3 text-sm">
                <span>
                  {it.name} <span className="text-muted">× {it.quantity}</span>
                </span>
                <span className="font-semibold">{formatVND(it.unitPrice * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Phí giao hoa</dt>
              <dd>{order.shippingFee ? formatVND(order.shippingFee) : "Miễn phí"}</dd>
            </div>
            <div className="flex justify-between text-base">
              <dt className="font-semibold">Tổng cộng</dt>
              <dd className="font-semibold text-brand-strong">{formatVND(order.total)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-6 text-sm">
          <h2 className="font-display text-2xl font-semibold">Giao hoa</h2>
          <dl className="mt-4 space-y-3">
            {[
              ["Trạng thái", orderStatusLabel[order.status]],
              ["Thanh toán", `${order.paymentMethod === "vietqr" ? "Chuyển khoản VietQR" : "Khi nhận hoa"} · ${paymentStatusLabel[order.paymentStatus]}`],
              ["Người nhận", `${order.recipientName} – ${order.recipientPhone}`],
              ["Địa chỉ", `${order.address}, ${order.city}`],
              ["Thời gian", `${new Date(order.deliveryDate).toLocaleDateString("vi-VN")} · ${order.deliveryTime}`],
              ...(order.cardMessage ? [["Thiệp", order.cardMessage]] : []),
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[100px_1fr] gap-3">
                <dt className="text-muted">{k}</dt>
                <dd className="whitespace-pre-line">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <a href={`tel:${site.phone}`} className="btn-leaf h-12">
          <Phone className="size-4" aria-hidden /> Cần hỗ trợ? Gọi {site.phoneDisplay}
        </a>
        <Link href="/" className="btn-outline h-12">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
