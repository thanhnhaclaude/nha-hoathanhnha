import { livePage } from "./published";
import "server-only";
import { and, desc, eq, inArray, like, or, sql, count } from "drizzle-orm";
import { HOME_SEO_SLUG } from "./constants";
import { db, categories, pageCategories, pages, postCategories, products, productCategories, type Category } from "./db";

export type ProductCardData = {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  image: string | null;
};

const cardColumns = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  price: products.price,
  salePrice: products.salePrice,
  images: products.images,
};

function toCard(row: { images: string[] | null } & Omit<ProductCardData, "image">): ProductCardData {
  const { images, ...rest } = row;
  return { ...rest, image: images?.[0] ?? null };
}

export async function getAllCategories() {
  return db.select().from(categories).orderBy(categories.sortOrder, categories.name);
}

export async function getCategoryBySlug(slug: string) {
  const [row] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return row ?? null;
}

/** Danh mục theo mã term WooCommerce cũ (dùng cho shortcode [ux_products cat="…"]). */
export async function getCategoryByWooId(wooId: number) {
  const [row] = await db.select().from(categories).where(eq(categories.wooId, wooId)).limit(1);
  return row ?? null;
}

/** Trả về id của danh mục và toàn bộ danh mục con cháu. */
async function descendantIds(root: Category) {
  const all = await db.select({ id: categories.id, parentId: categories.parentId }).from(categories);
  const ids = new Set([root.id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of all) {
      if (c.parentId != null && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  return [...ids];
}

export type SortKey = "newest" | "price-asc" | "price-desc";

function orderFor(sort: SortKey) {
  const effective = sql`CASE WHEN ${products.salePrice} > 0 AND ${products.salePrice} < ${products.price} THEN ${products.salePrice} ELSE ${products.price} END`;
  if (sort === "price-asc") return [sql`${effective} = 0`, sql`${effective} ASC`];
  if (sort === "price-desc") return [sql`${effective} DESC`];
  return [desc(products.createdAt), desc(products.id)];
}

export async function getProductsInCategory(
  category: Category,
  { page = 1, perPage = 24, sort = "newest" as SortKey } = {},
) {
  const ids = await descendantIds(category);
  const inCategory = inArray(
    products.id,
    db
      .selectDistinct({ id: productCategories.productId })
      .from(productCategories)
      .where(inArray(productCategories.categoryId, ids)),
  );
  const where = and(eq(products.isActive, true), inCategory);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select(cardColumns)
      .from(products)
      .where(where)
      .orderBy(...orderFor(sort))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ total: count() }).from(products).where(where),
  ]);
  return { items: rows.map(toCard), total, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function searchProducts(q: string, { page = 1, perPage = 24, sort = "newest" as SortKey } = {}) {
  const term = `%${q.trim()}%`;
  const where = and(eq(products.isActive, true), or(like(products.name, term), like(products.sku, term)));
  const [rows, [{ total }]] = await Promise.all([
    db
      .select(cardColumns)
      .from(products)
      .where(where)
      .orderBy(...orderFor(sort))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ total: count() }).from(products).where(where),
  ]);
  return { items: rows.map(toCard), total, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getProductBySlug(slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);
  if (!product) return null;
  const cats = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug, parentId: categories.parentId })
    .from(productCategories)
    .innerJoin(categories, eq(categories.id, productCategories.categoryId))
    .where(eq(productCategories.productId, product.id))
    // Thứ tự cố định: danh mục gốc (id nhỏ) trước danh mục tạo thêm như trang theo giá (maintenance/price-pages.ts)
    .orderBy(productCategories.categoryId);
  return { product, categories: cats };
}

export async function getRelatedProducts(productId: number, categoryIds: number[], limit = 8) {
  if (categoryIds.length === 0) return [];
  const rows = await db
    .select(cardColumns)
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        inArray(
          products.id,
          db
            .selectDistinct({ id: productCategories.productId })
            .from(productCategories)
            .where(inArray(productCategories.categoryId, categoryIds)),
        ),
        sql`${products.id} <> ${productId}`,
      ),
    )
    // Mẫu "hàng xóm" theo mã trong cùng danh mục (thay vì luôn là mẫu mới nhất): mọi sản phẩm đều được
    // vài sản phẩm khác trỏ tới, không có trang sản phẩm "mồ côi"
    .orderBy(sql`ABS(${products.id} - ${productId})`, desc(products.createdAt))
    .limit(limit);
  return rows.map(toCard);
}

