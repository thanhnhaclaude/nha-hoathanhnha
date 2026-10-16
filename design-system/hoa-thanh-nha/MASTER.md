# Hoa Thanh Nhã — Design System (MASTER)

Nguồn sự thật cho giao diện. Token được khai báo trong `src/app/globals.css`.

## Định hướng

- **Loại sản phẩm:** e-commerce hoa tươi cao cấp, khách hàng đặt hoa tặng (mobile chiếm đa số).
- **Phong cách:** thanh lịch, ấm áp, nhiều khoảng trắng; ảnh sản phẩm là trung tâm. Không dùng hiệu ứng kính/blur nặng (gợi ý "Liquid Glass" từ công cụ không phù hợp với shop hoa nên đã bỏ).
- **Bố cục:** giữ cấu trúc website cũ (topbar khuyến mãi → header logo/tìm kiếm/hotline/giỏ → menu 8 nhóm → banner → ưu đãi → danh mục → các khối sản phẩm → vì sao chọn chúng tôi → footer cửa hàng).

## Màu sắc

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--brand` | `#e8641b` | Nút chính, điểm nhấn (cam logo) |
| `--brand-strong` | `#b9480b` | Chữ giá, link, hover — đạt 4.5:1 trên nền sáng |
| `--brand-soft` | `#fdeee3` | Nền icon, trạng thái chọn |
| `--leaf` | `#2f5d4e` | Màu phụ: topbar, CTA gọi điện, "Liên hệ" |
| `--background` | `#fbf8f4` | Nền trang (kem ấm) |
| `--surface` / `--surface-muted` | `#ffffff` / `#f4eee6` | Thẻ, khối |
| `--foreground` / `--muted` | `#1f1a17` / `#6b6159` | Chữ chính / phụ |
| `--border` | `#e7ddd2` | Viền |
| `--danger` | `#c0262d` | Lỗi, nhãn giảm giá |

Không dùng mã hex trực tiếp trong component — dùng class Tailwind theo token (`bg-brand`, `text-muted`…).

## Chữ

- **Tiêu đề:** Cormorant Garamond 500–700 (`font-display`, class `heading-display`).
- **Nội dung:** Be Vietnam Pro 400–700 — được chọn thay Montserrat vì hiển thị dấu tiếng Việt tốt hơn.
- Nội dung tối thiểu 16px trên ô nhập (tránh iOS tự zoom), line-height 1.5–1.75.

## Thành phần

- `btn-primary`, `btn-outline`, `btn-leaf`: bo tròn hoàn toàn, cao tối thiểu 44px.
- `field`, `label`: nhãn luôn hiển thị, lỗi hiện ngay dưới ô (`role="alert"`).
- Thẻ sản phẩm: ảnh 4:5, zoom nhẹ khi hover (500ms), giá màu `brand-strong`, giá 0 → "Liên hệ".
- Icon: Lucide (SVG). Không dùng emoji làm icon.

## Chuyển động

- 150–300ms cho hover/màu; 500–700ms cho ảnh/banner.
- Tôn trọng `prefers-reduced-motion` (banner không tự chạy, tắt hiệu ứng ping).

## Checklist trước khi bàn giao

- [x] Tương phản chữ ≥ 4.5:1
- [x] Focus ring hiển thị khi dùng bàn phím
- [x] Vùng bấm ≥ 44×44px
- [x] Responsive 375 / 768 / 1024 / 1440px
- [x] Ảnh có `alt`, nút icon có `aria-label`
