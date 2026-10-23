/**
 * Tuần 5 Kế hoạch SEO: nội dung danh mục khai trương (từ khóa "hoa khai trương" 10.000 lượt tìm/tháng, đang vị trí 8,6;
 * "đặt hoa khai trương" 1.500, vị trí 29,5). Bảng giá tính từ sản phẩm đang bán mỗi lần khởi động, nên luôn đúng giá;
 * kèm cách chọn, băng rôn, giao hàng, câu hỏi thường gặp và liên kết sang trang giá + bài viết khai trương.
 * Ghi đè mô tả danh mục mỗi lần khởi động (nội dung quản lý tại đây).
 */
import type { Connection } from "mysql2/promise";
import { site } from "../site";

const PRICE = "case when p.sale_price > 0 and p.sale_price < p.price then p.sale_price else p.price end";
const vnd = (n: number) => `${Number(n).toLocaleString("vi-VN")}đ`;

type Band = { label: string; min: number; max: number };
type Kind = { slug: string; name: string };
const BANDS: Band[] = [
  { label: "Dưới 1 triệu", min: 1, max: 999_999 },
  { label: "1 – 2 triệu", min: 1_000_000, max: 1_999_999 },
  { label: "2 – 3 triệu", min: 2_000_000, max: 2_999_999 },
  { label: "Từ 3 triệu", min: 3_000_000, max: 1e12 },
];
const TYPES: Kind[] = [
  { slug: "gio-hoa-khai-truong", name: "Giỏ hoa khai trương" },
  { slug: "ke-hoa-khai-truong", name: "Kệ hoa khai trương" },
  { slug: "lan-ho-diep-khai-truong", name: "Lan hồ điệp khai trương" },
];

async function priceTable(db: Connection, types: Kind[] = TYPES, bands: Band[] = BANDS) {
  const rows: string[] = [];
  for (const t of types) {
    const [[r]] = (await db.query(
      `select count(*) n, min(${PRICE}) mn, max(${PRICE}) mx,
        ${bands.map((b, i) => `sum(${PRICE} between ${b.min} and ${b.max}) b${i}`).join(", ")}
       from products p join product_categories pc on pc.product_id = p.id join categories c on c.id = pc.category_id
       where c.slug = ? and p.is_active = 1 and p.price > 0`,
      [t.slug],
    )) as [Record<string, number>[], unknown];
    if (!r || !Number(r.n)) continue;
    rows.push(
      `<tr><td><a href="/${t.slug}/">${t.name}</a></td><td>${Number(r.n)}</td><td>${vnd(r.mn)} – ${vnd(r.mx)}</td>${bands.map((_, i) => `<td>${Number(r[`b${i}`])}</td>`).join("")}</tr>`,
    );
  }
  if (!rows.length) return "";
  return `<table><thead><tr><th>Loại</th><th>Số mẫu</th><th>Khoảng giá</th>${bands.map((b) => `<th>${b.label}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
}

