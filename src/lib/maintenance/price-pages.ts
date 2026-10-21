/**
 * Trang khai trương theo mức giá của website cũ (/gio-hoa-khai-truong-200k/, …): từng đứng top 5–10 Google
 * với "giỏ hoa khai trương 200k/300k", "lẵng hoa khai trương 500k" nhưng không có trong sitemap nên không được chép sang.
 * Tạo lại dưới dạng danh mục; sản phẩm được gán lại mỗi lần máy chủ khởi động theo giá hiện tại (mẫu bị ẩn tự rơi ra).
 * Tiêu đề ghi giá thấp nhất thật đang có, không hứa mức giá shop không bán. Chạy lặp lại an toàn.
 */
import type { Connection } from "mysql2/promise";

type PricePage = {
  slug: string;
  name: string;
  /** Lấy sản phẩm từ các danh mục này (gồm danh mục con) */
  from: string[];
  maxPrice: number;
  title: (min: string) => string;
  description: (min: string) => string;
  html: (min: string) => string;
};

const PHONE = '<a href="tel:0396727374">0396.72.73.74</a>';

const PAGES: PricePage[] = [
  {
    slug: "gio-hoa-khai-truong-200k",
    name: "Giỏ Hoa Khai Trương Giá Rẻ",
    from: ["gio-hoa-khai-truong"],
    maxPrice: 850_000,
    title: (min) => `Giỏ Hoa Khai Trương Giá Rẻ Từ ${min} | Hoa Thanh Nhã`,
    description: (min) => `Giỏ hoa khai trương giá rẻ từ ${min}, hoa tươi trong ngày, tặng thiệp và băng rôn, gửi ảnh trước khi giao. Giao nhanh 2 giờ nội thành.`,
    html: (min) => `<h2>Giỏ hoa khai trương giá rẻ – gọn, tươi, đủ trang trọng</h2>
<p>Đây là những mẫu <a href="/gio-hoa-khai-truong/">giỏ hoa khai trương</a> có giá thấp nhất của Hoa Thanh Nhã, hiện từ <strong>${min}</strong>. Giỏ nhỏ gọn, đặt vừa quầy lễ tân hoặc bàn tiếp khách, hợp để bạn bè, đồng nghiệp gửi lời chúc khi chưa cần đến kệ hoa lớn.</p>
<h3>Giỏ hoa giá rẻ gồm những gì?</h3>
<ul>
<li>Hoa tươi nhập trong ngày: hướng dương, đồng tiền, hồng, cúc mẫu đơn, phối màu vàng – đỏ – cam cho may mắn.</li>
<li>Thiệp hoặc băng rôn ghi lời chúc theo yêu cầu, không tính thêm phí.</li>
<li>Ảnh thật của giỏ hoa gửi qua Zalo trước khi giao.</li>
</ul>
<h3>Chọn giỏ hoa theo ngân sách</h3>
<p>Mẫu bên trên được xếp theo giá hiện tại. Nếu ngân sách của bạn thấp hơn giá mẫu rẻ nhất, hãy nhắn Zalo hoặc gọi ${PHONE} để shop báo mẫu phù hợp. Cần mẫu nổi bật hơn, xem <a href="/gio-hoa-khai-truong-300k/">giỏ hoa khai trương dưới 1 triệu</a>, <a href="/lang-hoa-khai-truong-500k/">lẵng hoa khai trương giá tốt</a> hoặc <a href="/ke-hoa-khai-truong/">kệ hoa khai trương</a>.</p>`,
  },
  {
    slug: "gio-hoa-khai-truong-300k",
    name: "Giỏ Hoa Khai Trương Dưới 1 Triệu",
    from: ["gio-hoa-khai-truong"],
    maxPrice: 1_000_000,
    title: (min) => `Giỏ Hoa Khai Trương Dưới 1 Triệu, Từ ${min} | Hoa Thanh Nhã`,
    description: (min) => `Mẫu giỏ hoa khai trương dưới 1 triệu, từ ${min}: hoa tươi, thiệp và băng rôn miễn phí, gửi ảnh trước khi giao, giao nhanh tận nơi.`,
    html: (min) => `<h2>Giỏ hoa khai trương dưới 1 triệu</h2>
<p>Tổng hợp các mẫu <a href="/gio-hoa-khai-truong/">giỏ hoa khai trương</a> giá dưới 1.000.000đ, thấp nhất hiện là <strong>${min}</strong>. Ở mức giá này giỏ hoa đầy đặn hơn, dùng nhiều hoa tạo điểm nhấn như lan, hồng môn, hướng dương, hợp để gửi đối tác hoặc khách hàng thân thiết.</p>
<h3>Vì sao chọn giỏ hoa thay vì kệ hoa?</h3>
<p>Giỏ hoa đặt được trong nhà, trên quầy hoặc bàn làm việc, giữ được lâu sau ngày khai trương. Kệ hoa đứng ngoài cửa, nổi bật trong ngày lễ nhưng cần nhiều chỗ hơn. Nếu cửa hàng có mặt tiền rộng, xem thêm <a href="/ke-hoa-khai-truong/">kệ hoa khai trương</a>.</p>
<h3>Đặt hoa thế nào?</h3>
<p>Chọn mẫu và đặt trên website, hoặc gọi/Zalo ${PHONE}. Shop ghi băng rôn theo nội dung bạn gửi và chụp ảnh giỏ hoa trước khi giao. Mẫu rẻ hơn có trong <a href="/gio-hoa-khai-truong-200k/">giỏ hoa khai trương giá rẻ</a>.</p>`,
  },
  {
    slug: "lang-hoa-khai-truong-500k",
    name: "Lẵng Hoa Khai Trương Giá Tốt",
    from: ["ke-hoa-khai-truong", "lan-ho-diep-khai-truong", "lang-hoa-khai-truong"],
    maxPrice: 1_200_000,
    title: (min) => `Lẵng Hoa Khai Trương Giá Tốt Từ ${min} | Hoa Thanh Nhã`,
    description: (min) => `Lẵng hoa, kệ hoa và lan hồ điệp khai trương giá tốt từ ${min}. Hoa tươi, băng rôn miễn phí, gửi ảnh trước, giao đúng giờ khai trương.`,
    html: (min) => `<h2>Lẵng hoa khai trương giá tốt</h2>
<p>Các mẫu lẵng hoa, kệ hoa và chậu lan hồ điệp khai trương có giá đến 1.200.000đ, rẻ nhất hiện từ <strong>${min}</strong>. Lẵng hoa cao, nhiều tầng, đặt trước cửa để chúc mừng ngày mở bán: hợp gửi từ công ty, đối tác hoặc nhóm bạn góp chung.</p>
<h3>Ý nghĩa lẵng hoa khai trương</h3>
<p>Màu đỏ và vàng tượng trưng cho may mắn, tài lộc; hoa đồng tiền, hướng dương, hồng môn mang lời chúc buôn bán phát đạt. <a href="/lan-ho-diep-khai-truong/">Lan hồ điệp khai trương</a> giữ được vài tuần nên được chọn nhiều cho văn phòng và showroom.</p>
<h3>Giao lẵng hoa đúng giờ khai trương</h3>
<p>Bạn gửi giờ khai trương và nội dung băng rôn, shop giao trước giờ làm lễ và gửi ảnh thật khi hoa đã đặt tại nơi nhận. Gọi/Zalo ${PHONE}. Ngân sách nhỏ hơn có <a href="/gio-hoa-khai-truong-200k/">giỏ hoa khai trương giá rẻ</a>; cần mẫu lớn hơn xem tất cả <a href="/hoa-khai-truong/">hoa khai trương</a>.</p>`,
  },
];

