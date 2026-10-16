/**
 * Nhập danh mục + sản phẩm từ website WooCommerce hiện tại (hoathanhnha.com) vào MySQL.
 *
 *   npm run import                     # giữ link ảnh gốc trên hoathanhnha.com
 *   npm run import -- --download-images  # tải ảnh về public/uploads (nên chạy trước khi chuyển tên miền)
 *
 * Chạy lại nhiều lần an toàn: dữ liệu được cập nhật theo slug.
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

const SOURCE = process.env.IMPORT_SOURCE || "https://hoathanhnha.com";
const DOWNLOAD = process.argv.includes("--download-images");
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

  console.log("Hoàn tất!");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
