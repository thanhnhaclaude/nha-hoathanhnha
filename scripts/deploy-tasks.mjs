/**
 * Chạy tự động trước "npm start" (npm prestart) mỗi lần Hostinger khởi động website sau khi triển khai:
 *  1. content:sync    — đưa bài trong content/bai-viet/*.md vào database (thêm mới / cập nhật, có hẹn giờ)
 *  2. content:fix-contact — thay thông tin công ty cũ, đồng bộ hotline/Zalo 0396.72.73.74
 * Cả hai chạy lặp lại không gây hại. Lỗi (vd. chưa có database) chỉ được ghi ra log,
 * KHÔNG chặn website khởi động.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const tsx = path.join("node_modules", "tsx", "dist", "cli.mjs");
const tasks = [
  ["Đồng bộ bài viết", "scripts/sync-content.ts"],
  ["Chuẩn hóa thông tin liên hệ", "scripts/fix-contact-info.ts"],
];

if (process.env.SKIP_DEPLOY_TASKS === "1") {
  console.log("[deploy-tasks] bỏ qua (SKIP_DEPLOY_TASKS=1)");
} else if (!existsSync(tsx)) {
  console.log("[deploy-tasks] không có tsx trong node_modules, bỏ qua");
} else {
  for (const [name, script] of tasks) {
    const r = spawnSync(process.execPath, [tsx, script], { stdio: "inherit", timeout: 120_000, env: process.env });
    console.log(`[deploy-tasks] ${name}: ${r.status === 0 ? "xong" : `lỗi (mã ${r.status ?? r.signal}), website vẫn khởi động`}`);
  }
}
