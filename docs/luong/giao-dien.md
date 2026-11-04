# Sổ luồng Giao diện & cửa hàng

## Trạng thái hiện tại
- Trang chủ mới (bản A), header và footer mới (9b507a1).
- Nút gọi/Zalo/Messenger bo tròn trong mô tả sản phẩm (9bf7b16).
- Trang danh mục, sản phẩm, bài viết, khu vực cache CDN 5 phút; trang chủ ISR 5 phút.

## Quyết định đã chốt
- Font, cỡ chữ theo flowervsflorist.com (178abec).

## Việc cần làm tiếp
- `npm run lint` còn 2 lỗi `react-hooks/purity` có từ trước (`post-form.tsx` và 1 chỗ khác), không chặn build.
- Khi shop gửi số nhà Cần Giờ: thêm vào `site.stores`, `storeAreas` và đổi "20 cửa hàng" trong `home-view.tsx` thành 21.

## Nhật ký
- 2026-11-04 — Gộp Khu vực vào bộ lọc Địa Điểm (admin), xóa 2 danh mục trống tp-ho-chi-minh, da-nang và chuyển hướng 301 — (commit này)
- 2026-11-04 — Thêm nút Khu vực vào Bài viết & trang (admin), quy tắc chủ shop xem localhost trước khi push — (commit này)
- 2026-11-04 — Trang khu vực hiện ở tab Danh mục bài viết (admin) và trên /dia-diem/, vẫn là danh mục sản phẩm để giữ URL và lưới sản phẩm — (commit này)
- 2026-11-04 — `security-autofix.yml` quét cả gói dev, thêm `.github/dependabot.yml` (hàng tuần, chờ 7 ngày, không tự gộp) — (commit này)
- 2026-11-04 — Vá CVE-2026-118764: nâng eslint 10, ép minimatch ^11.0.4 (chỉ đồ nghề dev, web không dùng) — (commit này)
- 2026-11-03 — Thêm 7 cửa hàng vào `site.ts`, trang chủ ghi 20 cửa hàng, chủ shop cho làm trong phiên Nội dung — (commit này)
- 2026-10-30 — Tạo sổ luồng từ CLAUDE.md và lịch sử commit — (commit này)
