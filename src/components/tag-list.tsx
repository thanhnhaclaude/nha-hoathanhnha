import Link from "next/link";
import { Tag } from "lucide-react";

/** Danh sách thẻ dưới bài viết / mô tả sản phẩm, mỗi thẻ dẫn tới trang /the/<slug>/ */
export function TagList({ tags, className = "" }: { tags: { slug: string; name: string }[]; className?: string }) {
  if (tags.length === 0) return null;
  return (
    <nav aria-label="Thẻ" className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Tag className="size-4 text-muted" aria-hidden />
      {tags.map((t) => (
        <Link key={t.slug} href={`/the/${t.slug}/`} className="rounded-full bg-surface-muted px-3 py-1.5 text-sm ring-1 ring-border transition hover:bg-brand-soft hover:text-brand-strong">
          {t.name}
        </Link>
      ))}
    </nav>
  );
}
