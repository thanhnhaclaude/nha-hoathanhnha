# Sổ luồng Giao diện & cửa hàng

## Trạng thái hiện tại
- Trang chủ mới (bản A), header và footer mới (9b507a1).
- Nút gọi/Zalo/Messenger bo tròn trong mô tả sản phẩm (9bf7b16).
- Trang danh mục, sản phẩm, bài viết, khu vực cache CDN 5 phút; trang chủ ISR 5 phút.

## Quyết định đã chốt
- Font, cỡ chữ theo flowervsflorist.com (178abec).

## Việc cần làm tiếp
- [từ noi-dung] Thêm 7 cửa hàng shop đã xác nhận (3/11/2026) vào `site.stores` và `storeAreas` trong `src/lib/site.ts`, đổi "13 cửa hàng" trong `home-view.tsx` thành 20: Đồng Nai: 150 Nguyễn Tất Thành (chỉ thêm `site.stores`, trang `shop-hoa-tuoi-dong-nai` đang gắn Biên Hòa); 457 Đ. Nguyễn Kiệm, Phú Nhuận (`shop-hoa-tuoi-quan-phu-nhuan`); 71 Đ. Trần Đại Nghĩa, Bình Chánh (`shop-hoa-tuoi-huyen-binh-chanh`); Nhơn Trạch: 511 Đ. Hùng Vương (`shop-hoa-tuoi-nhon-trach`); Thống Nhất: 193 QL20 (`shop-hoa-tuoi-thong-nhat`); Xuân Lộc: 3741 QL1A (`shop-hoa-tuoi-xuan-loc`); Định Quán: 30 QL20 (`shop-hoa-tuoi-dinh-quan`). Cần Giờ chờ số nhà.

## Nhật ký
- 2026-10-30 — Tạo sổ luồng từ CLAUDE.md và lịch sử commit — (commit này)
