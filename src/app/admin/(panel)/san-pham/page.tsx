import Image from "next/image";
import Link from "next/link";
import { count, desc, like, or } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db, products } from "@/lib/db";
import { effectivePrice, formatVND } from "@/lib/format";

const PER_PAGE = 40;

export default async function ProductsAdmin({ searchParams }: PageProps<"/admin/san-pham">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const where = q ? or(like(products.name, `%${q}%`), like(products.sku, `%${q}%`), like(products.slug, `%${q}%`)) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(products).where(where).orderBy(desc(products.createdAt)).limit(PER_PAGE).offset((page - 1) * PER_PAGE),
    db.select({ total: count() }).from(products).where(where),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const link = (p: number) => `?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-semibold">Sản phẩm</h1>
        <span className="text-sm text-muted">{total} sản phẩm</span>
        <Link href="/admin/san-pham/moi" className="btn-primary ml-auto h-11">
          <Plus className="size-4" aria-hidden /> Thêm sản phẩm
        </Link>
      </div>
      {sp.deleted && (
        <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm text-leaf">
          Đã xóa sản phẩm.
        </p>
      )}
      <form className="flex gap-2">
        <label htmlFor="pq" className="sr-only">
          Tìm sản phẩm
        </label>
        <input id="pq" name="q" defaultValue={q} placeholder="Tên, mã SKU, đường dẫn…" className="field h-11 max-w-sm py-0" />
        <button className="btn-outline h-11">Tìm</button>
      </form>
      <div className="overflow-x-auto rounded-2xl bg-surface ring-1 ring-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3 text-right">Giá</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const price = effectivePrice(p);
              return (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-muted/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/san-pham/${p.id}`} className="flex items-center gap-3">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                        {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                      <span>
                        <span className="font-medium hover:text-brand-strong">{p.name}</span>
                        <span className="block text-xs text-muted">/{p.slug}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {price > 0 ? formatVND(price) : <span className="text-muted">Liên hệ</span>}
                    {price < p.price && <div className="text-xs text-muted line-through">{formatVND(p.price)}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.isActive ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700"}`}>
                      {p.isActive ? "Đang bán" : "Ẩn"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Trang {page}/{pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={link(page - 1)} className="btn-outline h-10 min-h-0">
                Trước
              </Link>
            )}
            {page < pages && (
              <Link href={link(page + 1)} className="btn-outline h-10 min-h-0">
                Sau
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
