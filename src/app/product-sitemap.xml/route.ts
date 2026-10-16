import { sitemapEntries, urlsetXml, xmlResponse } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  return xmlResponse(urlsetXml(await sitemapEntries("product")));
}
