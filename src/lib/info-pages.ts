import { site } from "./site";

export type InfoPage = { title: string; description: string; sections: { heading?: string; body: string[] }[] };

/**
 * Trang thông tin không có trên WordPress cũ. Các trang hướng dẫn/chính sách và tin tức
 * được nhập từ WordPress vào bảng `pages` (xem scripts/import-woo.ts).
 */
export const infoPages: Record<string, InfoPage> = {
  "khach-hang-doi-tac": {
    title: "Khách hàng & đối tác",
    description: "Hợp tác cùng Hoa Thanh Nhã.",
    sections: [
      {
        body: [
          "Thanh Nhã cung cấp hoa định kỳ cho doanh nghiệp, khách sạn, nhà hàng và hoa sự kiện, khai trương với số lượng lớn.",
          `Shop hoa tại các tỉnh muốn trở thành đối tác điện hoa, vui lòng liên hệ ${site.email} hoặc ${site.phoneDisplay}.`,
        ],
      },
    ],
  },
};
