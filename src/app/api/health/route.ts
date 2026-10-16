import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { db, pages, products, seoMeta } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Kiểm tra nhanh tình trạng website trên máy chủ: kết nối CSDL, số dữ liệu, biến môi trường.
 * Chỉ trả về mã lỗi và đúng/sai — KHÔNG trả về mật khẩu, khóa hay giá trị biến môi trường.
 */
export async function GET() {
  const env = Object.fromEntries(
    [
      "DATABASE_URL",
      "NEXT_PUBLIC_SITE_URL",
      "ADMIN_USERNAME",
      "ADMIN_PASSWORD_HASH",
      "AUTH_SECRET",
      "VIETQR_BANK_ID",
      "VIETQR_ACCOUNT_NO",
      "VIETQR_ACCOUNT_NAME",
      "UPLOAD_DIR",
    ].map((k) => [k, Boolean(process.env[k]?.trim())]),
  );

  let dbHost: string | null = null;
  let urlValid = false;
  try {
    const u = new URL(process.env.DATABASE_URL ?? "");
    urlValid = u.protocol === "mysql:" && Boolean(u.username) && u.pathname.length > 1 && !/[<>]/.test(decodeURIComponent(u.href));
    dbHost = `${u.hostname}:${u.port || "3306"}`;
  } catch {}

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
    { node: process.version, env, databaseUrl: { valid: urlValid, host: dbHost }, database },
    { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
  );
}
