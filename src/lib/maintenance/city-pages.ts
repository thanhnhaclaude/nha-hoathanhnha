/**
 * Trang khu vực cho các thành phố ra đơn nhiều nhưng không có trang trên website (phân tích 21/10/2026:
 * file theo dõi sale + chuyển đổi Google Ads). Website cũ có /shop-hoa-tuoi-nha-trang/ … nhưng không chép sang được.
 * Tạo dưới nhóm "KHU VỰC"; nội dung quản lý tại đây (cập nhật mỗi lần máy chủ khởi động).
 * Sản phẩm: lần đầu gán bộ mẫu bán chạy (AREA_MIX); sau đó giữ nguyên nếu đã chỉnh trong admin.
 * Địa chỉ cửa hàng lấy từ site.stores — thành phố không có cửa hàng thì không ghi địa chỉ. Chạy lặp lại an toàn.
 */
import type { Connection } from "mysql2/promise";
import { site, storeAreas } from "../site";

type CityPage = {
  slug: string;
  city: string;
  /** Tiền tố trong site.stores ("Nha Trang: …") */
  store?: string;
  /** Nơi giao, viết đủ ("các phường A, B" / "thành phố X và các huyện Y") */
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
    areas: "các phường Lộc Thọ, Phước Tân, Phước Tiến, Tân Lập, Vĩnh Hải, Vĩnh Phước, Phước Long, Vĩnh Nguyên, Vĩnh Hòa",
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
    areas: "các phường 1 đến 12, Thắng Tam, Thắng Nhì, Thắng Nhất, Rạch Dừa, Nguyễn An Ninh, khu Bãi Trước và Bãi Sau",
    nearby: "Bà Rịa, Long Điền, Phú Mỹ",
    places: "khách sạn ven biển Bãi Sau, Bệnh viện Lê Lợi, các văn phòng khu công nghiệp dầu khí",
    note: "Hoa khai trương và hoa chia buồn tại Vũng Tàu nên đặt trước vài giờ để shop sắp xếp xe chở kệ hoa lớn.",
  },
  {
    slug: "shop-hoa-tuoi-bien-hoa",
    city: "Biên Hòa",
    store: "Biên Hòa",
    areas: "các phường Trung Dũng, Quang Vinh, Tân Phong, Tân Hiệp, Tam Hiệp, Hố Nai, Long Bình, Bửu Long, Hóa An",
    nearby: "Trảng Bom, Long Thành, Nhơn Trạch, Vĩnh Cửu",
    places: "Khu công nghiệp Biên Hòa 1, Biên Hòa 2, Amata, Bệnh viện Đa khoa Đồng Nai, các nhà tang lễ trong thành phố",
    note: "Doanh nghiệp trong khu công nghiệp thường đặt kệ hoa khai trương và hoa chúc mừng đối tác: gửi tên công ty và cổng ra vào để giao đúng chỗ.",
  },
  {
    slug: "shop-hoa-tuoi-hue",
    city: "Huế",
    store: "Huế",
    areas: "các phường Phú Hội, Phú Nhuận, Vĩnh Ninh, Phú Hòa, Vỹ Dạ, An Cựu, Xuân Phú, Thuận Hòa, Kim Long",
    nearby: "Hương Thủy, Hương Trà, Phú Vang",
    places: "Bệnh viện Trung ương Huế, Đại học Huế, khách sạn khu phố Tây Phạm Ngũ Lão",
    note: "Đơn hoa chia buồn ở Huế thường cần giao sớm: báo shop địa chỉ tang lễ và nội dung băng tang ngay khi đặt.",
  },
  {
    slug: "shop-hoa-tuoi-vinh",
    city: "Vinh",
    areas: "các phường Hưng Dũng, Bến Thủy, Trường Thi, Quang Trung, Hà Huy Tập, Lê Mao, Hưng Bình, Đội Cung",
    nearby: "Cửa Lò, Nghi Lộc, Hưng Nguyên",
    places: "Đại học Vinh, Bệnh viện Hữu nghị Đa khoa Nghệ An, Quảng trường Hồ Chí Minh",
    note: "Hoa tốt nghiệp ở Đại học Vinh vào mùa lễ tốt nghiệp nên đặt trước 1–2 ngày để giữ mẫu.",
  },
  {
    slug: "shop-hoa-tuoi-hai-duong",
    city: "Hải Dương",
    areas: "các phường Trần Hưng Đạo, Nguyễn Trãi, Phạm Ngũ Lão, Quang Trung, Thanh Bình, Tân Bình, Hải Tân, Việt Hòa",
    nearby: "Nam Sách, Cẩm Giàng, Gia Lộc, Chí Linh, Kinh Môn",
    places: "Khu công nghiệp Đại An, Nam Sách, Bệnh viện Đa khoa tỉnh Hải Dương, Quảng trường Thống Nhất",
    note: "Kệ hoa khai trương cho cửa hàng, công ty ở các khu công nghiệp quanh Hải Dương được giao và dựng tận nơi.",
  },
  // Tuần 2 (2/11/2026): 4 quận TP.HCM có cửa hàng — nội dung riêng thay mô tả mẫu chung của website cũ
  {
    slug: "shop-hoa-tuoi-quan-1",
    city: "Quận 1",
    areas: "các phường Bến Nghé, Bến Thành, Đa Kao, Tân Định, Nguyễn Thái Bình, Phạm Ngũ Lão, Cầu Ông Lãnh, Cô Giang, Nguyễn Cư Trinh, Cầu Kho",
    nearby: "Quận 3, Quận 4, Bình Thạnh, Phú Nhuận",
    places: "văn phòng và khách sạn khu Đồng Khởi, Nguyễn Huệ, Lê Duẩn, Nhà hát Thành phố, Bệnh viện Nhi Đồng 2, các nhà hàng tiệc cưới trung tâm",
    note: "Cửa hàng nằm ngay đường Hai Bà Trưng nên đơn trong Quận 1 thường được giao sớm nhất; đặt hoa gửi văn phòng, khách sạn chỉ cần ghi tên tòa nhà, tầng và người nhận.",
  },
  {
    slug: "shop-hoa-tuoi-quan-go-vap",
    city: "Quận Gò Vấp",
    areas: "các phường 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 dọc các trục Quang Trung, Nguyễn Văn Lượng, Phan Văn Trị, Lê Đức Thọ, Nguyễn Oanh",
    nearby: "Quận 12, Phú Nhuận, Bình Thạnh, Tân Bình",
    places: "Bệnh viện Quân y 175, Công viên Văn hóa Gia Định, Đại học Công nghiệp TP.HCM, khu dân cư Cityland, các chợ Hạnh Thông Tây, Gò Vấp",
    note: "Cửa hàng ở 229 Quang Trung, Phường 10 — giữa quận — nên các phường Gò Vấp đều trong bán kính giao nhanh; có thể ghé chọn hoa và nhận ngay.",
  },
  {
    slug: "shop-hoa-tuoi-quan-12",
    city: "Quận 12",
    areas: "các phường Tân Thới Hiệp, Hiệp Thành, Tân Chánh Hiệp, Thới An, Thạnh Lộc, Thạnh Xuân, An Phú Đông, Đông Hưng Thuận, Tân Hưng Thuận, Trung Mỹ Tây, Tân Thới Nhất",
    nearby: "Gò Vấp, Hóc Môn, Thủ Đức, Tân Bình",
    places: "Công viên phần mềm Quang Trung, khu công nghiệp Tân Thới Hiệp, Bệnh viện Quận 12, chợ Hiệp Thành, các trường trên đường Lê Văn Khương",
    note: "Cửa hàng ở 181 Thị Mười, Tân Thới Hiệp; doanh nghiệp ở Công viên phần mềm Quang Trung và khu công nghiệp thường đặt kệ hoa khai trương, hoa chúc mừng giao tận văn phòng.",
  },
  {
    slug: "shop-hoa-tuoi-quan-thu-duc",
    city: "Quận Thủ Đức",
    areas: "các phường Hiệp Bình Chánh, Hiệp Bình Phước, Linh Đông, Linh Tây, Linh Chiểu, Linh Trung, Bình Thọ, Trường Thọ, Tam Bình, Tam Phú và khu Thảo Điền, An Phú, Phước Long, Tăng Nhơn Phú thuộc TP. Thủ Đức",
    nearby: "Bình Thạnh, Quận 12, Dĩ An, Thuận An",
    places: "Làng Đại học Quốc gia, Vinhomes Grand Park, Gigamall, Vincom Thủ Đức, khu biệt thự Thảo Điền, Bệnh viện Thủ Đức",
    note: "Cửa hàng ở 61/5 Kha Vạn Cân, Hiệp Bình Chánh; hoa tốt nghiệp giao tận cổng các trường trong Làng Đại học vào mùa lễ nên đặt trước 1–2 ngày.",
  },
  // Tuần 1 (26/10/2026): trang tỉnh đang có thứ hạng trên Google nhưng mất khi chuyển website (trước đó chuyển hướng về trang chung)
  {
    slug: "shop-hoa-tuoi-cao-lanh",
    city: "Cao Lãnh",
    areas: "các phường 1, 2, 3, 4, 6, 11, Mỹ Phú, Hòa Thuận và các xã ven thành phố",
    nearby: "Sa Đéc, Lấp Vò, Tháp Mười, Thanh Bình",
    places: "Bệnh viện Đa khoa Đồng Tháp, Đại học Đồng Tháp, khu di tích Nguyễn Sinh Sắc",
    note: "Hoa chia buồn và kệ hoa khai trương tại Cao Lãnh nên đặt sớm vài giờ để shop chuẩn bị và giao đúng giờ.",
  },
  {
    slug: "shop-hoa-tuoi-nhon-trach",
    city: "Nhơn Trạch",
    areas: "các xã, thị trấn Hiệp Phước, Phú Hội, Long Tân, Phước Thiền, Phú Thạnh, Long Thọ, Phước An",
    nearby: "Long Thành, Biên Hòa, Thủ Đức",
    places: "các khu công nghiệp Nhơn Trạch 1 đến 6, văn phòng nhà máy, khu dân cư quanh trung tâm huyện",
    note: "Doanh nghiệp trong khu công nghiệp Nhơn Trạch thường đặt kệ hoa khai trương và hoa chúc mừng đối tác: gửi tên công ty, cổng ra vào để giao đúng chỗ.",
  },
  {
    slug: "shop-hoa-tuoi-uong-bi",
    city: "Uông Bí",
    areas: "các phường Quang Trung, Thanh Sơn, Trưng Vương, Yên Thanh, Bắc Sơn, Phương Đông, Nam Khê",
    nearby: "Đông Triều, Quảng Yên, Hạ Long",
    places: "Bệnh viện Việt Nam – Thụy Điển Uông Bí, khu di tích Yên Tử, các khu dân cư trung tâm",
    note: "Khách ở xa đặt hoa sinh nhật, hoa chúc mừng cho người thân ở Uông Bí chỉ cần gửi địa chỉ và số điện thoại người nhận, shop gửi ảnh trước khi giao.",
  },
  {
    slug: "shop-hoa-tuoi-cam-ranh",
    city: "Cam Ranh",
    areas: "các phường Cam Nghĩa, Cam Phú, Cam Lộc, Cam Thuận, Cam Lợi, Ba Ngòi, Cam Linh",
    nearby: "Cam Lâm, Nha Trang",
    places: "sân bay Cam Ranh, các resort Bãi Dài, khu dân cư trung tâm Ba Ngòi",
    note: "Hoa tặng khách nghỉ dưỡng tại các resort Bãi Dài: gửi tên resort, tên khách và giờ có mặt để shop hẹn giao tại lễ tân.",
  },
  {
    slug: "shop-hoa-tuoi-viet-tri",
    city: "Việt Trì",
    areas: "các phường Gia Cẩm, Tân Dân, Tiên Cát, Thọ Sơn, Nông Trang, Dữu Lâu, Vân Phú, Bến Gót",
    nearby: "Phù Ninh, Lâm Thao, thị xã Phú Thọ",
    places: "Bệnh viện Đa khoa tỉnh Phú Thọ, khu di tích Đền Hùng, Đại học Hùng Vương",
    note: "Mùa lễ hội Đền Hùng và mùa tốt nghiệp đơn hoa tăng nhiều, nên đặt trước 1 ngày để giữ mẫu.",
  },
  {
    slug: "shop-hoa-tuoi-hong-ngu",
    city: "Hồng Ngự",
    areas: "các phường An Thạnh, An Lộc, An Lạc, An Bình và các xã lân cận",
    nearby: "Tân Hồng, Tam Nông, Thanh Bình",
    places: "chợ Hồng Ngự, Bệnh viện Đa khoa khu vực Hồng Ngự, các nhà tang lễ trong thành phố",
    note: "Đơn hoa chia buồn ở Hồng Ngự: báo shop địa chỉ tang lễ và nội dung băng tang ngay khi đặt để giao kịp.",
  },
  {
    slug: "shop-hoa-tuoi-tuy-hoa",
    city: "Tuy Hòa",
    areas: "các phường 1 đến 9, Phú Lâm, Phú Đông, Phú Thạnh",
    nearby: "Đông Hòa, Phú Hòa, Sông Cầu",
    places: "Bệnh viện Đa khoa tỉnh Phú Yên, tháp Nhạn, các khách sạn ven biển đường Độc Lập",
    note: "Khách ở xa đặt hoa cho gia đình ở Tuy Hòa được gửi ảnh hoa thật qua Zalo trước khi giao.",
  },
  {
    slug: "shop-hoa-tuoi-phu-quoc",
    city: "Phú Quốc",
    areas: "Dương Đông, An Thới, Cửa Lấp, Gành Dầu, khu Bãi Trường, Bãi Khem",
    nearby: "các xã ven đảo theo lịch hẹn",
    places: "các resort Bãi Trường và Bãi Khem, Grand World, sân bay Phú Quốc",
    note: "Hoa tặng khách đang nghỉ dưỡng hoặc cầu hôn tại resort: gửi tên resort, tên khách và giờ hẹn để shop phối hợp với lễ tân.",
  },
  {
    slug: "shop-hoa-tuoi-rach-gia",
    city: "Rạch Giá",
    areas: "các phường Vĩnh Thanh Vân, Vĩnh Thanh, Vĩnh Lạc, Vĩnh Bảo, An Hòa, Rạch Sỏi, Vĩnh Quang, Vĩnh Hiệp",
    nearby: "Châu Thành, Tân Hiệp, Hòn Đất, Hà Tiên (theo lịch hẹn)",
    places: "Bệnh viện Đa khoa tỉnh Kiên Giang, khu lấn biển Phú Cường, các văn phòng trung tâm",
    note: "Kệ hoa khai trương ở khu lấn biển Rạch Giá được giao và dựng tận nơi trước giờ làm lễ.",
  },
  {
    slug: "shop-hoa-tuoi-ha-nam",
    city: "Hà Nam",
    areas: "thành phố Phủ Lý (Hai Bà Trưng, Lương Khánh Thiện, Minh Khai, Quang Trung, Lam Hạ) và Duy Tiên, Kim Bảng, Thanh Liêm, Bình Lục, Lý Nhân",
    nearby: "Hà Nội, Nam Định, Ninh Bình",
    places: "Bệnh viện Bạch Mai và Việt Đức cơ sở 2 tại Phủ Lý, khu công nghiệp Đồng Văn, chùa Tam Chúc",
    note: "Thăm người thân điều trị tại các bệnh viện cơ sở 2 ở Phủ Lý: chọn giỏ hoa hoặc giỏ trái cây nhỏ gọn, gửi tên khoa và số phòng.",
  },
  {
    slug: "shop-hoa-tuoi-quang-ngai",
    city: "Quảng Ngãi",
    areas: "các phường Trần Phú, Lê Hồng Phong, Nghĩa Chánh, Nghĩa Lộ, Chánh Lộ, Quảng Phú, Trương Quang Trọng",
    nearby: "Sơn Tịnh, Tư Nghĩa, Bình Sơn (Dung Quất)",
    places: "Bệnh viện Đa khoa tỉnh Quảng Ngãi, khu kinh tế Dung Quất, các văn phòng trung tâm",
    note: "Doanh nghiệp ở khu kinh tế Dung Quất đặt hoa chúc mừng, khai trương: gửi tên công ty và giờ làm lễ.",
  },
  {
    slug: "shop-hoa-tuoi-hau-giang",
    city: "Hậu Giang",
    areas: "thành phố Vị Thanh (phường I, III, IV, V, VII), Ngã Bảy và Long Mỹ, Châu Thành A, Phụng Hiệp",
    nearby: "Cần Thơ, Sóc Trăng",
    places: "Bệnh viện Đa khoa tỉnh Hậu Giang, khu công nghiệp Tân Phú Thạnh, chợ nổi Ngã Bảy",
    note: "Khách ở Cần Thơ hoặc TP.HCM đặt hoa cho người thân ở Hậu Giang được gửi ảnh hoa thật qua Zalo trước khi giao.",
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
  const addr = storeAreas[c.slug]?.street ?? storeAddress(c.store);
  const maps = addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addr}, ${storeAreas[c.slug]?.city ?? c.city}`)}` : "";
  const phone = `<a href="tel:${site.phone}">${site.phoneDisplay}</a>`;
  return `<p>Hoa Thanh Nhã nhận đặt và giao hoa tươi tại ${c.city}: hoa sinh nhật, hoa khai trương, hoa chúc mừng, hoa chia buồn và lan hồ điệp. Mỗi đơn được chụp ảnh thật gửi bạn trước khi giao, kèm thiệp hoặc băng rôn ghi lời chúc miễn phí.</p>
${SECTIONS}
<h2>Giao hoa tận nơi tại ${c.city}</h2>
<p>Shop giao trong ngày đến ${c.areas}. Khu vực lân cận: ${c.nearby}. Điểm giao thường gặp: ${c.places}.</p>
<p>${c.note}</p>
${
  addr
    ? `<h2>Cửa hàng hoa tại ${c.city}</h2>