const vnd = (n: number) => `${Math.round(n / 1000)}K`;

export async function syncPricePages(db: Connection): Promise<string[]> {
  const log: string[] = [];
  const [[parent]] = (await db.query("select id from categories where slug = 'hoa-khai-truong'")) as [{ id: number }[], unknown];
  for (const p of PAGES) {
    const [ids] = (await db.query(
      "select id from categories where slug in (?) union select c.id from categories c join categories pc on pc.id = c.parent_id where pc.slug in (?)",
      [p.from, p.from],
    )) as [{ id: number }[], unknown];
    const price = "CASE WHEN p.sale_price > 0 AND p.sale_price < p.price THEN p.sale_price ELSE p.price END";
    const [rows] = (await db.query(
      `select distinct p.id, ${price} as price from products p join product_categories pc on pc.product_id = p.id
       where p.is_active = 1 and pc.category_id in (?) and ${price} > 0 and ${price} <= ? order by price`,
      [ids.length ? ids.map((r) => r.id) : [0], p.maxPrice],
    )) as [{ id: number; price: number }[], unknown];
    if (!rows.length) {
      log.push(`! /${p.slug}/: không có sản phẩm phù hợp, giữ nguyên`);
      continue;
    }
    const min = vnd(rows[0].price);
    await db.query(
      `insert into categories (name, slug, parent_id, description, sort_order) values (?, ?, ?, ?, 99)
       on duplicate key update name = values(name), parent_id = values(parent_id), description = values(description)`,
      [p.name, p.slug, parent?.id ?? null, p.html(min)],
    );
    const [[cat]] = (await db.query("select id from categories where slug = ?", [p.slug])) as [{ id: number }[], unknown];
    await db.query("delete from product_categories where category_id = ?", [cat.id]);
    await db.query("insert into product_categories (product_id, category_id) values ?", [rows.map((r) => [r.id, cat.id])]);
    await db.query(
      `insert into seo_meta (path, title, description) values (?, ?, ?)
       on duplicate key update title = values(title), description = values(description)`,
      [`/${p.slug}/`, p.title(min), p.description(min)],
    );
    log.push(`✓ /${p.slug}/: ${rows.length} mẫu, từ ${min}`);
  }
  return log;
}