async function khaiTruongHtml(db: Connection) {
  const phone = `<a href="tel:${site.phone}">${site.phoneDisplay}</a>`;
  const table = await priceTable(db);
  return `<p>Hoa khai trương là lời chúc may mắn gửi tới cửa hàng, công ty, showroom trong ngày đầu mở cửa. Hoa Thanh Nhã có kệ hoa, giỏ hoa và lan hồ điệp khai trương với nhiều mức giá, in băng rôn ghi lời chúc miễn phí, chụp ảnh hoa thật gửi bạn trước khi giao và giao đúng giờ làm lễ.</p>
<h2>Bảng giá hoa khai trương</h2>
<p>Số mẫu và giá dưới đây lấy từ các mẫu đang bán trên website, cập nhật tự động.</p>
${table}
<p>Ngân sách nhỏ hơn: xem <a href="/gio-hoa-khai-truong-200k/">giỏ hoa khai trương giá rẻ</a>, <a href="/gio-hoa-khai-truong-300k/">giỏ hoa khai trương dưới 1 triệu</a>, <a href="/lang-hoa-khai-truong-500k/">lẵng hoa khai trương giá tốt</a>. Chi tiết từng mức giá kệ hoa có trong bài <a href="/gia-ke-hoa-khai-truong/">giá kệ hoa khai trương</a>.</p>
<h2>Chọn kệ, giỏ hay lan hồ điệp?</h2>
<ul><li><strong>Kệ hoa:</strong> đặt trước cửa, nổi bật trong ảnh cắt băng; hợp đối tác, công ty, cửa hàng mặt tiền rộng.</li>
<li><strong>Giỏ hoa:</strong> gọn, đặt quầy lễ tân hoặc bàn tiếp khách; hợp bạn bè, đồng nghiệp, cửa hàng nhỏ.</li>
<li><strong>Lan hồ điệp:</strong> sang trọng, giữ đẹp nhiều tuần; hợp văn phòng, showroom, phòng giám đốc.</li></ul>
<h2>Màu hoa và ý nghĩa</h2>
<p>Đỏ, vàng, cam tượng trưng cho tài lộc, thịnh vượng, hợp gần như mọi ngành. Hồng và pastel nhẹ nhàng cho spa, thời trang, cà phê. Xanh trắng trang nhã cho phòng khám, công ty công nghệ. Nếu cửa hàng có màu thương hiệu, chọn kệ theo màu đó sẽ đẹp hơn trong ảnh khai trương.</p>
<h2>Băng rôn và lời chúc</h2>
<p>Băng rôn gồm hai dải: lời chúc (ví dụ "Chúc mừng khai trương – Hồng phát vạn sự") và tên người tặng. Shop in miễn phí đúng nội dung bạn gửi. Tham khảo thêm <a href="/cau-chuc-khai-truong-bang-ron/">câu chúc khai trương ghi băng rôn</a> theo từng ngành.</p>
<h2>Đặt hoa khai trương như thế nào?</h2>
<ol><li>Chọn mẫu và đặt trên website, hoặc gọi/Zalo ${phone}.</li>
<li>Gửi địa chỉ, giờ làm lễ, nội dung băng rôn.</li>
<li>Shop xác nhận, gửi ảnh kệ hoa thật trước khi giao.</li>
<li>Giao và dựng tận nơi trước giờ khai trương 1–2 tiếng.</li></ol>
<h2>Câu hỏi thường gặp</h2>
<h3>Đặt hoa khai trương trước bao lâu?</h3>
<p>Nên đặt trước ít nhất 1 ngày, sớm hơn vào các ngày đẹp đầu tháng vì nhiều nơi khai trương cùng lúc. Đơn gấp trong ngày hãy gọi ${phone} để shop kiểm tra mẫu còn hoa.</p>
<h3>Giá đã gồm băng rôn và giao hàng chưa?</h3>
<p>Giá đã gồm băng rôn in lời chúc. Phí giao tùy khu vực và giá trị đơn, hiển thị khi đặt hàng.</p>
<h3>Có giao hoa khai trương ở tỉnh khác không?</h3>
<p>Có. Shop nhận giao tại nhiều tỉnh thành; xem trang khu vực của bạn trong mục <a href="/khu-vuc/">Khu vực</a>.</p>`;
}