<p>Địa chỉ: <strong>${addr}</strong> (<a href="${maps}" rel="nofollow noopener" target="_blank">chỉ đường Google Maps</a>). Mở cửa 06:00–21:00 hằng ngày. Bạn có thể ghé xem hoa trực tiếp, hoặc đặt trên website và gọi/Zalo ${phone} để được tư vấn mẫu.</p>`
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
  for (const c of CITIES) {
    const name = `Shop Hoa Tươi ${c.city}`;
    await db.query(
      `insert into categories (name, slug, parent_id, description, sort_order) values (?, ?, ?, ?, 90)
       on duplicate key update name = values(name), description = values(description)`,
      [name, c.slug, group?.id ?? null, html(c)],
    );
    const [[cat]] = (await db.query("select id from categories where slug = ?", [c.slug])) as [{ id: number }[], unknown];
    const [[{ n }]] = (await db.query("select count(*) n from product_categories where category_id = ?", [cat.id])) as [{ n: number }[], unknown];
    if (!n) await setAreaProducts(db, cat.id, await areaMixIds(db));
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

/** Nhóm mẫu bán chạy dùng cho trang khu vực (số mẫu mới nhất có giá lấy từ mỗi nhóm) */
const AREA_MIX: [string, number][] = [
  ["hoa-bo", 12],
  ["hoa-gio", 12],
  ["ke-hoa-khai-truong", 12],
  ["lan-ho-diep-khai-truong", 8],
  ["hoa-chia-buon", 12],
];

/** Mã sản phẩm của bộ mẫu trang khu vực: hoa bó, giỏ, kệ khai trương, lan hồ điệp, chia buồn (chỉ mẫu đang bán, có giá) */
async function areaMixIds(db: Connection) {
  const ids = new Set<number>();
  for (const [slug, n] of AREA_MIX) {
    const [rows] = (await db.query(
      `select p.id from products p join product_categories pc on pc.product_id = p.id join categories c on c.id = pc.category_id
       where c.slug = ? and p.is_active = 1 and p.price > 0 order by p.created_at desc, p.id desc limit ?`,
      [slug, n],
    )) as [{ id: number }[], unknown];
    rows.forEach((r) => ids.add(r.id));
  }
  return [...ids];
}

async function setAreaProducts(db: Connection, categoryId: number, ids: number[]) {
  await db.query("delete from product_categories where category_id = ?", [categoryId]);
  if (ids.length) await db.query("insert ignore into product_categories (product_id, category_id) values ?", [ids.map((id) => [id, categoryId])]);
}

/**
 * Trang khu vực (shop-hoa-tuoi-…) ít mẫu (dưới 8, vd. Quy Nhơn chỉ 1 mẫu), hoặc trang thành phố trong CITIES đang mang nguyên bộ mẫu TP. Hồ Chí Minh
 * (nhiều xe hoa cưới, giỏ trái cây giá "Liên hệ" — không hợp trang shop hoa của tỉnh): gán bộ mẫu bán chạy AREA_MIX,
 * để lưới luôn đủ 2 hàng × 4 cột với mẫu phổ biến. Trang đã có bộ mẫu riêng (chỉnh trong admin) được giữ nguyên.
 * Chạy lặp lại an toàn.
 */
export async function fillThinAreaPages(db: Connection): Promise<string[]> {
  const [[source]] = (await db.query("select id from categories where slug = 'shop-hoa-tuoi-thanh-pho-ho-chi-minh'")) as [{ id: number }[], unknown];
  const ids = await areaMixIds(db);
  if (ids.length < 8) return ["! Trang khu vực: bộ mẫu bán chạy chưa đủ 8 mẫu, giữ nguyên"];
  const [targets] = (await db.query(
    `select c.id, c.slug,
       (select count(*) from product_categories pc join products p on p.id = pc.product_id and p.is_active = 1 where pc.category_id = c.id) as total,
       (select count(*) from product_categories pc where pc.category_id = c.id
          and pc.product_id not in (select product_id from product_categories where category_id = ?)) as own
     from categories c
     where c.slug like 'shop-hoa-tuoi-%' and c.id <> ?`,
    [source?.id ?? 0, source?.id ?? 0],
  )) as [{ id: number; slug: string; total: number; own: number }[], unknown];
  const mixSet = new Set(ids);
  let changed = 0;
  for (const c of targets) {
    const thin = Number(c.total) < 8;
    // Trang thành phố/tỉnh tạo ở CITIES mà vẫn mang nguyên bộ mẫu TP.HCM (bản trước). Trang quận cũ đang có thứ hạng không đụng tới.
    // Trang quận cũ (shop-hoa-tuoi-quan-…) giữ danh sách mẫu đang có
    const copyOfHcm = CITIES.some((x) => x.slug === c.slug) && !c.slug.startsWith("shop-hoa-tuoi-quan-") && Number(c.total) >= 50 && Number(c.own) === 0;
    if (!thin && !copyOfHcm) continue;
    if (!thin) {
      // đã là bộ mẫu bán chạy rồi thì thôi
      const [cur] = (await db.query("select product_id from product_categories where category_id = ?", [c.id])) as [{ product_id: number }[], unknown];
      if (cur.length === ids.length && cur.every((r) => mixSet.has(r.product_id))) continue;
    }
    await setAreaProducts(db, c.id, ids);
    changed++;
  }
  return [`✓ Trang khu vực: bộ mẫu bán chạy (${ids.length} mẫu) cho ${changed} trang`];
}
