/**
 * Nhập danh mục + sản phẩm từ website WooCommerce hiện tại (hoathanhnha.com) vào MySQL.
 *
 *   npm run import                     # giữ link ảnh gốc trên hoathanhnha.com
 *   npm run import -- --download-images  # tải ảnh về public/uploads (nên chạy trước khi chuyển tên miền)
 *   npm run import -- --content-only     # chỉ nhập trang, bài viết và đoạn SEO trang chủ
 *   npm run import -- --seo-only         # chỉ chép tiêu đề/mô tả/robots/lastmod SEO từ website cũ
 *
 * Chạy lại nhiều lần an toàn: dữ liệu được cập nhật theo slug.
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
import { HOME_SEO_SLUG } from "../src/lib/constants";

const SOURCE = process.env.IMPORT_SOURCE || "https://hoathanhnha.com";
const DOWNLOAD = process.argv.includes("--download-images");
const CONTENT_ONLY = process.argv.includes("--content-only");
const SEO_ONLY = process.argv.includes("--seo-only");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

type WooCategory = { id: number; name: string; slug: string; parent: number; description: string; image: { src: string } | null };
type WooProduct = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  short_description: string;
  description: string;
  prices: { regular_price: string; sale_price: string; price: string };
  images: { src: string }[];
  categories: { id: number; slug: string }[];
};

async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; ; page++) {
    const url = `${SOURCE}/wp-json/wc/store/v1/${endpoint}${endpoint.includes("?") ? "&" : "?"}per_page=100&page=${page}`;
    const res = await fetch(url, { headers: { "User-Agent": "hoathanhnha-migrator" } });
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    const batch = (await res.json()) as T[];
    out.push(...batch);
    const totalPages = Number(res.headers.get("x-wp-totalpages") || 1);
    process.stdout.write(`\r  ${endpoint}: trang ${page}/${totalPages}`);
    if (page >= totalPages || batch.length === 0) break;
  }
  process.stdout.write("\n");
  return out;
}

const decode = (s: string) =>
  s
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "’")
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

async function localizeImage(src: string) {
  if (!DOWNLOAD || !src) return src;
  const u = new URL(src);
  const rel = u.pathname.replace(/^\/wp-content\/uploads\//, "");
  const dest = path.join(UPLOAD_DIR, rel);
  try {
    await fs.access(dest);
  } catch {
    const res = await fetch(src);
    if (!res.ok) return src;
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  }
  return `/uploads/${rel}`;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Thiếu DATABASE_URL trong .env");
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 4 });
  const db = drizzle(pool, { schema, mode: "default" });

  console.log(`Nguồn: ${SOURCE}`);
  if (SEO_ONLY) {
    await importSeo(db);
    console.log("Hoàn tất!");
    await pool.end();
    return;
  }
  if (CONTENT_ONLY) {
    await importWordpressContent(db);
    console.log("Hoàn tất!");
    await pool.end();
    return;
  }
  const wooCats = await fetchAll<WooCategory>("products/categories");
  const wooProducts = await fetchAll<WooProduct>("products?orderby=date&order=asc");
  console.log(`Tìm thấy ${wooCats.length} danh mục, ${wooProducts.length} sản phẩm`);

  // 1) Danh mục (chưa gán cha)
  const catIdByWoo = new Map<number, number>();
  for (const [i, c] of wooCats.entries()) {
    const values = {
      name: decode(c.name),
      slug: c.slug,
      description: c.description || null,
      image: c.image?.src ? await localizeImage(c.image.src) : null,
      sortOrder: i,
      wooId: c.id,
    };
    await db.insert(schema.categories).values(values).onDuplicateKeyUpdate({ set: values });
    const [row] = await db.select({ id: schema.categories.id }).from(schema.categories).where(eq(schema.categories.slug, c.slug));
    catIdByWoo.set(c.id, row.id);
  }
  // 2) Gán danh mục cha
  for (const c of wooCats) {
    const parentId = c.parent ? (catIdByWoo.get(c.parent) ?? null) : null;
    await db.update(schema.categories).set({ parentId }).where(eq(schema.categories.id, catIdByWoo.get(c.id)!));
  }

  // 3) Sản phẩm (cũ -> mới để created_at giữ đúng thứ tự "mới nhất")
  let done = 0;
  const base = Date.now() - wooProducts.length * 60_000;
  for (const [i, p] of wooProducts.entries()) {
    const regular = Number(p.prices.regular_price || p.prices.price || 0);
    const sale = Number(p.prices.sale_price || 0);
    const images = await Promise.all(p.images.map((img) => localizeImage(img.src)));
    const values = {
      name: decode(p.name),
      slug: p.slug,
      sku: p.sku || null,
      price: regular,
      salePrice: sale > 0 && sale < regular ? sale : null,
      shortDescription: p.short_description || null,
      description: p.description || null,
      images,
      isActive: true,
      wooId: p.id,
      createdAt: new Date(base + i * 60_000),
    };
    await db.insert(schema.products).values(values).onDuplicateKeyUpdate({ set: values });
    const [row] = await db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.slug, p.slug));
    await db.delete(schema.productCategories).where(eq(schema.productCategories.productId, row.id));
    const links = p.categories
      .map((c) => catIdByWoo.get(c.id))
      .filter((id): id is number => id != null)
      .map((categoryId) => ({ productId: row.id, categoryId }));
    if (links.length) await db.insert(schema.productCategories).ignore().values(links);
    done++;
    if (done % 25 === 0 || done === wooProducts.length) process.stdout.write(`\r  Đã nhập ${done}/${wooProducts.length} sản phẩm`);
  }
  process.stdout.write("\n");

  // 4) Danh mục có trong menu nhưng không trả về từ API (danh mục rỗng) -> tạo để đường dẫn không bị 404
  const { mainMenu } = await import("../src/lib/menu");
  for (const group of mainMenu) {
    for (const item of [{ label: group.label, slug: group.slug }, ...group.children]) {
      const [exists] = await db.select({ id: schema.categories.id }).from(schema.categories).where(eq(schema.categories.slug, item.slug));
      if (!exists) await db.insert(schema.categories).values({ name: item.label, slug: item.slug, sortOrder: 9999 });
    }
  }

  // 5) Trang thông tin (footer) + toàn bộ bài viết tin tức từ WordPress
  await importWordpressContent(db);

  // 6) SEO (tiêu đề, mô tả, robots, lastmod) giữ nguyên như website cũ
  await importSeo(db);

  console.log("Hoàn tất!");
  await pool.end();
}

/** Các trang WordPress cần chuyển sang (liên kết ở footer). */
const WP_PAGE_SLUGS = [
  "cau-hoi-thuong-gap",
  "huong-dan-doi-tra",
  "huong-dan-dat-hang",
  "huong-dan-thanh-toan",
  "chinh-sach-bao-mat",
  "lien-he",
  "quy-dinh-chuyen-phat",
  "quy-trinh-dien-hoa",
  "gop-y-khieu-nai-phan-hoi",
  "gioi-thieu",
  "chinh-sach-hoan-tien-va-tra-hang",
];

