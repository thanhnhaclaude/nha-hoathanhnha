/**
 * Next.js gọi register() một lần khi máy chủ khởi động.
 * Chạy việc bảo trì dữ liệu (đồng bộ bài viết, chuẩn hóa thông tin liên hệ) ở nền,
 * không chặn website nhận request. Tắt bằng biến môi trường SKIP_DEPLOY_TASKS=1.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.SKIP_DEPLOY_TASKS === "1") return;
  const { runMaintenance } = await import("./lib/maintenance/run");
  void runMaintenance().catch((e) => console.error("[maintenance]", e));
}
