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

// Tuần 10: trang Tết 2027 (mùng 1 = 6/2/2027) và Valentine (14/2/2027 = mùng 9 Tết)
async function tetHtml(db: Connection) {
  const phone = `<a href="tel:${site.phone}">${site.phoneDisplay}</a>`;
  const table = await priceTable(
    db,
    [
      { slug: "lan-ho-diep", name: "Lan hồ điệp" },
      { slug: "hoa-gio", name: "Giỏ hoa" },
    ],
    [
      { label: "Dưới 1 triệu", min: 1, max: 999_999 },
      { label: "1 – 2 triệu", min: 1_000_000, max: 1_999_999 },
      { label: "2 – 4 triệu", min: 2_000_000, max: 3_999_999 },
      { label: "Từ 4 triệu", min: 4_000_000, max: 1e12 },
    ],
  );
  return `<p>Hoa Tết là món quà biếu mang lời chúc năm mới an khang, tài lộc: chậu lan hồ điệp đặt phòng khách, giỏ hoa tông đỏ vàng biếu ông bà, thầy cô, hay quà Tết cho đối tác, khách hàng. Tết Đinh Mùi 2027 rơi vào ngày 6/2/2027; Hoa Thanh Nhã nhận đặt trước, ghi thiệp hoặc băng chúc Tết miễn phí, gửi ảnh hoa thật trước khi giao.</p>
<h2>Bảng giá hoa Tết</h2>
<p>Số mẫu và giá lấy từ các mẫu đang bán, cập nhật tự động. Giá các ngày cận Tết có thể thay đổi theo giá hoa đầu vào.</p>
${table}
<h2>Chọn hoa Tết theo người nhận</h2>
<ul><li><strong>Ông bà, bố mẹ:</strong> chậu lan hồ điệp vàng, trắng hoặc tím, chơi được qua cả tháng Giêng; xem <a href="/lan-ho-diep/">lan hồ điệp</a>.</li>
<li><strong>Đối tác, khách hàng:</strong> lan hồ điệp nhiều cành kèm thiệp tên công ty; đặt số lượng để shop chuẩn bị đồng bộ.</li>
<li><strong>Thầy cô, người quen:</strong> giỏ hoa tông đỏ, vàng vừa phải, dễ đặt trên bàn; xem <a href="/hoa-gio/">giỏ hoa</a>.</li>
<li><strong>Trang trí nhà, cửa hàng đầu năm:</strong> lan hồ điệp đặt phòng khách, quầy lễ tân.</li></ul>
<h2>Màu hoa ngày Tết</h2>
<p>Đỏ tượng trưng may mắn, vàng cho tài lộc, thịnh vượng, trắng và tím cho sự thanh cao, sang trọng. Lan hồ điệp vàng và đỏ tím là hai màu được chọn biếu Tết nhiều nhất.</p>
<h2>Lịch đặt hoa Tết</h2>
<ul><li><strong>Từ đầu tháng Chạp:</strong> đặt sớm giữ được mẫu đẹp và giá tốt, nhất là đơn biếu doanh nghiệp số lượng lớn.</li>
<li><strong>Từ 23 tháng Chạp:</strong> đơn tăng mạnh, giá hoa đầu vào tăng; nên chốt mẫu trước ngày này.</li>
<li><strong>Những ngày Tết:</strong> lịch giao có hạn, hãy hẹn trước ngày giờ giao khi đặt.</li></ul>
<h2>Cách chăm lan hồ điệp ngày Tết</h2>
<p>Đặt nơi sáng, thoáng, tránh nắng gắt và gió điều hòa thổi trực tiếp; tưới ít nước khoảng 1 lần mỗi tuần vào giá thể, không tưới lên hoa. Chăm đúng cách, lan giữ đẹp nhiều tuần sau Tết.</p>
<h2>Câu hỏi thường gặp</h2>
<h3>Có giao hoa Tết cho người thân ở tỉnh khác không?</h3>
<p>Có. Bạn đặt và thanh toán online, shop giao đến người nhận và gửi ảnh xác nhận qua Zalo.</p>
<h3>Có ghi lời chúc Tết lên thiệp không?</h3>
<p>Có, miễn phí. Gửi lời chúc và tên người tặng khi đặt hàng.</p>
<p>Đặt hoa Tết: chọn mẫu trên website hoặc gọi/Zalo ${phone}. Xem thêm <a href="/lan-ho-diep-khai-truong/">lan hồ điệp khai trương</a> cho cửa hàng mở cửa đầu năm.</p>`;
}

