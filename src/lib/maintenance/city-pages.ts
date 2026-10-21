/**
 * Trang khu vực cho các thành phố ra đơn nhiều nhưng không có trang trên website (phân tích 21/10/2026:
 * file theo dõi sale + chuyển đổi Google Ads). Website cũ có /shop-hoa-tuoi-nha-trang/ … nhưng không chép sang được.
 * Tạo dưới nhóm "KHU VỰC"; nội dung quản lý tại đây (cập nhật mỗi lần máy chủ khởi động).
 * Sản phẩm: lần đầu chép bộ mẫu của trang TP. Hồ Chí Minh; sau đó giữ nguyên nếu đã chỉnh trong admin.
 * Địa chỉ cửa hàng lấy từ site.stores — thành phố không có cửa hàng thì không ghi địa chỉ. Chạy lặp lại an toàn.
 */
import type { Connection } from "mysql2/promise";
import { site } from "../site";

type CityPage = {
  slug: string;
  city: string;
  /** Tiền tố trong site.stores ("Nha Trang: …") */
  store?: string;
  areas: string;
  nearby: string;
  places: string;
  note: string;
};

const CITIES: CityPage[] = [
  {
    slug: "shop-hoa-tuoi-nha-trang",
    city: "Nha Trang",
    store: "Nha Trang",
    areas: "Lộc Thọ, Phước Tân, Phước Tiến, Tân Lập, Vĩnh Hải, Vĩnh Phước, Phước Long, Vĩnh Nguyên, Vĩnh Hòa",
    nearby: "Diên Khánh, Cam Lâm, Cam Ranh",
    places: "khách sạn và resort dọc đường Trần Phú, Bệnh viện Đa khoa tỉnh Khánh Hòa, các nhà hàng tiệc cưới ven biển",
    note: "Khách ở xa đặt hoa tặng người thân đang du lịch hoặc công tác tại Nha Trang chỉ cần gửi tên khách sạn và số phòng, shop giao tận quầy lễ tân.",
  },
  {
    slug: "shop-hoa-tuoi-da-lat",
    city: "Đà Lạt",
    areas: "khu trung tâm quanh chợ Đà Lạt và hồ Xuân Hương, khu Hòa Bình, đường Phan Đình Phùng, Trần Phú, Ba Tháng Hai",
    nearby: "Đức Trọng (Liên Khương), Lạc Dương, Bảo Lộc (theo lịch hẹn)",
    places: "Đại học Đà Lạt, Bệnh viện Đa khoa Lâm Đồng, các homestay và khách sạn trung tâm",
    note: "Nhiều khách đặt hoa Đà Lạt để tặng người yêu đang đi du lịch: gửi tên homestay hoặc khách sạn và giờ khách có mặt để shop hẹn giờ giao.",
  },
  {
    slug: "shop-hoa-tuoi-vung-tau",
    city: "Vũng Tàu",
    store: "Vũng Tàu",
    areas: "Phường 1 đến Phường 12, Thắng Tam, Thắng Nhì, Thắng Nhất, Rạch Dừa, Nguyễn An Ninh, khu Bãi Trước và Bãi Sau",
    nearby: "Bà Rịa, Long Điền, Phú Mỹ",
    places: "khách sạn ven biển Bãi Sau, Bệnh viện Lê Lợi, các văn phòng khu công nghiệp dầu khí",
    note: "Hoa khai trương và hoa chia buồn tại Vũng Tàu nên đặt trước vài giờ để shop sắp xếp xe chở kệ hoa lớn.",
  },
  {
    slug: "shop-hoa-tuoi-bien-hoa",
    city: "Biên Hòa",
    store: "Biên Hòa",
    areas: "Trung Dũng, Quang Vinh, Tân Phong, Tân Hiệp, Tam Hiệp, Hố Nai, Long Bình, Bửu Long, Hóa An",
    nearby: "Trảng Bom, Long Thành, Nhơn Trạch, Vĩnh Cửu",
    places: "Khu công nghiệp Biên Hòa 1, Biên Hòa 2, Amata, Bệnh viện Đa khoa Đồng Nai, các nhà tang lễ trong thành phố",
    note: "Doanh nghiệp trong khu công nghiệp thường đặt kệ hoa khai trương và hoa chúc mừng đối tác: gửi tên công ty và cổng ra vào để giao đúng chỗ.",
  },
  {
    slug: "shop-hoa-tuoi-hue",
    city: "Huế",
    store: "Huế",
    areas: "Phú Hội, Phú Nhuận, Vĩnh Ninh, Phú Hòa, Vỹ Dạ, An Cựu, Xuân Phú, Thuận Hòa, Kim Long",
    nearby: "Hương Thủy, Hương Trà, Phú Vang",
    places: "Bệnh viện Trung ương Huế, Đại học Huế, khách sạn khu phố Tây Phạm Ngũ Lão",
    note: "Đơn hoa chia buồn ở Huế thường cần giao sớm: báo shop địa chỉ tang lễ và nội dung băng tang ngay khi đặt.",
  },
  {
    slug: "shop-hoa-tuoi-vinh",
    city: "Vinh",
    areas: "Hưng Dũng, Bến Thủy, Trường Thi, Quang Trung, Hà Huy Tập, Lê Mao, Hưng Bình, Đội Cung",
    nearby: "Cửa Lò, Nghi Lộc, Hưng Nguyên",
    places: "Đại học Vinh, Bệnh viện Hữu nghị Đa khoa Nghệ An, Quảng trường Hồ Chí Minh",
    note: "Hoa tốt nghiệp ở Đại học Vinh vào mùa lễ tốt nghiệp nên đặt trước 1–2 ngày để giữ mẫu.",
  },
  {
    slug: "shop-hoa-tuoi-hai-duong",
    city: "Hải Dương",
    areas: "Trần Hưng Đạo, Nguyễn Trãi, Phạm Ngũ Lão, Quang Trung, Thanh Bình, Tân Bình, Hải Tân, Việt Hòa",
    nearby: "Nam Sách, Cẩm Giàng, Gia Lộc, Chí Linh, Kinh Môn",
    places: "Khu công nghiệp Đại An, Nam Sách, Bệnh viện Đa khoa tỉnh Hải Dương, Quảng trường Thống Nhất",
    note: "Kệ hoa khai trương cho cửa hàng, công ty ở các khu công nghiệp quanh Hải Dương được giao và dựng tận nơi.",
  },
];

