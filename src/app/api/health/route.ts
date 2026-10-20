import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { db, pages, products, seoMeta } from "@/lib/db";
import { dbConnection } from "@/lib/db/config";
import { lastMaintenance } from "@/lib/maintenance/run";

export const dynamic = "force-dynamic";

/**
 * Kiểm tra nhanh tình trạng website trên máy chủ: kết nối CSDL, số dữ liệu, biến môi trường.
 * Chỉ trả về mã lỗi và đúng/sai — KHÔNG trả về mật khẩu, khóa hay giá trị biến môi trường.
 */
export async function GET() {
  const env = Object.fromEntries(
    [
      "DATABASE_URL",
      "DB_HOST",
      "DB_PORT",
      "DB_USER",
      "DB_PASSWORD",
      "DB_NAME",
      "NEXT_PUBLIC_SITE_URL",
      "ADMIN_USERNAME",
      "ADMIN_PASSWORD_HASH",
      "AUTH_SECRET",
      "VIETQR_BANK_ID",
      "VIETQR_ACCOUNT_NO",
      "VIETQR_ACCOUNT_NAME",
      "UPLOAD_DIR",
      "SEPAY_API_KEY",
      "SMTP_HOST",
      "SMTP_USER",
      "SMTP_PASS",
      "SHOP_EMAIL",
    ].map((k) => [k, Boolean(process.env[k]?.trim())]),
  );

  // Cách khai báo CSDL đang dùng + host (không trả về user/mật khẩu)
  let dbConfig: Record<string, unknown>;
  try {
    const c = dbConnection();
    if (c.mode === "parts") {
      dbConfig = { mode: "DB_HOST/DB_USER/DB_PASSWORD/DB_NAME", valid: true, host: `${c.host}:${c.port}`, hasPassword: Boolean(c.password) };
    } else {
      try {
        const u = new URL(c.uri);
        const ok = u.protocol === "mysql:" && Boolean(u.username) && u.pathname.length > 1 && !/[<>]/.test(decodeURIComponent(u.href));
        dbConfig = { mode: "DATABASE_URL", valid: ok, host: `${u.hostname}:${u.port || "3306"}` };
      } catch {
        dbConfig = { mode: "DATABASE_URL", valid: false, host: null, hint: "Chuỗi không hợp lệ: thiếu mysql://, có dấu cách, hoặc mật khẩu có ký tự đặc biệt. Hãy dùng DB_HOST/DB_USER/DB_PASSWORD/DB_NAME." };
      }
    }
  } catch (e) {
    dbConfig = { mode: null, valid: false, error: (e as Error).message };
  }

  let database: Record<string, unknown>;
  try {
    const [[p], [g], [s]] = await Promise.all([
      db.select({ n: count() }).from(products),
      db.select({ n: count() }).from(pages),
      db.select({ n: count() }).from(seoMeta),
    ]);
    database = { status: "ok", products: p.n, pagesAndPosts: g.n, seoRows: s.n };
  } catch (e) {
    const err = e as { code?: string; errno?: number; cause?: { code?: string; errno?: number } };
    database = { status: "error", code: err.cause?.code ?? err.code ?? "UNKNOWN", errno: err.cause?.errno ?? err.errno ?? null };
  }

  return NextResponse.json(
    { node: process.version, env, dbConfig, database, maintenance: lastMaintenance() },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}