async function valentineHtml(db: Connection) {
  const phone = `<a href="tel:${site.phone}">${site.phoneDisplay}</a>`;
  const table = await priceTable(
    db,
    [
      { slug: "hoa-valentine", name: "Hoa Valentine" },
      { slug: "hoa-hong", name: "Hoa hồng" },
      { slug: "hoa-tang-nguoi-yeu", name: "Hoa tặng người yêu" },
    ],
    [
      { label: "Dưới 1 triệu", min: 1, max: 999_999 },
      { label: "1 – 2 triệu", min: 1_000_000, max: 1_999_999 },
      { label: "Từ 2 triệu", min: 2_000_000, max: 1e12 },
    ],
  );
  return `<p>Bó hồng đỏ, hồng phấn là món quà kinh điển ngày Valentine 14/2. Năm 2027, Valentine rơi vào mùng 9 Tết Đinh Mùi, khi nhiều người vẫn đang nghỉ Tết, vì vậy nên đặt hoa sớm và hẹn rõ địa chỉ, giờ giao. Hoa Thanh Nhã ghi thiệp lời yêu thương miễn phí, gửi ảnh hoa thật trước khi giao.</p>
<h2>Bảng giá hoa Valentine</h2>
<p>Số mẫu và giá lấy từ các mẫu đang bán, cập nhật tự động. Ngày 13–14/2 giá hoa hồng đầu vào thường tăng.</p>
${table}
<h2>Chọn hoa Valentine theo màu</h2>
<ul><li><strong>Hồng đỏ:</strong> tình yêu nồng nhiệt, hợp các cặp đã gắn bó, vợ chồng.</li>
<li><strong>Hồng phấn:</strong> dịu dàng, ngọt ngào, hợp khi mới yêu.</li>
<li><strong>Hồng kem, trắng:</strong> tình yêu trong sáng, chân thành.</li>
<li><strong>Tulip, cẩm tú cầu:</strong> khác biệt, nhẹ nhàng; xem mẫu <a href="/hoa-cuoi-cam-tay/">hoa cầm tay</a> có tulip.</li></ul>
<h2>Gợi ý theo người nhận</h2>
<ul><li><strong>Người yêu:</strong> bó hồng đỏ hoặc hồng phấn; xem <a href="/hoa-tang-nguoi-yeu/">hoa tặng người yêu</a>.</li>
<li><strong>Vợ:</strong> bó lớn hoặc giỏ hoa đặt bàn; xem <a href="/hoa-tang-vo/">hoa tặng vợ</a>.</li>
<li><strong>Chồng:</strong> tông đỏ trầm, gọn gàng; xem <a href="/hoa-tang-chong/">hoa tặng chồng</a>.</li></ul>
<h2>Lịch đặt hoa Valentine</h2>
<ul><li>Đặt trước từ đầu tháng 2 để giữ mẫu và giá; năm nay trùng dịp Tết nên càng nên đặt sớm.</li>
<li>Giao bất ngờ tại công ty: ghi tên tòa nhà, tầng và giờ người nhận có mặt.</li>
<li>Người nhận đang về quê ăn Tết: gửi đúng địa chỉ ở quê, shop giao tận nơi và gửi ảnh xác nhận.</li></ul>
<h2>Câu hỏi thường gặp</h2>
<h3>Có giao đúng ngày 14/2 không?</h3>
<p>Có, khi đặt trước và ghi rõ khung giờ. Đơn gấp trong ngày hãy gọi ${phone} để shop kiểm tra mẫu còn hoa.</p>
<h3>Có kèm thiệp, gấu bông, socola được không?</h3>
<p>Thiệp ghi lời chúc miễn phí; quà đi kèm bạn nhắn shop để được tư vấn mẫu còn hàng.</p>
<p>Xem thêm <a href="/hoa-tinh-yeu/">hoa tình yêu</a> và <a href="/hoa-hong/">hoa hồng</a>.</p>`;
}

export async function syncCategoryCopy(db: Connection): Promise<string[]> {
  const P = site.phoneDisplay;
  const pages: [string, string, [string, string]?][] = [
    ["hoa-khai-truong", await khaiTruongHtml(db)],
    ["hoa-sinh-nhat", await sinhNhatHtml(db)],
    [
      "hoa-tet",
      await tetHtml(db),
      [
        "Hoa Tết 2027 – Lan Hồ Điệp, Giỏ Hoa Biếu Tết | Hoa Thanh Nhã",
        `Hoa Tết 2027: lan hồ điệp, giỏ hoa đỏ vàng biếu ông bà, đối tác. Bảng giá cập nhật, ghi thiệp chúc Tết miễn phí, gửi ảnh trước khi giao. Gọi ${P}.`,
      ],
    ],
    [
      "hoa-valentine",
      await valentineHtml(db),
      [
        "Hoa Valentine 14/2/2027 – Bó Hồng Tặng Người Yêu | Hoa Thanh Nhã",
        `Hoa Valentine 14/2/2027 (mùng 9 Tết): bó hồng đỏ, hồng phấn tặng người yêu, vợ. Bảng giá cập nhật, ghi thiệp miễn phí, gửi ảnh trước khi giao. Gọi ${P}.`,
      ],
    ],
  ];
  const done: string[] = [];
  for (const [slug, html, seo] of pages) {
    const [res] = (await db.query("update categories set description = ? where slug = ?", [html, slug])) as [{ affectedRows: number }, unknown];
    if (res.affectedRows) done.push(slug);
    if (seo)
      await db.query(
        `insert into seo_meta (path, title, description) values (?, ?, ?) on duplicate key update title = values(title), description = values(description)`,
        [`/${slug}/`, ...seo],
      );
  }
  return [`✓ Nội dung danh mục (bảng giá tự động): ${done.join(", ") || "không có"}`];
}
