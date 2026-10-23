/**
 * Tiêu đề + mô tả tìm kiếm (bảng seo_meta) cho trang đích của từ khóa mức A/B trong Kế hoạch SEO tổng thể:
 * - Trang khu vực vị trí 8–11 (Search Console 24/9 – 21/10/2026): mô tả cũ là chữ tiêu đề dính liền, CTR ~1%.
 * - Tuần 1 (26/10/2026): danh mục đang dùng mô tả mặc định ("… tại Shop hoa tươi Thanh Nhã") hoặc mô tả hỏng
 *   (/hoa-sinh-nhat/ chỉ có "hoa sinh nhật").
 * "{min}" = giá thấp nhất đang bán trong danh mục (vd. 450K), tính lại mỗi lần khởi động để không ghi sai giá.
 * Địa chỉ chỉ ghi khi có cửa hàng thật (site.stores). Chạy lặp lại an toàn.
 */
import type { Connection } from "mysql2/promise";
import { site } from "../site";

const P = site.phoneDisplay;

const AREAS: { path: string; title: string; description: string; minFrom?: string }[] = [
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
  {
    path: "/shop-hoa-tuoi-quan-1/",
    title: "Shop Hoa Tươi Quận 1 – Cửa Hàng Hai Bà Trưng | Hoa Thanh Nhã",
    description: `Cửa hàng hoa tại 130 Hai Bà Trưng, Bến Nghé, Quận 1. Hoa sinh nhật, khai trương, chia buồn giao trong ngày, gửi ảnh trước. Gọi ${P}.`,
  },
  {
    path: "/shop-hoa-tuoi-quan-go-vap/",
    title: "Shop Hoa Tươi Gò Vấp – Cửa Hàng Quang Trung | Hoa Thanh Nhã",
    description: `Cửa hàng hoa tại 229 Quang Trung, Phường 10, Gò Vấp. Hoa sinh nhật, khai trương, chia buồn giao trong ngày, gửi ảnh trước. Gọi ${P}.`,
  },
  // Tuần 1 (26/10/2026): danh mục mức A/B
  {
    path: "/shop-hoa-tuoi-gan-day/",
    title: "Tiệm Hoa Gần Đây – 13 Cửa Hàng, Giao Trong Ngày | Hoa Thanh Nhã",
    description: `Tìm tiệm hoa, shop hoa tươi gần đây: 13 cửa hàng Hoa Thanh Nhã ở TP.HCM, Hà Nội, Đà Nẵng, Huế, Nha Trang, Vũng Tàu, Biên Hòa, Cần Thơ. Đặt online, giao trong ngày.`,
  },
  {
    path: "/shop-hoa-tuoi-thanh-pho-ho-chi-minh/",
    title: "Shop Hoa Tươi TPHCM – 4 Cửa Hàng, Giao Nhanh | Hoa Thanh Nhã",
    description: `Shop hoa tươi TP.HCM với 4 cửa hàng: Quận 1, Gò Vấp, Quận 12, Thủ Đức. Hoa sinh nhật, khai trương, chia buồn giao trong ngày, gửi ảnh trước. Gọi ${P}.`,
  },
  {
    path: "/shop-hoa-tuoi-quan-10/",
    title: "Shop Hoa Tươi Quận 10 – Giao Nhanh, Gửi Ảnh Trước | Hoa Thanh Nhã",
    description: `Đặt hoa tươi Quận 10: hoa sinh nhật, khai trương, chia buồn, giao trong ngày từ cửa hàng Quận 1, gửi ảnh thật trước khi giao. Gọi ${P}.`,
  },
  {
    path: "/shop-hoa-tuoi-quan-11/",
    title: "Shop Hoa Tươi Quận 11 – Giao Nhanh, Gửi Ảnh Trước | Hoa Thanh Nhã",
    description: `Đặt hoa tươi Quận 11: hoa sinh nhật, khai trương, chia buồn, giao trong ngày, gửi ảnh thật trước khi giao, tặng thiệp miễn phí. Gọi ${P}.`,
  },
  {
    path: "/hoa-khai-truong/",
    minFrom: "gio-hoa-khai-truong",
    title: "Hoa Khai Trương: Kệ, Giỏ, Lan Hồ Điệp Từ {min} | Hoa Thanh Nhã",
    description: `Đặt hoa khai trương: kệ hoa, giỏ hoa từ {min}, lan hồ điệp. In băng rôn miễn phí, gửi ảnh trước, giao đúng giờ làm lễ. Gọi ${P}.`,
  },
  {
    path: "/hoa-chia-buon/",
    title: "Hoa Chia Buồn, Hoa Tang Lễ – Đặt Hoa Viếng Giao Gấp | Hoa Thanh Nhã",
    description: `Đặt hoa chia buồn, vòng hoa, kệ hoa tang lễ trang nghiêm; ghi băng tang miễn phí, giao gấp tới nhà tang lễ, gửi ảnh trước khi giao. Gọi ${P}.`,
  },
  {
    path: "/lang-hoa-chia-buon/",
    title: "Lẵng Hoa Chia Buồn, Lẵng Hoa Tang Lễ | Hoa Thanh Nhã",
    description: `Lẵng hoa chia buồn, lẵng hoa đám tang trang nghiêm, ghi băng tang miễn phí, giao tận nơi tổ chức tang lễ, gửi ảnh trước khi giao. Gọi ${P}.`,
  },
  {
    path: "/lang-hoa-khai-truong/",
    minFrom: "lang-hoa-khai-truong",
    title: "Lẵng Hoa Khai Trương Đẹp, Giá Từ {min} | Hoa Thanh Nhã",
    description: `Lẵng hoa, kệ hoa khai trương từ {min}: hoa tươi màu may mắn, in băng rôn miễn phí, giao và dựng tận nơi trước giờ khai trương. Gọi ${P}.`,
  },
  {
    path: "/hoa-sinh-nhat/",
    minFrom: "hoa-bo",
    title: "Hoa Sinh Nhật Đẹp – Bó Hoa, Giỏ Hoa Từ {min} | Hoa Thanh Nhã",
    description: `Đặt hoa sinh nhật: bó hoa, giỏ hoa tặng mẹ, người yêu, bạn bè, sếp, giá từ {min}. Tặng thiệp ghi tay, gửi ảnh trước, giao trong ngày. Gọi ${P}.`,
  },
  {
    path: "/bo-hoa-tuoi/",
    minFrom: "hoa-bo",
    title: "Bó Hoa Tươi Đẹp – Hoa Hồng, Hướng Dương Từ {min} | Hoa Thanh Nhã",
    description: `Bó hoa tươi đẹp từ {min}: hoa hồng, hướng dương, baby, cúc mẫu đơn, gói giấy cao cấp. Tặng thiệp ghi tay, giao trong ngày. Gọi ${P}.`,
  },
  {
    path: "/gio-hoa-tuoi/",
    minFrom: "hoa-gio",
    title: "Giỏ Hoa Tươi Đẹp – Sinh Nhật, Chúc Mừng Từ {min} | Hoa Thanh Nhã",
    description: `Giỏ hoa tươi từ {min} tặng sinh nhật, chúc mừng, khai trương, thăm hỏi; đặt bàn đẹp, giữ hoa lâu. Gửi ảnh trước, giao trong ngày. Gọi ${P}.`,
  },
  {
    path: "/hoa-mung-tot-nghiep/",
    minFrom: "hoa-mung-tot-nghiep",
    title: "Hoa Tốt Nghiệp Đẹp, Giá Từ {min} | Hoa Thanh Nhã",
    description: `Hoa mừng tốt nghiệp từ {min}: bó hướng dương, hoa hồng, baby rực rỡ; giao tận trường đúng giờ lễ, tặng thiệp ghi tay. Gọi ${P}.`,
  },
  {
    path: "/hoa-cuoi-cam-tay/",
    minFrom: "hoa-cuoi-cam-tay",
    title: "Hoa Cưới Cầm Tay Cô Dâu Đẹp, Giá Từ {min} | Hoa Thanh Nhã",
    description: `Hoa cưới cầm tay cô dâu từ {min}: hoa hồng, baby, cẩm tú cầu, thiết kế theo váy cưới và tông màu tiệc, giao tận nơi đúng giờ rước dâu. Gọi ${P}.`,
  },
  {
    path: "/hoa-cuoi/",
    title: "Hoa Cưới: Hoa Cầm Tay Cô Dâu, Trang Trí Tiệc | Hoa Thanh Nhã",
    description: `Hoa cưới trọn gói: hoa cầm tay cô dâu, hoa bàn gia tiên, bàn gallery, cổng hoa, xe hoa. Tư vấn theo tông màu tiệc cưới. Gọi ${P}.`,
  },
  {
    path: "/hoa-chuc-mung/",
    title: "Hoa Chúc Mừng – Thăng Chức, Sự Kiện, Kỷ Niệm | Hoa Thanh Nhã",
    description: `Hoa chúc mừng thăng chức, sinh nhật, kỷ niệm, sự kiện, tân gia, mừng thọ: bó hoa, giỏ hoa đẹp, tặng thiệp, giao trong ngày. Gọi ${P}.`,
  },
  {
    path: "/hoa-tang-me/",
    title: "Hoa Tặng Mẹ Ý Nghĩa – Giỏ Hoa, Lan Hồ Điệp | Hoa Thanh Nhã",
    description: `Hoa tặng mẹ dịp sinh nhật, 20/10, 8/3, Ngày của Mẹ: giỏ hoa, cẩm chướng, lan hồ điệp bền lâu. Con ở xa đặt online, giao tận nhà, gửi ảnh trước.`,
  },
  {
    path: "/ngay-nha-giao/",
    minFrom: "ngay-nha-giao",
    title: "Hoa 20/11 Tặng Thầy Cô – Bó Hoa Từ {min} | Hoa Thanh Nhã",
    description: `Hoa 20/11 tặng thầy cô từ {min}: bó hồng, cát tường, hướng dương ý nghĩa tri ân. Ghi thiệp miễn phí, giao tận trường trước giờ lễ. Gọi ${P}.`,
  },
  {
    path: "/hoa-tang-nguoi-yeu/",
    title: "Hoa Tặng Người Yêu – Bó Hồng Lãng Mạn | Hoa Thanh Nhã",
    description: `Hoa tặng người yêu: bó hồng đỏ, hồng phấn, hoa tình yêu cho sinh nhật, kỷ niệm, Valentine. Ghi thiệp theo lời bạn, giao bất ngờ đúng giờ.`,
  },
  {
    path: "/hoa-tang-vo/",
    title: "Hoa Tặng Vợ – Bó Hồng, Giỏ Hoa Ý Nghĩa | Hoa Thanh Nhã",
    description: `Hoa tặng vợ dịp sinh nhật, kỷ niệm ngày cưới, 20/10, 8/3: bó hồng, giỏ hoa tươi, thiệp ghi tay miễn phí, giao tận nhà đúng giờ. Gọi ${P}.`,
  },
  {
    path: "/hoa-tang-chong/",
    title: "Hoa Tặng Chồng – Hướng Dương, Lan Hồ Điệp | Hoa Thanh Nhã",
    description: `Hoa tặng chồng dịp sinh nhật, kỷ niệm, thăng chức: hướng dương, lan hồ điệp, tông màu mạnh mẽ, giao tận nhà hoặc văn phòng. Gọi ${P}.`,
  },
  {
    path: "/hoa-tang-sep/",
    title: "Hoa Tặng Sếp Sang Trọng – Giỏ Hoa, Lan Hồ Điệp | Hoa Thanh Nhã",
    description: `Hoa tặng sếp dịp sinh nhật, thăng chức, khai trương: giỏ hoa, lan hồ điệp sang trọng, ghi thiệp, giao tận văn phòng đúng giờ. Gọi ${P}.`,
  },
  {
    path: "/hoa-cam-on/",
    title: "Hoa Cảm Ơn – Bó Hoa, Giỏ Hoa Tri Ân | Hoa Thanh Nhã",
    description: `Hoa cảm ơn gửi thầy cô, bác sĩ, đồng nghiệp, khách hàng: bó hoa, giỏ hoa nhẹ nhàng, thiệp ghi lời tri ân, giao trong ngày. Gọi ${P}.`,
  },
];

