import Image from "next/image";
import Link from "next/link";
import { and, count, desc, eq, inArray, like, ne, or, type SQL } from "drizzle-orm";
import { ExternalLink, Plus } from "lucide-react";
import { db, pageCategories, pages, postCategories } from "@/lib/db";
import { HOME_SEO_SLUG } from "@/lib/constants";

const PER_PAGE = 40;

export default async function PostsAdmin({ searchParams }: PageProps<"/admin/bai-viet">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const type = sp.type === "page" ? "page" : "post";
  const cat = Number(sp.cat) || null;
  const page = Math.max(1, Number(sp.page) || 1);

  // Bản ghi ẩn chứa đoạn SEO trang chủ không hiển thị ở đây
  const filters: SQL[] = [eq(pages.type, type), ne(pages.slug, HOME_SEO_SLUG)];
  if (q) filters.push(or(like(pages.title, `%${q}%`), like(pages.slug, `%${q}%`))!);
  if (cat) filters.push(inArray(pages.id, db.select({ id: pageCategories.pageId }).from(pageCategories).where(eq(pageCategories.categoryId, cat))));
  const where = and(...filters);

  const [rows, [{ total }], cats] = await Promise.all([
    db
      .select({ id: pages.id, slug: pages.slug, title: pages.title, image: pages.image, isPublished: pages.isPublished, publishedAt: pages.publishedAt })
      .from(pages)
      .where(where)
      .orderBy(desc(pages.publishedAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ total: count() }).from(pages).where(where),
    db.select().from(postCategories).orderBy(postCategories.name),
  ]);
  const list = rows;
  const pages_ = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams({ type, ...(q ? { q } : {}), ...(cat ? { cat: String(cat) } : {}) });
    for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
    return `?${p}`;
  };
  const tab = (active: boolean) => `rounded-full px-4 py-2 text-sm ${active ? "bg-foreground text-white" : "bg-surface ring-1 ring-border"}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-semibold">Bài viết & trang</h1>
        <span className="text-sm text-muted">{total} mục</span>
        <Link href={`/admin/bai-viet/moi/?type=${type}`} className="btn-primary ml-auto h-11">
          <Plus className="size-4" aria-hidden /> {type === "post" ? "Viết bài mới" : "Thêm trang"}
        </Link>
      </div>
      {sp.deleted && (
        <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm text-leaf">
          Đã xóa.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/bai-viet/?type=post" className={tab(type === "post" && !cat)}>
          Tất cả bài viết
        </Link>
        {type === "post" &&
          cats.map((c) => (
            <Link key={c.id} href={`/admin/bai-viet/?type=post&cat=${c.id}`} className={tab(cat === c.id)}>
              {c.name}
            </Link>
          ))}
        <Link href="/admin/bai-viet/?type=page" className={tab(type === "page")}>
          Trang thông tin
        </Link>
        <form className="ml-auto flex gap-2">
          <input type="hidden" name="type" value={type} />
          {cat && <input type="hidden" name="cat" value={cat} />}
          <label htmlFor="bq" className="sr-only">
            Tìm bài viết
          </label>
          <input id="bq" name="q" defaultValue={q} placeholder="Tiêu đề, đường dẫn…" className="field h-10 w-56 py-0" />
          <button className="btn-outline h-10 min-h-0">Tìm</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-surface ring-1 ring-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Ngày đăng</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-muted/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/bai-viet/${p.id}/`} className="flex items-center gap-3">
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                      {p.image && <Image src={p.image} alt="" fill sizes="48px" className="object-cover" />}
                    </span>
                    <span>
                      <span className="font-medium hover:text-brand-strong">{p.title}</span>
                      <span className="block text-xs text-muted">/{p.slug}/</span>
                    </span>
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3">{p.publishedAt.toLocaleDateString("vi-VN")}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700"}`}>
                    {p.isPublished ? "Đã đăng" : "Bản nháp"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/${p.slug}/`} target="_blank" className="inline-flex items-center gap-1 text-xs text-brand-strong hover:underline">
                    Xem <ExternalLink className="size-3" aria-hidden />
                  </Link>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted">
                  Không có mục nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages_ > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Trang {page}/{pages_}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={qs({ page: page - 1 })} className="btn-outline h-10 min-h-0">
                Trước
              </Link>
            )}
            {page < pages_ && (
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
