/**
 * Danh mục nhập từ website cũ nhưng trống (47 danh mục, 23/10/2026): trang bị noindex, nhiều mục nằm trong menu chính
 * (Đối tượng, Kiểu dáng, Màu sắc, Bộ sưu tập) và đang có thứ hạng (hoa tặng sếp, hoa tặng vợ, lẵng hoa…).
 * Gán mẫu theo quy tắc từ dữ liệu thật: danh mục sẵn có, khoảng giá, hoặc chữ trong tên/mô tả ngắn (màu, loài hoa).
 * CHỈ gán khi danh mục đang trống — chỉnh trong admin sau đó được giữ. Quy tắc dò chữ cần ≥ 4 mẫu, ít hơn thì để trống.
 * Danh mục shop chưa bán (bánh kem, gấu bông, nến, socola, hamper, sen đá…) không gán.
 */
import type { Connection } from "mysql2/promise";

export type Rule = { slug: string; from?: string[]; and?: string[]; text?: string[]; min?: number; max?: number; limit?: number; newest?: boolean };

const RULES: Rule[] = [
  // Đối tượng
  { slug: "hoa-tang-nguoi-yeu", from: ["hoa-tinh-yeu"] },
  { slug: "hoa-tang-vo", from: ["hoa-hong"], limit: 36 },
  { slug: "hoa-tang-chong", from: ["hoa-huong-duong", "lan-ho-diep"], limit: 36 },
  { slug: "hoa-tang-sep", from: ["hoa-gio", "lan-ho-diep"], min: 800_000 },
  { slug: "hoa-tang-ban-be", from: ["hoa-bo"], max: 700_000 },
  { slug: "hoa-tang-cho-nam", from: ["hoa-huong-duong", "lan-ho-diep"], limit: 36 },
  { slug: "hoa-tang-cho-nu", from: ["hoa-bo", "hoa-gio"], and: ["mau-hong"] },
  { slug: "hoa-tang-dong-nghiep", from: ["hoa-gio", "hoa-bo"], max: 1_000_000 },
  { slug: "hoa-tang-tre-em", from: ["hoa-baby", "hoa-bo"], max: 600_000, limit: 24 },
  { slug: "hoa-sinh-vien", from: ["hoa-mung-tot-nghiep"] },
  { slug: "hoa-cam-on", from: ["hoa-bo", "hoa-gio"], max: 800_000 },
  { slug: "hoa-chuc-suc-khoe", from: ["hoa-gio", "lan-ho-diep"], max: 1_500_000 },
  { slug: "hoa-su-kien", from: ["ke-hoa-khai-truong", "hoa-gio"], min: 1_000_000 },
  // Kiểu dáng
  { slug: "bo-hoa-tuoi", from: ["hoa-bo"] },
  { slug: "gio-hoa-tuoi", from: ["hoa-gio"] },
  { slug: "lang-hoa-khai-truong", from: ["ke-hoa-khai-truong"], max: 1_500_000 },
  { slug: "lang-hoa-chia-buon", from: ["hoa-chia-buon"] },
  { slug: "hop-hoa-tuoi", text: ["hộp hoa", "hộp"] },
  { slug: "binh-hoa-tuoi", text: ["bình hoa", "cắm bình"] },
  // Màu sắc
  { slug: "mau-trang", text: ["trắng"] },
  { slug: "mau-tim", text: ["tím"] },
  { slug: "mau-xanh", text: ["xanh"] },
  // Loài hoa
  { slug: "hoa-dong-tien", text: ["đồng tiền"] },
  { slug: "hoa-cat-tuong", text: ["cát tường"] },
  { slug: "cam-chuong", text: ["cẩm chướng"] },
  { slug: "hoa-ly", text: ["lily", "hoa ly"] },
  { slug: "hoa-tulip", text: ["tulip"] },
  { slug: "baby-flower", from: ["hoa-baby"] },
  { slug: "only-rose", from: ["hoa-hong"] },
  // Bộ sưu tập
  { slug: "mau-hoa-moi", newest: true, limit: 24 },
  { slug: "hoa-cao-cap", min: 2_000_000, newest: true },
];

const PRICE = "case when p.sale_price > 0 and p.sale_price < p.price then p.sale_price else p.price end";

export async function pick(db: Connection, r: Rule) {
  const where: string[] = ["p.is_active = 1", `${PRICE} > 0`];
  const params: unknown[] = [];
  let joins = "";
  if (r.from) {
    joins += " join product_categories a on a.product_id = p.id join categories ca on ca.id = a.category_id and ca.slug in (?)";
    params.push(r.from);
  }
  if (r.and) {
    joins += " join product_categories b on b.product_id = p.id join categories cb on cb.id = b.category_id and cb.slug in (?)";
    params.push(r.and);
  }
  // Dò chữ làm trong JS: so sánh của MySQL bỏ qua dấu ("hộp" khớp cả "kết hợp", "trắng" khớp "trang trí")
  if (r.min) where.push(`${PRICE} >= ${Number(r.min)}`);
  if (r.max) where.push(`${PRICE} <= ${Number(r.max)}`);
  const [rows] = (await db.query(
    `select distinct p.id, p.created_at, p.name, p.short_description from products p${joins} where ${where.join(" and ")} order by p.created_at desc, p.id desc`,
    params,
  )) as [{ id: number; name: string; short_description: string | null }[], unknown];
  const words = (r.text ?? []).map((t) => t.toLowerCase());
  const hit = (x: { name: string; short_description: string | null }) => {
    const text = `${x.name} ${(x.short_description ?? "").replace(/<[^>]+>/g, " ")}`.toLowerCase();
    return words.some((w) => new RegExp(`(^|[^\\p{L}])${w}($|[^\\p{L}])`, "u").test(text));
  };
  return (words.length ? rows.filter(hit) : rows).slice(0, Number(r.limit ?? 48)).map((x) => x.id);
}

export async function fillEmptyCategories(db: Connection): Promise<string[]> {
  const filled: string[] = [];
  const skipped: string[] = [];
  for (const r of RULES) {
    const [[cat]] = (await db.query(
      `select c.id,
        (select count(*) from product_categories pc join products p on p.id = pc.product_id and p.is_active = 1 where pc.category_id = c.id) as n
       from categories c where c.slug = ?`,
      [r.slug],
    )) as [{ id: number; n: number }[], unknown];
    if (!cat || Number(cat.n) > 0) continue;
    const ids = await pick(db, r);
    if (ids.length < 4) {
      skipped.push(`${r.slug} (${ids.length})`);
      continue;
    }
    await db.query("insert ignore into product_categories (product_id, category_id) values ?", [ids.map((id) => [id, cat.id])]);
    filled.push(`${r.slug} ${ids.length}`);
  }
  return [`✓ Danh mục trống: gán mẫu ${filled.length ? filled.join(", ") : "không có"}${skipped.length ? `; để trống (ít mẫu phù hợp): ${skipped.join(", ")}` : ""}`];
}
