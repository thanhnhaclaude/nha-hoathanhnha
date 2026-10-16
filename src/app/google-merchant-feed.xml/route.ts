import { and, eq, gt } from "drizzle-orm";
import { categories, db, productCategories, products } from "@/lib/db";
import { effectivePrice } from "@/lib/format";
import { plainText } from "@/lib/sanitize";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Nguồn cấp sản phẩm cho Google Merchant Center (RSS 2.0, chuẩn https://support.google.com/merchants/answer/7052112).
 * Trong Merchant Center: Sản phẩm → Nguồn dữ liệu → Thêm → "Tìm nạp theo lịch" với URL
 *   https://hoathanhnha.com/google-merchant-feed.xml
 * Chỉ gồm sản phẩm đang bán, có giá và có ảnh.
 */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
const abs = (u: string) => (/^https?:\/\//.test(u) ? u : `${site.url}${u.startsWith("/") ? "" : "/"}${u}`);
const money = (n: number) => `${n} VND`;
/** Số điện thoại Việt Nam, vd. 0396.72.73.74, 0396 727 374, +84 396727374 */
const PHONE = /(?:\+?84|0)\s?\d{2,3}(?:[.\s-]?\d{2,4}){2,3}/g;

export async function GET() {
  const [rows, cats] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        price: products.price,
        salePrice: products.salePrice,
        shortDescription: products.shortDescription,
        description: products.description,
        images: products.images,
      })
      .from(products)
      .where(and(eq(products.isActive, true), gt(products.price, 0))),
    db
      .select({ productId: productCategories.productId, name: categories.name, parentId: categories.parentId })
      .from(productCategories)
      .innerJoin(categories, eq(categories.id, productCategories.categoryId)),
  ]);

  // Loại sản phẩm theo website: ưu tiên danh mục con (vd. "Bó Hoa Sinh Nhật")
  const typeOf = new Map<number, string>();
  for (const c of cats) if (!typeOf.has(c.productId) || c.parentId != null) typeOf.set(c.productId, c.name);

  const items = rows
    .filter((p) => p.images.length > 0)
    .map((p) => {
      const sale = effectivePrice(p);
      // Merchant Center không cho phép số điện thoại / lời kêu gọi liên hệ trong mô tả
      // -> bỏ cả câu có số điện thoại
      const desc =
        plainText(p.description || p.shortDescription, 8000)
          .replace(PHONE, "\u0000")
          .split(/(?<=[.!?…])\s+/)
          .filter((sentence) => !sentence.includes("\u0000"))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 4900) || p.name;
      const type = typeOf.get(p.id);
      return `<item>
<g:id>${esc(p.sku || String(p.id))}</g:id>
<g:title>${esc(p.name.slice(0, 150))}</g:title>
<g:description>${esc(desc)}</g:description>
<g:link>${esc(`${site.url}/${p.slug}/`)}</g:link>
<g:image_link>${esc(abs(p.images[0]))}</g:image_link>
${p.images
  .slice(1, 11)
  .map((u) => `<g:additional_image_link>${esc(abs(u))}</g:additional_image_link>`)
  .join("\n")}
<g:availability>in_stock</g:availability>
<g:condition>new</g:condition>
<g:price>${money(p.price)}</g:price>
${sale < p.price ? `<g:sale_price>${money(sale)}</g:sale_price>` : ""}
<g:brand>${esc(site.name)}</g:brand>
<g:identifier_exists>no</g:identifier_exists>
<g:google_product_category>Home &amp; Garden &gt; Plants &gt; Flowers</g:google_product_category>
${type ? `<g:product_type>${esc(type)}</g:product_type>` : ""}
</item>`;
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(site.name)}</title>
<link>${esc(site.url)}/</link>
<description>${esc(site.description)}</description>
${items.join("\n")}
</channel>
</rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=UTF-8", "Cache-Control": "public, max-age=3600", "X-Robots-Tag": "noindex" },
  });
}
