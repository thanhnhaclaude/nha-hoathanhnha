import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, categories, pages, products } from "@/lib/db";
import { infoPages } from "@/lib/info-pages";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [prods, cats, cms] = await Promise.all([
    db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.isActive, true)),
    db.select({ slug: categories.slug }).from(categories),
    db.select({ slug: pages.slug, type: pages.type, updatedAt: pages.updatedAt }).from(pages).where(eq(pages.isPublished, true)),
  ]);
  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/tin-tuc`, changeFrequency: "weekly", priority: 0.5 },
    ...cms.map((p) => ({ url: `${site.url}/${p.slug}`, lastModified: p.updatedAt, priority: p.type === "post" ? 0.5 : 0.3 })),
    ...cats.map((c) => ({ url: `${site.url}/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...prods.map((p) => ({ url: `${site.url}/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
    ...Object.keys(infoPages).map((slug) => ({ url: `${site.url}/${slug}`, priority: 0.3 })),
  ];
}
