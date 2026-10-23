"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { categories, db, pageCategories, pageTags, postCategories, productCategories, productTags, tags } from "@/lib/db";
import { slugify } from "@/lib/format";

const schema = z.object({
  kind: z.enum(["product", "post"]),
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(2, "Tên quá ngắn").max(191),
  slug: z.string().trim().max(191).optional(),
  parentId: z.coerce.number().int().optional(),
  description: z.string().max(200000).optional(),
});

const back = (kind: string, msg: string) => `/admin/danh-muc/?kind=${kind}&msg=${encodeURIComponent(msg)}`;

/** Thêm / sửa danh mục sản phẩm hoặc danh mục bài viết */
export async function saveCategory(formData: FormData) {
  await requireAdmin();
  const opt = (k: string) => (formData.get(k) as string | null) || undefined;
  const parsed = schema.safeParse({
    kind: formData.get("kind"),
    id: opt("id"),
    name: formData.get("name"),
    slug: opt("slug"),
    parentId: opt("parentId"),
    description: opt("description"),
  });
  const kind = String(formData.get("kind") ?? "product");
  if (!parsed.success) redirect(back(kind, parsed.error.issues.map((i) => i.message).join(", ")));
  const v = parsed.data;
  const slug = slugify(v.slug || v.name);
  if (!slug) redirect(back(kind, "Đường dẫn không hợp lệ"));

  try {
    if (v.kind === "product") {
      const values = { name: v.name, slug, parentId: v.parentId && v.parentId !== v.id ? v.parentId : null, description: v.description || null };
      if (v.id) await db.update(categories).set(values).where(eq(categories.id, v.id));
      else await db.insert(categories).values(values);
    } else {
      const values = { name: v.name, slug, description: v.description || null };
      if (v.id) await db.update(postCategories).set(values).where(eq(postCategories.id, v.id));
      else await db.insert(postCategories).values(values);
    }
  } catch (e) {
    const code = (e as { cause?: { code?: string } }).cause?.code ?? (e as { code?: string }).code;
    if (code === "ER_DUP_ENTRY") redirect(back(v.kind, `Đường dẫn "/${slug}/" đã được dùng`));
    throw e;
  }
  revalidatePath("/", "layout");
  redirect(back(v.kind, v.id ? `Đã lưu “${v.name}”` : `Đã thêm “${v.name}” — trang /${slug}/`));
}

/** Xóa danh mục chỉ khi không còn sản phẩm / bài viết / danh mục con (tránh trang đang có thứ hạng bị 404) */
export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const kind = formData.get("kind") === "post" ? "post" : "product";
  const id = Number(formData.get("id"));
  if (kind === "product") {
    const [[{ n }], [{ c }]] = await Promise.all([
      db.select({ n: count() }).from(productCategories).where(eq(productCategories.categoryId, id)),
      db.select({ c: count() }).from(categories).where(eq(categories.parentId, id)),
    ]);
    if (n || c) redirect(back(kind, "Chỉ xóa được danh mục trống (không còn sản phẩm và danh mục con)"));
    await db.delete(categories).where(eq(categories.id, id));
  } else {
    const [[{ n }]] = await Promise.all([db.select({ n: count() }).from(pageCategories).where(eq(pageCategories.categoryId, id))]);
    if (n) redirect(back(kind, "Chỉ xóa được danh mục chưa có bài viết"));
    await db.delete(postCategories).where(eq(postCategories.id, id));
  }
  revalidatePath("/", "layout");
  redirect(back(kind, "Đã xóa"));
}

/** Đổi tên hoặc xóa thẻ (xóa thẻ chỉ gỡ khỏi bài/sản phẩm, không xóa bài/sản phẩm) */
export async function saveTag(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (formData.get("delete") === "1") {
    await db.delete(pageTags).where(eq(pageTags.tagId, id));
    await db.delete(productTags).where(eq(productTags.tagId, id));
    await db.delete(tags).where(eq(tags.id, id));
    revalidatePath("/", "layout");
    redirect(back("tag", "Đã xóa thẻ"));
  }
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const slug = slugify(name);
  if (!slug) redirect(back("tag", "Tên thẻ không hợp lệ"));
  try {
    await db.update(tags).set({ name, slug }).where(eq(tags.id, id));
  } catch {
    redirect(back("tag", `Thẻ “${name}” đã có`));
  }
  revalidatePath("/", "layout");
  redirect(back("tag", `Đã lưu thẻ “${name}”`));
}