/** Lấy phần "VỀ CHÚNG TÔI" ở cuối trang chủ WordPress (nội dung SEO). */
async function importHomeSeo(db: MySql2Database<typeof schema>) {
  const [home] = await fetchWp("pages?slug=trang-chu");
  if (!home) return console.warn("  Không tìm thấy trang chủ WordPress");
  const html = home.content.rendered;
  const marker = html.search(/<h2[^>]*>\s*(?:<strong>)?\s*V(?:Ề|&#7872;) CHÚNG TÔI/i);
  if (marker < 0) return console.warn("  Không tìm thấy mục 'VỀ CHÚNG TÔI' trên trang chủ");
  const values = {
    type: "page" as const,
    slug: HOME_SEO_SLUG,
    title: "Về chúng tôi",
    content: stripShortcodes(html.slice(marker)),
    isPublished: false,
    wpId: home.id,
  };
  await db.insert(schema.pages).values(values).onDuplicateKeyUpdate({ set: values });
  console.log("  Đã nhập đoạn SEO trang chủ");
}

type WpItem = {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  categories?: number[];
  _embedded?: { "wp:featuredmedia"?: { source_url?: string }[] };
};

type WpCategory = { id: number; slug: string; name: string; description: string };

/** Bỏ shortcode WordPress còn sót (vd. [ux_image id="1"]). */
const stripShortcodes = (html: string) => html.replace(/\[\/?[a-z_][\w-]*(?:\s[^\]]*)?\]/gi, "");

async function fetchWp(path: string): Promise<WpItem[]> {
  const out: WpItem[] = [];
  for (let page = 1; ; page++) {
    const url = `${SOURCE}/wp-json/wp/v2/${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}&_embed=wp:featuredmedia`;
    const res = await fetch(url, { headers: { "User-Agent": "hoathanhnha-migrator" } });
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    out.push(...((await res.json()) as WpItem[]));
    if (page >= Number(res.headers.get("x-wp-totalpages") || 1)) break;
  }
  return out;
}

async function importWordpressContent(db: MySql2Database<typeof schema>) {
  const wpPages = await fetchWp(`pages?slug=${WP_PAGE_SLUGS.join(",")}`);
  const wpPosts = await fetchWp("posts?orderby=date&order=asc");
  console.log(`Tìm thấy ${wpPages.length} trang, ${wpPosts.length} bài viết`);

  // Danh mục bài viết
  const catRes = await fetch(`${SOURCE}/wp-json/wp/v2/categories?per_page=100`, { headers: { "User-Agent": "hoathanhnha-migrator" } });
  const wpCats = (await catRes.json()) as WpCategory[];
  const postCatIdByWp = new Map<number, number>();
  for (const c of wpCats) {
    const values = { slug: c.slug, name: decode(c.name), description: c.description || null, wpId: c.id };
    await db.insert(schema.postCategories).values(values).onDuplicateKeyUpdate({ set: values });
    const [row] = await db.select({ id: schema.postCategories.id }).from(schema.postCategories).where(eq(schema.postCategories.slug, c.slug));
    postCatIdByWp.set(c.id, row.id);
  }

  const items = [...wpPages.map((p) => ({ p, type: "page" as const })), ...wpPosts.map((p) => ({ p, type: "post" as const }))];
  let done = 0;
  for (const { p, type } of items) {
    const image = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    const values = {
      type,
      slug: p.slug,
      title: decode(p.title.rendered),
      content: stripShortcodes(p.content.rendered),
      excerpt: p.excerpt.rendered || null,
      image: image ? await localizeImage(image) : null,
      wpId: p.id,
      publishedAt: new Date(p.date),
    };
    await db.insert(schema.pages).values(values).onDuplicateKeyUpdate({ set: values });
    if (type === "post") {
      const [row] = await db.select({ id: schema.pages.id }).from(schema.pages).where(eq(schema.pages.slug, p.slug));
      await db.delete(schema.pageCategories).where(eq(schema.pageCategories.pageId, row.id));
      const links = (p.categories ?? [])
        .map((id) => postCatIdByWp.get(id))
        .filter((id): id is number => id != null)
        .map((categoryId) => ({ pageId: row.id, categoryId }));
      if (links.length) await db.insert(schema.pageCategories).ignore().values(links);
    }
    done++;
    if (done % 25 === 0 || done === items.length) process.stdout.write(`\r  Đã nhập ${done}/${items.length} trang & bài viết`);
  }
  process.stdout.write("\n");
  await importHomeSeo(db);
}

const SITEMAPS = ["post", "page", "product", "category"] as const;

const decodeEntities = (s: string) =>
  decode(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .trim();

/** Chạy tác vụ bất đồng bộ với số luồng giới hạn. */
async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

/**
 * Chép nguyên SEO của website cũ: vị trí + lastmod trong sitemap Rank Math, và
 * title / meta description / robots trong <head> của từng URL (kể cả danh mục sản phẩm).
 */
async function importSeo(db: MySql2Database<typeof schema>) {
  type Entry = { path: string; sitemap: string | null; position: number | null; lastmod: Date | null };
  const entries = new Map<string, Entry>();
  for (const name of SITEMAPS) {
    const xml = await (await fetch(`${SOURCE}/${name}-sitemap.xml`, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
    const urls = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)];
    urls.forEach((m, position) => {
      const path = new URL(m[1]).pathname;
      // Một URL có thể nằm ở 2 sitemap (vd. /cua-hang/ ở page và product) -> giữ vị trí ở sitemap đầu tiên
      if (!entries.has(path)) entries.set(path, { path, sitemap: name, position, lastmod: m[2] ? new Date(m[2]) : null });
    });
    console.log(`  ${name}-sitemap.xml: ${urls.length} URL`);
  }
  // Danh mục sản phẩm không nằm trong sitemap cũ nhưng vẫn được Google index -> lấy SEO luôn
  const cats = await db.select({ slug: schema.categories.slug }).from(schema.categories);
  for (const c of cats) {
    const path = `/${c.slug}/`;
    if (!entries.has(path)) entries.set(path, { path, sitemap: null, position: null, lastmod: null });
  }

  const list = [...entries.values()];
  let done = 0;
  let missing = 0;
  await pool(list, 8, async (e) => {
    let title: string | null = null;
    let description: string | null = null;
    let robots: string | null = null;
    try {
      const res = await fetch(`${SOURCE}${e.path}`, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (res.ok) {
        const html = await res.text();
        const head = html.slice(0, html.indexOf("</head>") > 0 ? html.indexOf("</head>") : 60000);
        const get = (re: RegExp) => head.match(re)?.[1];
        title = get(/<title>([^<]*)<\/title>/) ?? null;
        description = get(/<meta name="description" content="([^"]*)"/) ?? null;
        robots = get(/<meta name="robots" content="([^"]*)"/) ?? null;
      } else missing++;
    } catch {
      missing++;
    }
    const values = {
      title: title ? decodeEntities(title) : null,
      // Bỏ mô tả rác do shortcode sinh ra (vd. [block id="goi-ngay"])
      description: description && !/\[[a-z_]+/i.test(decodeEntities(description)) ? decodeEntities(description) : null,
      robots,
      sitemap: e.sitemap,
      position: e.position,
      lastmod: e.lastmod,
    };
    await db.insert(schema.seoMeta).values({ path: e.path, ...values }).onDuplicateKeyUpdate({ set: values });
    done++;
    if (done % 50 === 0 || done === list.length) process.stdout.write(`\r  Đã lấy SEO ${done}/${list.length} URL`);
  });
  process.stdout.write("\n");
  if (missing) console.warn(`  ${missing} URL không tải được (giữ SEO mặc định)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
