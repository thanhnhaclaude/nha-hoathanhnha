import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllCategories } from "@/lib/queries";
import { ProductForm } from "../product-form";

export default async function NewProduct() {
  const categories = await getAllCategories();
  return (
    <div className="space-y-6">
      <Link href="/admin/san-pham" className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand-strong">
        <ArrowLeft className="size-4" aria-hidden /> Danh sách sản phẩm
      </Link>
      <h1 className="font-display text-4xl font-semibold">Thêm sản phẩm</h1>
      <ProductForm categories={categories} selected={[]} />
    </div>
  );
}
