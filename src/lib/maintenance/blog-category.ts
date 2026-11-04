/**
 * "Địa Điểm" là danh mục mặc định của WordPress cũ (wp_id = 1) nên bài blog nhập về đều nằm trong đó.
 * Chuyển sang "Blog" các bài nhập từ website cũ chỉ thuộc mỗi danh mục này. URL bài không đổi. Chạy lặp lại an toàn.
 * shortcut: chạy ở mọi lần khởi động nên bài cũ bị gán lại vào Địa Điểm cũng chuyển về Blog, thêm slug vào KEEP nếu cần giữ.
 */
import type { Connection } from "mysql2/promise";

const KEEP = ["he-thong-cua-hang-cua-chung-toi"];

export async function moveImportedPostsToBlog(db: Connection): Promise<string[]> {
  const [cats] = (await db.query("select id, slug from post_categories where slug in ('dia-diem', 'blog')")) as [{ id: number; slug: string }[], unknown];
  const from = cats.find((c) => c.slug === "dia-diem")?.id;
  const to = cats.find((c) => c.slug === "blog")?.id;
  if (!from || !to) return ["! Chuyển bài sang Blog: không thấy danh mục dia-diem hoặc blog"];

  const [res] = (await db.query(
    `update page_categories pc join pages p on p.id = pc.page_id
     set pc.category_id = ?
     where pc.category_id = ? and p.type = 'post' and p.wp_id is not null and p.slug not in (?)
       and not exists (select 1 from (select page_id, category_id from page_categories) o where o.page_id = pc.page_id and o.category_id <> ?)`,
    [to, from, KEEP, from],
  )) as [{ affectedRows: number }, unknown];
  return [`✓ Chuyển bài sang Blog: vừa chuyển ${res.affectedRows}`];
}
