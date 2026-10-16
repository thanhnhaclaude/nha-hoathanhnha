import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/don-hang/", "/*?add-to-cart=", "/*?*add-to-cart="] },
    sitemap: `${site.url}/sitemap_index.xml`,
  };
}
