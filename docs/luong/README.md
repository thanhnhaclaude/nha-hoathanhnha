# Luồng làm việc – hoathanhnha.com

| Luồng | Lệnh mở | Phụ trách | Liên quan |
|---|---|---|---|
| Nội dung | `/noi-dung` | `content/` (bai-viet, pr, tu-khoa.txt), `src/lib/maintenance/` (nội dung trang khu vực, danh mục), `src/lib/internal-links.ts`, `scripts/sync-content.ts` | `seo`, `giao-dien` |
| Giao diện & cửa hàng | `/giao-dien` | `src/app/`, `src/components/`, `src/lib/` (trừ file của luồng Nội dung, SEO), `next.config.ts`, thanh toán SePay, `/admin` | `noi-dung`, `seo` |
| SEO & số liệu | `/seo` | Phân tích Search Console, GA4, từ khóa; đọc vị trí theo TỪNG trang. Chỉ đề xuất, việc sửa ghi sang sổ luồng phụ trách. File: `scripts/seo-*.ts`, `gsc-report.ts`, `ga4-report.ts`, `pagespeed-report.ts`, `indexnow.ts`, `reports/`, `src/lib/legacy-redirects.ts` | `noi-dung`, `giao-dien` |

Luồng không tự nhớ nhau; chúng nối với nhau qua sổ `docs/luong/<luồng>.md`. Nếu sổ và CLAUDE.md mâu thuẫn, CLAUDE.md là đúng.
