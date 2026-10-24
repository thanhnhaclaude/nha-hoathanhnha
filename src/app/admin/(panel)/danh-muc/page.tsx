import Link from "next/link";
import { count, eq, sql } from "drizzle-orm";
import { ExternalLink, Plus } from "lucide-react";
import { categories, db, pageCategories, pageTags, postCategories, productCategories, productTags, tags } from "@/lib/db";
import { deleteCategory, saveCategory, saveTag } from "./actions";

type Kind = "product" | "post" | "tag";

export default async function CategoriesAdmin({ searchParams }: PageProps<"/admin/danh-muc">) {
  const sp = await searchParams;
  const kind: Kind = sp.kind === "post" ? "post" : sp.kind === "tag" ? "tag" : "product";
  const msg = typeof sp.msg === "string" ? sp.msg : "";
  const tab = (active: boolean) => `rounded-full px-4 py-2 text-sm ${active ? "bg-foreground text-white" : "bg-surface ring-1 ring-border"}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-bold">Danh mục & thẻ</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/danh-muc/?kind=product" className={tab(kind === "product")}>
          Danh mục sản phẩm
        </Link>
        <Link href="/admin/danh-muc/?kind=post" className={tab(kind === "post")}>
          Danh mục bài viết
        </Link>
        <Link href="/admin/danh-muc/?kind=tag" className={tab(kind === "tag")}>
          Thẻ (tag)
        </Link>
      </div>
      {msg && (
        <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm text-leaf">
          {msg}
        </p>
      )}
      {kind === "tag" ? <TagList /> : <CategoryList kind={kind} />}
    </div>
  );
}

async function CategoryList({ kind }: { kind: "product" | "post" }) {
  const rows =
    kind === "product"
      ? await db
          .select({ id: categories.id, name: categories.name, slug: categories.slug, parentId: categories.parentId, description: categories.description, n: sql<number>`(select count(*) from ${productCategories} where ${productCategories.categoryId} = ${categories.id})` })
          .from(categories)
          .orderBy(categories.name)
      : await db
          .select({ id: postCategories.id, name: postCategories.name, slug: postCategories.slug, parentId: sql<number | null>`null`, description: postCategories.description, n: sql<number>`(select count(*) from ${pageCategories} where ${pageCategories.categoryId} = ${postCategories.id})` })
          .from(postCategories)
          .orderBy(postCategories.name);
  const roots = rows.filter((r) => r.parentId == null);
  const childrenOf = (id: number) => rows.filter((r) => r.parentId === id);
  const ordered = roots.flatMap((r) => [{ ...r, depth: 0 }, ...childrenOf(r.id).flatMap((c) => [{ ...c, depth: 1 }, ...childrenOf(c.id).map((g) => ({ ...g, depth: 2 }))])]);
  const parentSelect = (selected?: number | null, self?: number) => (
    <select name="parentId" defaultValue={selected ?? ""} className="field">
      <option value="">— Không có (danh mục gốc) —</option>
      {ordered
        .filter((r) => r.depth < 2 && r.id !== self)
        .map((r) => (
          <option key={r.id} value={r.id}>
            {r.depth ? "— " : ""}
            {r.name}
          </option>
        ))}
    </select>
  );

  return (
    <div className="space-y-6">
      <details className="rounded-2xl bg-surface p-6 ring-1 ring-border">
        <summary className="flex cursor-pointer items-center gap-2 font-semibold">
          <Plus className="size-4" aria-hidden /> Thêm {kind === "product" ? "danh mục sản phẩm" : "danh mục bài viết"}
        </summary>
        <form action={saveCategory} className="mt-4 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="kind" value={kind} />
          <div>
            <label className="label" htmlFor="new-name">
              Tên *
            </label>
            <input id="new-name" name="name" required className="field" placeholder={kind === "product" ? "Hoa tặng thầy cô" : "Kinh nghiệm chọn hoa"} />
          </div>
          <div>
            <label className="label" htmlFor="new-slug">
              Đường dẫn (để trống tự tạo)
            </label>
            <input id="new-slug" name="slug" className="field" placeholder="hoa-tang-thay-co" />
          </div>
          {kind === "product" && (
            <div>
              <span className="label">Danh mục cha</span>
              {parentSelect()}
            </div>
          )}
          <div className="md:col-span-2">
            <label className="label" htmlFor="new-desc">
              Mô tả (HTML, hiện trên trang danh mục — nên viết ít nhất 300 chữ để Google xếp hạng)
            </label>
            <textarea id="new-desc" name="description" rows={5} className="field font-mono text-sm" />
          </div>
          <button className="btn-primary h-11 md:w-fit">Thêm</button>
        </form>
      </details>

      <div className="overflow-x-auto rounded-2xl bg-surface ring-1 ring-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">{kind === "product" ? "Sản phẩm" : "Bài viết"}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {ordered.map((r) => (
              <tr key={r.id} className="border-b border-border align-top last:border-0">
                <td className="px-4 py-3" style={{ paddingLeft: `${1 + r.depth * 1.5}rem` }}>
                  <details>
                    <summary className="cursor-pointer">
                      <span className="font-medium">{r.name}</span> <span className="text-xs text-muted">/{r.slug}/</span>
                    </summary>
                    <form action={saveCategory} className="mt-3 grid max-w-2xl gap-3">
                      <input type="hidden" name="kind" value={kind} />
                      <input type="hidden" name="id" value={r.id} />
                      <input name="name" defaultValue={r.name} required className="field" aria-label="Tên" />
                      <input name="slug" defaultValue={r.slug} className="field" aria-label="Đường dẫn" />
                      <p className="text-xs text-muted">Đổi đường dẫn của trang đã có thứ hạng sẽ làm mất thứ hạng của đường dẫn cũ.</p>
                      {kind === "product" && parentSelect(r.parentId, r.id)}
                      <textarea name="description" rows={6} defaultValue={r.description ?? ""} className="field font-mono text-xs" aria-label="Mô tả" />
                      <button className="btn-primary h-10 min-h-0 w-fit">Lưu</button>
                    </form>
                  </details>
                </td>
                <td className="px-4 py-3">{Number(r.n)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Link href={`/${r.slug}/`} target="_blank" className="mr-3 inline-flex items-center gap-1 text-xs text-brand-strong hover:underline">
                    Xem <ExternalLink className="size-3" aria-hidden />
                  </Link>
                  {Number(r.n) === 0 && childrenOf(r.id).length === 0 && (
                    <form action={deleteCategory} className="inline">
                      <input type="hidden" name="kind" value={kind} />
                      <input type="hidden" name="id" value={r.id} />
                      <button className="cursor-pointer text-xs text-danger hover:underline">Xóa</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function TagList() {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      posts: sql<number>`(select count(*) from ${pageTags} where ${pageTags.tagId} = ${tags.id})`,
      products: sql<number>`(select count(*) from ${productTags} where ${productTags.tagId} = ${tags.id})`,
    })
    .from(tags)
    .orderBy(tags.name);
  const [{ total }] = await db.select({ total: count() }).from(tags).where(eq(tags.id, tags.id));
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {total} thẻ. Thêm thẻ trong ô “Thẻ (tag)” khi sửa bài viết hoặc sản phẩm. Trang thẻ /the/…/ không cho Google lập chỉ mục để tránh trùng nội dung với danh mục.
      </p>
      <div className="overflow-x-auto rounded-2xl bg-surface ring-1 ring-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Thẻ</th>
              <th className="px-4 py-3">Bài viết</th>
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <form action={saveTag} className="flex gap-2">
                    <input type="hidden" name="id" value={t.id} />
                    <input name="name" defaultValue={t.name} className="field h-9 w-56 py-0" aria-label="Tên thẻ" />
                    <button className="btn-outline h-9 min-h-0">Lưu</button>
                  </form>
                </td>
                <td className="px-4 py-3">{Number(t.posts)}</td>
                <td className="px-4 py-3">{Number(t.products)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Link href={`/the/${t.slug}/`} target="_blank" className="mr-3 inline-flex items-center gap-1 text-xs text-brand-strong hover:underline">
                    Xem <ExternalLink className="size-3" aria-hidden />
                  </Link>
                  <form action={saveTag} className="inline">
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="delete" value="1" />
                    <button className="cursor-pointer text-xs text-danger hover:underline">Xóa</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Chưa có thẻ nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
