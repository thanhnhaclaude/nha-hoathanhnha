export const site = {
  name: "Hoa Thanh Nhã",
  tagline: "Thay lời yêu thương",
  title: "Shop hoa tươi Thanh Nhã: Đặt hoa online, giao hoa miễn phí",
  description:
    "Shop hoa tươi Thanh Nhã – đặt hoa online, giao hoa hỏa tốc 60 phút, miễn phí thiệp & băng rôn. Hoa khai trương, hoa sinh nhật, hoa chia buồn, lan hồ điệp trên 63 tỉnh thành.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://hoathanhnha.com",
  phone: "0396727374",
  phoneDisplay: "0396.72.73.74",
  zalo: "https://zalo.me/0396727374",
  /** Mạng xã hội của shop (lấy từ website cũ). Hiển thị ở chân trang và khai báo với Google (sameAs). */
  socials: [
    { name: "Facebook", href: "https://www.facebook.com/hoatuoithanhnha/" },
    { name: "Instagram", href: "https://www.instagram.com/hoatuoithanhnha/" },
    { name: "YouTube", href: "https://www.youtube.com/channel/UCe2zrO2IXG4P3xIZ9I3ixUQ" },
  ],
  email: "contact@hoathanhnha.com",
  hours: "06:00 – 21:00",
  promo: "Giảm 10% khi đặt hoa hôm nay và 20% đặt hoa lần sau",
  stores: [
    {
      city: "TP. Hồ Chí Minh",
      addresses: [
        "776/10 Nguyễn Kiệm, Phường 3, Gò Vấp",
        "150A Đ. Nguyễn Ảnh Thủ, Khu Phố 2, Quận 12",
        "262 Hai Bà Trưng, Phường Tân Định, Quận 1",
        "77 Lê Văn Chí, Phường Linh Trung, Thủ Đức",
        "457 Nguyễn Kiệm, Phường 9, Phú Nhuận",
        "71 Đ. Trần Đại Nghĩa, Tân Nhựt, Bình Chánh",
      ],
    },
    {
      city: "Hà Nội",
      addresses: ["12 P. Trần Quang Diệu, Chợ Dừa, Đống Đa", "96 Ng. 44 P. Trần Thái Tông, Dịch Vọng Hậu, Cầu Giấy"],
    },
    {
      city: "Các tỉnh",
      addresses: [
        "Đà Nẵng: 24 Cẩm Chánh 4, Chợ, Cẩm Lệ",
        "Đà Nẵng: 396 Đ. Nguyễn Hoàng, P. Bình Thuận, Thanh Khê",
        "Huế: 74A Hai Bà Trưng, Vĩnh Ninh",
        "Cần Thơ: 18 Đ. Bế Văn Đàn, An Hoà, Ninh Kiều",
        "Nha Trang: 76 Lê Hồng Phong, Phước Tân",
        "Vũng Tàu: 462 Bình Giã, Nguyễn An Ninh",
        "Biên Hòa: 33 Điểu Xiển, Tân Biên",
        "Đồng Nai: 251 Hồ Thị Hương, Xuân Thanh, Long Khánh",
        "Nhơn Trạch: PWPW+FW9, Hiệp Phước",
        "Thống Nhất: 3559+V9X, Gia Tân 1",
        "Xuân Lộc: 3745 QL1A, Bảo Hoà",
        "Định Quán: 6957+34Q",
      ],
    },
  ],
} as const;

/**
 * Trang khu vực có cửa hàng thật -> địa chỉ (lấy đúng chuỗi trong stores ở trên) và thành phố.
 * Dùng cho đoạn "Cửa hàng hoa tại …" và dữ liệu có cấu trúc Florist trên trang khu vực.
 */
