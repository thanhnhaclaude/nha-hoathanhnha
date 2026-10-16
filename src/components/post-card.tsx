import Image from "next/image";
import Link from "next/link";

export type PostCardData = { slug: string; title: string; image: string | null; publishedAt: Date; excerptText?: string };

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <Link href={`/${post.slug}/`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow duration-300 hover:shadow-[0_12px_32px_-12px_rgba(60,30,10,0.25)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
        {post.image && (
          <Image src={post.image} alt={post.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <time dateTime={post.publishedAt.toISOString()} className="text-xs text-muted">
          {post.publishedAt.toLocaleDateString("vi-VN")}
        </time>
        <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-brand-strong">{post.title}</h3>
        {post.excerptText && <p className="line-clamp-3 text-sm text-muted">{post.excerptText}</p>}
      </div>
    </Link>
  );
}