/** Thẻ sản phẩm theo danh sách slug, giữ đúng thứ tự truyền vào; bỏ qua sản phẩm đã ẩn/xóa. */
export async function getProductCardsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  const rows = await db
    .select(cardColumns)
    .from(products)
    .where(and(inArray(products.slug, slugs), eq(products.isActive, true)));
  const bySlug = new Map(rows.map((r) => [r.slug, toCard(r)]));
  return slugs.map((s) => bySlug.get(s)).filter((p): p is ProductCardData => p != null);
}

export async function getProductsByIds(ids: number[]) {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(products)
    .where(and(inArray(products.id, ids), eq(products.isActive, true)));
}

export async function getPageBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), livePage()))
    .limit(1);
  return row ?? null;
}

/** Đoạn SEO cuối trang chủ (bản ghi ẩn trong bảng pages). */
export async function getHomeSeo() {
  const [row] = await db.select({ content: pages.content }).from(pages).where(eq(pages.slug, HOME_SEO_SLUG)).limit(1);
  return row?.content ?? null;
}

export async function getPosts({ page = 1, perPage = 12 } = {}) {
  const where = and(eq(pages.type, "post"), livePage());
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ id: pages.id, slug: pages.slug, title: pages.title, excerpt: pages.excerpt, image: pages.image, publishedAt: pages.publishedAt })
      .from(pages)
      .where(where)
      .orderBy(desc(pages.publishedAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ total: count() }).from(pages).where(where),
  ]);
  return { items: rows, total, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getPostCategoryBySlug(slug: string) {
  const [row] = await db.select().from(postCategories).where(eq(postCategories.slug, slug)).limit(1);
  return row ?? null;
}

/** Danh mục bài viết kèm số bài đã đăng, bỏ danh mục rỗng. */
export async function getPostCategoriesWithCounts() {
  const rows = await db
    .select({ id: postCategories.id, slug: postCategories.slug, name: postCategories.name, count: count(pages.id) })
    .from(postCategories)
    .leftJoin(pageCategories, eq(pageCategories.categoryId, postCategories.id))
    .leftJoin(pages, and(eq(pages.id, pageCategories.pageId), livePage()))
    .groupBy(postCategories.id, postCategories.slug, postCategories.name);
  return rows.filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
}

/** Danh mục đầu tiên của bài viết (dùng cho breadcrumb). */
export async function getPrimaryPostCategory(pageId: number) {
  const [row] = await db
    .select({ id: postCategories.id, slug: postCategories.slug, name: postCategories.name })
    .from(pageCategories)
    .innerJoin(postCategories, eq(postCategories.id, pageCategories.categoryId))
    .where(eq(pageCategories.pageId, pageId))
    .orderBy(postCategories.id)
    .limit(1);
  return row ?? null;
}

export async function getPostsInCategory(categoryId: number, { page = 1, perPage = 12 } = {}) {
  const where = and(
    eq(pages.type, "post"),
    livePage(),
    inArray(pages.id, db.select({ id: pageCategories.pageId }).from(pageCategories).where(eq(pageCategories.categoryId, categoryId))),
  );
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ id: pages.id, slug: pages.slug, title: pages.title, excerpt: pages.excerpt, image: pages.image, publishedAt: pages.publishedAt })
      .from(pages)
      .where(where)
      .orderBy(desc(pages.publishedAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ total: count() }).from(pages).where(where),
  ]);
  return { items: rows, total, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getAllProducts({ page = 1, perPage = 24, sort = "newest" as SortKey } = {}) {
  const where = eq(products.isActive, true);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select(cardColumns)
      .from(products)
      .where(where)
      .orderBy(...orderFor(sort))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ total: count() }).from(products).where(where),
  ]);
  return { items: rows.map(toCard), total, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getRecentPosts(excludeId: number, limit = 3) {
  return db
    .select({ id: pages.id, slug: pages.slug, title: pages.title, image: pages.image, publishedAt: pages.publishedAt })
    .from(pages)
    .where(and(eq(pages.type, "post"), livePage(), sql`${pages.id} <> ${excludeId}`))
    .orderBy(desc(pages.publishedAt))
    .limit(limit);
}

export async function getCategoryNames(slugs: string[]) {
  if (slugs.length === 0) return new Map<string, string>();
  const rows = await db
    .select({ slug: categories.slug, name: categories.name })
    .from(categories)
    .where(inArray(categories.slug, slugs));
  return new Map(rows.map((r) => [r.slug, r.name]));
}
