@AGENTS.md

# hoathanhnha.com

Shop hoa tươi tiếng Việt. Next.js 16 + MySQL (Drizzle), deploy Hostinger Node.js Web App, tự deploy khi `main` có commit mới.

Build: `npm run build` · Nhánh làm việc: `main` · Trả lời chủ shop bằng tiếng Việt.

## Luật cốt lõi
- Không bao giờ force-push lên `main`.
- Trang khu vực phải có dữ liệu riêng (tránh doorway). Nội dung không chép, không viết na ná shophoathanhnha.com; hai site không trỏ link qua lại để đẩy hạng.
- Workflow `security-autofix.yml` tự commit vào `main` lúc 08:00 VN: luôn `git pull` trước khi làm và trước khi push.
- Không chạy `npm audit fix --omit=dev` trên máy (gỡ mất devDependencies).
- DB máy là mysql-memory-server: khởi động lại là mất dữ liệu, nạp lại từ `deploy/database.sql`.
- Kế hoạch SEO 12 tuần: Claude Doc https://claude.ai/code/artifact/bdbf17b6-0981-470d-bc8f-31992afa4ddb

## Luồng làm việc
Mỗi việc một session ngắn, mở bằng lệnh luồng: `/noi-dung`, `/giao-dien`, `/seo`. Bảng phạm vi: `docs/luong/README.md`.
- Chỉ sửa file thuộc luồng mình. Việc của luồng khác: ghi sang sổ luồng đó với tiền tố `[từ <luồng>]`.
- Quên mở bằng lệnh luồng: hỏi chủ shop việc này thuộc luồng nào. Việc vặt 1 dòng thì làm thẳng, không cần đọc sổ.
- Sổ `docs/luong/<luồng>.md` có đúng 4 mục, giữ dưới 120 dòng. Quyết định đã chốt không được làm ngược khi chủ shop chưa đồng ý.

## Ship
- Xong mỗi việc: `npm run build` không lỗi, rồi trong CÙNG commit ghi sổ luồng: thêm 1 dòng Nhật ký (mới nhất ở trên); cập nhật Trạng thái, Quyết định đã chốt, Việc cần làm tiếp; sửa CLAUDE.md nếu thay đổi làm nó sai.
- Nhật ký quá 30 dòng: dời phần cũ sang `docs/luong/luu-tru/<luồng>-YYYY-MM.md`.
- Push lên `main`. Bị từ chối: `git pull --rebase` rồi push lại. Không bao giờ `push --force`.
- Kết thúc bằng đúng 1 dòng: "Đã push + đã ghi sổ <luồng>. Có thể đóng luồng."
- `/xong` chỉ dùng khi việc bị dừng giữa chừng chưa push.
