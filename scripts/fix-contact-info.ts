/**
 * Chuẩn hóa thông tin liên hệ trong nội dung nhập từ WordPress:
 *  1. Thay thông tin công ty (CÔNG TY TNHH CÔNG NGHỆ VÀ TRUYỀN THÔNG HẠNH PHÚC, mã số thuế…) bằng
 *     Shop Hoa Thanh Nhã: trang /gioi-thieu/ và /huong-dan-thanh-toan/.
 *  2. Số Zalo cũ 0848.35.39.39 -> hotline 0396.72.73.74; mọi link gọi của shop -> tel:0396727374
 *     (link cũ "tel:+840396727374" thừa số 0 sau +84, nhiều điện thoại gọi không được).
 *     Số điện thoại của shop khác trong các bài liệt kê shop hoa được giữ nguyên.
 *
 *   npm run content:fix-contact     # chạy với DATABASE_URL hoặc DB_HOST/DB_USER/... (máy hoặc Hostinger)
 *
 * Chạy nhiều lần vẫn an toàn: lần sau không còn gì để thay.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { fixContactInfo } from "../src/lib/maintenance/contact-fix";

async function connect() {
  // Trên Hostinger database nằm cùng máy chủ: thiếu DB_HOST thì mặc định localhost
  const host = process.env.DB_HOST || (process.env.DB_USER && process.env.DB_NAME ? "localhost" : "");
  if (host && process.env.DB_USER) {
    return mysql.createConnection({
      host,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  }
  if (!process.env.DATABASE_URL) throw new Error("Thiếu DATABASE_URL hoặc DB_HOST/DB_USER/DB_PASSWORD/DB_NAME");
  return mysql.createConnection({ uri: process.env.DATABASE_URL });
}

async function main() {
  const db = await connect();
  for (const line of await fixContactInfo(db)) console.log(line);
  await db.end();
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
