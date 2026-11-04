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

/**
 * Đưa mọi trang khu vực vào danh mục bài viết Địa Điểm: mỗi trang có một mục cùng đường dẫn, URL đó vẫn hiển thị
 * trang khu vực kèm lưới sản phẩm (getVisibleCms trong [slug]/page.tsx). Ngày đăng cũ để xếp sau bài viết thật.
 */
export async function syncAreaPostEntries(db: Connection): Promise<string[]> {
  const [[cat]] = (await db.query("select id from post_categories where slug = 'dia-diem'")) as [{ id: number }[], unknown];
  if (!cat) return ["! Mục khu vực: không thấy danh mục dia-diem"];
  const [ins] = (await db.query(
    `insert ignore into pages (type, slug, title, content, image, is_published, published_at)
     select 'post', c.slug, c.name, '',
       (select json_unquote(json_extract(p.images, '$[0]')) from product_categories pc join products p on p.id = pc.product_id
        where pc.category_id = c.id and p.is_active = 1 and json_length(p.images) > 0 order by p.id desc limit 1),
       1, '2020-01-01 08:00:00'
     from categories c where c.slug like 'shop-hoa-tuoi-%'
       and exists (select 1 from product_categories pc where pc.category_id = c.id)`,
  )) as [{ affectedRows: number }, unknown];
  await db.query(
    `update pages p join seo_meta m on m.path = concat('/', p.slug, '/')
     set p.excerpt = m.description where p.type = 'post' and p.wp_id is null and p.content = '' and p.slug like 'shop-hoa-tuoi-%'`,
  );
  await db.query(
    `insert ignore into page_categories (page_id, category_id)
     select p.id, ? from pages p join categories c on c.slug = p.slug where p.type = 'post' and p.slug like 'shop-hoa-tuoi-%'`,
    [cat.id],
  );
  return [`✓ Mục khu vực trong Địa Điểm: thêm ${ins.affectedRows}`];
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
