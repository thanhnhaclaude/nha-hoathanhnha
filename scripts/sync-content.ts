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
import mysql from "mysql2/promise";
import { checkArticle } from "./seo-rules";
import { readArticles, toHtml, upsertArticle } from "../src/lib/maintenance/content-sync";

const checkOnly = process.argv.includes("--check");

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
  const articles = readArticles();
  if (!articles.length) return console.log("Không có bài nào trong content/bai-viet/");

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

    console.log(`  → đã ${await upsertArticle(db, a, html, postCats)} vào database`);
  }
  await db.end();
  console.log(`\n${articles.length} bài, ${errors} bài lỗi${checkOnly ? " (chỉ kiểm tra, chưa ghi database)" : ""}.`);
  if (errors) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