/** Tuần 6: "hoa sinh nhật" 19.000 lượt tìm/tháng (vị trí ~15–44), "đặt hoa sinh nhật" 1.500 (vị trí 51) */
async function sinhNhatHtml(db: Connection) {
  const phone = `<a href="tel:${site.phone}">${site.phoneDisplay}</a>`;
  const table = await priceTable(
    db,
    [
      { slug: "bo-hoa-sinh-nhat", name: "Bó hoa sinh nhật" },
      { slug: "gio-hoa-sinh-nhat", name: "Giỏ hoa sinh nhật" },
    ],
    [
      { label: "Dưới 500 nghìn", min: 1, max: 499_999 },
      { label: "500 nghìn – 1 triệu", min: 500_000, max: 999_999 },
      { label: "1 – 2 triệu", min: 1_000_000, max: 1_999_999 },
      { label: "Từ 2 triệu", min: 2_000_000, max: 1e12 },
    ],
  );
  return `<p>Hoa sinh nhật là món quà dễ chọn mà luôn được nhớ: một bó hoa tươi tặng người yêu, giỏ hoa tặng mẹ, hay lẵng hoa gửi sếp, đồng nghiệp. Hoa Thanh Nhã thiết kế hoa sinh nhật theo người nhận và ngân sách, ghi thiệp tay miễn phí, gửi ảnh hoa thật trước khi giao và giao tận nơi trong ngày.</p>
<h2>Bảng giá hoa sinh nhật</h2>
<p>Số mẫu và giá lấy từ các mẫu đang bán, cập nhật tự động.</p>
${table}
<h2>Chọn hoa sinh nhật theo người nhận</h2>
<ul><li><strong>Người yêu:</strong> bó hồng đỏ, hồng phấn hoặc hoa baby; xem <a href="/hoa-tang-nguoi-yeu/">hoa tặng người yêu</a>.</li>
<li><strong>Mẹ, bà:</strong> giỏ hoa tông hồng, cẩm chướng hoặc lan hồ điệp; xem <a href="/hoa-tang-me/">hoa tặng mẹ</a>.</li>
<li><strong>Vợ, chồng:</strong> bó hoa lớn, giỏ hoa đặt bàn tiệc; xem <a href="/hoa-tang-vo/">hoa tặng vợ</a>, <a href="/hoa-tang-chong/">hoa tặng chồng</a>.</li>
<li><strong>Sếp, đối tác:</strong> giỏ hoa sang trọng hoặc lan hồ điệp; xem <a href="/hoa-tang-sep/">hoa tặng sếp</a>.</li>
<li><strong>Bạn bè, đồng nghiệp:</strong> bó hoa vừa phải, màu tươi sáng; xem <a href="/hoa-tang-ban-be/">hoa tặng bạn bè</a>.</li></ul>
<h2>Bó hoa hay giỏ hoa?</h2>
<p><a href="/bo-hoa-sinh-nhat/">Bó hoa sinh nhật</a> gọn, dễ trao tận tay, đẹp khi chụp ảnh. <a href="/gio-hoa-sinh-nhat/">Giỏ hoa sinh nhật</a> đặt được ngay trên bàn, giữ hoa tươi lâu hơn, hợp gửi tới văn phòng hoặc tiệc sinh nhật.</p>
<h2>Màu hoa và ý nghĩa</h2>
<p>Đỏ: tình yêu nồng nhiệt. Hồng: dịu dàng, biết ơn. Vàng, hướng dương: niềm vui, năng lượng. Trắng, pastel: trong trẻo, thanh lịch. Tím: thủy chung, lãng mạn.</p>
<h2>Đặt hoa sinh nhật như thế nào?</h2>
<ol><li>Chọn mẫu trên website hoặc gửi ảnh mẫu bạn thích qua Zalo ${phone}.</li>
<li>Ghi lời chúc để shop viết thiệp tay, chọn giờ giao.</li>
<li>Shop gửi ảnh hoa thật trước khi giao; không đúng mẫu bạn không cần thanh toán.</li>
<li>Hoa được giao tận nơi, kể cả gửi bất ngờ tới công ty hoặc nhà hàng.</li></ol>
<h2>Câu hỏi thường gặp</h2>
<h3>Đặt hoa sinh nhật giao trong ngày được không?</h3>
<p>Được. Đơn trong giờ làm việc được giao trong ngày; cần giao đúng giờ (tiệc tối, bất ngờ lúc nửa ngày), hãy ghi rõ khung giờ hoặc gọi ${phone}.</p>
<h3>Có tặng kèm thiệp, bánh kem không?</h3>
<p>Thiệp ghi tay luôn miễn phí. Muốn kèm bánh kem hoặc quà khác, nhắn shop để được báo mẫu còn hàng.</p>
<h3>Ở tỉnh khác có đặt được không?</h3>
<p>Có. Shop giao hoa sinh nhật tại nhiều tỉnh thành; xem trang khu vực trong mục <a href="/khu-vuc/">Khu vực</a>.</p>`;
}

export async function syncCategoryCopy(db: Connection): Promise<string[]> {
  const pages: [string, string][] = [
    ["hoa-khai-truong", await khaiTruongHtml(db)],
    ["hoa-sinh-nhat", await sinhNhatHtml(db)],
  ];
  const done: string[] = [];
  for (const [slug, html] of pages) {
    const [res] = (await db.query("update categories set description = ? where slug = ?", [html, slug])) as [{ affectedRows: number }, unknown];
    if (res.affectedRows) done.push(slug);
  }
  return [`✓ Nội dung danh mục (bảng giá tự động): ${done.join(", ") || "không có"}`];
}
