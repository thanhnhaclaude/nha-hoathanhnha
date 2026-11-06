# Sổ luồng SEO & số liệu

## Trạng thái hiện tại
- Số đo nền GSC 23/10/2026: 13 từ khóa top 10 / 155 (`reports/gsc-tu-khoa-2026-10-23.csv`).
- Kiểm tra index theo nhóm: `npm run seo:gsc -- --index-prefix=shop-hoa-tuoi-`.

## Quyết định đã chốt
- Đọc vị trí theo từng trang, không nhìn vị trí trung bình toàn site.

## Việc cần làm tiếp
- [Shop] Yêu cầu lập chỉ mục 25 URL khu vực còn chờ (mục 8 tab kế hoạch).
- Ngày 17/1/2027: đo lại GSC, so với `reports/gsc-tu-khoa-2026-10-23.csv`.
- (đề xuất 30/10) Thêm workflow `site-health.yml` kiểm tra web 2 giờ/lần.

## Nhật ký
- 2026-11-06 — `npm run seo:watch` (scripts/site-watch.ts): báo bài lên web, index Google, web/CSDL lỗi, SSL, lỗ hổng npm; tác vụ hẹn giờ "hoathanhnha-theo-doi-web" trong app Claude chạy mỗi giờ và đẩy thông báo. Tách đăng nhập Google sang scripts/gsc-auth.ts — (commit này)
- 2026-11-06 — `reports/don-vi-hanh-chinh-va-nhu-cau-2026-11-06.xlsx` (chỉ ở máy, reports/ bị gitignore): 3.321 xã/phường (34 tỉnh) và nhu cầu theo khu vực từ tab 4-K-ADS. Tên xã/phường mới gần như không có lượt tìm (cao nhất 17), nhu cầu vẫn theo tên cũ — (commit này)
- 2026-11-06 — Florist schema cho mọi cửa hàng shop đã xác nhận; bài cửa hàng chỉ hiện ở đúng trang khu vực nó trỏ tới. Mốc đo: GSC 4/11 (`reports/gsc-tu-khoa-2026-11-04.csv`), đo lại sau 3–4 tuần — (commit này)
- 2026-11-04 — Sửa nhóm nhanh sau audit: bổ sung sitemap, mô tả 12 trang, 9 tiêu đề dài, ẩn 15 danh mục trống khỏi menu — (commit này)
- 2026-11-04 — Chuyển hướng 301 ảnh /wp-content/uploads/ về /uploads/ (401 URL từng có hiển thị đang 404) — (commit này)
- 2026-11-04 — Sitemap lastmod theo lúc bài lên web; GitHub Actions gửi IndexNow URL mới 08:30 mỗi ngày — (commit này)
- 2026-10-30 — Tạo sổ luồng từ CLAUDE.md và lịch sử commit — (commit này)
