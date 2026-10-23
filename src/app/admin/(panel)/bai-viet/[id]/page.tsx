import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { db, pageCategories, pages, postCategories, seoMeta } from "@/lib/db";
import { deletePost } from "../../actions";
import { PostForm } from "../post-form";
import { getPageTags } from "@/lib/tags";

export default async function EditPost({ params, searchParams }: PageProps<"/admin/bai-viet/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const [post] = await db.select().from(pages).where(eq(pages.id, Number(id))).limit(1);
  if (!post) notFound();
  const [categories, links, [seo], tagRows] = await Promise.all([
    db.select().from(postCategories).orderBy(postCategories.name),
    db.select({ id: pageCategories.categoryId }).from(pageCategories).where(eq(pageCategories.pageId, post.id)),
    db.select({ title: seoMeta.title, description: seoMeta.description }).from(seoMeta).where(eq(seoMeta.path, `/${post.slug}/`)).limit(1),
    getPageTags(post.id),
  ]);

  return (
    <div className="space-y-6">
      <Link href={`/admin/bai-viet/?type=${post.type}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand-strong">
        <ArrowLeft className="size-4" aria-hidden /> Danh sách
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-semibold">{post.type === "post" ? "Sửa bài viết" : "Sửa trang"}</h1>
        <Link href={`/${post.slug}/`} target="_blank" className="inline-flex items-center gap-1 text-sm text-brand-strong hover:underline">
          Xem trên website <ExternalLink className="size-3.5" aria-hidden />
        </Link>
        <form action={deletePost} className="ml-auto">
          <input type="hidden" name="id" value={post.id} />
          <button className="btn h-10 min-h-0 text-danger ring-1 ring-danger/30 hover:bg-danger/10">
            <Trash2 className="size-4" aria-hidden /> Xóa
          </button>
        </form>
      </div>
      {saved && (
        <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm text-leaf">
          Đã lưu.
        </p>
      )}
      <PostForm key={post.updatedAt.toString()} post={post} type={post.type} categories={categories} selected={links.map((l) => l.id)} seo={seo} tagsText={tagRows.map((t) => t.name).join(", ")} />
    </div>
  );
}
