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
        "229 Đ. Quang Trung, Phường 10, Gò Vấp",
        "181 Đ. Thị Mười, P. Tân Thới Hiệp, Quận 12",
        "130 Hai Bà Trưng, Bến Nghé, Quận 1",
        "61/5 Đ. Kha Vạn Cân, Hiệp Bình Chánh, Thủ Đức",
      ],
    },
    {
      city: "Hà Nội",
      addresses: ["500 Đ. Lê Duẩn, Phương Liên, Đống Đa", "430 Đ. Cầu Giấy, Dịch Vọng, Cầu Giấy"],
    },
    {
      city: "Các tỉnh",
      addresses: [
        "Đà Nẵng: 05 Trần Văn Cẩn, Hoà Xuân, Cẩm Lệ",
        "Đà Nẵng: 396 Đ. Nguyễn Hoàng, P. Bình Thuận, Thanh Khê",
        "Huế: 265 Trần Hưng Đạo, Phú Hoà",
        "Cần Thơ: 220 Đ. Nguyễn Văn Cừ, An Hoà, Ninh Kiều",
        "Nha Trang: 76 Lê Hồng Phong, Phước Tân",
        "Vũng Tàu: 120 Trương Công Định, Phường 8",
        "Biên Hòa: 85 Hưng Đạo Vương, Trung Dũng",
      ],
    },
  ],
} as const;

/**
 * Trang khu vực có cửa hàng thật -> địa chỉ (lấy đúng chuỗi trong stores ở trên) và thành phố.
 * Dùng cho đoạn "Cửa hàng hoa tại …" và dữ liệu có cấu trúc Florist trên trang khu vực.
 */
export const storeAreas: Record<string, { street: string; city: string }> = {
  "shop-hoa-tuoi-quan-go-vap": { street: "229 Đ. Quang Trung, Phường 10, Gò Vấp", city: "TP. Hồ Chí Minh" },
  "shop-hoa-tuoi-quan-12": { street: "181 Đ. Thị Mười, P. Tân Thới Hiệp, Quận 12", city: "TP. Hồ Chí Minh" },
  "shop-hoa-tuoi-quan-1": { street: "130 Hai Bà Trưng, Bến Nghé, Quận 1", city: "TP. Hồ Chí Minh" },
  "shop-hoa-tuoi-quan-thu-duc": { street: "61/5 Đ. Kha Vạn Cân, Hiệp Bình Chánh, Thủ Đức", city: "TP. Hồ Chí Minh" },
  "shop-hoa-tuoi-quan-dong-da": { street: "500 Đ. Lê Duẩn, Phương Liên, Đống Đa", city: "Hà Nội" },
  "shop-hoa-tuoi-quan-cau-giay": { street: "430 Đ. Cầu Giấy, Dịch Vọng, Cầu Giấy", city: "Hà Nội" },
  "shop-hoa-tuoi-quan-cam-le": { street: "05 Trần Văn Cẩn, Hoà Xuân, Cẩm Lệ", city: "Đà Nẵng" },
  "shop-hoa-tuoi-quan-thanh-khe": { street: "396 Đ. Nguyễn Hoàng, P. Bình Thuận, Thanh Khê", city: "Đà Nẵng" },
  "shop-hoa-tuoi-hue": { street: "265 Trần Hưng Đạo, Phú Hoà", city: "Huế" },
  "shop-hoa-tuoi-can-tho": { street: "220 Đ. Nguyễn Văn Cừ, An Hoà, Ninh Kiều", city: "Cần Thơ" },
  "shop-hoa-tuoi-nha-trang": { street: "76 Lê Hồng Phong, Phước Tân", city: "Nha Trang" },
  "shop-hoa-tuoi-vung-tau": { street: "120 Trương Công Định, Phường 8", city: "Vũng Tàu" },
  "shop-hoa-tuoi-bien-hoa": { street: "85 Hưng Đạo Vương, Trung Dũng", city: "Biên Hòa" },
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

export function shippingConfig() {
  return {
    fee: Number(process.env.SHIPPING_FEE ?? 30000),
    freeThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD ?? 500000),
  };
}