/** Khối sản phẩm của website cũ (mã danh mục WooCommerce) — trang khu vực hiện các mẫu tiêu biểu theo dịp */
const SECTIONS = `<strong>Hoa chúc mừng</strong>
[ux_products cat="1270"]
<strong>Hoa chia buồn</strong>
[ux_products cat="1288"]
<strong>Hoa khai trương</strong>
[ux_products cat="1266"]
<strong>Hoa tình yêu</strong>
[ux_products cat="1272"]`;

function storeAddress(prefix?: string) {
  if (!prefix) return null;
  for (const s of site.stores) for (const a of s.addresses) if (a.startsWith(`${prefix}:`)) return a.slice(prefix.length + 1).trim();
  return null;
}

function html(c: CityPage) {
  const addr = storeAddress(c.store);
  const phone = `<a href="tel:${site.phone}">${site.phoneDisplay}</a>`;
  return `<p>Hoa Thanh Nhã nhận đặt và giao hoa tươi tại ${c.city}: hoa sinh nhật, hoa khai trương, hoa chúc mừng, hoa chia buồn và lan hồ điệp. Mỗi đơn được chụp ảnh thật gửi bạn trước khi giao, kèm thiệp hoặc băng rôn ghi lời chúc miễn phí.</p>
${SECTIONS}
<h2>Giao hoa tận nơi tại ${c.city}</h2>
<p>Shop giao trong ngày đến các phường ${c.areas}. Khu vực lân cận: ${c.nearby}. Điểm giao thường gặp: ${c.places}.</p>
<p>${c.note}</p>
${
  addr
    ? `<h2>Cửa hàng hoa tại ${c.city}</h2>
<p>Địa chỉ: <strong>${addr}</strong>. Bạn có thể ghé xem hoa trực tiếp, hoặc đặt trên website và gọi/Zalo ${phone} để được tư vấn mẫu.</p>`
    : `<h2>Đặt hoa ${c.city} như thế nào?</h2>
<p>Chọn mẫu trên website và đặt hàng, hoặc gọi/Zalo ${phone}. Shop xác nhận mẫu, thời gian giao và gửi ảnh hoa trước khi giao đến người nhận tại ${c.city}.</p>`
}
<h2>Câu hỏi thường gặp</h2>
<h3>Đặt hoa ${c.city} bao lâu thì giao?</h3>
<p>Đơn trong giờ làm việc được giao trong ngày. Đơn gấp hoặc cần giao đúng giờ (khai trương, tang lễ), hãy gọi ${phone} để shop báo thời gian cụ thể.</p>
<h3>Có giao hoa ${c.city} khi tôi ở tỉnh khác hoặc nước ngoài?</h3>
<p>Có. Bạn đặt và thanh toán online (chuyển khoản, quét mã VietQR), shop giao đến người nhận và gửi ảnh xác nhận qua Zalo.</p>
<h3>Có thiết kế hoa theo yêu cầu không?</h3>
<p>Có. Gửi ảnh mẫu, màu sắc hoặc ngân sách, shop tư vấn mẫu phù hợp. Xem thêm <a href="/hoa-sinh-nhat/">hoa sinh nhật</a>, <a href="/hoa-khai-truong/">hoa khai trương</a> và <a href="/hoa-chia-buon/">hoa chia buồn</a>.</p>`;
}

