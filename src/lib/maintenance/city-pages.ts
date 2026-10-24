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
    province: "shop-hoa-tuoi-khanh-hoa",
  },
  {
    slug: "shop-hoa-tuoi-da-lat",
    city: "Đà Lạt",
    areas: "khu trung tâm quanh chợ Đà Lạt và hồ Xuân Hương, khu Hòa Bình, đường Phan Đình Phùng, Trần Phú, Ba Tháng Hai",
    nearby: "Đức Trọng (Liên Khương), Lạc Dương, Bảo Lộc (theo lịch hẹn)",
    places: "Đại học Đà Lạt, Bệnh viện Đa khoa Lâm Đồng, các homestay và khách sạn trung tâm",
    note: "Nhiều khách đặt hoa Đà Lạt để tặng người yêu đang đi du lịch: gửi tên homestay hoặc khách sạn và giờ khách có mặt để shop hẹn giờ giao.",
    province: "shop-hoa-tuoi-lam-dong",
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
    province: "shop-hoa-tuoi-thua-thien-hue",
  },
  {
    slug: "shop-hoa-tuoi-vinh",
    city: "Vinh",
    areas: "các phường Hưng Dũng, Bến Thủy, Trường Thi, Quang Trung, Hà Huy Tập, Lê Mao, Hưng Bình, Đội Cung",
    nearby: "Cửa Lò, Nghi Lộc, Hưng Nguyên",
    places: "Đại học Vinh, Bệnh viện Hữu nghị Đa khoa Nghệ An, Quảng trường Hồ Chí Minh",
    note: "Hoa tốt nghiệp ở Đại học Vinh vào mùa lễ tốt nghiệp nên đặt trước 1–2 ngày để giữ mẫu.",
    province: "shop-hoa-tuoi-nghe-an",
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
  // Quý I/2027: quận TP.HCM nhiều lượt tìm còn dùng mô tả mẫu chung (Quận 7 1.700 lượt/tháng) — giữ danh sách mẫu đang có
  {
    slug: "shop-hoa-tuoi-quan-7",
    city: "Quận 7",
    areas: "các phường Tân Phong, Tân Phú, Tân Quy, Tân Kiểng, Tân Hưng, Bình Thuận, Phú Mỹ, Phú Thuận, Tân Thuận Đông, Tân Thuận Tây",
    nearby: "Quận 4, Quận 8, Nhà Bè, Quận 1",
    places: "khu đô thị Phú Mỹ Hưng, Crescent Mall, SECC, Bệnh viện FV, khu chế xuất Tân Thuận, Đại học Tôn Đức Thắng, RMIT",
    note: "Giao hoa tới căn hộ ở Phú Mỹ Hưng, Sunrise City: ghi tên tòa nhà, block, số căn và số điện thoại người nhận; lễ tân có thể nhận thay khi người nhận vắng nhà.",
  },
  {
    slug: "shop-hoa-tuoi-quan-3",
    city: "Quận 3",
    areas: "các phường Võ Thị Sáu, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14",
    nearby: "Quận 1, Quận 10, Phú Nhuận, Tân Bình",
    places: "Hồ Con Rùa, Nhà thờ Tân Định, chùa Vĩnh Nghiêm, Bệnh viện Bình Dân, các văn phòng dọc Nam Kỳ Khởi Nghĩa, Võ Văn Tần, Cách Mạng Tháng Tám",
    note: "Quận 3 nằm sát Quận 1, gần cửa hàng ở 130 Hai Bà Trưng; gửi hoa tới văn phòng chỉ cần ghi tên tòa nhà, tầng và người nhận.",
  },
  {
    slug: "shop-hoa-tuoi-quan-binh-thanh",
    city: "Quận Bình Thạnh",
    areas: "các phường 1, 2, 3, 5, 6, 7, 11, 12, 13, 14, 15, 17, 19, 21, 22, 24, 25, 26, 27, 28",
    nearby: "Quận 1, Phú Nhuận, Gò Vấp, Thủ Đức",
    places: "Landmark 81, Vinhomes Central Park, chợ Bà Chiểu, Bệnh viện Nhân dân Gia Định, Đại học Hutech, các căn hộ dọc Điện Biên Phủ, Xô Viết Nghệ Tĩnh",
    note: "Giao hoa tới Vinhomes Central Park, Landmark 81: ghi tên tòa, số căn hộ và số điện thoại người nhận để shipper liên hệ khi tới sảnh.",
  },
  // Quý I/2027 đợt 2: Hà Nội và 12 quận — thay mô tả mẫu chung của website cũ (giữ danh sách mẫu đang có)
  {
    slug: "shop-hoa-tuoi-ha-noi",
    city: "Hà Nội",
    areas: "các quận Hoàn Kiếm, Ba Đình, Đống Đa, Hai Bà Trưng, Cầu Giấy, Thanh Xuân, Tây Hồ, Hoàng Mai, Long Biên, Nam Từ Liêm, Bắc Từ Liêm, Hà Đông",
    nearby: "Gia Lâm, Thanh Trì, Đông Anh, Hoài Đức",
    places: "các bệnh viện Bạch Mai, Việt Đức, các trường đại học khu Cầu Giấy, Hai Bà Trưng, tòa văn phòng dọc Duy Tân, Phạm Hùng, Lê Văn Lương",
    note: "Hai cửa hàng ở 500 Lê Duẩn (Đống Đa) và 430 Cầu Giấy nhận đơn cho toàn thành phố; bạn có thể ghé chọn hoa hoặc đặt online để giao tận nơi.",
    districts: [
      "shop-hoa-tuoi-quan-dong-da",
      "shop-hoa-tuoi-quan-cau-giay",
      "shop-hoa-tuoi-quan-hoan-kiem",
      "shop-hoa-tuoi-quan-ba-dinh",
      "shop-hoa-tuoi-quan-hai-ba-trung",
      "shop-hoa-tuoi-quan-thanh-xuan",
      "shop-hoa-tuoi-quan-tay-ho",
      "shop-hoa-tuoi-quan-hoang-mai",
      "shop-hoa-tuoi-quan-long-bien",
      "shop-hoa-tuoi-quan-nam-tu-liem",
      "shop-hoa-tuoi-quan-bac-tu-liem",
      "shop-hoa-tuoi-quan-ha-dong",
    ],
  },
  {
    slug: "shop-hoa-tuoi-quan-dong-da",
    city: "Quận Đống Đa",
    areas: "các phường Cát Linh, Văn Miếu, Quốc Tử Giám, Láng Thượng, Láng Hạ, Ô Chợ Dừa, Văn Chương, Hàng Bột, Khâm Thiên, Thổ Quan, Nam Đồng, Trung Phụng, Quang Trung, Trung Liệt, Phương Liên, Thịnh Quang, Trung Tự, Kim Liên, Phương Mai, Ngã Tư Sở, Khương Thượng",
    nearby: "Ba Đình, Hai Bà Trưng, Thanh Xuân, Cầu Giấy",
    places: "Văn Miếu – Quốc Tử Giám, Bệnh viện Bạch Mai, Đại học Y Hà Nội, Đại học Thủy lợi, các văn phòng dọc Láng Hạ, Tây Sơn",
    note: "Cửa hàng ở 500 Lê Duẩn, gần Bệnh viện Bạch Mai: thăm người thân điều trị có thể ghé lấy giỏ hoa ngay, hoặc gửi tên khoa, số phòng để shop giao.",
    province: "shop-hoa-tuoi-ha-noi",
  },
  {
    slug: "shop-hoa-tuoi-quan-cau-giay",
    city: "Quận Cầu Giấy",
    areas: "các phường Dịch Vọng, Dịch Vọng Hậu, Mai Dịch, Nghĩa Đô, Nghĩa Tân, Quan Hoa, Trung Hòa, Yên Hòa",
    nearby: "Ba Đình, Đống Đa, Thanh Xuân, Nam Từ Liêm",
    places: "Đại học Quốc gia Hà Nội, Đại học Sư phạm Hà Nội, công viên Cầu Giấy, các tòa văn phòng dọc Duy Tân, Trần Thái Tông",
    note: "Cửa hàng ở 430 Cầu Giấy; mùa tốt nghiệp ở các trường đại học trong quận nên đặt hoa trước 1–2 ngày và ghi rõ cổng trường.",
    province: "shop-hoa-tuoi-ha-noi",
  },
  {
    slug: "shop-hoa-tuoi-quan-hoan-kiem",
    city: "Quận Hoàn Kiếm",
    areas: "các phường Hàng Bạc, Hàng Bồ, Hàng Bông, Hàng Buồm, Hàng Đào, Hàng Gai, Hàng Mã, Hàng Trống, Lý Thái Tổ, Tràng Tiền, Trần Hưng Đạo, Phan Chu Trinh, Cửa Đông, Cửa Nam, Đồng Xuân, Chương Dương, Phúc Tân",
    nearby: "Ba Đình, Hai Bà Trưng, Đống Đa, Long Biên",
    places: "hồ Hoàn Kiếm, Nhà hát Lớn, khu phố cổ, các khách sạn quanh hồ, Bệnh viện Việt Đức",
    note: "Phố đi bộ quanh hồ Hoàn Kiếm cấm xe vào tối cuối tuần; giao hoa khu phố cổ nên hẹn giờ và ghi số điện thoại người nhận để shipper gọi khi tới.",
    province: "shop-hoa-tuoi-ha-noi",
  },
  {
    slug: "shop-hoa-tuoi-quan-ba-dinh",
    city: "Quận Ba Đình",
    areas: "các phường Phúc Xá, Trúc Bạch, Vĩnh Phúc, Cống Vị, Liễu Giai, Ngọc Hà, Điện Biên, Đội Cấn, Ngọc Khánh, Kim Mã, Giảng Võ, Thành Công, Quán Thánh",
    nearby: "Hoàn Kiếm, Tây Hồ, Đống Đa, Cầu Giấy",
    places: "khu các bộ, ngành, hồ Trúc Bạch, Bệnh viện Xanh Pôn, các khách sạn và văn phòng dọc Liễu Giai, Kim Mã",
    note: "Hoa chúc mừng gửi cơ quan ở Ba Đình: ghi rõ tên đơn vị, phòng ban, người nhận và số điện thoại; một số tòa nhà chỉ nhận hoa tại bảo vệ.",
    province: "shop-hoa-tuoi-ha-noi",
  },
  {
    slug: "shop-hoa-tuoi-quan-hai-ba-trung",
    city: "Quận Hai Bà Trưng",
    areas: "các phường Bạch Đằng, Bách Khoa, Bạch Mai, Cầu Dền, Đống Mác, Đồng Nhân, Đồng Tâm, Lê Đại Hành, Minh Khai, Nguyễn Du, Phạm Đình Hổ, Phố Huế, Quỳnh Lôi, Quỳnh Mai, Thanh Lương, Thanh Nhàn, Trương Định, Vĩnh Tuy",
    nearby: "Hoàn Kiếm, Đống Đa, Hoàng Mai",
    places: "Đại học Bách khoa Hà Nội, Đại học Kinh tế Quốc dân, Times City, Vincom Bà Triệu, Bệnh viện Thanh Nhàn, hồ Thiền Quang",
    note: "Giao hoa tới căn hộ Times City: ghi tên tòa, số căn và số điện thoại người nhận để shipper liên hệ khi tới sảnh.",
    province: "shop-hoa-tuoi-ha-noi",
  },
  {
    slug: "shop-hoa-tuoi-quan-thanh-xuan",
    city: "Quận Thanh Xuân",
    areas: "các phường Hạ Đình, Khương Đình, Khương Mai, Khương Trung, Kim Giang, Nhân Chính, Phương Liệt, Thanh Xuân Bắc, Thanh Xuân Nam, Thanh Xuân Trung, Thượng Đình",
    nearby: "Đống Đa, Cầu Giấy, Hà Đông, Hoàng Mai",
    places: "Royal City, Đại học Khoa học Tự nhiên, Đại học Hà Nội, Đại học Kiến trúc Hà Nội, các tòa văn phòng dọc Nguyễn Trãi, Lê Văn Lương",
    note: "Văn phòng dọc Lê Văn Lương, Nguyễn Trãi thường đặt hoa sinh nhật đồng nghiệp: gửi tên công ty, tầng và giờ người nhận có mặt.",
    province: "shop-hoa-tuoi-ha-noi",
  },
  {
    slug: "shop-hoa-tuoi-quan-tay-ho",
    city: "Quận Tây Hồ",
    areas: "các phường Bưởi, Nhật Tân, Phú Thượng, Quảng An, Thụy Khuê, Tứ Liên, Xuân La, Yên Phụ",
    nearby: "Ba Đình, Bắc Từ Liêm, Cầu Giấy",
    places: "hồ Tây, phủ Tây Hồ, chùa Trấn Quốc, khu đô thị Ciputra, các nhà hàng và căn hộ cho người nước ngoài quanh Quảng An, Xuân Diệu",
    note: "Hoa tặng khách nước ngoài ở khu Quảng An, Ciputra: gửi tên tòa nhà hoặc biệt thự, số điện thoại người nhận; shop ghi thiệp tiếng Anh theo yêu cầu.",
    province: "shop-hoa-tuoi-ha-noi",
  },
  {
    slug: "shop-hoa-tuoi-quan-hoang-mai",
    city: "Quận Hoàng Mai",
    areas: "các phường Đại Kim, Định Công, Giáp Bát, Hoàng Liệt, Hoàng Văn Thụ, Lĩnh Nam, Mai Động, Tân Mai, Thanh Trì, Thịnh Liệt, Trần Phú, Tương Mai, Vĩnh Hưng, Yên Sở",
    nearby: "Hai Bà Trưng, Thanh Xuân, Thanh Trì",
    places: "khu đô thị Linh Đàm, bán đảo Linh Đàm, bến xe Giáp Bát, công viên Yên Sở, các khu chung cư dọc Giải Phóng",
    note: "Khu Linh Đàm có nhiều tòa chung cư cùng tên: ghi rõ mã tòa (HH, CT…), số căn và số điện thoại người nhận.",
    province: "shop-hoa-tuoi-ha-noi",
  },
  {
    slug: "shop-hoa-tuoi-quan-long-bien",
    city: "Quận Long Biên",
    areas: "các phường Bồ Đề, Cự Khối, Đức Giang, Gia Thụy, Giang Biên, Long Biên, Ngọc Lâm, Ngọc Thụy, Phúc Đồng, Phúc Lợi, Sài Đồng, Thạch Bàn, Thượng Thanh, Việt Hưng",
    nearby: "Hoàn Kiếm, Gia Lâm, Hai Bà Trưng",
    places: "Vinhomes Riverside, Aeon Mall Long Biên, cầu Long Biên, Bệnh viện Đa khoa Đức Giang, khu công nghiệp Sài Đồng",
    note: "Giao hoa tới biệt thự Vinhomes Riverside: ghi tên phân khu, số nhà và số điện thoại người nhận để qua cổng bảo vệ nhanh.",
    province: "shop-hoa-tuoi-ha-noi",
  },
  {
    slug: "shop-hoa-tuoi-quan-nam-tu-liem",
    city: "Quận Nam Từ Liêm",
    areas: "các phường Cầu Diễn, Đại Mỗ, Mễ Trì, Mỹ Đình 1, Mỹ Đình 2, Phú Đô, Phương Canh, Tây Mỗ, Trung Văn, Xuân Phương",
    nearby: "Cầu Giấy, Bắc Từ Liêm, Hà Đông, Thanh Xuân",
    places: "Sân vận động Mỹ Đình, Trung tâm Hội nghị Quốc gia, tòa Keangnam, bến xe Mỹ Đình, Vinhomes Smart City, các văn phòng dọc Phạm Hùng",
    note: "Hoa chúc mừng sự kiện, hội nghị ở Trung tâm Hội nghị Quốc gia, khách sạn khu Mỹ Đình: gửi tên sự kiện, cổng vào và giờ bắt đầu.",
    province: "shop-hoa-tuoi-ha-noi",
  },
  {
    slug: "shop-hoa-tuoi-quan-bac-tu-liem",
    city: "Quận Bắc Từ Liêm",
    areas: "các phường Cổ Nhuế 1, Cổ Nhuế 2, Đông Ngạc, Đức Thắng, Liên Mạc, Minh Khai, Phú Diễn, Phúc Diễn, Tây Tựu, Thượng Cát, Thụy Phương, Xuân Đỉnh, Xuân Tảo",
    nearby: "Nam Từ Liêm, Cầu Giấy, Tây Hồ",
    places: "Đại học Mỏ – Địa chất, Học viện Cảnh sát Nhân dân, Công viên Hòa Bình, khu Ngoại giao đoàn, làng hoa Tây Tựu",
    note: "Mùa tốt nghiệp ở các trường trong quận nên đặt hoa trước 1–2 ngày và ghi rõ cổng trường, giờ làm lễ.",
    province: "shop-hoa-tuoi-ha-noi",
  },
  {
    slug: "shop-hoa-tuoi-quan-ha-dong",
    city: "Quận Hà Đông",
    areas: "các phường Mộ Lao, Văn Quán, Vạn Phúc, Yết Kiêu, Quang Trung, Nguyễn Trãi, Phúc La, La Khê, Phú La, Kiến Hưng, Hà Cầu, Yên Nghĩa, Phú Lương, Dương Nội, Biên Giang, Đồng Mai, Phú Lãm",
    nearby: "Thanh Xuân, Nam Từ Liêm, Thanh Trì, Hoài Đức",
    places: "làng lụa Vạn Phúc, Học viện Công nghệ Bưu chính Viễn thông, Bệnh viện Đa khoa Hà Đông, Aeon Mall Hà Đông, khu đô thị Văn Quán, Dương Nội",
    note: "Khách ở nội thành đặt hoa cho người thân ở Hà Đông chỉ cần gửi địa chỉ và số điện thoại người nhận; shop gửi ảnh hoa thật qua Zalo trước khi giao.",
    province: "shop-hoa-tuoi-ha-noi",
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
    province: "shop-hoa-tuoi-dong-thap",
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
    province: "shop-hoa-tuoi-quang-ninh",
  },
  {
    slug: "shop-hoa-tuoi-cam-ranh",
    city: "Cam Ranh",
    areas: "các phường Cam Nghĩa, Cam Phú, Cam Lộc, Cam Thuận, Cam Lợi, Ba Ngòi, Cam Linh",
    nearby: "Cam Lâm, Nha Trang",
    places: "sân bay Cam Ranh, các resort Bãi Dài, khu dân cư trung tâm Ba Ngòi",
    note: "Hoa tặng khách nghỉ dưỡng tại các resort Bãi Dài: gửi tên resort, tên khách và giờ có mặt để shop hẹn giao tại lễ tân.",
    province: "shop-hoa-tuoi-khanh-hoa",
  },
  {
    slug: "shop-hoa-tuoi-viet-tri",
    city: "Việt Trì",
    areas: "các phường Gia Cẩm, Tân Dân, Tiên Cát, Thọ Sơn, Nông Trang, Dữu Lâu, Vân Phú, Bến Gót",
    nearby: "Phù Ninh, Lâm Thao, thị xã Phú Thọ",
    places: "Bệnh viện Đa khoa tỉnh Phú Thọ, khu di tích Đền Hùng, Đại học Hùng Vương",
    note: "Mùa lễ hội Đền Hùng và mùa tốt nghiệp đơn hoa tăng nhiều, nên đặt trước 1 ngày để giữ mẫu.",
    province: "shop-hoa-tuoi-phu-tho",
  },
  {
    slug: "shop-hoa-tuoi-hong-ngu",
    city: "Hồng Ngự",
    areas: "các phường An Thạnh, An Lộc, An Lạc, An Bình và các xã lân cận",
    nearby: "Tân Hồng, Tam Nông, Thanh Bình",
    places: "chợ Hồng Ngự, Bệnh viện Đa khoa khu vực Hồng Ngự, các nhà tang lễ trong thành phố",
    note: "Đơn hoa chia buồn ở Hồng Ngự: báo shop địa chỉ tang lễ và nội dung băng tang ngay khi đặt để giao kịp.",
    province: "shop-hoa-tuoi-dong-thap",
  },
  {
    slug: "shop-hoa-tuoi-tuy-hoa",
    city: "Tuy Hòa",
    areas: "các phường 1 đến 9, Phú Lâm, Phú Đông, Phú Thạnh",
    nearby: "Đông Hòa, Phú Hòa, Sông Cầu",
    places: "Bệnh viện Đa khoa tỉnh Phú Yên, tháp Nhạn, các khách sạn ven biển đường Độc Lập",
    note: "Khách ở xa đặt hoa cho gia đình ở Tuy Hòa được gửi ảnh hoa thật qua Zalo trước khi giao.",
    province: "shop-hoa-tuoi-phu-yen",
  },
  {
    slug: "shop-hoa-tuoi-phu-quoc",
    city: "Phú Quốc",
    areas: "Dương Đông, An Thới, Cửa Lấp, Gành Dầu, khu Bãi Trường, Bãi Khem",
    nearby: "các xã ven đảo theo lịch hẹn",
    places: "các resort Bãi Trường và Bãi Khem, Grand World, sân bay Phú Quốc",
    note: "Hoa tặng khách đang nghỉ dưỡng hoặc cầu hôn tại resort: gửi tên resort, tên khách và giờ hẹn để shop phối hợp với lễ tân.",
    province: "shop-hoa-tuoi-kien-giang",
  },
  {
    slug: "shop-hoa-tuoi-rach-gia",
    city: "Rạch Giá",
    areas: "các phường Vĩnh Thanh Vân, Vĩnh Thanh, Vĩnh Lạc, Vĩnh Bảo, An Hòa, Rạch Sỏi, Vĩnh Quang, Vĩnh Hiệp",
    nearby: "Châu Thành, Tân Hiệp, Hòn Đất, Hà Tiên (theo lịch hẹn)",
    places: "Bệnh viện Đa khoa tỉnh Kiên Giang, khu lấn biển Phú Cường, các văn phòng trung tâm",
    note: "Kệ hoa khai trương ở khu lấn biển Rạch Giá được giao và dựng tận nơi trước giờ làm lễ.",
    province: "shop-hoa-tuoi-kien-giang",
  },
  {
    slug: "shop-hoa-tuoi-ha-nam",
    city: "Hà Nam",
    areas: "thành phố Phủ Lý (Hai Bà Trưng, Lương Khánh Thiện, Minh Khai, Quang Trung, Lam Hạ) và Duy Tiên, Kim Bảng, Thanh Liêm, Bình Lục, Lý Nhân",
    nearby: "Hà Nội, Nam Định, Ninh Bình",
    places: "Bệnh viện Bạch Mai và Việt Đức cơ sở 2 tại Phủ Lý, khu công nghiệp Đồng Văn, chùa Tam Chúc",
    note: "Thăm người thân điều trị tại các bệnh viện cơ sở 2 ở Phủ Lý: chọn giỏ hoa hoặc giỏ trái cây nhỏ gọn, gửi tên khoa và số phòng.",
    districts: ["shop-hoa-tuoi-phu-ly"],
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
    districts: ["shop-hoa-tuoi-vi-thanh", "shop-hoa-tuoi-nga-bay"],
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
  // Tuần 9 (21/12/2026): 13 trang miền Tây — trước đó chuyển hướng về trang tỉnh lân cận
  {
    slug: "shop-hoa-tuoi-dong-thap",
    city: "Đồng Tháp",
    areas: "Cao Lãnh, Sa Đéc, Hồng Ngự và các khu Lấp Vò, Lai Vung, Châu Thành, Tháp Mười, Tam Nông, Thanh Bình",
    nearby: "Cần Thơ, Vĩnh Long, An Giang",
    places: "làng hoa kiểng Sa Đéc, Vườn quốc gia Tràm Chim, khu di tích Gò Tháp, Bệnh viện Đa khoa Đồng Tháp",
    note: "Khách ở TP.HCM, Cần Thơ đặt hoa cho gia đình ở Đồng Tháp chỉ cần gửi địa chỉ và số điện thoại người nhận; shop gửi ảnh hoa thật qua Zalo trước khi giao.",
    districts: ["shop-hoa-tuoi-cao-lanh", "shop-hoa-tuoi-sa-dec", "shop-hoa-tuoi-hong-ngu"],
  },
  {
    slug: "shop-hoa-tuoi-sa-dec",
    city: "Sa Đéc",
    areas: "các phường 1, 2, 3, 4, An Hòa, Tân Quy Đông và các xã Tân Khánh Đông, Tân Phú Đông",
    nearby: "Lai Vung, Lấp Vò, Châu Thành, Vĩnh Long",
    places: "làng hoa kiểng Sa Đéc ở Tân Quy Đông, nhà cổ Huỳnh Thủy Lê, Bệnh viện Đa khoa Sa Đéc, chợ Sa Đéc",
    note: "Sa Đéc nổi tiếng là xứ hoa, nhưng khi cần bó hoa, giỏ hoa thiết kế sẵn giao tận nhà kèm thiệp, bạn chỉ cần chọn mẫu trên website và ghi giờ giao.",
    province: "shop-hoa-tuoi-dong-thap",
  },
  {
    slug: "shop-hoa-tuoi-kien-giang",
    city: "Kiên Giang",
    areas: "Rạch Giá, Phú Quốc, Hà Tiên và các khu Châu Thành, Tân Hiệp, Hòn Đất, Kiên Lương",
    nearby: "An Giang, Cần Thơ, Hậu Giang",
    places: "Bệnh viện Đa khoa tỉnh Kiên Giang, khu lấn biển Rạch Giá, các resort ở Phú Quốc, bãi biển Mũi Nai Hà Tiên",
    note: "Đơn giao ra đảo Phú Quốc hoặc về các huyện xa cần hẹn giờ; gọi trước để shop báo thời gian giao cụ thể.",
    districts: ["shop-hoa-tuoi-rach-gia", "shop-hoa-tuoi-phu-quoc", "shop-hoa-tuoi-ha-tien"],
  },
  {
    slug: "shop-hoa-tuoi-ha-tien",
    city: "Hà Tiên",
    areas: "các phường Đông Hồ, Tô Châu, Bình San, Pháo Đài, Mỹ Đức và các xã Thuận Yên, Tiên Hải",
    nearby: "Kiên Lương, Rạch Giá",
    places: "bãi biển Mũi Nai, chùa Phù Dung, lăng Mạc Cửu, cửa khẩu Xà Xía, bến tàu đi Phú Quốc",
    note: "Hà Tiên cách Rạch Giá khá xa; đặt trước nửa ngày để shop hẹn giờ giao, nhất là kệ hoa khai trương.",
    province: "shop-hoa-tuoi-kien-giang",
  },
  {
    slug: "shop-hoa-tuoi-long-an",
    city: "Long An",
    areas: "Tân An, Bến Lức, Đức Hòa, Cần Giuộc, Cần Đước, Thủ Thừa, Châu Thành",
    nearby: "Bình Chánh, Tiền Giang, Tây Ninh",
    places: "các khu công nghiệp Đức Hòa, Bến Lức, Cần Giuộc, Bệnh viện Đa khoa Long An, Trung tâm hành chính tỉnh",
    note: "Doanh nghiệp ở các khu công nghiệp Long An giáp TP.HCM thường đặt kệ hoa khai trương, hoa chúc mừng đối tác: gửi tên công ty và cổng ra vào để giao đúng chỗ.",
    districts: ["shop-hoa-tuoi-tan-an"],
  },
  {
    slug: "shop-hoa-tuoi-tan-an",
    city: "Tân An",
    areas: "các phường 1, 2, 3, 4, 5, 6, 7, Tân Khánh, Khánh Hậu và các xã Hướng Thọ Phú, Lợi Bình Nhơn, Nhơn Thạnh Trung",
    nearby: "Thủ Thừa, Châu Thành, Bến Lức, Mỹ Tho",
    places: "Bệnh viện Đa khoa Long An, Trung tâm hành chính tỉnh, chợ Tân An, các trường dọc Quốc lộ 1",
    note: "Hoa chúc mừng gửi cơ quan trong khu hành chính tỉnh: ghi rõ tên đơn vị, phòng ban và người nhận để giao nhanh.",
    province: "shop-hoa-tuoi-long-an",
  },
  {
    slug: "shop-hoa-tuoi-tien-giang",
    city: "Tiền Giang",
    areas: "Mỹ Tho, Gò Công, Cai Lậy và các khu Châu Thành, Chợ Gạo, Cái Bè, Tân Phước",
    nearby: "Bến Tre, Long An, Vĩnh Long",
    places: "chùa Vĩnh Tràng, cù lao Thới Sơn, chợ nổi Cái Bè, các khu công nghiệp Tân Hương, Long Giang",
    note: "Kệ hoa khai trương cho nhà xưởng ở khu công nghiệp Tân Hương, Long Giang được giao và dựng tận nơi trước giờ làm lễ.",
    districts: ["shop-hoa-tuoi-my-tho"],
  },
  {
    slug: "shop-hoa-tuoi-my-tho",
    city: "Mỹ Tho",
    areas: "các phường 1 đến 10, Tân Long, Đạo Thạnh, Mỹ Phong, Tân Mỹ Chánh và các xã ven thành phố",
    nearby: "Châu Thành, Chợ Gạo, Bến Tre, Tân An",
    places: "chùa Vĩnh Tràng, Bệnh viện Đa khoa Trung tâm Tiền Giang, công viên Thủ Khoa Huân, bến tàu du lịch đi cồn Thới Sơn",
    note: "Khách ở TP.HCM đặt hoa sinh nhật, hoa chúc mừng cho người thân ở Mỹ Tho được gửi ảnh hoa thật qua Zalo trước khi giao.",
    province: "shop-hoa-tuoi-tien-giang",
  },
  {
    slug: "shop-hoa-tuoi-vinh-long",
    city: "Vĩnh Long",
    areas: "các phường 1, 2, 3, 4, 5, 8, 9, Tân Ngãi, Tân Hòa, Tân Hội và các khu Long Hồ, Bình Minh, Mang Thít",
    nearby: "Cần Thơ, Sa Đéc, Trà Vinh, Bến Tre",
    places: "Văn Thánh Miếu Vĩnh Long, cù lao An Bình, Bệnh viện Đa khoa tỉnh Vĩnh Long, các trường đại học trong thành phố",
    note: "Hoa tốt nghiệp ở các trường đại học Vĩnh Long vào mùa lễ nên đặt trước 1–2 ngày và ghi rõ cổng trường.",
  },
  {
    slug: "shop-hoa-tuoi-tra-vinh",
    city: "Trà Vinh",
    areas: "các phường 1 đến 9 thành phố Trà Vinh và các khu Càng Long, Châu Thành, Cầu Kè, Tiểu Cần, Duyên Hải",
    nearby: "Vĩnh Long, Bến Tre, Sóc Trăng",
    places: "ao Bà Om, chùa Âng, Đại học Trà Vinh, Bệnh viện Đa khoa tỉnh Trà Vinh",
    note: "Mùa tốt nghiệp ở Đại học Trà Vinh đơn hoa tăng mạnh; nên đặt trước 1–2 ngày để giữ mẫu.",
  },
  {
    slug: "shop-hoa-tuoi-soc-trang",
    city: "Sóc Trăng",
    areas: "các phường 1 đến 10 thành phố Sóc Trăng và các khu Mỹ Xuyên, Vĩnh Châu, Ngã Năm, Kế Sách",
    nearby: "Cần Thơ, Bạc Liêu, Hậu Giang",
    places: "chùa Dơi, chùa Chén Kiểu, hồ Nước Ngọt, Bệnh viện Đa khoa tỉnh Sóc Trăng",
    note: "Đơn hoa chia buồn ở Sóc Trăng: báo shop địa chỉ tang lễ và nội dung băng tang ngay khi đặt để giao kịp.",
  },
  {
    slug: "shop-hoa-tuoi-vi-thanh",
    city: "Vị Thanh",
    areas: "các phường I, III, IV, V, VII và các xã Hỏa Lựu, Hỏa Tiến, Tân Tiến, Vị Tân",
    nearby: "Long Mỹ, Vị Thủy, Rạch Giá",
    places: "Bệnh viện Đa khoa tỉnh Hậu Giang, Trung tâm hành chính tỉnh, chợ Vị Thanh",
    note: "Hoa chúc mừng gửi cơ quan trong khu hành chính tỉnh: ghi rõ tên đơn vị và người nhận để giao nhanh.",
    province: "shop-hoa-tuoi-hau-giang",
  },
  {
    slug: "shop-hoa-tuoi-nga-bay",
    city: "Ngã Bảy",
    areas: "các phường Ngã Bảy, Lái Hiếu, Hiệp Thành, Hiệp Lợi và các xã Đại Thành, Tân Thành",
    nearby: "Phụng Hiệp, Châu Thành, Cần Thơ, Sóc Trăng",
    places: "chợ nổi Ngã Bảy, chợ Ngã Bảy, Bệnh viện Đa khoa khu vực Ngã Bảy",
    note: "Khách ở Cần Thơ hoặc TP.HCM đặt hoa cho người thân ở Ngã Bảy được gửi ảnh hoa thật qua Zalo trước khi giao.",
    province: "shop-hoa-tuoi-hau-giang",
  },
  // Tuần 10 (28/12/2026): 19 trang miền Trung, Tây Nguyên — trước đó chuyển hướng về trang lân cận
  {
    slug: "shop-hoa-tuoi-khanh-hoa",
    city: "Khánh Hòa",
    store: "Nha Trang",
    areas: "Nha Trang, Cam Ranh, Ninh Hòa và các khu Diên Khánh, Cam Lâm, Vạn Ninh",
    nearby: "Phú Yên, Ninh Thuận",
    places: "khách sạn ven biển đường Trần Phú, sân bay Cam Ranh, các resort Bãi Dài, Bệnh viện Đa khoa tỉnh Khánh Hòa",
    note: "Cửa hàng ở Nha Trang nhận đơn cho toàn tỉnh; các khu xa như Vạn Ninh, Ninh Hòa nên đặt trước để shop hẹn giờ giao.",
    districts: ["shop-hoa-tuoi-nha-trang", "shop-hoa-tuoi-cam-ranh"],
  },
  {
    slug: "shop-hoa-tuoi-lam-dong",
    city: "Lâm Đồng",
    areas: "Đà Lạt, Bảo Lộc và các khu Đức Trọng, Lâm Hà, Di Linh, Lạc Dương",
    nearby: "Đắk Nông, Ninh Thuận, Đồng Nai",
    places: "khu hồ Xuân Hương, sân bay Liên Khương, Bệnh viện Đa khoa Lâm Đồng, các đồi chè Bảo Lộc",
    note: "Đà Lạt và Bảo Lộc cách nhau khá xa; ghi rõ địa chỉ và khung giờ khi đặt để shop hẹn giao đúng lúc.",
    districts: ["shop-hoa-tuoi-da-lat", "shop-hoa-tuoi-bao-loc"],
  },
  {
    slug: "shop-hoa-tuoi-bao-loc",
    city: "Bảo Lộc",
    areas: "các phường 1, 2, B'Lao, Lộc Phát, Lộc Tiến, Lộc Sơn và các xã Đại Lào, Lộc Châu",
    nearby: "Bảo Lâm, Di Linh, Đạ Huoai",
    places: "thác Đambri, các đồi chè quanh thành phố, Bệnh viện II Lâm Đồng, chợ Bảo Lộc",
    note: "Khách ở TP.HCM đặt hoa cho gia đình ở Bảo Lộc chỉ cần gửi địa chỉ và số điện thoại người nhận; shop gửi ảnh hoa thật qua Zalo trước khi giao.",
    province: "shop-hoa-tuoi-lam-dong",
  },
  {
    slug: "shop-hoa-tuoi-ninh-thuan",
    city: "Ninh Thuận",
    areas: "Phan Rang – Tháp Chàm và các khu Ninh Hải, Ninh Phước, Thuận Bắc, Ninh Sơn, Thuận Nam",
    nearby: "Khánh Hòa, Bình Thuận, Lâm Đồng",
    places: "tháp Po Klong Garai, vịnh Vĩnh Hy, Bệnh viện Đa khoa tỉnh Ninh Thuận, các nhà máy điện gió, điện mặt trời",
    note: "Doanh nghiệp năng lượng tái tạo ở Ninh Thuận thường đặt kệ hoa khai trương, khánh thành: gửi tên công ty, địa điểm và giờ làm lễ.",
    districts: ["shop-hoa-tuoi-phan-rang"],
  },
  {
    slug: "shop-hoa-tuoi-phan-rang",
    city: "Phan Rang – Tháp Chàm",
    areas: "các phường Kinh Dinh, Phủ Hà, Thanh Sơn, Mỹ Hương, Đạo Long, Tấn Tài, Mỹ Bình, Đô Vinh, Bảo An",
    nearby: "Ninh Hải, Ninh Phước, Thuận Bắc",
    places: "tháp Po Klong Garai, Quảng trường 16/4, Bệnh viện Đa khoa tỉnh Ninh Thuận, bãi biển Bình Sơn",
    note: "Hoa chia buồn ở Phan Rang: báo shop địa chỉ tang lễ và nội dung băng tang ngay khi đặt để giao kịp.",
    province: "shop-hoa-tuoi-ninh-thuan",
  },
  {
    slug: "shop-hoa-tuoi-kon-tum",
    city: "Kon Tum",
    areas: "các phường Quyết Thắng, Thắng Lợi, Thống Nhất, Duy Tân, Trường Chinh, Quang Trung và các xã ven thành phố",
    nearby: "Đắk Hà, Sa Thầy, Kon Rẫy, Pleiku",
    places: "Nhà thờ gỗ Kon Tum, cầu treo Kon Klor, Bệnh viện Đa khoa tỉnh Kon Tum",
    note: "Kon Tum ở xa các thành phố lớn; đặt trước nửa ngày để shop chuẩn bị đúng mẫu và hẹn giờ giao.",
  },
  {
    slug: "shop-hoa-tuoi-gia-lai",
    city: "Gia Lai",
    areas: "Pleiku, An Khê, Ayun Pa và các khu Chư Păh, Ia Grai, Đak Đoa, Chư Sê",
    nearby: "Kon Tum, Đắk Lắk, Bình Định",
    places: "Biển Hồ, Quảng trường Đại Đoàn Kết, Bệnh viện Đa khoa tỉnh Gia Lai, các đồn điền cà phê, chè",
    note: "Các thị xã An Khê, Ayun Pa cách Pleiku khá xa; gọi trước để shop báo thời gian giao cụ thể.",
    districts: ["shop-hoa-tuoi-pleiku"],
  },
  {
    slug: "shop-hoa-tuoi-pleiku",
    city: "Pleiku",
    areas: "các phường Hội Thương, Hội Phú, Tây Sơn, Diên Hồng, Ia Kring, Yên Đỗ, Phù Đổng, Hoa Lư, Trà Bá, Thắng Lợi",
    nearby: "Chư Păh, Ia Grai, Đak Đoa",
    places: "Biển Hồ, Quảng trường Đại Đoàn Kết, Bệnh viện Đa khoa tỉnh Gia Lai, sân bay Pleiku",
    note: "Khách ở TP.HCM, Đà Nẵng đặt hoa sinh nhật, hoa chúc mừng cho người thân ở Pleiku được gửi ảnh hoa thật qua Zalo trước khi giao.",
    province: "shop-hoa-tuoi-gia-lai",
  },
  {
    slug: "shop-hoa-tuoi-quang-nam",
    city: "Quảng Nam",
    areas: "Tam Kỳ, Hội An, Điện Bàn và các khu Núi Thành, Thăng Bình, Duy Xuyên, Đại Lộc",
    nearby: "Đà Nẵng, Quảng Ngãi",
    places: "phố cổ Hội An, khu kinh tế mở Chu Lai, sân bay Chu Lai, Bệnh viện Đa khoa Trung ương Quảng Nam",
    note: "Doanh nghiệp ở khu kinh tế Chu Lai và các khu công nghiệp Điện Bàn thường đặt kệ hoa khai trương: gửi tên công ty và giờ làm lễ.",
    districts: ["shop-hoa-tuoi-tam-ky", "shop-hoa-tuoi-hoi-an"],
  },
  {
    slug: "shop-hoa-tuoi-tam-ky",
    city: "Tam Kỳ",
    areas: "các phường An Mỹ, An Sơn, An Xuân, An Phú, Hòa Hương, Hòa Thuận, Phước Hòa, Tân Thạnh, Trường Xuân",
    nearby: "Phú Ninh, Núi Thành, Thăng Bình",
    places: "Trung tâm hành chính tỉnh, Bệnh viện Đa khoa tỉnh Quảng Nam, bãi biển Tam Thanh, hồ Phú Ninh",
    note: "Hoa chúc mừng gửi cơ quan trong khu hành chính tỉnh: ghi rõ tên đơn vị, phòng ban và người nhận để giao nhanh.",
    province: "shop-hoa-tuoi-quang-nam",
  },
  {
    slug: "shop-hoa-tuoi-hoi-an",
    city: "Hội An",
    areas: "các phường Minh An, Cẩm Phô, Sơn Phong, Cẩm Châu, Cẩm An, Thanh Hà, Tân An, Cửa Đại và các xã Cẩm Thanh, Cẩm Kim",
    nearby: "Điện Bàn, Duy Xuyên, Ngũ Hành Sơn",
    places: "phố cổ Hội An, các resort biển An Bàng, Cửa Đại, làng rau Trà Quế, rừng dừa Bảy Mẫu",
    note: "Hoa tặng khách đang nghỉ dưỡng, chụp ảnh cưới hoặc cầu hôn ở Hội An: gửi tên khách sạn, resort, tên khách và giờ hẹn để shop phối hợp với lễ tân.",
    province: "shop-hoa-tuoi-quang-nam",
  },
  {
    slug: "shop-hoa-tuoi-quang-binh",
    city: "Quảng Bình",
    areas: "Đồng Hới, Ba Đồn và các khu Bố Trạch, Quảng Ninh, Lệ Thủy, Quảng Trạch",
    nearby: "Hà Tĩnh, Quảng Trị",
    places: "Vườn quốc gia Phong Nha – Kẻ Bàng, biển Nhật Lệ, Bệnh viện Hữu nghị Việt Nam – Cu Ba Đồng Hới, sân bay Đồng Hới",
    note: "Khu Phong Nha và các huyện xa cần hẹn giờ; gọi trước để shop báo thời gian giao cụ thể.",
    districts: ["shop-hoa-tuoi-dong-hoi"],
  },
  {
    slug: "shop-hoa-tuoi-dong-hoi",
    city: "Đồng Hới",
    areas: "các phường Hải Thành, Đồng Phú, Nam Lý, Bắc Lý, Đồng Mỹ, Hải Đình, Phú Hải, Bắc Nghĩa, Đức Ninh Đông",
    nearby: "Bố Trạch, Quảng Ninh",
    places: "biển Nhật Lệ, Quảng Bình Quan, Bệnh viện Hữu nghị Việt Nam – Cu Ba, sân bay Đồng Hới",
    note: "Khách ở xa đặt hoa sinh nhật, hoa chúc mừng cho người thân ở Đồng Hới được gửi ảnh hoa thật qua Zalo trước khi giao.",
    province: "shop-hoa-tuoi-quang-binh",
  },
  {
    slug: "shop-hoa-tuoi-quang-tri",
    city: "Quảng Trị",
    areas: "Đông Hà, thị xã Quảng Trị và các khu Gio Linh, Vĩnh Linh, Triệu Phong, Hải Lăng, Cam Lộ",
    nearby: "Huế, Quảng Bình",
    places: "Thành cổ Quảng Trị, cầu Hiền Lương, Bệnh viện Đa khoa tỉnh Quảng Trị, cửa khẩu Lao Bảo",
    note: "Hoa viếng, hoa chia buồn ở Quảng Trị: báo shop địa chỉ và nội dung băng tang ngay khi đặt để giao kịp.",
    districts: ["shop-hoa-tuoi-dong-ha"],
  },
  {
    slug: "shop-hoa-tuoi-dong-ha",
    city: "Đông Hà",
    areas: "các phường 1, 2, 3, 4, 5, Đông Giang, Đông Lễ, Đông Lương, Đông Thanh",
    nearby: "Cam Lộ, Triệu Phong, Gio Linh",
    places: "cầu Đông Hà, chợ Đông Hà, Bệnh viện Đa khoa tỉnh Quảng Trị, các cơ quan dọc Quốc lộ 9",
    note: "Hoa chúc mừng gửi cơ quan, trường học ở Đông Hà: ghi rõ tên đơn vị và người nhận để giao nhanh.",
    province: "shop-hoa-tuoi-quang-tri",
  },
  {
    slug: "shop-hoa-tuoi-thua-thien-hue",
    city: "Thừa Thiên Huế",
    store: "Huế",
    areas: "Huế, Hương Thủy, Hương Trà và các khu Phú Vang, Phong Điền, Phú Lộc, Quảng Điền",
    nearby: "Đà Nẵng, Quảng Trị",
    places: "Đại Nội Huế, Bệnh viện Trung ương Huế, Đại học Huế, biển Thuận An, Lăng Cô",
    note: "Cửa hàng ở Huế nhận đơn cho cả khu vực; các nơi xa như Lăng Cô, Phong Điền nên đặt trước để shop hẹn giờ giao.",
    districts: ["shop-hoa-tuoi-hue"],
  },
  {
    slug: "shop-hoa-tuoi-nghe-an",
    city: "Nghệ An",
    areas: "Vinh, Cửa Lò, Thái Hòa, Hoàng Mai và các khu Diễn Châu, Nghi Lộc, Hưng Nguyên, Nam Đàn",
    nearby: "Hà Tĩnh, Thanh Hóa",
    places: "Đại học Vinh, biển Cửa Lò, khu di tích Kim Liên, Bệnh viện Hữu nghị Đa khoa Nghệ An",
    note: "Các huyện miền núi Nghệ An ở xa; gọi trước để shop báo thời gian giao cụ thể.",
    districts: ["shop-hoa-tuoi-vinh"],
  },
  {
    slug: "shop-hoa-tuoi-ha-tinh",
    city: "Hà Tĩnh",
    areas: "các phường Bắc Hà, Nam Hà, Tân Giang, Trần Phú, Nguyễn Du, Thạch Linh, Thạch Quý, Văn Yên, Đại Nài",
    nearby: "Thạch Hà, Cẩm Xuyên, Hồng Lĩnh, Vinh",
    places: "Bệnh viện Đa khoa tỉnh Hà Tĩnh, Đại học Hà Tĩnh, biển Thiên Cầm, khu kinh tế Vũng Áng (Kỳ Anh)",
    note: "Doanh nghiệp ở khu kinh tế Vũng Áng đặt hoa chúc mừng, khai trương: gửi tên công ty, cổng ra vào và giờ làm lễ.",
  },
  {
    slug: "shop-hoa-tuoi-phu-yen",
    city: "Phú Yên",
    areas: "Tuy Hòa, Sông Cầu và các khu Đông Hòa, Tuy An, Phú Hòa, Sơn Hòa",
    nearby: "Bình Định, Khánh Hòa, Gia Lai",
    places: "Gành Đá Đĩa, Mũi Điện, tháp Nhạn, Bệnh viện Đa khoa tỉnh Phú Yên",
    note: "Khách ở TP.HCM đặt hoa cho gia đình ở Phú Yên chỉ cần gửi địa chỉ và số điện thoại người nhận; shop gửi ảnh hoa thật trước khi giao.",
    districts: ["shop-hoa-tuoi-tuy-hoa"],
  },
  // Tuần 11 (4/1/2027): 28 trang miền Bắc — trước đó chuyển hướng về Hà Nội / trang lân cận (Tuyên Quang 404)
  {
    slug: "shop-hoa-tuoi-quang-ninh",
    city: "Quảng Ninh",
    areas: "Hạ Long, Cẩm Phả, Uông Bí, Móng Cái và các khu Đông Triều, Quảng Yên, Vân Đồn",
    nearby: "Hải Phòng, Hải Dương, Bắc Giang",
    places: "vịnh Hạ Long, khu di tích Yên Tử, sân bay Vân Đồn, Bệnh viện Đa khoa tỉnh Quảng Ninh",
    note: "Quảng Ninh trải dài theo bờ biển; đơn đi Móng Cái, Vân Đồn nên đặt trước nửa ngày để shop hẹn giờ giao.",
    districts: ["shop-hoa-tuoi-ha-long", "shop-hoa-tuoi-cam-pha", "shop-hoa-tuoi-uong-bi", "shop-hoa-tuoi-mong-cai"],
  },
  {
    slug: "shop-hoa-tuoi-ha-long",
    city: "Hạ Long",
    areas: "các phường Bãi Cháy, Hồng Gai, Bạch Đằng, Hồng Hải, Cao Xanh, Giếng Đáy, Hà Khẩu, Hùng Thắng, Tuần Châu",
    nearby: "Cẩm Phả, Quảng Yên, Uông Bí",
    places: "khu du lịch Bãi Cháy, Sun World Hạ Long, Bệnh viện Bãi Cháy, các khách sạn ven vịnh Hạ Long",
    note: "Hoa tặng khách đang nghỉ ở khách sạn Bãi Cháy, Tuần Châu: gửi tên khách sạn, tên khách và giờ có mặt để shop hẹn giao tại lễ tân.",
    province: "shop-hoa-tuoi-quang-ninh",
  },
  {
    slug: "shop-hoa-tuoi-cam-pha",
    city: "Cẩm Phả",
    areas: "các phường Cẩm Đông, Cẩm Tây, Cẩm Trung, Cẩm Thành, Cẩm Bình, Cẩm Thịnh, Cửa Ông, Mông Dương, Quang Hanh",
    nearby: "Hạ Long, Vân Đồn",
    places: "các mỏ và công ty than, khu suối khoáng Quang Hanh, đền Cửa Ông, Bệnh viện Đa khoa khu vực Cẩm Phả",
    note: "Các công ty than ở Cẩm Phả thường đặt hoa chúc mừng, kệ hoa khai trương: gửi tên đơn vị và cổng ra vào để giao đúng chỗ.",
    province: "shop-hoa-tuoi-quang-ninh",
  },
  {
    slug: "shop-hoa-tuoi-mong-cai",
    city: "Móng Cái",
    areas: "các phường Ka Long, Trần Phú, Hòa Lạc, Ninh Dương, Hải Hòa, Trà Cổ, Bình Ngọc",
    nearby: "Hải Hà, Đầm Hà",
    places: "cửa khẩu quốc tế Móng Cái, bãi biển Trà Cổ, mũi Sa Vĩ, chợ trung tâm Móng Cái",
    note: "Móng Cái cách Hạ Long khá xa; đặt trước nửa ngày để shop chuẩn bị và hẹn giờ giao.",
    province: "shop-hoa-tuoi-quang-ninh",
  },
  {
    slug: "shop-hoa-tuoi-hai-phong",
    city: "Hải Phòng",
    areas: "các quận Hồng Bàng, Lê Chân, Ngô Quyền, Hải An, Kiến An, Dương Kinh, Đồ Sơn và Thủy Nguyên, An Dương",
    nearby: "Hải Dương, Quảng Ninh, Thái Bình",
    places: "Nhà hát lớn Hải Phòng, sân bay Cát Bi, Bệnh viện Việt Tiệp, các khu công nghiệp VSIP, Đình Vũ, Tràng Duệ",
    note: "Doanh nghiệp ở các khu công nghiệp Hải Phòng thường đặt kệ hoa khai trương, hoa chúc mừng đối tác: gửi tên công ty và cổng ra vào để giao đúng chỗ.",
  },
  {
    slug: "shop-hoa-tuoi-ha-giang",
    city: "Hà Giang",
    areas: "các phường Minh Khai, Nguyễn Trãi, Trần Phú, Ngọc Hà, Quang Trung và các xã Ngọc Đường, Phương Thiện, Phương Độ",
    nearby: "Vị Xuyên, Bắc Quang, Quản Bạ",
    places: "cột mốc Km0 Hà Giang, Bệnh viện Đa khoa tỉnh Hà Giang, các khách sạn, homestay trung tâm",
    note: "Hà Giang là vùng núi; đơn ngoài trung tâm thành phố cần hẹn trước để shop báo thời gian giao cụ thể.",
  },
  {
    slug: "shop-hoa-tuoi-hoa-binh",
    city: "Hòa Bình",
    areas: "các phường Phương Lâm, Đồng Tiến, Chăm Mát, Tân Thịnh, Hữu Nghị, Thịnh Lang, Kỳ Sơn",
    nearby: "Lương Sơn, Cao Phong, Kim Bôi",
    places: "nhà máy thủy điện Hòa Bình, hồ Hòa Bình, Bệnh viện Đa khoa tỉnh Hòa Bình",
    note: "Khách ở Hà Nội đặt hoa cho người thân ở Hòa Bình chỉ cần gửi địa chỉ và số điện thoại người nhận; shop gửi ảnh hoa thật qua Zalo trước khi giao.",
  },
  {
    slug: "shop-hoa-tuoi-hung-yen",
    city: "Hưng Yên",
    areas: "các phường Hiến Nam, Lê Lợi, Quang Trung, Minh Khai, An Tảo, Hồng Châu và các khu Văn Lâm, Mỹ Hào, Văn Giang",
    nearby: "Hà Nội, Hải Dương, Thái Bình",
    places: "khu phố Hiến, khu đô thị Ecopark, các khu công nghiệp Phố Nối, Thăng Long II, Bệnh viện Đa khoa tỉnh Hưng Yên",
    note: "Doanh nghiệp ở khu công nghiệp Phố Nối, Thăng Long II đặt kệ hoa khai trương: gửi tên công ty và giờ làm lễ để giao kịp.",
  },
  {
    slug: "shop-hoa-tuoi-lai-chau",
    city: "Lai Châu",
    areas: "các phường Đoàn Kết, Tân Phong, Quyết Thắng, Quyết Tiến, Đông Phong và các xã ven thành phố",
    nearby: "Tam Đường, Phong Thổ, Sa Pa",
    places: "Trung tâm hành chính tỉnh, Bệnh viện Đa khoa tỉnh Lai Châu, đèo Ô Quy Hồ",
    note: "Lai Châu ở xa các thành phố lớn; đặt trước ít nhất nửa ngày để shop chuẩn bị đúng mẫu và hẹn giờ giao.",
  },
  {
    slug: "shop-hoa-tuoi-lang-son",
    city: "Lạng Sơn",
    areas: "các phường Chi Lăng, Hoàng Văn Thụ, Tam Thanh, Vĩnh Trại, Đông Kinh và các xã Mai Pha, Quảng Lạc",
    nearby: "Cao Lộc, Văn Lãng, Chi Lăng",
    places: "chợ Đông Kinh, động Tam Thanh, cửa khẩu Hữu Nghị, Bệnh viện Đa khoa tỉnh Lạng Sơn",
    note: "Doanh nghiệp xuất nhập khẩu ở các cửa khẩu Lạng Sơn đặt hoa chúc mừng, khai trương: gửi tên công ty và địa điểm làm lễ.",
  },
  {
    slug: "shop-hoa-tuoi-lao-cai",
    city: "Lào Cai",
    areas: "các phường Cốc Lếu, Duyên Hải, Kim Tân, Bắc Lệnh, Pom Hán của thành phố Lào Cai và thị xã Sa Pa",
    nearby: "Bát Xát, Bảo Thắng, Sa Pa",
    places: "cửa khẩu quốc tế Lào Cai, các khách sạn, resort Sa Pa, Bệnh viện Đa khoa tỉnh Lào Cai",
    note: "Hoa tặng khách nghỉ dưỡng hoặc cầu hôn ở Sa Pa: gửi tên khách sạn, tên khách và giờ hẹn để shop phối hợp với lễ tân.",
  },
  {
    slug: "shop-hoa-tuoi-nam-dinh",
    city: "Nam Định",
    areas: "các phường Trần Hưng Đạo, Vị Xuyên, Năng Tĩnh, Bà Triệu, Cửa Bắc, Lộc Hạ, Lộc Vượng, Trần Đăng Ninh",
    nearby: "Mỹ Lộc, Vụ Bản, Nam Trực, Phủ Lý",
    places: "khu di tích đền Trần, chùa Phổ Minh, Bệnh viện Đa khoa tỉnh Nam Định, Đại học Điều dưỡng Nam Định",
    note: "Dịp lễ hội đền Trần đầu năm đường phố rất đông; nên đặt hoa sớm và ghi rõ giờ có người nhận.",
  },
  {
    slug: "shop-hoa-tuoi-thai-binh",
    city: "Thái Bình",
    areas: "các phường Lê Hồng Phong, Bồ Xuyên, Đề Thám, Kỳ Bá, Quang Trung, Tiền Phong, Trần Lãm, Hoàng Diệu",
    nearby: "Vũ Thư, Kiến Xương, Đông Hưng, Nam Định",
    places: "Bệnh viện Đa khoa tỉnh Thái Bình, Đại học Y Dược Thái Bình, chùa Keo, biển Đồng Châu",
    note: "Khách ở Hà Nội, TP.HCM đặt hoa cho gia đình ở Thái Bình được gửi ảnh hoa thật qua Zalo trước khi giao.",
  },
  {
    slug: "shop-hoa-tuoi-ninh-binh",
    city: "Ninh Bình",
    areas: "các phường Đông Thành, Tân Thành, Thanh Bình, Vân Giang, Phúc Thành, Nam Bình, Ninh Khánh và các khu Hoa Lư, Gia Viễn, Tam Điệp",
    nearby: "Phủ Lý, Nam Định, Thanh Hóa",
    places: "khu du lịch Tràng An, Tam Cốc – Bích Động, chùa Bái Đính, cố đô Hoa Lư, Bệnh viện Đa khoa tỉnh Ninh Bình",
    note: "Hoa tặng khách nghỉ ở các resort Tràng An, Tam Cốc: gửi tên resort, tên khách và giờ có mặt để shop hẹn giao.",
    districts: ["shop-hoa-tuoi-tam-diep"],
  },
  {
    slug: "shop-hoa-tuoi-tam-diep",
    city: "Tam Điệp",
    areas: "các phường Bắc Sơn, Nam Sơn, Trung Sơn, Tân Bình, Tây Sơn và các xã Đông Sơn, Quang Sơn, Yên Sơn",
    nearby: "Yên Mô, Nho Quan, Bỉm Sơn",
    places: "đèo Tam Điệp, các nhà máy xi măng, khu công nghiệp dọc Quốc lộ 1",
    note: "Doanh nghiệp ở các khu công nghiệp Tam Điệp đặt hoa khai trương: gửi tên công ty và giờ làm lễ để giao kịp.",
    province: "shop-hoa-tuoi-ninh-binh",
  },
  {
    slug: "shop-hoa-tuoi-phu-ly",
    city: "Phủ Lý",
    areas: "các phường Hai Bà Trưng, Lương Khánh Thiện, Minh Khai, Quang Trung, Lam Hạ, Trần Hưng Đạo, Thanh Châu",
    nearby: "Duy Tiên, Kim Bảng, Thanh Liêm",
    places: "Bệnh viện Bạch Mai và Việt Đức cơ sở 2, Bệnh viện Đa khoa tỉnh Hà Nam, các trường dọc Quốc lộ 1",
    note: "Thăm người thân điều trị tại các bệnh viện cơ sở 2 ở Phủ Lý: chọn giỏ hoa nhỏ gọn, gửi tên khoa và số phòng.",
    province: "shop-hoa-tuoi-ha-nam",
  },
  {
    slug: "shop-hoa-tuoi-vinh-phuc",
    city: "Vĩnh Phúc",
    areas: "Vĩnh Yên, Phúc Yên và các khu Bình Xuyên, Tam Dương, Tam Đảo, Yên Lạc, Vĩnh Tường",
    nearby: "Hà Nội, Phú Thọ, Thái Nguyên",
    places: "khu du lịch Tam Đảo, Đại Lải, các khu công nghiệp Bình Xuyên, Khai Quang, Bá Thiện",
    note: "Doanh nghiệp ở các khu công nghiệp Vĩnh Phúc thường đặt kệ hoa khai trương, hoa chúc mừng đối tác: gửi tên công ty và cổng ra vào.",
    districts: ["shop-hoa-tuoi-vinh-yen", "shop-hoa-tuoi-phuc-yen"],
  },
  {
    slug: "shop-hoa-tuoi-vinh-yen",
    city: "Vĩnh Yên",
    areas: "các phường Ngô Quyền, Liên Bảo, Đống Đa, Tích Sơn, Hội Hợp, Khai Quang, Đồng Tâm",
    nearby: "Tam Dương, Bình Xuyên, Tam Đảo",
    places: "Bệnh viện Đa khoa tỉnh Vĩnh Phúc, khu công nghiệp Khai Quang, đầm Vạc",
    note: "Hoa chúc mừng gửi cơ quan, trường học ở Vĩnh Yên: ghi rõ tên đơn vị và người nhận để giao nhanh.",
    province: "shop-hoa-tuoi-vinh-phuc",
  },
  {
    slug: "shop-hoa-tuoi-phuc-yen",
    city: "Phúc Yên",
    areas: "các phường Hùng Vương, Trưng Trắc, Trưng Nhị, Phúc Thắng, Xuân Hòa, Đồng Xuân, Tiền Phong, Nam Viêm",
    nearby: "Mê Linh, Sóc Sơn, Bình Xuyên",
    places: "Đại học Sư phạm Hà Nội 2, khu du lịch Đại Lải, nhà máy Toyota Việt Nam",
    note: "Mùa tốt nghiệp ở Đại học Sư phạm Hà Nội 2 nên đặt hoa trước 1–2 ngày và ghi rõ cổng trường.",
    province: "shop-hoa-tuoi-vinh-phuc",
  },
  {
    slug: "shop-hoa-tuoi-phu-tho",
    city: "Phú Thọ",
    areas: "Việt Trì, thị xã Phú Thọ và các khu Lâm Thao, Phù Ninh, Thanh Ba, Đoan Hùng",
    nearby: "Vĩnh Phúc, Yên Bái, Tuyên Quang",
    places: "khu di tích Đền Hùng, Bệnh viện Đa khoa tỉnh Phú Thọ, Đại học Hùng Vương",
    note: "Mùa lễ hội Đền Hùng đường rất đông; đặt hoa trước 1 ngày để giữ mẫu và giờ giao.",
    districts: ["shop-hoa-tuoi-viet-tri"],
  },
  {
    slug: "shop-hoa-tuoi-thai-nguyen",
    city: "Thái Nguyên",
    areas: "các phường Hoàng Văn Thụ, Phan Đình Phùng, Trưng Vương, Đồng Quang, Quang Trung, Tân Thịnh, Tân Lập, Gia Sàng và Sông Công, Phổ Yên",
    nearby: "Bắc Giang, Bắc Kạn, Vĩnh Phúc",
    places: "Đại học Thái Nguyên, Bệnh viện Trung ương Thái Nguyên, hồ Núi Cốc, khu công nghiệp Yên Bình",
    note: "Mùa tốt nghiệp ở các trường thuộc Đại học Thái Nguyên đơn hoa tăng mạnh, nên đặt trước 1–2 ngày.",
    districts: ["shop-hoa-tuoi-song-cong"],
  },
  {
    slug: "shop-hoa-tuoi-song-cong",
    city: "Sông Công",
    areas: "các phường Mỏ Chè, Thắng Lợi, Phố Cò, Cải Đan, Lương Sơn, Bách Quang, Châu Sơn",
    nearby: "Phổ Yên, Thái Nguyên, Đại Từ",
    places: "các khu công nghiệp Sông Công, chợ Sông Công, trung tâm hành chính thành phố",
    note: "Doanh nghiệp ở khu công nghiệp Sông Công đặt kệ hoa khai trương, hoa chúc mừng: gửi tên công ty và cổng ra vào để giao đúng chỗ.",
    province: "shop-hoa-tuoi-thai-nguyen",
  },
  {
    slug: "shop-hoa-tuoi-thanh-hoa",
    city: "Thanh Hóa",
    areas: "các phường Ba Đình, Điện Biên, Lam Sơn, Đông Thọ, Đông Vệ, Ngọc Trạo, Phú Sơn, Quảng Thắng, Tân Sơn và Sầm Sơn, Bỉm Sơn, Nghi Sơn",
    nearby: "Ninh Bình, Nghệ An, Hòa Bình",
    places: "Bệnh viện Đa khoa tỉnh Thanh Hóa, Đại học Hồng Đức, khu kinh tế Nghi Sơn, quảng trường Lam Sơn",
    note: "Doanh nghiệp ở khu kinh tế Nghi Sơn đặt hoa chúc mừng, khai trương: gửi tên công ty và giờ làm lễ để giao kịp.",
    districts: ["shop-hoa-tuoi-sam-son"],
  },
  {
    slug: "shop-hoa-tuoi-sam-son",
    city: "Sầm Sơn",
    areas: "các phường Bắc Sơn, Trung Sơn, Trường Sơn, Quảng Tiến, Quảng Cư, Quảng Châu",
    nearby: "thành phố Thanh Hóa, Quảng Xương, Hoằng Hóa",
    places: "bãi biển Sầm Sơn, đền Độc Cước, hòn Trống Mái, các khách sạn ven biển",
    note: "Hoa tặng khách nghỉ ở khách sạn ven biển Sầm Sơn: gửi tên khách sạn, tên khách và giờ có mặt để shop hẹn giao tại lễ tân.",
    province: "shop-hoa-tuoi-thanh-hoa",
  },
  {
    slug: "shop-hoa-tuoi-son-la",
    city: "Sơn La",
    areas: "các phường Chiềng Lề, Tô Hiệu, Quyết Thắng, Quyết Tâm, Chiềng Sinh, Chiềng An, Chiềng Cơi",
    nearby: "Mai Sơn, Thuận Châu, Mộc Châu",
    places: "di tích Nhà tù Sơn La, Bệnh viện Đa khoa tỉnh Sơn La, cao nguyên Mộc Châu (theo lịch hẹn)",
    note: "Sơn La là vùng núi; đơn đi Mộc Châu hay các huyện xa cần hẹn trước để shop báo thời gian giao cụ thể.",
  },
  {
    slug: "shop-hoa-tuoi-tuyen-quang",
    city: "Tuyên Quang",
    areas: "các phường Phan Thiết, Minh Xuân, Tân Quang, Tân Hà, Ỷ La, Hưng Thành, Nông Tiến",
    nearby: "Yên Sơn, Sơn Dương, Hàm Yên",
    places: "Bệnh viện Đa khoa tỉnh Tuyên Quang, khu di tích Tân Trào (theo lịch hẹn), khu suối khoáng Mỹ Lâm",
    note: "Mùa lễ hội Thành Tuyên cuối năm đường phố rất đông; nên đặt hoa sớm và ghi rõ giờ có người nhận.",
  },
  {
    slug: "shop-hoa-tuoi-yen-bai",
    city: "Yên Bái",
    areas: "các phường Yên Ninh, Đồng Tâm, Hồng Hà, Minh Tân, Nguyễn Thái Học, Nguyễn Phúc, Yên Thịnh",
    nearby: "Trấn Yên, Yên Bình, Văn Yên",
    places: "Bệnh viện Đa khoa tỉnh Yên Bái, công viên Yên Hòa, hồ Thác Bà (theo lịch hẹn)",
    note: "Khách ở Hà Nội đặt hoa cho người thân ở Yên Bái được gửi ảnh hoa thật qua Zalo trước khi giao.",
  },
  {
    slug: "shop-hoa-tuoi-dien-bien",
    city: "Điện Biên",
    areas: "các phường Him Lam, Mường Thanh, Tân Thanh, Thanh Bình, Thanh Trường, Noong Bua, Nam Thanh của thành phố Điện Biên Phủ",
    nearby: "huyện Điện Biên, Mường Ảng",
    places: "đồi A1, Tượng đài Chiến thắng Điện Biên Phủ, sân bay Điện Biên, Bệnh viện Đa khoa tỉnh Điện Biên",
    note: "Điện Biên ở rất xa; đặt trước ít nhất nửa ngày để shop chuẩn bị đúng mẫu và hẹn giờ giao.",
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
