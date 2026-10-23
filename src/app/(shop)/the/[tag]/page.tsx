import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/listing";
import { ProductGrid } from "@/components/product-card";
import { getProductCardsBySlugs } from "@/lib/queries";
import { getTagBySlug, getTaggedPosts, getTaggedProductSlugs } from "@/lib/tags";

/**
 * Trang thẻ: gom sản phẩm và bài viết cùng thẻ. noindex (follow): đây là trang lọc, nội dung trùng với danh mục,
 * để Google xếp hạng danh mục/bài viết chính thay vì trang thẻ; Google vẫn đi theo link tới sản phẩm và bài.
 */
export async function generateMetadata({ params }: PageProps<"/the/[tag]">): Promise<Metadata> {
  const tag = await getTagBySlug((await params).tag);
  if (!tag) return { robots: { index: false } };
  return { title: `Thẻ: ${tag.name}`, description: `Mẫu hoa và bài viết về ${tag.name} tại Shop hoa tươi Thanh Nhã.`, robots: { index: false, follow: true } };
}

export default async function TagPage({ params }: PageProps<"/the/[tag]">) {
  const tag = await getTagBySlug((await params).tag);
  if (!tag) notFound();
  const [slugs, posts] = await Promise.all([getTaggedProductSlugs(tag.id), getTaggedPosts(tag.id)]);
  const items = await getProductCardsBySlugs(slugs);
  if (!items.length && !posts.length) notFound();

  return (
    <div className="container-x py-10">
      <Breadcrumbs items={[{ label: `Thẻ: ${tag.name}` }]} />
      <h1 className="heading-display mt-6 text-4xl sm:text-5xl">{tag.name}</h1>
      {items.length > 0 && (
        <section aria-labelledby="tag-products" className="mt-10">
          <h2 id="tag-products" className="heading-display text-2xl">
            Mẫu hoa ({items.length})
          </h2>
          <div className="mt-6">
            <ProductGrid products={items} priorityCount={2} />
          </div>
        </section>
      )}
      {posts.length > 0 && (
        <section aria-labelledby="tag-posts" className="mt-14">
          <h2 id="tag-posts" className="heading-display text-2xl">
            Bài viết ({posts.length})
          </h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/${p.slug}/`} className="group flex gap-3">
                  <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                    {p.image && <Image src={p.image} alt="" fill sizes="80px" className="object-cover" />}
                  </span>
                  <span>
                    <span className="line-clamp-2 font-semibold group-hover:text-brand-strong">{p.title}</span>
                    <time className="mt-1 block text-xs text-muted" dateTime={p.publishedAt.toISOString()}>
                      {p.publishedAt.toLocaleDateString("vi-VN")}
                    </time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
