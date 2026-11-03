# Sổ luồng Nội dung

## Trạng thái hiện tại
- Đã hẹn giờ 43 bài tới 29/3/2027 (quý I/2027 xong, bản 23d07c6).
- Mọi trang khu vực có nội dung riêng; 147/172 trang khu vực đã index.
- 4 bài PR nháp ở `content/pr/`, không đồng bộ lên web.
- Thêm 11 bài chi nhánh/khu vực hẹn giờ 3/11–8/12/2026: 4 bài cửa hàng (Thủ Đức, Gò Vấp, Quận 12, Đà Nẵng) và 7 bài giao hoa (Phú Nhuận, Bình Chánh, Cần Giờ, Nhơn Trạch, Thống Nhất, Xuân Lộc, Định Quán).

## Quyết định đã chốt
- Bài giá hoa linh lan hoãn tới khi shop xác nhận có hàng.
- Trang khu vực phải có dữ liệu riêng, không nhân bản theo mẫu.
- Mọi bài chi nhánh chỉ dùng một số 0396.72.73.74.
- Địa chỉ chưa có trong `site.stores` thì viết dạng giao hoa: không ghi địa chỉ, không mời ghé, không khai báo Florist.

## Việc cần làm tiếp
- Kiểm tra `npm run content:check` trước mỗi lần push bài. Dump `deploy/database.sql` cũ hơn site thật nên báo lỗi giả với `/gio-hoa-tuoi/`, `/bo-hoa-tuoi/`, `/shop-hoa-tuoi-dong-nai/`: đối chiếu trên site thật.
- Chờ shop xác nhận 7 khu vực giao hoa có mặt bằng thật không, nếu có thì đổi bài sang dạng cửa hàng.
- Chờ shop cho biết "TP DN" (150 Nguyễn Tất Thành) thuộc Đà Nẵng hay Đồng Nai; chưa viết bài này.
- Đổi "Thị Mười" thành "Dương Thị Mười" trong `city-pages.ts`, `area-meta.ts` sau khi shop xác nhận tên đường.

## Nhật ký
- 2026-11-03 — Thêm 11 bài chi nhánh và khu vực, dùng chung một số điện thoại — (commit này)
- 2026-10-30 — Tạo sổ luồng từ CLAUDE.md và lịch sử commit — (commit này)
