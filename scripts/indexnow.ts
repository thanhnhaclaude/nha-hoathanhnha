/**
 * Báo cho Bing (và các công cụ dùng IndexNow: Yandex, Seznam, Naver…) toàn bộ URL trong sitemap.
 *
 *   npm run seo:indexnow                         # mọi URL trong https://hoathanhnha.com/sitemap_index.xml
 *   npm run seo:indexnow -- /hoa-20-11-tang-thay-co/ /gia-ke-hoa-khai-truong/   # chỉ vài URL (bài mới)
 *
 * Khóa IndexNow là file public/<khóa>.txt (công khai theo thiết kế của giao thức, không phải mật khẩu).
 * Google KHÔNG dùng IndexNow: với Google, gửi sitemap trong Search Console và dùng "Kiểm tra URL".
 */
const KEY = "1077f66c7c9b4181925ae2f57700fd74";
const ORIGIN = "https://hoathanhnha.com";

async function sitemapUrls() {
  const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const index = await (await fetch(`${ORIGIN}/sitemap_index.xml`)).text();
  const urls: string[] = [];
  for (const sm of locs(index)) urls.push(...locs(await (await fetch(sm)).text()));
  return [...new Set(urls)];
}

async function main() {
  const paths = process.argv.slice(2).filter((a) => a.startsWith("/"));
  const urls = paths.length ? paths.map((p) => ORIGIN + p) : await sitemapUrls();
  // Kiểm tra file khóa đã có trên website (bắt buộc với IndexNow)
  const keyRes = await fetch(`${ORIGIN}/${KEY}.txt`);
  if (!keyRes.ok || (await keyRes.text()).trim() !== KEY) {
    throw new Error(`Chưa thấy file khóa ${ORIGIN}/${KEY}.txt — hãy triển khai website bản mới trước.`);
  }
  for (let i = 0; i < urls.length; i += 10000) {
    const batch = urls.slice(i, i + 10000);
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: new URL(ORIGIN).host, key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList: batch }),
    });
    // 200/202 = đã nhận; 422 = URL không thuộc host; 429 = gửi quá nhiều
    console.log(`Gửi ${batch.length} URL → HTTP ${r.status} ${r.status === 200 || r.status === 202 ? "(đã nhận)" : await r.text()}`);
  }
  console.log("Xem kết quả trong Bing Webmaster Tools → IndexNow (sau vài giờ).");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
