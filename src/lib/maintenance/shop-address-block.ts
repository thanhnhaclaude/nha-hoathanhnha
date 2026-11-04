/**
 * Thêm khối "Shop Hoa Tươi … – Hoa Thanh Nhã" kèm địa chỉ vào đầu mô tả trang khu vực (không đổi URL, tiêu đề, lưới sản phẩm).
 * Khối nằm giữa hai dấu chú thích nên chạy lại chỉ thay khối cũ. Chạy sau cùng vì syncCityPages ghi lại mô tả mỗi lần khởi động.
 * Chỉ hiển thị trên trang, không khai báo Florist: địa chỉ Florist chỉ lấy từ storeAreas trong site.ts.
 */
import type { Connection } from "mysql2/promise";
import { site } from "../site";
import { SHOP_ADDRESSES } from "./shop-addresses";

const OPEN = "<!-- shop-dia-chi -->";
const CLOSE = "<!-- /shop-dia-chi -->";
const OLD_BLOCK = new RegExp(`${OPEN}[\\s\\S]*?${CLOSE}\\s*`);
const PLUS_CODE = /\b[0-9A-Z]{4,8}\+[0-9A-Z]{2,3}\b/;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function block(name: string, addrs: string[]) {
  const phone = `<a href="tel:${site.phone}">${site.phoneDisplay}</a>`;
  const places = addrs.map((a) => `<strong>${esc(a)}</strong>`).join(" và ");
  const links = addrs
    .map((a, i) => {
      const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;
      return `<a href="${maps}" rel="nofollow noopener" target="_blank">Chỉ đường${addrs.length > 1 ? ` ${i + 1}` : ""} trên Google Maps</a>`;
    })
    .join(" · ");
  return `${OPEN}<h2>${esc(name)}</h2>\n<p>Địa chỉ: ${places}. Gọi hoặc nhắn Zalo ${phone} trước khi ghé để shop chuẩn bị sẵn mẫu, hoặc đặt online để giao tận nơi.</p>\n<p>${links}</p>\n${CLOSE}\n`;
}

export async function syncShopAddressBlocks(db: Connection): Promise<string[]> {
  let changed = 0;
  let missing = 0;
  for (const [slug, { name, addrs }] of Object.entries(SHOP_ADDRESSES)) {
    const [[row]] = (await db.query("select description from categories where slug = ?", [slug])) as [{ description: string | null }[], unknown];
    if (!row) {
      missing++;
      continue;
    }
    const next = block(name, addrs) + (row.description ?? "").replace(OLD_BLOCK, "");
    if (next !== row.description) {
      await db.query("update categories set description = ? where slug = ?", [next, slug]);
      changed++;
    }
    // Chỉ thay mô tả mẫu chung của trang thành phố; trang đã có mô tả riêng ở area-meta.ts giữ nguyên
    const street = addrs.find((a) => !PLUS_CODE.test(a))?.split(",").slice(0, 2).join(",");
    if (street) {
      const description = `${name}: ${street}. Hoa sinh nhật, khai trương, chia buồn, giao trong ngày, gửi ảnh trước. Gọi ${site.phoneDisplay}.`.slice(0, 160);
      await db.query("update seo_meta set description = ? where path = ? and description like 'Shop hoa tươi %: hoa sinh nhật%'", [description, `/${slug}/`]);
    }
  }
  return [`✓ Địa chỉ shop: ${Object.keys(SHOP_ADDRESSES).length} trang, vừa đổi ${changed}${missing ? `, không thấy ${missing}` : ""}`];
}