export async function syncCityPages(db: Connection): Promise<string[]> {
  const log: string[] = [];
  const [[group]] = (await db.query("select id from categories where slug = 'khu-vuc'")) as [{ id: number }[], unknown];
  const [[source]] = (await db.query("select id from categories where slug = 'shop-hoa-tuoi-thanh-pho-ho-chi-minh'")) as [{ id: number }[], unknown];
  for (const c of CITIES) {
    const name = `Shop Hoa Tươi ${c.city}`;
    await db.query(
      `insert into categories (name, slug, parent_id, description, sort_order) values (?, ?, ?, ?, 90)
       on duplicate key update name = values(name), description = values(description)`,
      [name, c.slug, group?.id ?? null, html(c)],
    );
    const [[cat]] = (await db.query("select id from categories where slug = ?", [c.slug])) as [{ id: number }[], unknown];
    const [[{ n }]] = (await db.query("select count(*) n from product_categories where category_id = ?", [cat.id])) as [{ n: number }[], unknown];
    if (!n && source) {
      await db.query(
        `insert ignore into product_categories (product_id, category_id)
         select pc.product_id, ? from product_categories pc join products p on p.id = pc.product_id and p.is_active = 1 where pc.category_id = ?`,
        [cat.id, source.id],
      );
    }
    await db.query(
      `insert into seo_meta (path, title, description) values (?, ?, ?)
       on duplicate key update title = values(title), description = values(description)`,
      [
        `/${c.slug}/`,
        `Shop Hoa Tươi ${c.city} – Đặt Hoa Giao Tận Nơi | Hoa Thanh Nhã`,
        `Shop hoa tươi ${c.city}: hoa sinh nhật, khai trương, chia buồn, giao trong ngày, gửi ảnh trước khi giao, tặng thiệp. Gọi ${site.phoneDisplay}.`,
      ],
    );
    const [[{ total }]] = (await db.query("select count(*) total from product_categories where category_id = ?", [cat.id])) as [{ total: number }[], unknown];
    log.push(`✓ /${c.slug}/: ${n ? "cập nhật" : "tạo"}, ${total} mẫu`);
  }
  return log;
}
