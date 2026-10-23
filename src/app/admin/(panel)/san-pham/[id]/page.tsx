import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { db, products, productCategories } from "@/lib/db";
import { getAllCategories } from "@/lib/queries";
import { deleteProduct } from "../../actions";
import { ProductForm } from "../product-form";
import { getProductTags } from "@/lib/tags";

export default async function EditProduct({ params, searchParams }: PageProps<"/admin/san-pham/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const [product] = await db.select().from(products).where(eq(products.id, Number(id))).limit(1);
  if (!product) notFound();
  const [categories, links, tagRows] = await Promise.all([
    getAllCategories(),
    db.select({ id: productCategories.categoryId }).from(productCategories).where(eq(productCategories.productId, product.id)),
    getProductTags(product.id),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/admin/san-pham" className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand-strong">
        <ArrowLeft className="size-4" aria-hidden /> Danh sách sản phẩm
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-semibold">Sửa sản phẩm</h1>
        <Link href={`/${product.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-brand-strong hover:underline">
          Xem trên website <ExternalLink className="size-3.5" aria-hidden />
        </Link>
        <form action={deleteProduct} className="ml-auto">
          <input type="hidden" name="id" value={product.id} />
          <button className="btn h-10 min-h-0 text-danger ring-1 ring-danger/30 hover:bg-danger/10">
            <Trash2 className="size-4" aria-hidden /> Xóa
          </button>
        </form>
      </div>
      {saved && (
        <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm text-leaf">
          Đã lưu sản phẩm.
        </p>
      )}
      <ProductForm key={product.updatedAt.toString()} product={product} categories={categories} selected={links.map((l) => l.id)} tagsText={tagRows.map((t) => t.name).join(", ")} />
    </div>
  );
}
