import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Camera, Gift, Phone, ShieldCheck, Truck } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import { Breadcrumbs, Pagination, SortBar, parseListingParams } from "@/components/listing";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard, ProductGrid } from "@/components/product-card";
import { ZaloIcon } from "@/components/icons";
import { effectivePrice, formatVND } from "@/lib/format";
import type { ProductCardData } from "@/lib/queries";
import { infoPages, type InfoPage } from "@/lib/info-pages";
import { mainMenu } from "@/lib/menu";
import { PostCard } from "@/components/post-card";
import { ReadMore } from "@/components/read-more";
import { WishlistButton } from "@/components/wishlist";
import Link from "next/link";
import type { Page, PostCategory } from "@/lib/db/schema";
import {
  getCategoryBySlug,
  getCategoryByWooId,
  getPageBySlug,
  getPostCategoriesWithCounts,
  getPostCategoryBySlug,
  getPostsInCategory,
  getPrimaryPostCategory,
  getProductBySlug,
  getProductCardsBySlugs,
  getProductsInCategory,
  getRelatedProducts,
} from "@/lib/queries";
import { canonicalPath, paginated, seoMetadata } from "@/lib/seo";
import { ChipScroller } from "@/components/chip-scroller";
import { TagList } from "@/components/tag-list";
import { getPageTags, getProductTags } from "@/lib/tags";
import { addContextualLinksMany, bestCategoryFor, getGuidePosts, getNearbyAreas, getRelatedPosts } from "@/lib/internal-links";
import { ViewItemTracker } from "@/components/view-item-tracker";
import { cleanHtml, introText, normalizeHeadings, plainText, removeDuplicateTitleHeading, splitCategoryShortcodes, splitProductBlocks } from "@/lib/sanitize";
import { cityHubs, shippingConfig, site, storeAreas } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[slug]">;

/**
 * Như WordPress cũ: khi bài viết trùng slug với danh mục sản phẩm (vd. shop-hoa-tuoi-quan-10),
 * URL đó hiển thị danh mục chứ không phải bài viết.
 */
async function getVisibleCms(slug: string) {
  const cms = await getPageBySlug(slug);
  if (cms?.type === "post" && (await getCategoryBySlug(slug))) return null;
  return cms;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { page } = parseListingParams(await searchParams);
  const path = canonicalPath(slug);
  const cms = await getVisibleCms(slug);
  if (cms) {
    return seoMetadata(path, {
      title: cms.title,
      description: plainText(cms.excerpt || cms.content) || site.description,
      openGraph: cms.image ? { type: cms.type === "post" ? "article" : "website", images: [cms.image] } : undefined,
    });
  }
  const info = infoPages[slug];
  if (info) return seoMetadata(path, { title: info.title, description: info.description });
  const found = await getProductBySlug(slug);
  if (found) {
    const { product } = found;
    return seoMetadata(path, {
      title: product.name,
      description: plainText(product.shortDescription || product.description) || site.description,
      openGraph: product.images.length ? { images: product.images.slice(0, 1) } : undefined,
    });
  }
  const category = await getCategoryBySlug(slug);
  if (category) {
    const [meta, { total }] = await Promise.all([
      seoMetadata(path, {
        title: category.name,
        description: introText(category.description, 160) || `${category.name} tại Shop hoa tươi Thanh Nhã. Giao hoa hỏa tốc, miễn phí thiệp & băng rôn.`,
      }),
      getProductsInCategory(category, { perPage: 1 }),
    ]);
    // Danh mục chưa có sản phẩm = trang mỏng: không cho lập chỉ mục cho tới khi gán sản phẩm trong admin
    return paginated(total ? meta : { ...meta, robots: { index: false, follow: true } }, path, page);
  }
  const postCategory = await getPostCategoryBySlug(slug);
  if (postCategory) return paginated(await seoMetadata(path, { title: postCategory.name, description: introText(postCategory.description, 160) || `${postCategory.name}: kinh nghiệm chọn hoa, ý nghĩa các loài hoa và địa chỉ shop hoa tươi Thanh Nhã giao hoa tận nơi.` }), path, page);
  return {};
}

