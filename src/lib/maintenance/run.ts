/**
 * Việc bảo trì dữ liệu chạy một lần mỗi khi máy chủ website khởi động (gọi từ src/instrumentation.ts):
 * đồng bộ bài viết từ content/bai-viet, chuẩn hóa thông tin liên hệ, sửa tiêu đề SEO sai mã sản phẩm, ẩn/hiện sản phẩm, tạo trang khai trương theo giá và trang thành phố. Không phụ thuộc lệnh khởi động
 * hay công cụ phụ trên hosting. Kết quả lần chạy gần nhất hiện ở /api/health/ (mục "maintenance").
 */
import mysql from "mysql2/promise";
import { dbConnection } from "../db/config";
import { fixContactInfo } from "./contact-fix";
import { syncArticles } from "./content-sync";
import { fixSeoTitleCodes } from "./seo-title-fix";
import { applyProductVisibility } from "./product-visibility";
import { syncPricePages } from "./price-pages";
import { syncCityPages } from "./city-pages";
import { syncAreaMeta } from "./area-meta";

export type MaintenanceResult = { at: string; ok: boolean; log: string[]; error?: string };

const store = globalThis as unknown as { __htnMaintenance?: MaintenanceResult };

export function lastMaintenance() {
  return store.__htnMaintenance ?? null;
}

export async function runMaintenance() {
  const result: MaintenanceResult = { at: new Date().toISOString(), ok: false, log: [] };
  store.__htnMaintenance = { ...result, log: ["đang chạy…"] };
  let db: mysql.Connection | undefined;
  try {
    const c = dbConnection();
    db =
      c.mode === "parts"
        ? await mysql.createConnection({ host: c.host, port: c.port, user: c.user, password: c.password, database: c.database, timezone: "+07:00" })
        : await mysql.createConnection({ uri: c.uri, timezone: "+07:00" });
    result.log.push(...(await syncArticles(db)));
    result.log.push(...(await fixContactInfo(db)));
    result.log.push(...(await fixSeoTitleCodes(db)));
    result.log.push(...(await applyProductVisibility(db)));
    result.log.push(...(await syncPricePages(db)));
    result.log.push(...(await syncCityPages(db)));
    result.log.push(...(await syncAreaMeta(db)));
    result.ok = true;
  } catch (e) {
    result.error = (e as Error).message?.slice(0, 300) ?? String(e);
  } finally {
    await db?.end().catch(() => {});
  }
  store.__htnMaintenance = result;
  console.log(`[maintenance] ${result.ok ? "xong" : `lỗi: ${result.error}`}\n  ${result.log.join("\n  ")}`);
  return result;
}
