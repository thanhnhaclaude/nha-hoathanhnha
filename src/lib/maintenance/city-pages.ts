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
  /** Trang tỉnh: slug các trang huyện/thành phố trong tỉnh (liên kết xuống) */
  districts?: string[];
  /** Trang huyện/thành phố: slug trang tỉnh (liên kết lên) */
  province?: string;
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
    province: "shop-hoa-tuoi-dong-nai",
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
  // Tuần 4 (16/11/2026): quận/huyện Đà Nẵng — nội dung riêng thay mô tả mẫu chung (giữ danh sách mẫu đang có)
  {
    slug: "shop-hoa-tuoi-quan-hai-chau",
    city: "Quận Hải Châu",
    areas: "các phường Thạch Thang, Hải Châu 1, Hải Châu 2, Phước Ninh, Bình Hiên, Bình Thuận, Nam Dương, Hòa Thuận Đông, Hòa Thuận Tây, Hòa Cường Bắc, Hòa Cường Nam, Thuận Phước, Thanh Bình (trung tâm Đà Nẵng)",
    nearby: "Thanh Khê, Sơn Trà, Cẩm Lệ",
    places: "khách sạn ven sông Hàn đường Bạch Đằng, chợ Hàn, Bệnh viện Đà Nẵng, Bệnh viện C, Trung tâm Hành chính thành phố, sân bay Đà Nẵng",
    note: "Hải Châu nằm giữa hai cửa hàng Thanh Khê và Cẩm Lệ nên đơn trong quận được giao nhanh; gửi hoa tới khách sạn ven sông Hàn chỉ cần ghi tên khách sạn, số phòng.",
  },
  {
    slug: "shop-hoa-tuoi-quan-thanh-khe",
    city: "Quận Thanh Khê",
    areas: "các phường Tam Thuận, Thanh Khê Tây, Thanh Khê Đông, Xuân Hà, Tân Chính, Chính Gián, Vĩnh Trung, Thạc Gián, An Khê, Hòa Khê (Đà Nẵng)",
    nearby: "Hải Châu, Liên Chiểu, Cẩm Lệ",
    places: "Công viên 29/3, bãi biển Thanh Khê, các trường và văn phòng dọc Điện Biên Phủ, Hà Huy Tập, Nguyễn Văn Linh",
    note: "Cửa hàng ở 396 Nguyễn Hoàng; khách ở Thanh Khê có thể ghé chọn hoa trực tiếp hoặc đặt online để giao trong ngày.",
  },
  {
    slug: "shop-hoa-tuoi-quan-cam-le",
    city: "Quận Cẩm Lệ",
    areas: "các phường Hòa Xuân, Khuê Trung, Hòa Thọ Đông, Hòa Thọ Tây, Hòa An, Hòa Phát (Đà Nẵng)",
    nearby: "Hải Châu, Ngũ Hành Sơn, Hòa Vang",
    places: "khu đô thị Hòa Xuân, cầu Hòa Xuân, bến xe trung tâm Đà Nẵng, chợ Cẩm Lệ",
    note: "Cửa hàng ở 05 Trần Văn Cẩn, Hòa Xuân — thuận tiện cho khu đô thị Hòa Xuân và phía nam thành phố.",
  },
  {
    slug: "shop-hoa-tuoi-quan-lien-chieu",
    city: "Quận Liên Chiểu",
    areas: "các phường Hòa Minh, Hòa Khánh Nam, Hòa Khánh Bắc, Hòa Hiệp Nam, Hòa Hiệp Bắc (Đà Nẵng)",
    nearby: "Thanh Khê, Hòa Vang",
    places: "Đại học Bách khoa và Đại học Sư phạm Đà Nẵng, khu công nghiệp Hòa Khánh, đèo Hải Vân",
    note: "Mùa tốt nghiệp ở các trường Đại học Bách khoa, Sư phạm đơn hoa tăng mạnh, nên đặt trước 1–2 ngày và ghi rõ cổng trường.",
  },
  {
    slug: "shop-hoa-tuoi-quan-son-tra",
    city: "Quận Sơn Trà",
    areas: "các phường An Hải Bắc, An Hải Đông, An Hải Tây, Phước Mỹ, Mân Thái, Thọ Quang, Nại Hiên Đông (Đà Nẵng)",
    nearby: "Hải Châu, Ngũ Hành Sơn",
    places: "khách sạn và căn hộ dọc biển Mỹ Khê, đường Võ Nguyên Giáp, bán đảo Sơn Trà, chùa Linh Ứng",
    note: "Nhiều khách đặt hoa tặng người thân đang nghỉ ở khách sạn biển Mỹ Khê: gửi tên khách sạn và giờ khách có mặt để shop hẹn giao tại lễ tân.",
  },
  {
    slug: "shop-hoa-tuoi-quan-ngu-hanh-son",
    city: "Quận Ngũ Hành Sơn",
    areas: "các phường Mỹ An, Khuê Mỹ, Hòa Hải, Hòa Quý (Đà Nẵng)",
    nearby: "Sơn Trà, Cẩm Lệ, Hội An",
    places: "các resort ven biển Võ Nguyên Giáp – Trường Sa, danh thắng Ngũ Hành Sơn, Đại học Kinh tế Đà Nẵng, FPT City",
    note: "Hoa tặng khách nghỉ dưỡng hoặc cầu hôn tại resort Ngũ Hành Sơn: gửi tên resort, tên khách và giờ hẹn để shop phối hợp với lễ tân.",
  },
  {
    slug: "shop-hoa-tuoi-huyen-hoa-vang",
    city: "Huyện Hòa Vang",
    areas: "các xã Hòa Châu, Hòa Tiến, Hòa Phước, Hòa Phong, Hòa Khương, Hòa Nhơn, Hòa Sơn, Hòa Liên, Hòa Ninh, Hòa Phú, Hòa Bắc (Đà Nẵng)",
    nearby: "Cẩm Lệ, Liên Chiểu",
    places: "khu du lịch Bà Nà Hills, các khu dân cư dọc Quốc lộ 1A và đường Trường Sơn",
    note: "Các xã xa trung tâm như Hòa Bắc, Hòa Phú cần hẹn giờ giao; gọi trước để shop báo thời gian cụ thể.",
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
    province: "shop-hoa-tuoi-dong-nai",
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
  // Tuần 7 (7/12/2026): cụm Tây Ninh — trước đó chuyển hướng về trang TP.HCM
  {
    slug: "shop-hoa-tuoi-tay-ninh",
    city: "Tây Ninh",
    areas: "trung tâm thành phố Tây Ninh (các phường 1, 2, 3, 4, Hiệp Ninh, Ninh Sơn, Ninh Thạnh) và các khu Hòa Thành, Trảng Bàng, Gò Dầu",
    nearby: "Châu Thành, Dương Minh Châu, Tân Biên, Tân Châu, Bến Cầu",
    places: "khu du lịch núi Bà Đen, Tòa Thánh Cao Đài, Bệnh viện Đa khoa tỉnh Tây Ninh, các khu công nghiệp Trảng Bàng, Phước Đông",
    note: "Khách ở TP.HCM đặt hoa cho người thân ở Tây Ninh chỉ cần gửi địa chỉ và số điện thoại người nhận; shop gửi ảnh hoa thật qua Zalo trước khi giao.",
    districts: [
      "shop-hoa-tuoi-hoa-thanh",
      "shop-hoa-tuoi-trang-bang",
      "shop-hoa-tuoi-go-dau",
      "shop-hoa-tuoi-chau-thanh-tay-ninh",
      "shop-hoa-tuoi-duong-minh-chau",
      "shop-hoa-tuoi-tan-bien",
      "shop-hoa-tuoi-tan-chau-tay-ninh",
      "shop-hoa-tuoi-ben-cau",
    ],
  },
  {
    slug: "shop-hoa-tuoi-hoa-thanh",
    city: "Hòa Thành",
    areas: "các khu Long Hoa, Long Thành Bắc, Long Thành Trung, Hiệp Tân và các ấp quanh chợ Long Hoa",
    nearby: "thành phố Tây Ninh, Châu Thành, Dương Minh Châu",
    places: "Tòa Thánh Cao Đài Tây Ninh, chợ Long Hoa, các trường học và cơ quan dọc đường Phạm Văn Đồng",
    note: "Vào các dịp lễ lớn ở Tòa Thánh, đường quanh khu vực đông xe; nên đặt hoa sớm và ghi rõ giờ có người nhận.",
    province: "shop-hoa-tuoi-tay-ninh",
  },
  {
    slug: "shop-hoa-tuoi-trang-bang",
    city: "Trảng Bàng",
    areas: "các khu Trảng Bàng, An Tịnh, Gia Bình, Gia Lộc, Lộc Hưng, An Hòa dọc Quốc lộ 22",
    nearby: "Gò Dầu, Củ Chi, Bến Cầu",
    places: "khu công nghiệp Trảng Bàng, Thành Thành Công, văn phòng nhà máy dọc Xuyên Á, các nhà hàng đặc sản bánh canh Trảng Bàng",
    note: "Doanh nghiệp trong các khu công nghiệp Trảng Bàng thường đặt kệ hoa khai trương, hoa chúc mừng đối tác: gửi tên công ty và cổng ra vào để giao đúng chỗ.",
    province: "shop-hoa-tuoi-tay-ninh",
  },
  {
    slug: "shop-hoa-tuoi-go-dau",
    city: "Gò Dầu",
    areas: "thị trấn Gò Dầu và các khu Thanh Phước, Phước Thạnh, Phước Đông, Hiệp Thạnh, Bàu Đồn",
    nearby: "Trảng Bàng, Bến Cầu, Dương Minh Châu",
    places: "khu công nghiệp Phước Đông, chợ Gò Dầu, các cơ quan và trường học dọc Quốc lộ 22",
    note: "Kệ hoa khai trương cho nhà xưởng ở khu công nghiệp Phước Đông được giao và dựng tận nơi trước giờ làm lễ.",
    province: "shop-hoa-tuoi-tay-ninh",
  },
  {
    slug: "shop-hoa-tuoi-chau-thanh-tay-ninh",
    city: "Châu Thành (Tây Ninh)",
    areas: "thị trấn Châu Thành và các xã Thái Bình, Hảo Đước, Phước Vinh, An Bình, Trí Bình",
    nearby: "thành phố Tây Ninh, Hòa Thành, Bến Cầu",
    places: "Trung tâm hành chính huyện, chợ Châu Thành, các khu dân cư dọc đường 781",
    note: "Các xã xa trung tâm cần hẹn giờ giao; gọi trước để shop báo thời gian cụ thể.",
    province: "shop-hoa-tuoi-tay-ninh",
  },
  {
    slug: "shop-hoa-tuoi-duong-minh-chau",
    city: "Dương Minh Châu",
    areas: "thị trấn Dương Minh Châu và các xã Suối Đá, Phan, Truông Mít, Chà Là, Bàu Năng",
    nearby: "thành phố Tây Ninh, Hòa Thành, Tân Châu, Gò Dầu",
    places: "hồ Dầu Tiếng, khu vực chân núi Bà Đen phía Suối Đá, chợ Dương Minh Châu",
    note: "Hoa tặng người thân ở các xã ven hồ Dầu Tiếng nên ghi thêm mốc dễ tìm (chợ, trường, UBND xã) để giao nhanh.",
    province: "shop-hoa-tuoi-tay-ninh",
  },
  {
    slug: "shop-hoa-tuoi-tan-bien",
    city: "Tân Biên",
    areas: "thị trấn Tân Biên và các xã Thạnh Tây, Tân Lập, Thạnh Bình, Hòa Hiệp, Trà Vong",
    nearby: "Tân Châu, thành phố Tây Ninh, Châu Thành",
    places: "Khu di tích Căn cứ Trung ương Cục miền Nam, cửa khẩu Xa Mát, chợ Tân Biên",
    note: "Tân Biên cách trung tâm tỉnh khá xa; đặt trước nửa ngày để shop sắp xếp giao đúng giờ.",
    province: "shop-hoa-tuoi-tay-ninh",
  },
  {
    slug: "shop-hoa-tuoi-tan-chau-tay-ninh",
    city: "Tân Châu (Tây Ninh)",
    areas: "thị trấn Tân Châu và các xã Tân Hưng, Suối Ngô, Tân Đông, Tân Hội, Thạnh Đông",
    nearby: "Tân Biên, Dương Minh Châu",
    places: "chợ Tân Châu, các nhà máy chế biến mì, cao su dọc đường 785",
    note: "Các xã giáp biên giới cần hẹn giờ; gọi trước để shop báo thời gian giao cụ thể.",
    province: "shop-hoa-tuoi-tay-ninh",
  },
  {
    slug: "shop-hoa-tuoi-ben-cau",
    city: "Bến Cầu",
    areas: "thị trấn Bến Cầu và các xã Lợi Thuận, Long Thuận, Tiên Thuận, An Thạnh, Long Chữ",
    nearby: "Gò Dầu, Trảng Bàng, Châu Thành",
    places: "cửa khẩu quốc tế Mộc Bài, khu thương mại Mộc Bài, chợ Bến Cầu",
    note: "Hoa khai trương cho cửa hàng, công ty ở khu thương mại Mộc Bài: gửi tên đơn vị và giờ làm lễ để shop giao kịp.",
    province: "shop-hoa-tuoi-tay-ninh",
  },
  // Tuần 7 (7/12/2026): cụm Đồng Nai — trước đó chuyển hướng về trang Biên Hòa / Nhơn Trạch
  {
    slug: "shop-hoa-tuoi-dong-nai",
    city: "Đồng Nai",
    store: "Biên Hòa",
    areas: "Biên Hòa, Long Khánh, Trảng Bom, Long Thành, Nhơn Trạch, Vĩnh Cửu, Thống Nhất, Cẩm Mỹ, Xuân Lộc, Định Quán, Tân Phú",
    nearby: "Thủ Đức, Dĩ An, Bà Rịa",
    places: "các khu công nghiệp Biên Hòa, Amata, Nhơn Trạch, Long Thành, Bàu Xéo, Bệnh viện Đa khoa Đồng Nai, khu vực dự án sân bay Long Thành",
    note: "Cửa hàng ở Biên Hòa nhận đơn cho toàn tỉnh; các khu xa như Tân Phú, Định Quán, Xuân Lộc nên đặt trước để shop hẹn giờ giao.",
    districts: [
      "shop-hoa-tuoi-bien-hoa",
      "shop-hoa-tuoi-long-khanh",
      "shop-hoa-tuoi-trang-bom",
      "shop-hoa-tuoi-long-thanh",
      "shop-hoa-tuoi-nhon-trach",
      "shop-hoa-tuoi-vinh-cuu",
      "shop-hoa-tuoi-thong-nhat",
      "shop-hoa-tuoi-cam-my",
      "shop-hoa-tuoi-xuan-loc",
      "shop-hoa-tuoi-dinh-quan",
      "shop-hoa-tuoi-tan-phu",
    ],
  },
  {
    slug: "shop-hoa-tuoi-long-khanh",
    city: "Long Khánh",
    areas: "các phường Xuân An, Xuân Bình, Xuân Hòa, Xuân Trung, Xuân Thanh, Phú Bình, Bàu Trâm, Suối Tre",
    nearby: "Xuân Lộc, Cẩm Mỹ, Thống Nhất",
    places: "Bệnh viện Đa khoa khu vực Long Khánh, chợ Long Khánh, các vườn trái cây Suối Tre, Bảo Quang",
    note: "Khách ở TP.HCM, Biên Hòa đặt hoa cho gia đình ở Long Khánh được gửi ảnh hoa thật qua Zalo trước khi giao.",
    province: "shop-hoa-tuoi-dong-nai",
  },
  {
    slug: "shop-hoa-tuoi-trang-bom",
    city: "Trảng Bom",
    areas: "thị trấn Trảng Bom và các khu Bắc Sơn, Hố Nai 3, Quảng Tiến, Sông Trầu, Bàu Hàm, Giang Điền",
    nearby: "Biên Hòa, Thống Nhất, Vĩnh Cửu",
    places: "các khu công nghiệp Bàu Xéo, Sông Mây, Giang Điền, Hố Nai, các giáo xứ khu Hố Nai – Bắc Sơn",
    note: "Kệ hoa khai trương cho nhà xưởng ở khu công nghiệp Bàu Xéo, Sông Mây: gửi tên công ty và cổng ra vào để giao đúng chỗ.",
    province: "shop-hoa-tuoi-dong-nai",
  },
  {
    slug: "shop-hoa-tuoi-long-thanh",
    city: "Long Thành",
    areas: "thị trấn Long Thành và các xã An Phước, Long An, Long Phước, Bình An, Tam An, Lộc An, Bình Sơn",
    nearby: "Nhơn Trạch, Biên Hòa, Cẩm Mỹ",
    places: "các khu công nghiệp Long Thành, Lộc An – Bình Sơn, Tam Phước, khu vực dự án sân bay Long Thành, các sân golf",
    note: "Doanh nghiệp ở các khu công nghiệp Long Thành thường đặt hoa chúc mừng đối tác, kệ hoa khai trương: gửi tên công ty và giờ làm lễ.",
    province: "shop-hoa-tuoi-dong-nai",
  },
  {
    slug: "shop-hoa-tuoi-vinh-cuu",
    city: "Vĩnh Cửu",
    areas: "thị trấn Vĩnh An và các xã Thạnh Phú, Tân Bình, Bình Lợi, Thiện Tân, Trị An, Tân An",
    nearby: "Biên Hòa, Trảng Bom, Tân Uyên",
    places: "hồ Trị An, nhà máy thủy điện Trị An, khu công nghiệp Thạnh Phú",
    note: "Các xã quanh hồ Trị An cách xa trung tâm; đặt trước nửa ngày để shop hẹn giờ giao.",
    province: "shop-hoa-tuoi-dong-nai",
  },
  {
    slug: "shop-hoa-tuoi-thong-nhat",
    city: "Thống Nhất",
    areas: "các xã Dầu Giây, Gia Tân, Hưng Lộc, Quang Trung, Xuân Thiện, Bàu Hàm 2, Gia Kiệm",
    nearby: "Trảng Bom, Long Khánh, Định Quán",
    places: "ngã ba Dầu Giây, khu công nghiệp Dầu Giây, các giáo xứ Gia Kiệm, Gia Tân",
    note: "Ngã ba Dầu Giây là điểm giao thuận tiện; nhà ở các xã xa nên ghi thêm mốc dễ tìm để giao nhanh.",
    province: "shop-hoa-tuoi-dong-nai",
  },
  {
    slug: "shop-hoa-tuoi-cam-my",
    city: "Cẩm Mỹ",
    areas: "các xã Long Giao, Xuân Mỹ, Xuân Quế, Sông Ray, Xuân Đường, Nhân Nghĩa, Xuân Bảo",
    nearby: "Long Khánh, Xuân Lộc, Long Thành",
    places: "trung tâm hành chính Long Giao, các trang trại và vườn cây dọc đường 765",
    note: "Cẩm Mỹ chủ yếu là xã, nhà cách xa nhau; gửi số điện thoại người nhận để shipper gọi trước khi tới.",
    province: "shop-hoa-tuoi-dong-nai",
  },
  {
    slug: "shop-hoa-tuoi-xuan-loc",
    city: "Xuân Lộc",
    areas: "thị trấn Gia Ray và các xã Xuân Hiệp, Xuân Tâm, Xuân Hưng, Suối Cát, Xuân Trường, Xuân Định",
    nearby: "Long Khánh, Cẩm Mỹ, Định Quán",
    places: "núi Chứa Chan, chợ Gia Ray, Bệnh viện Đa khoa Xuân Lộc",
    note: "Hoa chia buồn cho gia đình ở Xuân Lộc: báo shop địa chỉ tang lễ và nội dung băng tang ngay khi đặt để giao kịp.",
    province: "shop-hoa-tuoi-dong-nai",
  },
  {
    slug: "shop-hoa-tuoi-dinh-quan",
    city: "Định Quán",
    areas: "thị trấn Định Quán và các xã Phú Lợi, Phú Ngọc, La Ngà, Gia Canh, Phú Vinh, Phú Tân",
    nearby: "Tân Phú, Xuân Lộc, Thống Nhất",
    places: "thắng cảnh Đá Ba Chồng, hồ Trị An phía La Ngà, chợ Định Quán dọc Quốc lộ 20",
    note: "Định Quán nằm dọc Quốc lộ 20, cách Biên Hòa khá xa; đặt trước nửa ngày để shop hẹn giờ giao.",
    province: "shop-hoa-tuoi-dong-nai",
  },
  {
    slug: "shop-hoa-tuoi-tan-phu",
    city: "Tân Phú (Đồng Nai)",
    areas: "thị trấn Tân Phú và các xã Phú Lâm, Phú Bình, Phú Xuân, Phú Thanh, Nam Cát Tiên, Tà Lài",
    nearby: "Định Quán, Đạ Huoai, Bảo Lộc",
    places: "Vườn quốc gia Cát Tiên, chợ Tân Phú, các khu dân cư dọc Quốc lộ 20",
    note: "Tân Phú là khu xa nhất của Đồng Nai; gọi trước để shop báo thời gian giao cụ thể.",
    province: "shop-hoa-tuoi-dong-nai",
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

const cityName = (slug: string) => CITIES.find((x) => x.slug === slug)?.city ?? slug;

/** Liên kết trang tỉnh ↔ trang huyện/thành phố trong tỉnh */
function related(c: CityPage) {
  if (c.districts?.length) {
    const links = c.districts.map((s) => `<li><a href="/${s}/">Shop hoa tươi ${cityName(s)}</a></li>`).join("");
    return `<h2>Giao hoa các khu vực trong tỉnh ${c.city}</h2>\n<ul>${links}</ul>\n`;
  }
  if (c.province) return `<p>Xem thêm: <a href="/${c.province}/">shop hoa tươi ${cityName(c.province)}</a> – giao hoa khắp tỉnh.</p>\n`;
  return "";
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
${related(c)}${
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
    const copyOfHcm = CITIES.some((x) => x.slug === c.slug) && !/^shop-hoa-tuoi-(quan|huyen)-/.test(c.slug) && Number(c.total) >= 50 && Number(c.own) === 0;
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