export default async function SlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const cms = await getVisibleCms(slug);
  if (cms) return <CmsView page={cms} />;
  const info = infoPages[slug];
  if (info) return <InfoView page={info} />;
  const found = await getProductBySlug(slug);
  if (found) return <ProductView data={found} />;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    const postCategory = await getPostCategoryBySlug(slug);
    if (!postCategory) notFound();
    return <PostArchiveView category={postCategory} page={parseListingParams(await searchParams).page} />;
  }

  const { page, sort } = parseListingParams(await searchParams);
  // Trang khu vực (shop-hoa-tuoi-…): 8 mẫu/trang = 2 hàng × 4 cột, đồng bộ với các khối sản phẩm trong phần mô tả
  const isArea = category.slug.startsWith("shop-hoa-tuoi-");
  // Trang "gần đây": danh sách cửa hàng là nội dung chính -> hiện ngay dưới tiêu đề, không thu gọn
  const descFirst = category.slug === "shop-hoa-tuoi-gan-day";
  // Trang khu vực, sắp "mới nhất": xếp xen kẽ theo loại (bó, giỏ, khai trương, lan…) để trang đầu đủ loại, chia buồn xếp sau
  const mixArea = isArea && sort === "newest";
  const [listing, guides, nearby] = await Promise.all([
    mixArea
      ? getProductsInCategory(category, { page: 1, perPage: 240, sort }).then((r) => paginateMixed(r.items, page, 8))
      : getProductsInCategory(category, { page, sort, ...(isArea ? { perPage: 8 } : {}) }),
    getGuidePosts(category.name, 3),
    getNearbyAreas(category.id, category.parentId, category.slug),
  ]);
  const { items, total, pages } = listing;
  const group = mainMenu.find((g) => g.slug === slug || g.children.some((c) => c.slug === slug));
  const base = `/${category.slug}/`;

  // Trang khu vực có cửa hàng thật: dữ liệu có cấu trúc Florist (địa chỉ, giờ mở cửa) cho tìm kiếm địa phương
  const store = storeAreas[category.slug];
  const storeLd = store
    ? {
        "@context": "https://schema.org",
        "@type": "Florist",
        name: `${site.name} – ${store.street}`,
        url: `${site.url}${base}`,
        image: `${site.url}/brand/banner2.webp`,
        telephone: "+84" + site.phone.replace(/^0/, ""),
        openingHours: "Mo-Su 06:00-21:00",
        priceRange: "300.000₫ - 5.000.000₫",
        address: { "@type": "PostalAddress", streetAddress: store.street, addressLocality: store.city, addressCountry: "VN" },
        parentOrganization: { "@id": `${site.url}/#organization` },
      }
    : null;

  return (
    <div className="container-x py-8">
      {storeLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeLd).replace(/</g, "\\u003c") }} />}
      <Breadcrumbs items={[...(group && group.slug !== slug ? [{ label: group.label, href: `/${group.slug}/` }] : []), { label: category.name }]} />
      <header className="mt-6 max-w-3xl">
        <h1 className="heading-display text-4xl sm:text-5xl">{category.name}</h1>
        {category.description && !descFirst && <p className="mt-3 text-muted">{introText(category.description)}</p>}
      </header>
      {descFirst && category.description && (
        <section aria-label="Danh sách cửa hàng" className="mt-6 max-w-3xl">
          <CategoryDescription html={category.description} title={category.name} slug={category.slug} withProducts={false} />
        </section>
      )}
      {group && (
        <ChipScroller label="Danh mục liên quan">
          <ul className="flex gap-2">
            {group.children.map((c) => (
              <li key={c.slug} className="shrink-0">
                <a
                  href={`/${c.slug}/`}
                  aria-current={c.slug === slug ? "page" : undefined}
                  className={`block rounded-full px-4 py-2 text-sm ${c.slug === slug ? "bg-brand text-white" : "bg-surface ring-1 ring-border hover:ring-brand"}`}
                >
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </ChipScroller>
      )}
      <div className="mt-8">
        <SortBar base={base} sort={sort} total={total} />
      </div>
      <div className="mt-6">
        {items.length ? (
          <ProductGrid products={items} priorityCount={2} layout={isArea ? "four" : "default"} />
        ) : (
          <p className="rounded-2xl bg-surface p-10 text-center text-muted">
            Danh mục đang được cập nhật. Gọi <a className="font-semibold text-brand-strong" href={`tel:${site.phone}`}>{site.phoneDisplay}</a> để được tư vấn mẫu.
          </p>
        )}
      </div>
      <Pagination base={base} page={page} pages={pages} sort={sort} />
      {(nearby.parent || nearby.children.length > 0) && (
        <section aria-labelledby="near-h" className="defer-render mt-14">
          <h2 id="near-h" className="font-display text-2xl font-bold">
            Giao hoa khu vực lân cận
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {nearby.parent && (
              <li>
                <Link href={canonicalPath(nearby.parent.slug)} className="block rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand-strong hover:ring-1 hover:ring-brand">
                  {nearby.parent.name}
                </Link>
              </li>
            )}
            {[...nearby.children, ...nearby.siblings].map((a) => (
              <li key={a.slug}>
                <Link href={canonicalPath(a.slug)} className="block rounded-full bg-surface px-4 py-2 text-sm ring-1 ring-border hover:ring-brand">
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {guides.length > 0 && (
        <section aria-labelledby="guide-h" className="defer-render mt-14">
          <h2 id="guide-h" className="font-display text-2xl font-bold">
            Cẩm nang {category.name.toLocaleLowerCase("vi")}
          </h2>
          <ul className={`mt-6 grid gap-5 ${postGridCols(guides.length)}`}>
            {guides.map((p) => (
              <li key={p.id}>
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {category.description && !descFirst && plainText(category.description, 10000).length > 300 && (
        <section aria-label={`Giới thiệu ${category.name}`} className="defer-render mx-auto mt-16 max-w-3xl border-t border-border pt-10">
          <ReadMore>
            {/* Trang khu vực: lưới phía trên đã đủ mẫu, bỏ các khối sản phẩm trong phần mô tả */}
            <CategoryDescription html={category.description} title={category.name} slug={category.slug} withProducts={!isArea} />
          </ReadMore>
        </section>
      )}
    </div>
  );
}

/**
 * Mô tả danh mục nhập từ WordPress: shortcode [ux_products cat="…"] được thay bằng hàng sản phẩm
 * của danh mục tương ứng (như website cũ), kèm link xem tất cả.
 */
async function CategoryDescription({ html, title, slug, withProducts = true }: { html: string; title: string; slug: string; withProducts?: boolean }) {
  const rawSegments = await Promise.all(
    splitCategoryShortcodes(normalizeHeadings(removeDuplicateTitleHeading(html, title))).map(async (seg) => {
      if (seg.type === "html") return seg;
      if (!withProducts) return null;
      const cat = await getCategoryByWooId(seg.wooId);
      if (!cat) return null;
      // 8 mẫu = 2 hàng × 4 cột (2 cột × 4 hàng trên điện thoại)
      const { items } = await getProductsInCategory(cat, { perPage: 8 });
      return { type: "category" as const, label: seg.label || cat.name, category: cat, items };
    }),
  );
  // Làm sạch + link ngữ cảnh tới danh mục khác (tối đa 3, không tự link về chính danh mục này)
  const linked = await addContextualLinksMany(
    rawSegments.map((seg) => (seg?.type === "html" ? cleanHtml(seg.html, { normalize: false, imgAlt: title }) : "")),
    canonicalPath(slug),
    3,
  );
  const segments = rawSegments.map((seg, i) => (seg?.type === "html" ? { ...seg, html: linked[i] } : seg));
  return (
    <div className="space-y-6">
      {segments.map((seg, i) => {
        if (!seg) return null;
        if (seg.type === "html") return <div key={i} className="prose-shop" dangerouslySetInnerHTML={{ __html: seg.html }} />;
        if (!seg.items.length) return null;
        return (
          // Nằm trong cột chữ: phần "Xem thêm" ẩn phần tràn nên không được rộng hơn cột
          <div key={i}>
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h3 className="font-display text-xl font-bold">{seg.label}</h3>
              <Link href={canonicalPath(seg.category.slug)} className="shrink-0 text-sm font-semibold text-brand-strong hover:underline">
                Xem tất cả →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {seg.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Số cột cho lưới thẻ bài viết theo số bài, để hàng luôn đủ (vd. 3 bài -> 3 cột, 4 bài -> 2 hoặc 4 cột). */
function postGridCols(count: number) {
  if (count === 3) return "sm:grid-cols-3";
  if (count === 4) return "sm:grid-cols-2 lg:grid-cols-4";
  if (count === 2) return "sm:grid-cols-2";
  if (count % 3 === 0) return "sm:grid-cols-2 lg:grid-cols-3";
  return "sm:grid-cols-2";
}

/** Chọn số cột để hàng cuối không bị hụt (vd. 8 sản phẩm -> 4 cột, 6 hoặc 9 -> 3 cột). */
function productGridCols(count: number) {
  return count % 4 !== 0 && count % 3 === 0 ? "md:grid-cols-3" : "md:grid-cols-4";
}

async function PostArchiveView({ category, page }: { category: PostCategory; page: number }) {
  const [{ items, pages, total }, allCats] = await Promise.all([getPostsInCategory(category.id, { page }), getPostCategoriesWithCounts()]);
  const base = canonicalPath(category.slug);
  const link = (n: number) => (n === 1 ? base : `${base}?page=${n}`);
  return (
    <div className="container-x py-10">
      <Breadcrumbs items={[{ label: category.name }]} />
      <h1 className="heading-display mt-6 text-4xl sm:text-5xl">{category.name}</h1>
      {category.description && <p className="mt-3 max-w-3xl text-muted">{introText(category.description)}</p>}
      {allCats.length > 1 && (
        <ChipScroller label="Danh mục bài viết">
          <ul className="flex gap-2">
            {allCats.map((c) => (
              <li key={c.slug} className="shrink-0">
                <Link
                  href={canonicalPath(c.slug)}
                  aria-current={c.id === category.id ? "page" : undefined}
                  className={`block rounded-full px-4 py-2 text-sm ${c.id === category.id ? "bg-brand text-white" : "bg-surface ring-1 ring-border hover:ring-brand"}`}
                >
                  {c.name} <span className="opacity-70">({c.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </ChipScroller>
      )}
      <p className="mt-6 text-sm text-muted">{total} bài viết</p>
      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-surface p-10 text-center text-muted">Chưa có bài viết.</p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li key={p.id}>
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

async function CmsView({ page }: { page: Page }) {
  const isPost = page.type === "post";
  const [recent, postCategory, rawSegments, suggestCat, postTags] = await Promise.all([
    isPost ? getRelatedPosts(page.title, { excludeId: page.id, limit: 6 }) : Promise.resolve([]),
    isPost ? getPrimaryPostCategory(page.id) : Promise.resolve(null),
    Promise.all(
      splitProductBlocks(normalizeHeadings(removeDuplicateTitleHeading(page.content, page.title))).map(async (seg) =>
        seg.type === "html" ? seg : { type: "products" as const, products: await getProductCardsBySlugs(seg.slugs) },
      ),
    ),
    isPost ? bestCategoryFor(page.title, page.content) : Promise.resolve(null),
    isPost ? getPageTags(page.id) : Promise.resolve([]),
  ]);
  // Link nội bộ theo ngữ cảnh (tối đa 4 cho cả bài) tới danh mục đang bán, sau khi đã làm sạch HTML
  const linkedHtml = await addContextualLinksMany(
    rawSegments.map((seg) => (seg.type === "html" ? cleanHtml(seg.html, { normalize: false, imgAlt: page.title }) : "")),
    canonicalPath(page.slug),
    isPost ? undefined : 0,
  );
  const segments = rawSegments.map((seg, i) => (seg.type === "html" ? { ...seg, html: linkedHtml[i] } : seg));
  const suggestCategory = suggestCat ? await getCategoryBySlug(suggestCat.slug) : null;
  const hub = cityHubs[page.slug];
  const hubStores = (hub?.stores ?? [])
    .map((slug) => ({ slug, ...storeAreas[slug] }))
    .filter((st) => st.street)
    .map((st) => ({
      ...st,
      ld: {
        "@context": "https://schema.org",
        "@type": "Florist",
        name: `${site.name} – ${st.street}`,
        url: `${site.url}/${st.slug}/`,
        image: `${site.url}/brand/banner2.webp`,
        telephone: "+84" + site.phone.replace(/^0/, ""),
        openingHours: "Mo-Su 06:00-21:00",
        address: { "@type": "PostalAddress", streetAddress: st.street, addressLocality: st.city, addressCountry: "VN" },
        parentOrganization: { "@id": `${site.url}/#organization` },
      },
    }));
  const suggested = suggestCategory ? (await getProductsInCategory(suggestCategory, { perPage: 4 })).items : [];
  const jsonLd = isPost
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: page.title,
        // Google yêu cầu "image" cho Article: ảnh đại diện, nếu không có thì ảnh đầu tiên trong bài, cuối cùng là ảnh thương hiệu
        image: [absUrl(page.image || page.content?.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || "/brand/banner2.webp")],
        datePublished: page.publishedAt.toISOString(),
        dateModified: page.updatedAt.toISOString(),
        publisher: { "@type": "Organization", name: site.name },
      }
    : null;
  return (
    <div className="container-x max-w-3xl py-10">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <Breadcrumbs items={[...(postCategory ? [{ label: postCategory.name, href: canonicalPath(postCategory.slug) }] : []), { label: page.title }]} />
      <h1 className="heading-display mt-6 text-[1.875rem] leading-tight sm:text-4xl lg:text-5xl">{page.title}</h1>
      {isPost && (
        <p className="mt-3 text-sm text-muted">
          <time dateTime={page.publishedAt.toISOString()}>{page.publishedAt.toLocaleDateString("vi-VN")}</time>
        </p>
      )}
      {hub && (
        // Trang thành phố dạng bài viết: cửa hàng thật + link các quận ngay dưới tiêu đề
        <section aria-label={`Cửa hàng và khu vực giao hoa ${hub.city}`} className="mt-6 rounded-2xl bg-surface p-5 ring-1 ring-border">
          {hubStores.map((st) => (
            <script key={st.slug} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(st.ld).replace(/</g, "\\u003c") }} />
          ))}
          <h2 className="font-semibold">Cửa hàng hoa tại {hub.city}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {hubStores.map((st) => (
              <li key={st.slug}>
                <Link href={`/${st.slug}/`} className="font-medium text-brand-strong hover:underline">
                  {st.street}
                </Link>{" "}
                <span className="text-muted">· mở cửa 06:00–21:00</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-semibold">Giao hoa theo quận</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {hub.areas.map((a) => (
              <li key={a.slug}>
                <Link href={`/${a.slug}/`} className="block rounded-full bg-surface-muted px-3 py-1.5 text-sm ring-1 ring-border hover:ring-brand">
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <article className="mt-8 space-y-8">
        {segments.map((seg, i) =>
          seg.type === "html" ? (
            <div key={i} className="prose-shop" dangerouslySetInnerHTML={{ __html: seg.html }} />
          ) : (
            <div key={i} className={`grid grid-cols-2 gap-3 sm:gap-4 lg:-mx-24 ${productGridCols(seg.products.length)}`}>
              {seg.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ),
        )}
      </article>
      <TagList tags={postTags} className="mt-10" />
      {suggestCategory && suggested.length > 0 && (
        <section aria-labelledby="suggest-h" className="defer-render mt-14 lg:-mx-24">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="suggest-h" className="heading-display text-3xl">
              Mẫu {suggestCategory.name.toLocaleLowerCase("vi")} đẹp tại Thanh Nhã
            </h2>
            <Link href={canonicalPath(suggestCategory.slug)} className="shrink-0 text-sm font-semibold text-brand-strong hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {suggested.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      {recent.length > 0 && (
        <section aria-labelledby="recent-h" className="defer-render mt-16 border-t border-border pt-10">
          <h2 id="recent-h" className="heading-display text-3xl">
            Bài viết liên quan
          </h2>
          <ul className={`mt-6 grid gap-5 ${postGridCols(recent.length)}`}>
            {recent.map((p) => (
              <li key={p.id}>
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function InfoView({ page }: { page: InfoPage }) {
  return (
    <div className="container-x max-w-3xl py-10">
      <Breadcrumbs items={[{ label: page.title }]} />
      <h1 className="heading-display mt-6 text-4xl sm:text-5xl">{page.title}</h1>
      <div className="mt-8 space-y-8">
        {page.sections.map((s, i) => (
          <section key={s.heading ?? i}>
            {s.heading && <h2 className="font-display text-2xl font-bold">{s.heading}</h2>}
            <div className="mt-3 space-y-2 leading-relaxed text-muted">
              {s.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

async function ProductView({ data }: { data: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>> }) {
  const { product, categories } = data;
  const price = effectivePrice(product);
  const onSale = price < product.price;
  const [related, guides, productTagList] = await Promise.all([
    getRelatedProducts(product.id, categories.map((c) => c.id)),
    getGuidePosts(`${product.name} ${categories.map((c) => c.name).join(" ")}`, 3),
    getProductTags(product.id),
  ]);
  const primaryCat = categories.find((c) => c.parentId != null) ?? categories[0];
  const shipping = shippingConfig();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map(absUrl),
    sku: product.sku ?? undefined,
    description: plainText(product.shortDescription || product.description, 300),
    brand: { "@type": "Brand", name: site.name },
    offers:
      price > 0
        ? {
            "@type": "Offer",
            priceCurrency: "VND",
            price,
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            url: `${site.url}/${product.slug}/`,
            seller: { "@type": "Organization", name: site.name },
            // Dữ liệu cho "Merchant listings" của Google: phí giao theo cấu hình, giao trong ngày
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: { "@type": "MonetaryAmount", value: price >= shipping.freeThreshold ? 0 : shipping.fee, currency: "VND" },
              shippingDestination: { "@type": "DefinedRegion", addressCountry: "VN" },
              deliveryTime: {
                "@type": "ShippingDeliveryTime",
                handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
                transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
              },
            },
            // Theo trang "Chính sách hoàn tiền và trả hàng": đổi trả trong 24 giờ
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "VN",
              returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: 1,
              merchantReturnLink: `${site.url}/chinh-sach-hoan-tien-va-tra-hang/`,
            },
          }
        : undefined,
  };

  return (
    <div className="container-x py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {price > 0 && <ViewItemTracker id={product.id} name={product.name} price={price} />}
      <Breadcrumbs items={[...(primaryCat ? [{ label: primaryCat.name, href: `/${primaryCat.slug}/` }] : []), { label: product.name }]} />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            {product.sku && <p className="text-xs uppercase tracking-widest text-muted">Mã: {product.sku}</p>}
            <h1 className="heading-display mt-2 text-3xl leading-tight sm:text-4xl">{product.name}</h1>
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              {price > 0 ? (
                <>
                  <span className="text-3xl font-semibold text-brand-strong">{formatVND(price)}</span>
                  {onSale && <span className="text-lg text-muted line-through">{formatVND(product.price)}</span>}
                </>
              ) : (
                <span className="text-2xl font-semibold text-leaf">Liên hệ để báo giá</span>
              )}
            </div>
          </div>

          {product.shortDescription && (
            <div className="prose-shop text-[15px] text-muted" dangerouslySetInnerHTML={{ __html: cleanHtml(product.shortDescription, { imgAlt: product.name }) }} />
          )}

          {price > 0 ? (
            <AddToCart product={{ id: product.id, slug: product.slug, name: product.name, image: product.images[0] ?? null, price }} />
          ) : null}
          <WishlistButton item={{ id: product.id, slug: product.slug, name: product.name, image: product.images[0] ?? null, price }} />

          <div className="grid gap-3 sm:grid-cols-2">
            <a href={`tel:${site.phone}`} className="btn-leaf h-12">
              <Phone className="size-4" aria-hidden /> Gọi {site.phoneDisplay}
            </a>
            <a href={site.zalo} target="_blank" rel="noopener noreferrer" className="btn-outline h-12">
              <ZaloIcon className="size-5 rounded" /> Tư vấn qua Zalo
            </a>
          </div>

          <ul className="grid gap-3 rounded-2xl bg-surface-muted p-5 text-sm sm:grid-cols-2">
            <li className="flex gap-3">
              <Truck className="size-5 shrink-0 text-brand-strong" aria-hidden /> Giao hỏa tốc 60–90 phút
            </li>
            <li className="flex gap-3">
              <Gift className="size-5 shrink-0 text-brand-strong" aria-hidden /> Tặng thiệp & băng rôn miễn phí
            </li>
            <li className="flex gap-3">
              <Camera className="size-5 shrink-0 text-brand-strong" aria-hidden /> Chụp ảnh hoa trước khi giao
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0 text-brand-strong" aria-hidden /> Không đúng mẫu – không thanh toán
            </li>
          </ul>
        </div>
      </div>

      {product.description && (
        <section aria-labelledby="desc-h" className="defer-render mx-auto mt-16 max-w-3xl">
          <h2 id="desc-h" className="heading-display text-3xl">
            Mô tả sản phẩm
          </h2>
          <div className="prose-shop mt-6" dangerouslySetInnerHTML={{ __html: cleanHtml(removeDuplicateTitleHeading(product.description, product.name), { imgAlt: product.name }) }} />
          <TagList tags={productTagList} className="mt-8" />
        </section>
      )}
      {!product.description && <TagList tags={productTagList} className="mx-auto mt-12 max-w-3xl" />}

      {related.length > 0 && (
        <section aria-labelledby="rel-h" className="defer-render mt-16">
          <h2 id="rel-h" className="heading-display text-3xl">
            Có thể bạn cũng thích
          </h2>
          <div className="mt-6">
            <ProductGrid products={related.slice(0, 4)} layout="four" />
          </div>
        </section>
      )}
      {guides.length > 0 && (
        <section aria-labelledby="guide-h" className="defer-render mt-16">
          <h2 id="guide-h" className="heading-display text-3xl">
            Cẩm nang chọn hoa
          </h2>
          <ul className={`mt-6 grid gap-5 ${postGridCols(guides.length)}`}>
            {guides.map((p) => (
              <li key={p.id}>
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Đường dẫn ảnh tuyệt đối cho dữ liệu có cấu trúc (JSON-LD): "/uploads/a.webp" -> "https://hoathanhnha.com/uploads/a.webp". */
function absUrl(src: string) {
  return /^https?:\/\//i.test(src) ? src : `${site.url}${src.startsWith("/") ? "" : "/"}${src}`;
}

/**
 * Xếp xen kẽ sản phẩm theo loại (nhận từ đầu tên: "Hoa Bó", "Hoa Giỏ", "Lan Hồ Điệp"…) rồi chia trang.
 * Hoa chia buồn và mẫu giá "Liên hệ" xếp sau cùng để đầu trang khu vực là các mẫu tặng phổ biến.
 */
function paginateMixed(all: ProductCardData[], page: number, perPage: number) {
  const late = (p: ProductCardData) => /chia buồn|tang lễ|đám tang/i.test(p.name) || effectivePrice(p) <= 0;
  const groups = new Map<string, ProductCardData[]>();
  for (const p of all.filter((x) => !late(x))) {
    const key = p.name.split(/\s+[–-]\s+/)[0].toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  const lists = [...groups.values()];
  const mixed: ProductCardData[] = [];
  for (let i = 0; lists.some((l) => i < l.length); i++) for (const l of lists) if (i < l.length) mixed.push(l[i]);
  mixed.push(...all.filter(late));
  const pages = Math.max(1, Math.ceil(mixed.length / perPage));
  return { items: mixed.slice((page - 1) * perPage, page * perPage), total: mixed.length, pages };
}
