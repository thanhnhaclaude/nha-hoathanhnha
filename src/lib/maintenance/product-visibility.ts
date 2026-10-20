/**
 * Ẩn / hiện sản phẩm theo file content/san-pham-an.txt (áp dụng khi máy chủ khởi động).
 * Dòng "slug" -> ẩn (is_active = 0); dòng "+slug" -> hiện lại (is_active = 1). Chạy lặp lại an toàn.
 */
import fs from "node:fs";
import path from "node:path";
import type { Connection } from "mysql2/promise";

export const VISIBILITY_FILE = path.join(process.cwd(), "content", "san-pham-an.txt");

export function readVisibilityRules(file = VISIBILITY_FILE) {
  if (!fs.existsSync(file)) return { hide: [] as string[], show: [] as string[] };
  const lines = fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*/, "").trim().replace(/^\/|\/$/g, ""))
    .filter(Boolean);
  return {
    hide: lines.filter((l) => !l.startsWith("+")),
    show: lines.filter((l) => l.startsWith("+")).map((l) => l.slice(1).replace(/^\/|\/$/g, "")),
  };
}

export async function applyProductVisibility(db: Connection): Promise<string[]> {
  const { hide, show } = readVisibilityRules();
  const log: string[] = [];
  for (const [slugs, active, label] of [
    [hide, 0, "ẩn"],
    [show, 1, "hiện"],
  ] as const) {
    if (!slugs.length) continue;
    const [res] = (await db.query("update products set is_active = ? where slug in (?) and is_active <> ?", [active, slugs, active])) as [{ affectedRows: number }, unknown];
    const [found] = (await db.query("select slug from products where slug in (?)", [slugs])) as [{ slug: string }[], unknown];
    const missing = slugs.filter((s) => !found.some((f) => f.slug === s));
    log.push(`✓ Sản phẩm ${label}: ${slugs.length} trong danh sách, vừa đổi ${res.affectedRows}${missing.length ? ` — không tìm thấy: ${missing.join(", ")}` : ""}`);
  }
  return log.length ? log : ["✓ Ẩn/hiện sản phẩm: danh sách trống"];
}
