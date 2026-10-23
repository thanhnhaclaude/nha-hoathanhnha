/**
 * Tuần 3 Kế hoạch SEO: tạo lại trang dịp đã có thứ hạng trên website cũ nhưng mất khi chuyển website
 * (đang chuyển 301 về /hoa-chuc-mung/ hoặc /hoa-tinh-yeu/): mừng tân gia, mừng thọ, chúc mừng đại hội,
 * kỷ niệm ngày cưới, 22/12; thêm /hoa-valentine/ cho "hoa valentine", "hoa 14 2".
 * Tạo danh mục nếu chưa có; mô tả + tiêu đề tìm kiếm quản lý tại đây (ghi lại mỗi lần khởi động);
 * sản phẩm chỉ gán khi danh mục trống (chỉnh trong admin sau đó được giữ). Chạy lặp lại an toàn.
 */
import type { Connection } from "mysql2/promise";
import { site } from "../site";
import { pick, type Rule } from "./category-fill";

type Page = { slug: string; name: string; parent: string; rule: Rule; title: string; description: string; html: string };

const P = site.phoneDisplay;
const tel = `<a href="tel:${site.phone}">${site.phoneDisplay}</a>`;

const PAGES: Page[] = [
  {
    slug: "hoa-mung-tan-gia",
    name: "Hoa Mừng Tân Gia",
    parent: "hoa-chuc-mung",
    rule: { slug: "hoa-mung-tan-gia", from: ["hoa-gio"], max: 1_500_000, limit: 24 },
    title: "Hoa Mừng Tân Gia – Giỏ Hoa Chúc Mừng Nhà Mới | Hoa Thanh Nhã",
    description: `Hoa mừng tân gia: giỏ hoa tươi màu may mắn, đặt bàn khách, chúc gia chủ an cư lạc nghiệp. Ghi thiệp miễn phí, giao tận nhà mới. Gọi ${P}.`,
    html: `<h2>Hoa mừng tân gia</h2>
<p>Giỏ hoa tươi là món quà mừng nhà mới gọn gàng, đặt được ngay trên bàn khách hoặc kệ tivi trong ngày tân gia. Màu vàng, đỏ, cam mang ý nghĩa sung túc; hướng dương, đồng tiền, hồng gửi lời chúc gia chủ an cư lạc nghiệp.</p>
<h3>Chọn hoa tân gia</h3>
<ul><li><strong>Bạn bè, đồng nghiệp:</strong> giỏ hoa vừa phải, tông vàng hoặc cam.</li>
<li><strong>Người thân, sếp:</strong> giỏ hoa lớn hoặc <a href="/lan-ho-diep-khai-truong/">chậu lan hồ điệp</a> giữ được nhiều tuần.</li>
<li><strong>Tránh:</strong> hoa tông trắng tím đậm vốn dùng cho chia buồn.</li></ul>
<p>Gửi tên gia chủ và lời chúc, shop ghi thiệp tay miễn phí, giao đúng giờ tiệc tân gia và gửi ảnh hoa trước khi giao. Gọi ${tel}.</p>`,
  },
  {
    slug: "hoa-mung-tho",
    name: "Hoa Mừng Thọ",
    parent: "hoa-chuc-mung",
    rule: { slug: "hoa-mung-tho", from: ["lan-ho-diep"], limit: 24 },
    title: "Hoa Mừng Thọ Ông Bà – Lan Hồ Điệp Sang Trọng | Hoa Thanh Nhã",
    description: `Hoa mừng thọ ông bà, cha mẹ: chậu lan hồ điệp bền đẹp nhiều tuần, ý nghĩa phúc thọ. Ghi thiệp chúc thọ, giao tận nhà đúng ngày tiệc. Gọi ${P}.`,
    html: `<h2>Hoa mừng thọ ông bà, cha mẹ</h2>
<p>Lan hồ điệp là lựa chọn được ưa chuộng nhất cho tiệc mừng thọ: dáng cây sang trọng, hoa bền đẹp nhiều tuần, người lớn tuổi dễ chăm. Màu vàng, trắng, tím nhạt tượng trưng cho phúc lộc và sức khỏe.</p>
<h3>Gợi ý theo dịp</h3>
<ul><li><strong>Mừng thọ 60, 70, 80 tuổi:</strong> chậu lan 5–10 cành đặt phòng khách hoặc bàn thờ gia tiên.</li>
<li><strong>Con cháu ở xa:</strong> đặt online, shop giao tận nhà và gửi ảnh để cả nhà yên tâm.</li>
<li><strong>Kèm giỏ trái cây:</strong> nhắn shop để phối cùng lan.</li></ul>
<p>Lời chúc thọ (ví dụ "Phúc như Đông Hải, thọ tỷ Nam Sơn") được ghi trên thiệp hoặc băng đỏ miễn phí. Gọi ${tel}.</p>`,
  },
  {
    slug: "hoa-chuc-mung-dai-hoi",
    name: "Hoa Chúc Mừng Đại Hội",
    parent: "hoa-chuc-mung",
    rule: { slug: "hoa-chuc-mung-dai-hoi", from: ["ke-hoa-khai-truong", "hoa-gio"], min: 1_000_000, limit: 24 },
    title: "Hoa Chúc Mừng Đại Hội, Hội Nghị – Kệ Hoa, Giỏ Hoa | Hoa Thanh Nhã",
    description: `Hoa chúc mừng đại hội, hội nghị, lễ kỷ niệm thành lập: kệ hoa, giỏ hoa trang trọng, băng rôn ghi tên đơn vị miễn phí, giao đúng giờ khai mạc. Gọi ${P}.`,
    html: `<h2>Hoa chúc mừng đại hội, hội nghị</h2>
<p>Kệ hoa và giỏ hoa lớn dùng cho đại hội Đảng bộ, chi bộ, đại hội cổ đông, hội nghị khách hàng, lễ kỷ niệm ngày thành lập. Hoa tông đỏ, vàng trang trọng, đặt hai bên sân khấu hoặc lối vào hội trường.</p>
<h3>Lưu ý khi đặt</h3>
<ul><li>Gửi tên đơn vị tặng và nội dung băng rôn, ví dụ "Chúc mừng Đại hội thành công tốt đẹp".</li>
<li>Hẹn giao trước giờ khai mạc 1–2 tiếng để kịp sắp xếp.</li>
<li>Đặt số lượng nhiều kệ cùng mẫu, shop báo giá riêng.</li></ul>
<p>Xem thêm <a href="/ke-hoa-khai-truong/">kệ hoa</a> hoặc gọi ${tel} để được tư vấn.</p>`,
  },
  {
    slug: "hoa-chuc-mung-22-thang-12",
    name: "Hoa Chúc Mừng 22/12",
    parent: "hoa-chuc-mung",
    rule: { slug: "hoa-chuc-mung-22-thang-12", from: ["hoa-gio", "ke-hoa-khai-truong"], max: 1_500_000, limit: 24 },
    title: "Hoa Chúc Mừng 22/12 Ngày Quân Đội Nhân Dân | Hoa Thanh Nhã",
    description: `Hoa chúc mừng 22/12 Ngày thành lập Quân đội Nhân dân Việt Nam: giỏ hoa, kệ hoa tông đỏ tặng chiến sĩ, cựu chiến binh, đơn vị. Ghi thiệp miễn phí. Gọi ${P}.`,
    html: `<h2>Hoa chúc mừng 22/12</h2>
<p>Ngày 22/12 là dịp tri ân các chiến sĩ, cựu chiến binh và người thân đang phục vụ trong quân đội. Giỏ hoa, kệ hoa tông đỏ, vàng thể hiện sự kính trọng, phù hợp tặng cá nhân hoặc gửi tới đơn vị, hội cựu chiến binh.</p>
<h3>Chọn hoa 22/12</h3>
<ul><li><strong>Tặng ông, bố là cựu chiến binh:</strong> giỏ hoa đặt bàn kèm thiệp tri ân.</li>
<li><strong>Gửi đơn vị, buổi gặp mặt:</strong> kệ hoa có băng rôn ghi tên người tặng.</li></ul>
<p>Đặt trước 1–2 ngày để giao đúng sáng 22/12. Gọi ${tel}.</p>`,
  },
  {
    slug: "hoa-ky-niem-ngay-cuoi",
    name: "Hoa Kỷ Niệm Ngày Cưới",
    parent: "hoa-tinh-yeu",
    rule: { slug: "hoa-ky-niem-ngay-cuoi", from: ["hoa-hong"], and: ["mau-do"], limit: 24 },
    title: "Hoa Kỷ Niệm Ngày Cưới – Bó Hồng Đỏ Lãng Mạn | Hoa Thanh Nhã",
    description: `Hoa kỷ niệm ngày cưới tặng vợ, chồng: bó hồng đỏ lãng mạn, ghi thiệp lời yêu thương, giao bất ngờ đúng giờ tại nhà hoặc nhà hàng. Gọi ${P}.`,
    html: `<h2>Hoa kỷ niệm ngày cưới</h2>
<p>Bó hồng đỏ là cách quen thuộc mà vẫn luôn khiến người nhận xúc động trong ngày kỷ niệm cưới. Hồng đỏ tượng trưng cho tình yêu bền chặt; số bông hoa có thể chọn theo số năm bên nhau.</p>
<h3>Gợi ý</h3>
<ul><li><strong>Kỷ niệm 1–5 năm:</strong> bó hồng đỏ nhỏ xinh kèm thiệp viết tay.</li>
<li><strong>Kỷ niệm 10 năm trở lên:</strong> bó lớn hoặc giỏ hoa đặt bàn tiệc.</li>
<li><strong>Tạo bất ngờ:</strong> hẹn giao tới nhà hàng trước giờ hai người đến.</li></ul>
<p>Xem thêm <a href="/hoa-tang-vo/">hoa tặng vợ</a>, <a href="/hoa-tang-chong/">hoa tặng chồng</a> hoặc gọi ${tel}.</p>`,
  },
  {
    slug: "hoa-valentine",
    name: "Hoa Valentine",
    parent: "hoa-tinh-yeu",
    rule: { slug: "hoa-valentine", from: ["hoa-tinh-yeu"], and: ["mau-do", "mau-hong"], limit: 48 },
    title: "Hoa Valentine 14/2 – Bó Hồng Tặng Người Yêu | Hoa Thanh Nhã",
    description: `Hoa Valentine 14/2: bó hồng đỏ, hồng phấn tặng người yêu, vợ, chồng. Ghi thiệp miễn phí, giao bất ngờ đúng ngày 14/2, gửi ảnh trước khi giao. Gọi ${P}.`,
    html: `<h2>Hoa Valentine 14/2</h2>
<p>Bó hồng đỏ, hồng phấn là món quà kinh điển của ngày Valentine. Hoa Thanh Nhã nhận đặt trước để giao đúng ngày 14/2, kèm thiệp ghi lời yêu thương theo nội dung bạn gửi.</p>
<h3>Đặt hoa Valentine không lo hết mẫu</h3>
<ul><li>Ngày 13–14/2 đơn rất đông và giá hoa hồng tăng; nên đặt trước từ đầu tháng 2.</li>
<li>Muốn giao bất ngờ tại công ty, ghi rõ tên tòa nhà, tầng và giờ người nhận có mặt.</li>
<li>Màu hồng đỏ: tình yêu nồng nhiệt; hồng phấn: dịu dàng, mới yêu.</li></ul>
<p>Xem thêm <a href="/hoa-tang-nguoi-yeu/">hoa tặng người yêu</a> hoặc gọi ${tel}.</p>`,
  },
];

