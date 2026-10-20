/**
 * Đọc bài viết trong content/bai-viet/*.md và ghi vào database (thêm mới / cập nhật theo slug).
 * Dùng chung cho `npm run content:sync` (có chấm SEO) và lúc máy chủ khởi động (src/instrumentation.ts).
 * Bài có ngày đăng tương lai vẫn được ghi; website chỉ hiện khi tới giờ (xem src/lib/published.ts).
 */
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import type { Connection } from "mysql2/promise";

export const ARTICLES_DIR = path.join(process.cwd(), "content", "bai-viet");

export type Article = {
  file: string;
  title: string;
  slug: string;
  description: string;
  keyword: string;
  publish: string;
  category: string;
  image: string | null;
  markdown: string;
};

export function parseArticle(file: string): Article {
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

export function readArticles(dir = ARTICLES_DIR) {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort() : [];
  return files.map((f) => parseArticle(path.join(dir, f)));
}

/** Markdown -> HTML. Dòng [san-pham: …] thành khối sản phẩm mà trang bài viết hiển thị bằng lưới thẻ sản phẩm. */
export function toHtml(md: string) {
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

/** Ghi một bài vào database. Trả về "thêm" hoặc "cập nhật". */
export async function upsertArticle(db: Connection, a: Article, html: string, postCats: { id: number; slug: string }[]) {
  const publishedAt = a.publish.length <= 10 ? `${a.publish} 08:00:00` : `${a.publish}:00`.slice(0, 19);
  const [[existing]] = (await db.query("select id from pages where slug = ?", [a.slug])) as [{ id: number }[], unknown];
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
  return existing ? "cập nhật" : "thêm";
}

/** Đồng bộ toàn bộ bài (không chấm SEO — việc đó do `npm run content:check` làm trước khi push). */
export async function syncArticles(db: Connection): Promise<string[]> {
  const log: string[] = [];
  const articles = readArticles();
  if (!articles.length) return ["Không có bài nào trong content/bai-viet/"];
  await db.query("SET time_zone = '+07:00'");
  const [taken] = (await db.query("select slug from categories union select slug from products")) as [{ slug: string }[], unknown];
  const takenSet = new Set(taken.map((r) => r.slug));
  const [postCats] = (await db.query("select id, slug from post_categories")) as [{ id: number; slug: string }[], unknown];
  for (const a of articles) {
    if (takenSet.has(a.slug)) {
      log.push(`! /${a.slug}/: bỏ qua, slug trùng danh mục/sản phẩm`);
      continue;
    }
    log.push(`✓ /${a.slug}/: ${await upsertArticle(db, a, toHtml(a.markdown), postCats)} (đăng ${a.publish})`);
  }
  return log;
}
