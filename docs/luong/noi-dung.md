# Sổ luồng Nội dung

## Trạng thái hiện tại
- Đã hẹn giờ 43 bài tới 29/3/2027 (quý I/2027 xong, bản 23d07c6).
- Mọi trang khu vực có nội dung riêng; 147/172 trang khu vực đã index.
- 4 bài PR nháp ở `content/pr/`, không đồng bộ lên web.
- Thêm 12 bài cửa hàng hẹn giờ 3/11–12/12/2026: Thủ Đức, Gò Vấp, Quận 12, Đà Nẵng, Phú Nhuận, Bình Chánh, Cần Giờ, Nhơn Trạch, Thống Nhất, Xuân Lộc, Định Quán, Đồng Nai. 7 bài sau giữ slug `giao-hoa-*` vì đổi slug sẽ để lại bản cũ trong database tự đăng đúng hẹn.

## Quyết định đã chốt
- Bài giá hoa linh lan hoãn tới khi shop xác nhận có hàng.
- Trang khu vực phải có dữ liệu riêng, không nhân bản theo mẫu.
- Mọi bài chi nhánh chỉ dùng một số 0396.72.73.74.
- Shop xác nhận 3/11/2026: Phú Nhuận, Bình Chánh, Cần Giờ, Nhơn Trạch, Thống Nhất, Xuân Lộc, Định Quán có mặt bằng thật. Địa chỉ khác chưa được shop xác nhận thì viết dạng giao hoa: không ghi địa chỉ, không mời ghé, không khai báo Florist.

- Shop xác nhận 5/11/2026: địa chỉ của các dòng "Cần viết" ở tab Địa điểm (Sheet Lộ trình SEO) đều là mặt bằng thật, được viết dạng cửa hàng có địa chỉ. Hải Châu và Tân Phú (Đồng Nai) vẫn chờ địa chỉ.
- Lịch viết và đăng nằm ở tab "Lịch đăng bài", "Lịch theo tuần" của Sheet. Bài mới dùng slug và từ khóa theo tab Địa điểm: `shop-hoa-thanh-nha-chi-nhanh-*`.

## Việc cần làm tiếp
- Kiểm tra `npm run content:check` trước mỗi lần push bài. Dump `deploy/database.sql` cũ hơn site thật nên báo lỗi giả với `/gio-hoa-tuoi/`, `/bo-hoa-tuoi/`, `/shop-hoa-tuoi-dong-nai/`: đối chiếu trên site thật.
- Cập nhật bài PR nháp `content/pr/01-mang-luoi-13-cua-hang.md` (vẫn ghi 13 cửa hàng) trước khi gửi báo.
- Chờ shop gửi số nhà Cần Giờ để thêm vào bài, rồi đổi 20 thành 21 và 6 thành 7 trong `area-meta.ts`.
- Đổi "Thị Mười" thành "Dương Thị Mười" trong `city-pages.ts`, `area-meta.ts` sau khi shop xác nhận tên đường.

## Nhật ký
- 2026-11-05 — Thêm 3 bài cửa hàng hẹn giờ: Quận 2 (11/11), Tân Phú (13/11), Quận 9 (15/11) — (commit này)
- 2026-11-04 — Đổi tên Map và địa chỉ shop theo sheet Địa điểm trên site, 12 bài, ghi chú khu vực, trang hệ thống — (commit này)
- 2026-11-04 — Trang hệ thống đổi tiêu đề thành "Hệ thống shop hoa tươi", thêm ảnh đại diện — (commit này)
- 2026-11-04 — Mọi trang khu vực thành mục trong danh mục Địa Điểm (`syncAreaPostEntries`), URL vẫn hiển thị trang khu vực; loại khỏi bài liên quan và post-sitemap — (commit này)
- 2026-11-04 — Thêm địa chỉ shop từ danh sách hệ thống vào trang khu vực (`shop-addresses.ts`, `shop-address-block.ts`), chưa khai báo Florist cho các địa chỉ này — (commit này)
- 2026-11-04 — Đổi tiêu đề trang hệ thống thành "Hệ thống shop của chúng tôi", URL giữ nguyên — (commit này)
- 2026-11-04 — Gom 12 bài cửa hàng và 11 bài địa điểm cũ vào danh mục Địa Điểm — (commit này)
- 2026-11-04 — Chuyển bài blog nhập từ website cũ từ Địa Điểm sang Blog (`blog-category.ts`), giữ "Hệ thống cửa hàng" ở Địa Điểm, URL bài không đổi — (commit này)
- 2026-11-03 — Đổi số cửa hàng trong `area-meta.ts`, `near-me-page.ts` sang 20 — (commit này)
- 2026-11-03 — Thêm bài cửa hàng Đồng Nai (150 Nguyễn Tất Thành), hẹn 12/12/2026 — (commit này)
- 2026-11-03 — Đổi 7 bài giao hoa và ghi chú khu vực sang dạng cửa hàng theo xác nhận của shop — (commit này)
- 2026-11-03 — Thêm 11 bài chi nhánh và khu vực, dùng chung một số điện thoại — (commit này)
- 2026-10-30 — Tạo sổ luồng từ CLAUDE.md và lịch sử commit — (commit này)
