/**
 * Đưa bài viết trong content/bai-viet/*.md lên database (thêm mới hoặc cập nhật theo slug).
 *
 *   npm run content:sync              # đồng bộ tất cả bài
 *   npm run content:sync -- --check   # chỉ kiểm tra SEO, không ghi database
 *
 * Mỗi file gồm phần khai báo giữa hai dòng "---" rồi tới nội dung Markdown:
 *   ---
 *   title: Hoa tặng thầy cô 20/11: 30 mẫu ý nghĩa theo ngân sách
 *   slug: hoa-tang-thay-co-20-11
 *   description: Câu mô tả 120–160 ký tự hiện dưới tiêu đề trên Google.
 *   keyword: hoa 20/11
 *   publish: 2026-10-19 08:00        # giờ Việt Nam; ngày tương lai = hẹn giờ đăng
 *   category: tin-tuc                 # danh mục bài viết
 *   image: /uploads/....webp          # ảnh đại diện (ảnh thật của shop)
 *   ---
 * Dòng riêng "[san-pham: slug-1, slug-2, slug-3, slug-4]" chèn lưới sản phẩm thật vào bài.
 * Có DATABASE_URL (hoặc DB_HOST/DB_USER/...) của Hostinger thì chạy được với database thật.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { marked } from "marked";
import { checkArticle, type Article } from "./seo-rules";

const DIR = path.join(process.cwd(), "content", "bai-viet");
const checkOnly = process.argv.includes("--check");

function parse(file: string): Article {
  const raw = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error(`${path.basename(file)}: thiếu phần khai báo giữa hai dòng ---`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-z]+):\s*(.*?)\s*(#.*)?$/i);
    if (kv) meta[kv[1].toLowerCase()] = kv[2].replace(/^["']|["']$/g, "");
  }
  for (const k of ["title", "slug", "description", "keyword", "publish"]) {
    if (!meta[k]) throw new Error(`${path.basename(file)}: thiếu "${k}"`);
  }
  return {
    file: path.basename(file),
    title: meta.title,
    slug: meta.slug,
    description: meta.description,
    keyword: meta.keyword,
    publish: meta.publish,
    category: meta.category || "tin-tuc",
    image: meta.image || null,
    markdown: m[2].trim(),
  };
}

/** Markdown -> HTML. Dòng [san-pham: …] thành khối sản phẩm mà trang bài viết hiển thị bằng lưới thẻ sản phẩm. */
function toHtml(md: string) {
  const withProducts = md.replace(/^\[san-pham:\s*([^\]]+)\]\s*$/gim, (_l, list: string) => {
    const items = list
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((slug) => `<div class="product-small col"><a href="https://hoathanhnha.com/${slug}/" class="woocommerce-LoopProduct-link">${slug}</a></div>`)
      .join("");
    return `\n<div class="row">${items}</div>\n`;
  });
  return marked.parse(withProducts, { async: false, gfm: true }) as string;
}

async function connect() {
  // Trên Hostinger database nằm cùng máy chủ: thiếu DB_HOST thì mặc định localhost
  const host = process.env.DB_HOST || (process.env.DB_USER && process.env.DB_NAME ? "localhost" : "");
  if (host && process.env.DB_USER) {
    return mysql.createConnection({
      host,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      timezone: "+07:00",
    });
  }
  if (!process.env.DATABASE_URL) throw new Error("Thiếu DATABASE_URL hoặc DB_HOST/DB_USER/DB_PASSWORD/DB_NAME");
  return mysql.createConnection({ uri: process.env.DATABASE_URL, timezone: "+07:00" });
}

async function main() {
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".md")).sort() : [];
  if (!files.length) return console.log("Không có bài nào trong content/bai-viet/");
  const articles = files.map((f) => parse(path.join(DIR, f)));

  const db = await connect();
  await db.query("SET time_zone = '+07:00'");
  const q = async <T>(sql: string, params: unknown[] = []) => (await db.query(sql, params))[0] as T;

  const [cats, prods, postCats, liveProducts] = await Promise.all([
    q<{ slug: string }[]>("select slug from categories"),
    q<{ slug: string }[]>("select slug from products"),
    q<{ id: number; slug: string }[]>("select id, slug from post_categories"),
    q<{ slug: string }[]>("select slug from products where is_active = 1"),
  ]);
  const taken = new Set([...cats.map((c) => c.slug), ...prods.map((p) => p.slug)]);
  const liveSet = new Set(liveProducts.map((p) => p.slug));
  const linkable = new Set(
    (
      await q<{ slug: string }[]>(
        "select distinct c.slug from categories c join product_categories pc on pc.category_id = c.id join products p on p.id = pc.product_id and p.is_active = 1",
      )
    ).map((r) => r.slug),
  );
  const postSlugs = new Set((await q<{ slug: string }[]>("select slug from pages")).map((r) => r.slug));

  let errors = 0;
  for (const a of articles) {
    const html = toHtml(a.markdown);
    const report = checkArticle(a, html, { linkable, liveProducts: liveSet, knownPages: new Set([...postSlugs, ...articles.map((x) => x.slug)]) });
    if (taken.has(a.slug)) report.errors.push(`slug "${a.slug}" trùng danh mục/sản phẩm`);
    const status = report.errors.length ? "LỖI" : report.warnings.length ? "CẢNH BÁO" : "ĐẠT";
    console.log(`\n[${status}] ${a.file} → /${a.slug}/ (đăng ${a.publish})`);
    for (const e of report.errors) console.log(`  ✗ ${e}`);
    for (const w of report.warnings) console.log(`  ! ${w}`);
    for (const ok of report.passed) console.log(`  ✓ ${ok}`);
    if (report.errors.length) {
      errors++;
      continue;
    }
    if (checkOnly) continue;

    const publishedAt = a.publish.length <= 10 ? `${a.publish} 08:00:00` : `${a.publish}:00`.slice(0, 19);
    await db.query(
      `insert into pages (type, slug, title, content, excerpt, image, is_published, published_at)
       values ('post', ?, ?, ?, ?, ?, 1, ?)
       on duplicate key update title = values(title), content = values(content), excerpt = values(excerpt),
         image = values(image), is_published = 1, published_at = values(published_at)`,
      [a.slug, a.title, html, a.description, a.image, publishedAt],
    );
    const [[page]] = (await db.query("select id from pages where slug = ?", [a.slug])) as [{ id: number }[], unknown];
    const cat = postCats.find((c) => c.slug === a.category);
    if (cat) {
      await db.query("delete from page_categories where page_id = ?", [page.id]);
      await db.query("insert into page_categories (page_id, category_id) values (?, ?)", [page.id, cat.id]);
    }
    console.log(`  → đã ${postSlugs.has(a.slug) ? "cập nhật" : "thêm"} vào database`);
  }
  await db.end();
  console.log(`\n${articles.length} bài, ${errors} bài lỗi${checkOnly ? " (chỉ kiểm tra, chưa ghi database)" : ""}.`);
  if (errors) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
