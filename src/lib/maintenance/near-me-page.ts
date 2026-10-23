/**
 * Trang /shop-hoa-tuoi-gan-day/ (từ khóa "tiệm hoa gần đây" 21.600 lượt tìm/tháng, "shop hoa gần đây" 9.600):
 * thay mô tả chung của website cũ bằng danh sách 13 cửa hàng thật (site.stores) theo thành phố, mỗi cửa hàng có
 * link chỉ đường Google Maps và link tới trang khu vực. Nội dung quản lý tại đây, ghi lại mỗi lần khởi động.
 */
import type { Connection } from "mysql2/promise";
import { site, storeAreas } from "../site";

const SLUG = "shop-hoa-tuoi-gan-day";

function storeList() {
  const bySlug = new Map(Object.entries(storeAreas).map(([slug, s]) => [s.street, slug]));
  const groups: { city: string; items: { street: string; slug?: string }[] }[] = [];
  for (const g of site.stores) {
    for (const raw of g.addresses) {
      const [city, street] = raw.includes(": ") ? raw.split(": ") : [g.city, raw];
      let grp = groups.find((x) => x.city === city);
      if (!grp) groups.push((grp = { city, items: [] }));
      grp.items.push({ street, slug: bySlug.get(street) });
    }
  }
  return groups;
}

function html() {
  const groups = storeList();
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const phone = `<a href="tel:${site.phone}">${site.phoneDisplay}</a>`;
  const list = groups
    .map(
      (g) => `<h3>${g.city}</h3>
<ul>${g.items
        .map((s) => {
          const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.street}, ${g.city}`)}`;
          return `<li><strong>${s.street}</strong> — <a href="${maps}" rel="nofollow noopener" target="_blank">chỉ đường</a>${s.slug ? ` · <a href="/${s.slug}/">hoa tươi khu vực này</a>` : ""}</li>`;
        })
        .join("")}</ul>`,
    )
    .join("\n");
  return `<p>Bạn đang tìm tiệm hoa, shop hoa tươi gần đây? Hoa Thanh Nhã có ${total} cửa hàng ở ${groups.length} thành phố, mở cửa 06:00–21:00 hằng ngày. Ghé cửa hàng gần nhất để chọn hoa trực tiếp, hoặc đặt online để shop giao tận nơi trong ngày và gửi ảnh hoa thật trước khi giao.</p>
<h2>Danh sách ${total} cửa hàng Hoa Thanh Nhã</h2>
${list}
<h2>Không có cửa hàng gần bạn?</h2>
<p>Shop vẫn nhận đặt và giao hoa tại hầu hết tỉnh thành. Chọn khu vực của bạn trong mục <a href="/khu-vuc/">Khu vực</a> hoặc gọi/Zalo ${phone} để được báo thời gian giao cụ thể.</p>
<h2>Câu hỏi thường gặp</h2>
<h3>Làm sao biết tiệm hoa nào gần tôi nhất?</h3>
<p>Bấm "chỉ đường" ở cửa hàng cùng thành phố với bạn, Google Maps sẽ hiện khoảng cách và đường đi. Nếu đặt giao tận nơi, shop tự chọn cửa hàng gần người nhận nhất.</p>
<h3>Đặt hoa online có nhanh bằng ghé tiệm không?</h3>
<p>Đơn trong giờ làm việc được giao trong ngày. Đơn gấp (sinh nhật bất ngờ, khai trương, tang lễ) hãy gọi ${phone} để shop ưu tiên.</p>
<h3>Có xem hoa thật trước khi nhận không?</h3>
<p>Có. Shop chụp ảnh hoa thật gửi qua Zalo trước khi giao; không đúng mẫu đã chọn, bạn không cần thanh toán.</p>`;
}

export async function syncNearMePage(db: Connection): Promise<string[]> {
  const [res] = (await db.query("update categories set description = ? where slug = ?", [html(), SLUG])) as [{ affectedRows: number }, unknown];
  return [`✓ Trang gần đây: ${res.affectedRows ? "danh sách cửa hàng đã cập nhật" : "không thấy danh mục"}`];
}
