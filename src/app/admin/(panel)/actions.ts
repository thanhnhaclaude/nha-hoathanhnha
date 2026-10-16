"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db, orders, pageCategories, pages, products, productCategories, seoMeta, ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/db";
import { slugify } from "@/lib/format";

export async function updateOrder(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = z.enum(ORDER_STATUSES).parse(formData.get("status"));
  const paymentStatus = z.enum(PAYMENT_STATUSES).parse(formData.get("paymentStatus"));
  const adminNote = String(formData.get("adminNote") ?? "").slice(0, 2000) || null;
  await db.update(orders).set({ status, paymentStatus, adminNote }).where(eq(orders.id, id));
  revalidatePath(`/admin/don-hang/${id}`);
  redirect(`/admin/don-hang/${id}/?saved=1`);
}

const productSchema = z.object({
  name: z.string().trim().min(2, "Tên quá ngắn").max(255),
  slug: z.string().trim().max(191).optional(),
  sku: z.string().trim().max(64).optional(),
  price: z.coerce.number().int().min(0),
  salePrice: z.coerce.number().int().min(0).optional(),
  shortDescription: z.string().max(5000).optional(),
  description: z.string().max(200000).optional(),
  images: z.string().optional(),
  categoryIds: z.array(z.coerce.number().int()).default([]),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

export type ProductFormState = { error?: string } | undefined;

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const id = Number(formData.get("id")) || null;
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    sku: formData.get("sku") || undefined,
    price: formData.get("price") || 0,
    salePrice: formData.get("salePrice") || undefined,
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description") || undefined,
    images: formData.get("images") || undefined,
    categoryIds: formData.getAll("categoryIds"),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  const v = parsed.data;
  const slug = slugify(v.slug || v.name);
  if (!slug) return { error: "Đường dẫn (slug) không hợp lệ" };

  const values = {
    name: v.name,
    slug,
    sku: v.sku || null,
    price: v.price,
    salePrice: v.salePrice && v.salePrice < v.price ? v.salePrice : null,
    shortDescription: v.shortDescription || null,
    description: v.description || null,
    images: (v.images ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => /^(https?:\/\/|\/)/.test(s)),
    isActive: v.isActive,
    isFeatured: v.isFeatured,
  };

  let productId = id;
  try {
    if (id) {
      await db.update(products).set(values).where(eq(products.id, id));
    } else {
      const [res] = await db.insert(products).values(values);
      productId = res.insertId;
    }
  } catch (e) {
    const code = (e as { cause?: { code?: string } }).cause?.code ?? (e as { code?: string }).code;
    if (code === "ER_DUP_ENTRY") return { error: `Đường dẫn "/${slug}" đã được dùng cho sản phẩm khác` };
    throw e;
  }

  await db.delete(productCategories).where(eq(productCategories.productId, productId!));
  if (v.categoryIds.length) {
    await db.insert(productCategories).values(v.categoryIds.map((categoryId) => ({ productId: productId!, categoryId })));
  }
  revalidatePath("/", "layout");
  redirect(`/admin/san-pham/${productId}/?saved=1`);
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  // Đơn hàng cũ vẫn giữ tên/giá sản phẩm trong order_items nên có thể xóa an toàn
  await db.delete(productCategories).where(eq(productCategories.productId, id));
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/", "layout");
  redirect("/admin/san-pham/?deleted=1");
}

const postSchema = z.object({
  type: z.enum(["post", "page"]),
  title: z.string().trim().min(2, "Tiêu đề quá ngắn").max(255),
  slug: z.string().trim().max(191).optional(),
  excerpt: z.string().max(5000).optional(),
  content: z.string().max(2_000_000).optional(),
  image: z.string().trim().max(500).optional(),
  publishedAt: z.string().optional(),
  seoTitle: z.string().trim().max(255).optional(),
  seoDescription: z.string().trim().max(500).optional(),
  categoryIds: z.array(z.coerce.number().int()).default([]),
  isPublished: z.boolean(),
});

export type PostFormState = { error?: string } | undefined;

export async function savePost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  await requireAdmin();
  const id = Number(formData.get("id")) || null;
  const opt = (k: string) => (formData.get(k) as string | null) || undefined;
  const parsed = postSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    slug: opt("slug"),
    excerpt: opt("excerpt"),
    content: opt("content"),
    image: opt("image"),
    publishedAt: opt("publishedAt"),
    seoTitle: opt("seoTitle"),
    seoDescription: opt("seoDescription"),
    categoryIds: formData.getAll("categoryIds"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  const v = parsed.data;
  const slug = slugify(v.slug || v.title);
  if (!slug) return { error: "Đường dẫn (slug) không hợp lệ" };
  if (v.image && !/^(https?:\/\/|\/)/.test(v.image)) return { error: "Ảnh đại diện phải là đường dẫn http(s) hoặc bắt đầu bằng /" };

  const values = {
    type: v.type,
    title: v.title,
    slug,
    excerpt: v.excerpt || null,
    content: v.content || null,
    image: v.image || null,
    isPublished: v.isPublished,
    ...(v.publishedAt ? { publishedAt: new Date(v.publishedAt) } : {}),
  };

  let pageId = id;
  try {
    if (id) await db.update(pages).set(values).where(eq(pages.id, id));
    else pageId = (await db.insert(pages).values(values))[0].insertId;
  } catch (e) {
    const code = (e as { cause?: { code?: string } }).cause?.code ?? (e as { code?: string }).code;
    if (code === "ER_DUP_ENTRY") return { error: `Đường dẫn "/${slug}/" đã được dùng` };
    throw e;
  }

  await db.delete(pageCategories).where(eq(pageCategories.pageId, pageId!));
  if (v.type === "post" && v.categoryIds.length) {
    await db.insert(pageCategories).values(v.categoryIds.map((categoryId) => ({ pageId: pageId!, categoryId })));
  }

  // Tiêu đề / mô tả SEO riêng (để trống = dùng tự động)
  const path = `/${slug}/`;
  const seo = { title: v.seoTitle || null, description: v.seoDescription || null };
  await db.insert(seoMeta).values({ path, ...seo }).onDuplicateKeyUpdate({ set: seo });

  revalidatePath("/", "layout");
  redirect(`/admin/bai-viet/${pageId}/?saved=1`);
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(pageCategories).where(eq(pageCategories.pageId, id));
  await db.delete(pages).where(eq(pages.id, id));
  revalidatePath("/", "layout");
  redirect("/admin/bai-viet/?deleted=1");
}
