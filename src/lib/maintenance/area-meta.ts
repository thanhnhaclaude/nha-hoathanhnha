/**
 * Tiêu đề + mô tả tìm kiếm cho trang khu vực đang đứng vị trí 8–11 trên Google (Search Console 24/9 – 21/10/2026):
 * gần trang 1 nhưng tỷ lệ nhấp ~1% vì tiêu đề chung chung và mô tả là chữ tiêu đề dính liền từ website cũ.
 * Từ khóa lấy từ truy vấn thật (vd. "hoa tươi tân phú", "shop hoa tươi hải châu"); địa chỉ chỉ ghi khi có cửa hàng thật (site.stores).
 * Cập nhật bảng seo_meta mỗi lần máy chủ khởi động. Chạy lặp lại an toàn.
 */
import type { Connection } from "mysql2/promise";
import { site } from "../site";

const P = site.phoneDisplay;

const AREAS: { path: string; title: string; description: string }[] = [
  {
    path: "/shop-hoa-tuoi-quan-tan-phu/",
    title: "Shop Hoa Tươi Tân Phú – Giao Nhanh, Gửi Ảnh Trước | Hoa Thanh Nhã",
    description: `Đặt hoa tươi Quận Tân Phú: hoa sinh nhật, khai trương, chia buồn, giao trong ngày, gửi ảnh thật trước khi giao, tặng thiệp. Gọi ${P}.`,
  },
  {
    path: "/shop-hoa-tuoi-quan-thu-duc/",
    title: "Shop Hoa Tươi Thủ Đức – Cửa Hàng Kha Vạn Cân | Hoa Thanh Nhã",
    description: `Cửa hàng hoa tại 61/5 Kha Vạn Cân, Hiệp Bình Chánh, Thủ Đức. Hoa sinh nhật, khai trương, chia buồn giao trong ngày, gửi ảnh trước. Gọi ${P}.`,
  },
  {
    path: "/shop-hoa-tuoi-quan-12/",
    title: "Shop Hoa Tươi Quận 12 – Cửa Hàng Thị Mười | Hoa Thanh Nhã",
    description: `Cửa hàng hoa tại 181 Thị Mười, Tân Thới Hiệp, Quận 12. Hoa sinh nhật, khai trương, chia buồn giá tốt, giao trong ngày, gửi ảnh trước. Gọi ${P}.`,
  },
  {
    path: "/shop-hoa-tuoi-quan-thanh-khe/",
    title: "Shop Hoa Tươi Thanh Khê Đà Nẵng – Cửa Hàng Nguyễn Hoàng | Hoa Thanh Nhã",
    description: `Cửa hàng hoa tại 396 Nguyễn Hoàng, Thanh Khê, Đà Nẵng. Hoa sinh nhật, khai trương, chia buồn giao trong ngày, gửi ảnh trước. Gọi ${P}.`,
  },
  {
    path: "/shop-hoa-tuoi-quan-hai-chau/",
    title: "Shop Hoa Tươi Hải Châu Đà Nẵng – Giao Nhanh Trong Ngày | Hoa Thanh Nhã",
    description: `Đặt hoa tươi Quận Hải Châu, Đà Nẵng: hoa sinh nhật, khai trương, chia buồn, giao trong ngày từ cửa hàng Thanh Khê, gửi ảnh trước. Gọi ${P}.`,
  },
  {
    path: "/shop-hoa-tuoi-buon-ma-thuot/",
    title: "Shop Hoa Tươi Buôn Ma Thuột (BMT) – Giao Tận Nơi | Hoa Thanh Nhã",
    description: `Đặt hoa tươi Buôn Ma Thuột: hoa sinh nhật, khai trương, chia buồn, lan hồ điệp, giao trong ngày, gửi ảnh thật trước khi giao. Gọi ${P}.`,
  },
  {
    path: "/shop-hoa-tuoi-bac-lieu/",
    title: "Shop Hoa Tươi Bạc Liêu – Đặt Hoa Giao Tận Nơi | Hoa Thanh Nhã",
    description: `Đặt hoa tươi Bạc Liêu: hoa sinh nhật, khai trương, chia buồn, giao trong ngày, gửi ảnh trước khi giao, tặng thiệp miễn phí. Gọi ${P}.`,
  },
  {
    path: "/shop-hoa-tuoi-chau-doc/",
    title: "Shop Hoa Tươi Châu Đốc – Đặt Hoa Giao Tận Nơi | Hoa Thanh Nhã",
    description: `Đặt hoa tươi Châu Đốc, An Giang: hoa sinh nhật, khai trương, chia buồn, giao trong ngày, gửi ảnh thật trước khi giao. Gọi ${P}.`,
  },
  {
    path: "/shop-hoa-tuoi-dong-xoai/",
    title: "Shop Hoa Tươi Đồng Xoài – Đặt Hoa Giao Tận Nơi | Hoa Thanh Nhã",
    description: `Đặt hoa tươi Đồng Xoài, Bình Phước: hoa sinh nhật, khai trương, chia buồn, giao trong ngày, gửi ảnh trước khi giao. Gọi ${P}.`,
  },
];

export async function syncAreaMeta(db: Connection): Promise<string[]> {
  for (const a of AREAS) {
    await db.query(
      `insert into seo_meta (path, title, description) values (?, ?, ?)
       on duplicate key update title = values(title), description = values(description)`,
      [a.path, a.title, a.description],
    );
  }
  return [`✓ Tiêu đề/mô tả trang khu vực: ${AREAS.length} trang`];
}
