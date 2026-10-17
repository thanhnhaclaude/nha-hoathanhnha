import { and, eq, lte, sql } from "drizzle-orm";
import { pages } from "./db/schema";

/**
 * Bài/trang đang hiển thị: đã bật "xuất bản" VÀ đã tới ngày đăng.
 * Bài có ngày đăng ở tương lai được hẹn giờ: tự xuất hiện (trang, danh sách, sitemap, bài liên quan) khi tới ngày.
 * Kết nối MySQL đặt múi giờ +07:00 nên NOW() là giờ Việt Nam, khớp với published_at.
 */
export function livePage() {
  return and(eq(pages.isPublished, true), lte(pages.publishedAt, sql`NOW()`));
}
