/**
 * Thẻ (tag) cho bài viết và sản phẩm. Admin nhập tên thẻ cách nhau bằng dấu phẩy; thẻ mới tự được tạo.
 * Trang thẻ: /the/<slug>/ (noindex — trang lọc, tránh trùng nội dung với danh mục; vẫn cho Google đi theo link).
 */
import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, pages, pageTags, products, productTags, tags } from "./db";
import { slugify } from "./format";
import { livePage } from "./published";

/** "Hoa hồng, tặng mẹ ,hoa hồng" -> ["Hoa hồng", "tặng mẹ"] (bỏ trùng theo slug, tối đa 15 thẻ, mỗi thẻ ≤ 60 ký tự) */
export function parseTagInput(input: string | null | undefined) {
  const seen = new Set<string>();
  const out: { name: string; slug: string }[] = [];
  for (const raw of (input ?? "").split(/[,;\n]/)) {
    const name = raw.trim().replace(/\s+/g, " ").slice(0, 60);
    const slug = slugify(name);
    if (!name || !slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ name, slug });
  }
  return out.slice(0, 15);
}

async function ensureTags(list: { name: string; slug: string }[]) {
  if (!list.length) return [];
  await db.insert(tags).values(list).onDuplicateKeyUpdate({ set: { slug: sql`slug` } });
  return db.select().from(tags).where(inArray(tags.slug, list.map((t) => t.slug)));
}

export async function setPageTags(pageId: number, input: string | null | undefined) {
  const rows = await ensureTags(parseTagInput(input));
  await db.delete(pageTags).where(eq(pageTags.pageId, pageId));
  if (rows.length) await db.insert(pageTags).values(rows.map((t) => ({ pageId, tagId: t.id })));
}

export async function setProductTags(productId: number, input: string | null | undefined) {
  const rows = await ensureTags(parseTagInput(input));
  await db.delete(productTags).where(eq(productTags.productId, productId));
  if (rows.length) await db.insert(productTags).values(rows.map((t) => ({ productId, tagId: t.id })));
}

export async function getPageTags(pageId: number) {
  return db.select({ id: tags.id, name: tags.name, slug: tags.slug }).from(pageTags).innerJoin(tags, eq(tags.id, pageTags.tagId)).where(eq(pageTags.pageId, pageId)).orderBy(tags.name);
}

export async function getProductTags(productId: number) {
  return db.select({ id: tags.id, name: tags.name, slug: tags.slug }).from(productTags).innerJoin(tags, eq(tags.id, productTags.tagId)).where(eq(productTags.productId, productId)).orderBy(tags.name);
}

export async function getTagBySlug(slug: string) {
  const [t] = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  return t ?? null;
}

export async function getTaggedPosts(tagId: number, limit = 24) {
  return db
    .select({ id: pages.id, slug: pages.slug, title: pages.title, image: pages.image, publishedAt: pages.publishedAt })
    .from(pageTags)
    .innerJoin(pages, eq(pages.id, pageTags.pageId))
    .where(and(eq(pageTags.tagId, tagId), eq(pages.type, "post"), livePage()))
    .orderBy(desc(pages.publishedAt))
    .limit(limit);
}

export async function getTaggedProductSlugs(tagId: number, limit = 48) {
  const rows = await db
    .select({ slug: products.slug })
    .from(productTags)
    .innerJoin(products, eq(products.id, productTags.productId))
    .where(and(eq(productTags.tagId, tagId), eq(products.isActive, true)))
    .orderBy(desc(products.createdAt))
    .limit(limit);
  return rows.map((r) => r.slug);
}
