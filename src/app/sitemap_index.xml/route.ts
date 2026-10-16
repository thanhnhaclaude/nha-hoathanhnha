import { indexXml, xmlResponse } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  return xmlResponse(await indexXml());
}