export const storeAreas: Record<string, { street: string; city: string }> = {
  "shop-hoa-tuoi-quan-go-vap": { street: "776/10 Nguyễn Kiệm, Phường 3, Gò Vấp", city: "TP. Hồ Chí Minh" },
  "shop-hoa-tuoi-quan-12": { street: "150A Đ. Nguyễn Ảnh Thủ, Khu Phố 2, Quận 12", city: "TP. Hồ Chí Minh" },
  "shop-hoa-tuoi-quan-1": { street: "262 Hai Bà Trưng, Phường Tân Định, Quận 1", city: "TP. Hồ Chí Minh" },
  "shop-hoa-tuoi-quan-thu-duc": { street: "77 Lê Văn Chí, Phường Linh Trung, Thủ Đức", city: "TP. Hồ Chí Minh" },
  "shop-hoa-tuoi-quan-dong-da": { street: "12 P. Trần Quang Diệu, Chợ Dừa, Đống Đa", city: "Hà Nội" },
  "shop-hoa-tuoi-quan-cau-giay": { street: "96 Ng. 44 P. Trần Thái Tông, Dịch Vọng Hậu, Cầu Giấy", city: "Hà Nội" },
  "shop-hoa-tuoi-quan-cam-le": { street: "24 Cẩm Chánh 4, Chợ, Cẩm Lệ", city: "Đà Nẵng" },
  "shop-hoa-tuoi-quan-thanh-khe": { street: "396 Đ. Nguyễn Hoàng, P. Bình Thuận, Thanh Khê", city: "Đà Nẵng" },
  "shop-hoa-tuoi-hue": { street: "74A Hai Bà Trưng, Vĩnh Ninh", city: "Huế" },
  "shop-hoa-tuoi-can-tho": { street: "18 Đ. Bế Văn Đàn, An Hoà, Ninh Kiều", city: "Cần Thơ" },
  "shop-hoa-tuoi-nha-trang": { street: "76 Lê Hồng Phong, Phước Tân", city: "Nha Trang" },
  "shop-hoa-tuoi-vung-tau": { street: "462 Bình Giã, Nguyễn An Ninh", city: "Vũng Tàu" },
  "shop-hoa-tuoi-bien-hoa": { street: "33 Điểu Xiển, Tân Biên", city: "Biên Hòa" },
  "shop-hoa-tuoi-quan-phu-nhuan": { street: "457 Nguyễn Kiệm, Phường 9, Phú Nhuận", city: "TP. Hồ Chí Minh" },
  "shop-hoa-tuoi-huyen-binh-chanh": { street: "71 Đ. Trần Đại Nghĩa, Tân Nhựt, Bình Chánh", city: "TP. Hồ Chí Minh" },
  "shop-hoa-tuoi-nhon-trach": { street: "PWPW+FW9, Hiệp Phước", city: "Nhơn Trạch" },
  "shop-hoa-tuoi-thong-nhat": { street: "3559+V9X, Gia Tân 1", city: "Thống Nhất" },
  "shop-hoa-tuoi-xuan-loc": { street: "3745 QL1A, Bảo Hoà", city: "Xuân Lộc" },
  "shop-hoa-tuoi-dinh-quan": { street: "6957+34Q", city: "Định Quán" },
};

/**
 * Trang thành phố là bài viết dài từ website cũ (đang có thứ hạng, không đổi sang danh mục):
 * hiện khung cửa hàng + link các quận ngay dưới tiêu đề, kèm dữ liệu Florist cho từng cửa hàng.
 */
export const cityHubs: Record<string, { city: string; stores: string[]; areas: { slug: string; name: string }[] }> = {
  "shop-hoa-tuoi-da-nang": {
    city: "Đà Nẵng",
    stores: ["shop-hoa-tuoi-quan-thanh-khe", "shop-hoa-tuoi-quan-cam-le"],
    areas: [
      { slug: "shop-hoa-tuoi-quan-hai-chau", name: "Hải Châu" },
      { slug: "shop-hoa-tuoi-quan-thanh-khe", name: "Thanh Khê" },
      { slug: "shop-hoa-tuoi-quan-cam-le", name: "Cẩm Lệ" },
      { slug: "shop-hoa-tuoi-quan-son-tra", name: "Sơn Trà" },
      { slug: "shop-hoa-tuoi-quan-ngu-hanh-son", name: "Ngũ Hành Sơn" },
      { slug: "shop-hoa-tuoi-quan-lien-chieu", name: "Liên Chiểu" },
      { slug: "shop-hoa-tuoi-huyen-hoa-vang", name: "Hòa Vang" },
    ],
  },
};

// Chủ shop chốt 8/11/2026: nội thành miễn phí, không theo giá trị đơn (biến SHIPPING_FEE, FREE_SHIPPING_THRESHOLD thôi dùng).
// shortcut: form chỉ có ô địa chỉ tự do nên phí ngoại thành do shop báo khi xác nhận đơn, nâng cấp khi form có chọn quận/huyện.
export function shippingConfig() {
  return { fee: 0, freeThreshold: 0 };
}
