import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, categories, products } from "@/lib/db";
import { infoPages } from "@/lib/info-pages";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [prods, cats] = await Promise.all([
    db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.isActive, true)),
    db.select({ slug: categories.slug }).from(categories),
  ]);
  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    ...cats.map((c) => ({ url: `${site.url}/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...prods.map((p) => ({ url: `${site.url}/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
    ...Object.keys(infoPages).map((slug) => ({ url: `${site.url}/${slug}`, priority: 0.3 })),
  ];
}
