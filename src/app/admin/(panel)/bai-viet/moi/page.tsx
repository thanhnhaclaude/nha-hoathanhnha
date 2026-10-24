import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db, postCategories } from "@/lib/db";
import { PostForm } from "../post-form";

export default async function NewPost({ searchParams }: PageProps<"/admin/bai-viet/moi">) {
  const type = (await searchParams).type === "page" ? "page" : "post";
  const categories = await db.select().from(postCategories).orderBy(postCategories.name);
  return (
    <div className="space-y-6">
      <Link href={`/admin/bai-viet/?type=${type}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand-strong">
        <ArrowLeft className="size-4" aria-hidden /> Danh sách
      </Link>
      <h1 className="font-display text-4xl font-bold">{type === "post" ? "Viết bài mới" : "Thêm trang"}</h1>
      <PostForm type={type} categories={categories} selected={[]} />
    </div>
  );
}
