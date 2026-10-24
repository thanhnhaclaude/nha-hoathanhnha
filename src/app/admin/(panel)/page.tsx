import Link from "next/link";
import { count, desc, eq, sql, sum } from "drizzle-orm";
import { db, orders, products } from "@/lib/db";
import { formatDateTime, formatVND } from "@/lib/format";
import { orderStatusLabel } from "@/lib/orders";
import { StatusBadge } from "./status-badge";

export default async function Dashboard() {
  const [[{ productCount }], [{ pendingCount }], [{ todayRevenue, todayOrders }], recent] = await Promise.all([
    db.select({ productCount: count() }).from(products).where(eq(products.isActive, true)),
    db.select({ pendingCount: count() }).from(orders).where(eq(orders.status, "pending")),
    db
      .select({ todayRevenue: sum(orders.total), todayOrders: count() })
      .from(orders)
      .where(sql`DATE(${orders.createdAt}) = CURDATE() AND ${orders.status} <> 'cancelled'`),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10),
  ]);

  const stats = [
    { label: "Đơn chờ xác nhận", value: pendingCount, href: "/admin/don-hang?status=pending" },
    { label: "Đơn hôm nay", value: todayOrders, href: "/admin/don-hang" },
    { label: "Doanh thu hôm nay", value: formatVND(Number(todayRevenue ?? 0)), href: "/admin/don-hang" },
    { label: "Sản phẩm đang bán", value: productCount, href: "/admin/san-pham" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl font-bold">Tổng quan</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl bg-surface p-5 ring-1 ring-border hover:ring-brand">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{s.value}</p>
          </Link>
        ))}
      </div>
      <section className="rounded-2xl bg-surface ring-1 ring-border">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-lg font-semibold">Đơn hàng mới nhất</h2>
          <Link href="/admin/don-hang" className="text-sm text-brand-strong hover:underline">
            Xem tất cả
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-border bg-surface-muted text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-3">Mã</th>
                <th className="px-5 py-3">Khách</th>
                <th className="px-5 py-3">Giao</th>
                <th className="px-5 py-3 text-right">Tổng</th>
                <th className="px-5 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface-muted/60">
                  <td className="px-5 py-3 font-mono">
                    <Link href={`/admin/don-hang/${o.id}`} className="text-brand-strong hover:underline">
                      {o.code}
                    </Link>
                    <div className="text-xs text-muted">{formatDateTime(o.createdAt)}</div>
                  </td>
                  <td className="px-5 py-3">
                    {o.senderName}
                    <div className="text-xs text-muted">{o.senderPhone}</div>
                  </td>
                  <td className="px-5 py-3">
                    {new Date(o.deliveryDate).toLocaleDateString("vi-VN")}
                    <div className="text-xs text-muted">{o.deliveryTime}</div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatVND(o.total)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={o.status} label={orderStatusLabel[o.status]} />
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    Chưa có đơn hàng.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
