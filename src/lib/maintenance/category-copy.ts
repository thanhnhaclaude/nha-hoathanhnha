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
const BANDS: Band[] = [
  { label: "Dưới 1 triệu", min: 1, max: 999_999 },
  { label: "1 – 2 triệu", min: 1_000_000, max: 1_999_999 },
  { label: "2 – 3 triệu", min: 2_000_000, max: 2_999_999 },
  { label: "Từ 3 triệu", min: 3_000_000, max: 1e12 },
];
const TYPES = [
  { slug: "gio-hoa-khai-truong", name: "Giỏ hoa khai trương" },
  { slug: "ke-hoa-khai-truong", name: "Kệ hoa khai trương" },
  { slug: "lan-ho-diep-khai-truong", name: "Lan hồ điệp khai trương" },
];

async function priceTable(db: Connection) {
  const rows: string[] = [];
  for (const t of TYPES) {
    const [[r]] = (await db.query(
      `select count(*) n, min(${PRICE}) mn, max(${PRICE}) mx,
        ${BANDS.map((b, i) => `sum(${PRICE} between ${b.min} and ${b.max}) b${i}`).join(", ")}
       from products p join product_categories pc on pc.product_id = p.id join categories c on c.id = pc.category_id
       where c.slug = ? and p.is_active = 1 and p.price > 0`,
      [t.slug],
    )) as [Record<string, number>[], unknown];
    if (!r || !Number(r.n)) continue;
    rows.push(
      `<tr><td><a href="/${t.slug}/">${t.name}</a></td><td>${Number(r.n)}</td><td>${vnd(r.mn)} – ${vnd(r.mx)}</td>${BANDS.map((_, i) => `<td>${Number(r[`b${i}`])}</td>`).join("")}</tr>`,
    );
  }
  if (!rows.length) return "";
  return `<table><thead><tr><th>Loại</th><th>Số mẫu</th><th>Khoảng giá</th>${BANDS.map((b) => `<th>${b.label}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
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

export async function syncCategoryCopy(db: Connection): Promise<string[]> {
  const html = await khaiTruongHtml(db);
  const [res] = (await db.query("update categories set description = ? where slug = 'hoa-khai-truong'", [html])) as [{ affectedRows: number }, unknown];
  return [`✓ Nội dung danh mục: hoa-khai-truong ${res.affectedRows ? "cập nhật (bảng giá tự động)" : "không thấy"}`];
}
