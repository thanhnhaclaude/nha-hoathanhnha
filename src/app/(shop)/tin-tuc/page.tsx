import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/listing";
import { PostCard } from "@/components/post-card";
import { getPosts } from "@/lib/queries";
import { plainText } from "@/lib/sanitize";

export const metadata: Metadata = {
  title: "Tin tức",
  description: "Tin tức, cẩm nang và ý nghĩa các loài hoa từ Shop hoa tươi Thanh Nhã.",
  alternates: { canonical: "/tin-tuc" },
};
export const dynamic = "force-dynamic";

export default async function NewsPage({ searchParams }: PageProps<"/tin-tuc">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, pages } = await getPosts({ page });
  const link = (n: number) => (n === 1 ? "/tin-tuc" : `/tin-tuc?page=${n}`);

  return (
    <div className="container-x py-10">
      <Breadcrumbs items={[{ label: "Tin tức" }]} />
      <h1 className="heading-display mt-6 text-4xl sm:text-5xl">Tin tức</h1>
      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-surface p-10 text-center text-muted">Chưa có bài viết.</p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <li key={p.id} className={i === 0 && page === 1 ? "sm:col-span-2 lg:col-span-1" : undefined}>
              <PostCard post={{ ...p, excerptText: plainText(p.excerpt, 150) }} />
            </li>
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav aria-label="Phân trang" className="mt-10 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={link(page - 1)} className="btn-outline h-11">
              Bài mới hơn
            </Link>
          )}
          <span className="text-muted">
            Trang {page}/{pages}
          </span>
          {page < pages && (
            <Link href={link(page + 1)} className="btn-outline h-11">
              Bài cũ hơn
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
