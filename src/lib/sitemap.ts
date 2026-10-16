import "server-only";
import { and, eq, isNotNull, max } from "drizzle-orm";
import { categories, db, pages, postCategories, productCategories, products, seoMeta } from "./db";
import { HOME_SEO_SLUG } from "./constants";
import { site } from "./site";

/**
 * Sitemap giữ nguyên cấu trúc Rank Math của website WordPress cũ:
 * /sitemap_index.xml -> post-, page-, product-, category-sitemap.xml
 * Thứ tự và lastmod lấy từ sitemap cũ (bảng seo_meta); URL mới được nối vào cuối.
 */
export const SITEMAP_NAMES = ["post", "page", "product", "category"] as const;
export type SitemapName = (typeof SITEMAP_NAMES)[number];

type Entry = { path: string; lastmod: Date | null };

async function oldEntries(name: SitemapName) {
  const rows = await db
    .select({ path: seoMeta.path, position: seoMeta.position, lastmod: seoMeta.lastmod })
    .from(seoMeta)
    .where(and(eq(seoMeta.sitemap, name), isNotNull(seoMeta.position)));
  return new Map(rows.map((r) => [r.path, r]));
}

/** Sắp xếp theo vị trí trong sitemap cũ; URL mới (không có trong sitemap cũ) xếp sau. */
function merge(old: Map<string, { position: number | null; lastmod: Date | null }>, items: { path: string; updatedAt: Date | null }[]): Entry[] {
  return items
    .map((i) => ({ path: i.path, lastmod: old.get(i.path)?.lastmod ?? i.updatedAt, pos: old.get(i.path)?.position ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.pos - b.pos)
    .map(({ path, lastmod }) => ({ path, lastmod }));
}

export async function sitemapEntries(name: SitemapName): Promise<Entry[]> {
  const old = await oldEntries(name);
  if (name === "post") {
    const rows = await db
      .select({ slug: pages.slug, updatedAt: pages.updatedAt })
      .from(pages)
      .where(and(eq(pages.type, "post"), eq(pages.isPublished, true)));
    return merge(old, rows.map((r) => ({ path: `/${r.slug}/`, updatedAt: r.updatedAt })));
  }
  if (name === "product") {
    const rows = await db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.isActive, true));
    // Như Rank Math: trang /cua-hang/ đứng đầu product-sitemap, lastmod = ngày sửa sản phẩm mới nhất
    const items = merge(old, rows.map((r) => ({ path: `/${r.slug}/`, updatedAt: r.updatedAt })));
    const newest = items.reduce<Date | null>((m, e) => (e.lastmod && (!m || e.lastmod > m) ? e.lastmod : m), null);
    return [{ path: "/cua-hang/", lastmod: newest }, ...items];
  }
  if (name === "category") {
    const rows = await db.select({ slug: postCategories.slug }).from(postCategories);
    // Rank Math không đưa danh mục rỗng vào sitemap -> chỉ giữ những danh mục có trong sitemap cũ hoặc có bài
    const postCats = merge(old, rows.map((r) => ({ path: `/${r.slug}/`, updatedAt: null }))).filter((e) => old.has(e.path) || e.lastmod);
    // Danh mục sản phẩm đang có hàng (website cũ không khai báo trong sitemap): nối vào sau, lastmod = sản phẩm mới sửa nhất
    const productCats = await db
      .select({ slug: categories.slug, updatedAt: max(products.updatedAt) })
      .from(categories)
      .innerJoin(productCategories, eq(productCategories.categoryId, categories.id))
      .innerJoin(products, and(eq(products.id, productCategories.productId), eq(products.isActive, true)))
      .groupBy(categories.id, categories.slug);
    const seen = new Set(postCats.map((e) => e.path));
    return [
      ...postCats,
      ...productCats
        .map((c) => ({ path: `/${c.slug}/`, lastmod: c.updatedAt ? new Date(c.updatedAt) : null }))
        .filter((e) => !seen.has(e.path))
        .sort((a, b) => a.path.localeCompare(b.path)),
    ];
  }
  // page: trang chủ + các trang hệ thống + trang nội dung
  const rows = await db
    .select({ slug: pages.slug, updatedAt: pages.updatedAt })
    .from(pages)
    .where(and(eq(pages.type, "page"), eq(pages.isPublished, true)));
  const fixed = ["/", "/danh-sach/", "/cua-hang/", "/tai-khoan/", "/thanh-toan/", "/gio-hang/"].map((path) => ({ path, updatedAt: null }));
  return merge(old, [...fixed, ...rows.filter((r) => r.slug !== HOME_SEO_SLUG).map((r) => ({ path: `/${r.slug}/`, updatedAt: r.updatedAt }))]);
}

const iso = (d: Date | null) => (d ? d.toISOString().replace(/\.\d{3}Z$/, "+00:00") : null);
const xmlEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function urlsetXml(entries: Entry[]) {
  const body = entries
    .map((e) => {
      const lastmod = iso(e.lastmod);
      return `\t<url>\n\t\t<loc>${xmlEscape(site.url + e.path)}</loc>${lastmod ? `\n\t\t<lastmod>${lastmod}</lastmod>` : ""}\n\t</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
}

export async function indexXml() {
  const parts = await Promise.all(
    SITEMAP_NAMES.map(async (name) => {
      const entries = await sitemapEntries(name);
      const latest = entries.reduce<Date | null>((m, e) => (e.lastmod && (!m || e.lastmod > m) ? e.lastmod : m), null);
      const lastmod = iso(latest);
      return `\t<sitemap>\n\t\t<loc>${site.url}/${name}-sitemap.xml</loc>${lastmod ? `\n\t\t<lastmod>${lastmod}</lastmod>` : ""}\n\t</sitemap>`;
    }),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${parts.join("\n")}\n</sitemapindex>\n`;
}

export function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: { "Content-Type": "text/xml; charset=UTF-8", "Cache-Control": "public, max-age=3600", "X-Robots-Tag": "noindex, follow" },
  });
}
