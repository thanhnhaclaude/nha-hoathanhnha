/**
 * "Địa Điểm" là danh mục mặc định của WordPress cũ (wp_id = 1) nên bài blog nhập về đều nằm trong đó.
 * Bài địa điểm nhập từ website cũ (LOCATION) chỉ nằm ở Địa Điểm; các bài nhập khác chỉ thuộc Địa Điểm thì chuyển sang "Blog".
 * URL bài không đổi. Chạy lặp lại an toàn.
 * shortcut: chạy ở mọi lần khởi động nên bài cũ bị gán lại vào Địa Điểm cũng chuyển về Blog, thêm slug vào LOCATION nếu cần giữ.
 */
import type { Connection } from "mysql2/promise";

const LOCATION = [
  "he-thong-cua-hang-cua-chung-toi",
  "shop-hoa-tuoi-da-nang",
  "shop-hoa-tuoi-quan-1",
  "shop-hoa-tuoi-quan-go-vap",
  "shop-hoa-tuoi-quan-4",
  "shop-hoa-tuoi-quan-2",
  "shop-hoa-tuoi-quan-3",
  "shop-hoa-tuoi-quan-tan-binh",
  "shop-hoa-tuoi-quan-12",
  "shop-hoa-tuoi-quan-6",
  "shop-hoa-tuoi-quan-10",
  "shop-hoa-tuoi-huyen-hoc-mon",
];

export async function moveImportedPostsToBlog(db: Connection): Promise<string[]> {
  const [cats] = (await db.query("select id, slug from post_categories where slug in ('dia-diem', 'blog')")) as [{ id: number; slug: string }[], unknown];
  const from = cats.find((c) => c.slug === "dia-diem")?.id;
  const to = cats.find((c) => c.slug === "blog")?.id;
  if (!from || !to) return ["! Chuyển bài sang Blog: không thấy danh mục dia-diem hoặc blog"];

  const [posts] = (await db.query("select id from pages where type = 'post' and slug in (?)", [LOCATION])) as [{ id: number }[], unknown];
  const ids = posts.map((p) => p.id);
  if (ids.length) {
    await db.query("delete from page_categories where page_id in (?) and category_id <> ?", [ids, from]);
    await db.query("insert ignore into page_categories (page_id, category_id) values ?", [ids.map((id) => [id, from])]);
  }

  const [res] = (await db.query(
    `update page_categories pc join pages p on p.id = pc.page_id
     set pc.category_id = ?
     where pc.category_id = ? and p.type = 'post' and p.wp_id is not null and p.slug not in (?)
       and not exists (select 1 from (select page_id, category_id from page_categories) o where o.page_id = pc.page_id and o.category_id <> ?)`,
    [to, from, LOCATION, from],
  )) as [{ affectedRows: number }, unknown];
  await db.query("update pages set title = 'Hệ thống shop hoa tươi', image = '/uploads/Hoa-bo-HB165.webp' where slug = 'he-thong-cua-hang-cua-chung-toi'");
  await db.query(
    "update seo_meta set title = replace(replace(title, 'Hệ thống cửa hàng của chúng tôi', 'Hệ thống shop hoa tươi'), 'Hệ thống shop của chúng tôi', 'Hệ thống shop hoa tươi') where path = '/he-thong-cua-hang-cua-chung-toi/'",
  );

  // Danh mục thành phố đã gom vào Địa Điểm: xóa khi không còn bài, URL cũ chuyển hướng ở legacy-redirects.ts
  const [del] = (await db.query(
    `delete from post_categories where slug in ('tp-ho-chi-minh', 'da-nang')
     and not exists (select 1 from page_categories pc where pc.category_id = post_categories.id)`,
  )) as [{ affectedRows: number }, unknown];
  return [`✓ Danh mục bài viết: ${ids.length} bài địa điểm ở Địa Điểm, vừa chuyển ${res.affectedRows} bài sang Blog, xóa ${del.affectedRows} danh mục trống`];
}
