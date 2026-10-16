import "server-only";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, seoMeta } from "./db";

/** Đường dẫn chuẩn có dấu "/" cuối, giống WordPress cũ. */
export function canonicalPath(slug?: string) {
  return slug ? `/${slug}/` : "/";
}

/**
 * Metadata cho một đường dẫn: ưu tiên tiêu đề / mô tả / robots chép từ website cũ (bảng seo_meta),
 * thiếu thì dùng giá trị mặc định truyền vào.
 */
export async function seoMetadata(path: string, fallback: { title: string; description?: string; noindex?: boolean } & Metadata): Promise<Metadata> {
  const [row] = await db.select().from(seoMeta).where(eq(seoMeta.path, path)).limit(1);
  const { title, description, noindex, ...rest } = fallback;
  const noIndex = row?.robots ? /noindex/i.test(row.robots) : noindex;
  return {
    ...rest,
    // Tiêu đề cũ đã gồm " | Hoa Thanh Nhã" nên dùng nguyên văn
    title: row?.title ? { absolute: row.title } : title,
    description: row?.description || description,
    alternates: { canonical: path, ...rest.alternates },
    robots: noIndex ? { index: false, follow: true } : rest.robots,
  };
}