const k = (n: number) => `${Math.round(n / 1000)}K`;

export async function syncAreaMeta(db: Connection): Promise<string[]> {
  const skipped: string[] = [];
  for (const a of AREAS) {
    let title = a.title;
    let description = a.description;
    if (a.minFrom) {
      const [[row]] = (await db.query(
        `select min(case when p.sale_price > 0 and p.sale_price < p.price then p.sale_price else p.price end) as m
         from products p join product_categories pc on pc.product_id = p.id join categories c on c.id = pc.category_id
         where c.slug = ? and p.is_active = 1 and p.price > 0`,
        [a.minFrom],
      )) as [{ m: number | null }[], unknown];
      if (!row?.m) {
        // Không có giá thì bỏ cụm "Từ {min}" thay vì ghi sai
        title = title.replace(/,? ?(Giá )?[Tt]ừ \{min\}/, "");
        description = description.replace(/,? ?(giá )?từ \{min\}/, "");
        skipped.push(a.path);
      } else {
        title = title.replaceAll("{min}", k(row.m));
        description = description.replaceAll("{min}", `${Number(row.m).toLocaleString("vi-VN")}đ`);
      }
    }
    await db.query(
      `insert into seo_meta (path, title, description) values (?, ?, ?)
       on duplicate key update title = values(title), description = values(description)`,
      [a.path, title, description],
    );
  }
  return [`✓ Tiêu đề/mô tả tìm kiếm: ${AREAS.length} trang${skipped.length ? ` (không có giá: ${skipped.join(", ")})` : ""}`];
}
