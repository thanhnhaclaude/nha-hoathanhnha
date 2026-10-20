/**
 * Sửa tiêu đề SEO (bảng seo_meta, chép từ Rank Math của website cũ) bị ghi nhầm mã sản phẩm,
 * vd. /hoa-bo-hb040/ có tiêu đề "Hoa Bó - HB041" -> trùng tiêu đề với /hoa-bo-hb041/ trên Google.
 * Chỉ sửa khi đường dẫn kết thúc bằng một mã (hb040) và tiêu đề chứa đúng MỘT mã cùng loại nhưng khác số.
 * Chạy nhiều lần vẫn an toàn.
 */
import type { Connection } from "mysql2/promise";

const CODE = /\b([A-Z]{1,4})(\d{2,4})\b/g;

export async function fixSeoTitleCodes(db: Connection): Promise<string[]> {
  const [rows] = (await db.query("select path, title from seo_meta where title is not null")) as [{ path: string; title: string }[], unknown];
  const fixed: string[] = [];
  for (const { path, title } of rows) {
    const m = path.match(/-([a-z]{1,4})(\d{2,4})\/$/i);
    if (!m) continue;
    const code = `${m[1]}${m[2]}`.toUpperCase();
    const inTitle = [...title.matchAll(CODE)];
    if (inTitle.length !== 1) continue;
    const [found, prefix] = inTitle[0];
    if (found === code || prefix !== m[1].toUpperCase()) continue;
    await db.query("update seo_meta set title = ? where path = ?", [title.replace(found, code), path]);
    fixed.push(`${path} (${found} → ${code})`);
  }
  return [`✓ Tiêu đề SEO sai mã sản phẩm: ${fixed.length ? `đã sửa ${fixed.join(", ")}` : "không có"}`];
}
