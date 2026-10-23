/**
 * Dịp tặng hoa sắp tới, hiện trên trang chủ để đẩy trang danh mục theo mùa (liên kết nội bộ từ trang mạnh nhất)
 * đúng lúc người dùng bắt đầu tìm. Khoảng ngày theo lịch dương (giờ Việt Nam); ngoài các khoảng thì không hiện.
 */
type Occasion = { from: [number, number]; to: [number, number]; label: string; text: string; href: string };

const OCCASIONS: Occasion[] = [
  { from: [10, 1], to: [10, 20], label: "20/10 – Ngày Phụ nữ Việt Nam", text: "Bó hoa, giỏ hoa tông hồng tặng mẹ, vợ, người yêu", href: "/ngay-phu-nu-viet-nam-20-10/" },
  { from: [10, 21], to: [11, 20], label: "20/11 – Ngày Nhà giáo Việt Nam", text: "Hoa tặng thầy cô, ghi thiệp miễn phí, giao tận trường", href: "/ngay-nha-giao/" },
  { from: [11, 21], to: [12, 25], label: "Giáng sinh", text: "Hoa tông đỏ cho mùa Noel, giao đúng tối 24/12", href: "/giang-sinh/" },
  { from: [12, 26], to: [1, 31], label: "Hoa Tết", text: "Lan hồ điệp và giỏ hoa biếu Tết, đặt sớm giữ giá", href: "/hoa-tet/" },
  { from: [2, 1], to: [2, 14], label: "Valentine 14/2", text: "Bó hồng, hoa tình yêu giao bất ngờ đúng ngày", href: "/hoa-tinh-yeu/" },
  { from: [2, 15], to: [3, 8], label: "8/3 – Quốc tế Phụ nữ", text: "Hoa tông hồng tặng mẹ, vợ, đồng nghiệp nữ", href: "/ngay-quoc-te-phu-nu/" },
  { from: [4, 25], to: [5, 15], label: "Ngày của Mẹ", text: "Giỏ hoa, cẩm chướng, lan hồ điệp tặng mẹ", href: "/hoa-tang-me/" },
  { from: [5, 16], to: [7, 15], label: "Mùa tốt nghiệp", text: "Bó hoa tốt nghiệp giao tận trường đúng giờ lễ", href: "/hoa-mung-tot-nghiep/" },
];

const key = (m: number, d: number) => m * 100 + d;

export function upcomingOccasion(now = new Date()) {
  const vn = new Date(now.getTime() + 7 * 3600_000);
  const today = key(vn.getUTCMonth() + 1, vn.getUTCDate());
  return (
    OCCASIONS.find((o) => {
      const a = key(...o.from);
      const b = key(...o.to);
      return a <= b ? today >= a && today <= b : today >= a || today <= b; // khoảng vắt qua năm mới
    }) ?? null
  );
}