export async function syncOccasionPages(db: Connection): Promise<string[]> {
  const log: string[] = [];
  for (const p of PAGES) {
    const [[parent]] = (await db.query("select id from categories where slug = ?", [p.parent])) as [{ id: number }[], unknown];
    await db.query(
      `insert into categories (name, slug, parent_id, description, sort_order) values (?, ?, ?, ?, 95)
       on duplicate key update description = values(description)`,
      [p.name, p.slug, parent?.id ?? null, p.html],
    );
    const [[cat]] = (await db.query(
      "select id, (select count(*) from product_categories pc where pc.category_id = categories.id) n from categories where slug = ?",
      [p.slug],
    )) as [{ id: number; n: number }[], unknown];
    let note = "";
    if (Number(cat.n) === 0) {
      const ids = await pick(db, p.rule);
      if (ids.length) await db.query("insert ignore into product_categories (product_id, category_id) values ?", [ids.map((id) => [id, cat.id])]);
      note = `, gán ${ids.length} mẫu`;
    }
    await db.query(
      `insert into seo_meta (path, title, description) values (?, ?, ?) on duplicate key update title = values(title), description = values(description)`,
      [`/${p.slug}/`, p.title, p.description],
    );
    log.push(`${p.slug}${note}`);
  }
  return [`✓ Trang dịp (tuần 3): ${log.join("; ")}`];
}
