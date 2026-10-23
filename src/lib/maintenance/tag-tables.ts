/**
 * Tạo bảng thẻ (tags, page_tags, product_tags) nếu chưa có — website trên Hostinger không chạy drizzle-kit,
 * nên bảng mới được tạo lúc máy chủ khởi động. Chạy lặp lại an toàn.
 */
import type { Connection } from "mysql2/promise";

export async function ensureTagTables(db: Connection): Promise<string[]> {
  await db.query(`create table if not exists tags (
    id int not null auto_increment primary key,
    name varchar(120) not null,
    slug varchar(150) not null,
    unique key tags_slug_uq (slug)
  ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci`);
  await db.query(`create table if not exists page_tags (
    page_id int not null, tag_id int not null,
    primary key (page_id, tag_id), key page_tags_tag_idx (tag_id)
  ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci`);
  await db.query(`create table if not exists product_tags (
    product_id int not null, tag_id int not null,
    primary key (product_id, tag_id), key product_tags_tag_idx (tag_id)
  ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci`);
  return ["✓ Bảng thẻ (tags): sẵn sàng"];
}
