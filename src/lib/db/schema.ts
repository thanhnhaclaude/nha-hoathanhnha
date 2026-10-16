import {
  mysqlTable,
  int,
  varchar,
  text,
  mediumtext,
  json,
  boolean,
  datetime,
  date,
  mysqlEnum,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

const createdAt = () => datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`);
const updatedAt = () =>
  datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date());

export const categories = mysqlTable(
  "categories",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 191 }).notNull(),
    slug: varchar("slug", { length: 191 }).notNull(),
    parentId: int("parent_id"),
    description: text("description"),
    image: varchar("image", { length: 500 }),
    sortOrder: int("sort_order").notNull().default(0),
    wooId: int("woo_id"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("categories_slug_uq").on(t.slug), index("categories_parent_idx").on(t.parentId)],
);

export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 191 }).notNull(),
    sku: varchar("sku", { length: 64 }),
    /** Giá bán thường (VND). 0 = liên hệ */
    price: int("price").notNull().default(0),
    /** Giá khuyến mãi (VND), null nếu không giảm */
    salePrice: int("sale_price"),
    shortDescription: text("short_description"),
    description: mediumtext("description"),
    images: json("images").$type<string[]>().notNull().default(sql`(JSON_ARRAY())`),
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    wooId: int("woo_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("products_slug_uq").on(t.slug),
    index("products_active_idx").on(t.isActive, t.createdAt),
  ],
);

export const productCategories = mysqlTable(
  "product_categories",
  {
    productId: int("product_id").notNull(),
    categoryId: int("category_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] }), index("pc_category_idx").on(t.categoryId)],
);

/** Trang thông tin (hướng dẫn, chính sách…) và bài viết tin tức nhập từ WordPress. */
export const pages = mysqlTable(
  "pages",
  {
    id: int("id").autoincrement().primaryKey(),
    type: mysqlEnum("type", ["page", "post"]).notNull(),
    slug: varchar("slug", { length: 191 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: mediumtext("content"),
    excerpt: text("excerpt"),
    image: varchar("image", { length: 500 }),
    isPublished: boolean("is_published").notNull().default(true),
    wpId: int("wp_id"),
    publishedAt: datetime("published_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("pages_slug_uq").on(t.slug), index("pages_type_idx").on(t.type, t.publishedAt)],
);

export type Page = typeof pages.$inferSelect;

export const ORDER_STATUSES = ["pending", "confirmed", "delivering", "completed", "cancelled"] as const;
export const PAYMENT_METHODS = ["vietqr", "cod"] as const;
export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;

export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 20 }).notNull(),
    /** Token bí mật để khách xem lại đơn hàng của mình */
    accessToken: varchar("access_token", { length: 64 }).notNull(),
    senderName: varchar("sender_name", { length: 120 }).notNull(),
    senderPhone: varchar("sender_phone", { length: 20 }).notNull(),
    senderEmail: varchar("sender_email", { length: 191 }),
    recipientName: varchar("recipient_name", { length: 120 }).notNull(),
    recipientPhone: varchar("recipient_phone", { length: 20 }).notNull(),
    address: varchar("address", { length: 500 }).notNull(),
    city: varchar("city", { length: 120 }).notNull(),
    deliveryDate: date("delivery_date", { mode: "string" }).notNull(),
    deliveryTime: varchar("delivery_time", { length: 40 }).notNull(),
    cardMessage: text("card_message"),
    bannerMessage: text("banner_message"),
    note: text("note"),
    subtotal: int("subtotal").notNull(),
    shippingFee: int("shipping_fee").notNull().default(0),
    total: int("total").notNull(),
    paymentMethod: mysqlEnum("payment_method", PAYMENT_METHODS).notNull(),
    paymentStatus: mysqlEnum("payment_status", PAYMENT_STATUSES).notNull().default("unpaid"),
    status: mysqlEnum("status", ORDER_STATUSES).notNull().default("pending"),
    adminNote: text("admin_note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("orders_code_uq").on(t.code), index("orders_status_idx").on(t.status, t.createdAt)],
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("order_id").notNull(),
    productId: int("product_id"),
    name: varchar("name", { length: 255 }).notNull(),
    image: varchar("image", { length: 500 }),
    unitPrice: int("unit_price").notNull(),
    quantity: int("quantity").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
