import Link from "next/link";
import { and, count, desc, eq, like, or, type SQL } from "drizzle-orm";
import { db, orders, ORDER_STATUSES } from "@/lib/db";
import { formatDateTime, formatVND } from "@/lib/format";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/orders";
import { StatusBadge } from "../status-badge";

const PER_PAGE = 30;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/don-hang">) {
  const sp = await searchParams;
  const status = ORDER_STATUSES.find((s) => s === sp.status);
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const filters: SQL[] = [];
  if (status) filters.push(eq(orders.status, status));
  if (q) filters.push(or(like(orders.code, `%${q}%`), like(orders.senderPhone, `%${q}%`), like(orders.recipientPhone, `%${q}%`), like(orders.senderName, `%${q}%`))!);
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(PER_PAGE).offset((page - 1) * PER_PAGE),
    db.select({ total: count() }).from(orders).where(where),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (q) p.set("q", q);
    for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
    return `?${p}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold">Đơn hàng</h1>
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/don-hang" className={`rounded-full px-4 py-2 text-sm ${!status ? "bg-foreground text-white" : "bg-surface ring-1 ring-border"}`}>
          Tất cả
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/don-hang?status=${s}`} className={`rounded-full px-4 py-2 text-sm ${status === s ? "bg-foreground text-white" : "bg-surface ring-1 ring-border"}`}>
            {orderStatusLabel[s]}
          </Link>
        ))}
        <form className="ml-auto flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="oq" className="sr-only">
            Tìm đơn
          </label>
          <input id="oq" name="q" defaultValue={q} placeholder="Mã đơn, SĐT, tên…" className="field h-10 w-56 py-0" />
          <button className="btn-outline h-10 min-h-0">Tìm</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-surface ring-1 ring-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Mã / Ngày đặt</th>
              <th className="px-4 py-3">Người đặt</th>
              <th className="px-4 py-3">Người nhận</th>
              <th className="px-4 py-3">Ngày giao</th>
              <th className="px-4 py-3 text-right">Tổng</th>
              <th className="px-4 py-3">Thanh toán</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface-muted/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/don-hang/${o.id}`} className="font-mono font-semibold text-brand-strong hover:underline">
                    {o.code}
                  </Link>
                  <div className="text-xs text-muted">{formatDateTime(o.createdAt)}</div>
                </td>
                <td className="px-4 py-3">
                  {o.senderName}
                  <div className="text-xs text-muted">{o.senderPhone}</div>
                </td>
                <td className="px-4 py-3">
                  {o.recipientName}
                  <div className="max-w-56 truncate text-xs text-muted">{o.address}</div>
                </td>
                <td className="px-4 py-3">
                  {new Date(o.deliveryDate).toLocaleDateString("vi-VN")}
                  <div className="text-xs text-muted">{o.deliveryTime}</div>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatVND(o.total)}</td>
                <td className="px-4 py-3">
                  <div className="text-xs text-muted">{o.paymentMethod === "vietqr" ? "VietQR" : "COD"}</div>
                  <StatusBadge status={o.paymentStatus} label={paymentStatusLabel[o.paymentStatus]} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} label={orderStatusLabel[o.status]} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  Không có đơn hàng phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Trang {page}/{pages} · {total} đơn
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={qs({ page: page - 1 })} className="btn-outline h-10 min-h-0">
                Trước
              </Link>
            )}
            {page < pages && (
              <Link href={qs({ page: page + 1 })} className="btn-outline h-10 min-h-0">
                Sau
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
