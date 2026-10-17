/**
 * Kiểm tra SEO toàn website qua HTTP (giống cách Googlebot đọc trang).
 *
 *   npm run seo:audit                                  # bản chạy trên máy (http://localhost:3300)
 *   npm run seo:audit -- https://hoathanhnha.com       # website thật
 *
 * Với mỗi URL trong sitemap: mã trả về, noindex, canonical, tiêu đề, mô tả, H1, số link trỏ về
 * (không tính menu/footer), link nội bộ hỏng. Kết quả: tóm tắt trên màn hình + reports/seo-audit-<ngày>.csv
 * Mở file CSV bằng Excel/Google Sheets để lọc trang có vấn đề.
 */
import fs from "node:fs";
import path from "node:path";

const BASE = (process.argv[2] || "http://localhost:3300").replace(/\/$/, "");
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const CONCURRENCY = Number(process.env.AUDIT_CONCURRENCY || 6);

type Page = {
  path: string;
  sitemap: string;
  status: number;
  location: string;
  noindex: boolean;
  canonicalOk: boolean;
  title: string;
  description: string;
  h1: number;
  inbound: Set<string>;
  issues: string[];
};

async function get(url: string) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": UA }, redirect: "manual" });
      return { status: r.status, location: r.headers.get("location") ?? "", text: r.status === 200 ? await r.text() : "" };
    } catch {
      await new Promise((res) => setTimeout(res, 1500));
    }
  }
  return { status: 0, location: "", text: "" };
}

const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const meta = (head: string, name: string) =>
  decode(head.match(new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]*)"`, "i"))?.[1] ?? "");

async function pool<T>(items: T[], fn: (item: T) => Promise<void>) {
  const queue = [...items];
  let done = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        await fn(queue.shift()!);
        if (++done % 200 === 0) process.stdout.write(`  … ${done}/${items.length}\n`);
      }
    }),
  );
}

async function main() {
  console.log(`Kiểm tra ${BASE}`);
  const index = await get(`${BASE}/sitemap_index.xml`);
  if (index.status !== 200) throw new Error(`Không đọc được ${BASE}/sitemap_index.xml (mã ${index.status})`);
  const pages = new Map<string, Page>();
  for (const sm of locs(index.text)) {
    const name = sm.replace(/^\//, "").replace("-sitemap.xml", "");
    for (const p of locs((await get(BASE + sm)).text)) {
      if (!pages.has(p)) pages.set(p, { path: p, sitemap: name, status: 0, location: "", noindex: false, canonicalOk: false, title: "", description: "", h1: 0, inbound: new Set(), issues: [] });
    }
  }
  console.log(`Sitemap: ${pages.size} URL. Đang tải từng trang…`);

  const outLinks = new Map<string, Set<string>>();
  await pool([...pages.values()], async (pg) => {
    const r = await get(BASE + pg.path);
    pg.status = r.status;
    pg.location = r.location;
    if (r.status !== 200) return;
    const head = r.text.slice(0, r.text.indexOf("</head>") + 7);
    pg.title = decode(head.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
    pg.description = meta(head, "description");
    pg.noindex = /noindex/i.test(meta(head, "robots"));
    const canonical = head.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1] ?? "";
    pg.canonicalOk = canonical ? new URL(canonical, BASE).pathname === pg.path : false;
    pg.h1 = (r.text.match(/<h1\b/gi) || []).length;
    // Link trong phần nội dung (bỏ header/footer lặp lại trên mọi trang)
    const main = r.text.replace(/<header[\s\S]*?<\/header>/, "").replace(/<footer[\s\S]*?<\/footer>/, "");
    outLinks.set(pg.path, new Set([...main.matchAll(/href="(\/[^"#?]*)/g)].map((m) => m[1]).filter((h) => !h.startsWith("/_next") && !/\.[a-z0-9]+$/i.test(h))));
  });

  // Link trỏ về + link nội bộ hỏng
  const targets = new Set<string>();
  for (const [from, set] of outLinks) for (const to of set) {
    targets.add(to);
    if (to !== from && pages.has(to)) pages.get(to)!.inbound.add(from);
  }
  const broken: [string, number, string][] = [];
  await pool([...targets].filter((t) => !pages.has(t)), async (t) => {
    const r = await get(BASE + t);
    if (r.status >= 400 || r.status === 0) {
      const from = [...outLinks].find(([, s]) => s.has(t))?.[0] ?? "";
      broken.push([t, r.status, from]);
    }
  });

  // Đánh giá từng trang
  const titles = new Map<string, string[]>();
  for (const pg of pages.values()) {
    if (pg.status !== 200) pg.issues.push(pg.status >= 300 && pg.status < 400 ? `chuyển hướng → ${pg.location}` : `mã ${pg.status}`);
    else {
      if (pg.noindex) pg.issues.push("noindex nhưng nằm trong sitemap");
      if (!pg.canonicalOk) pg.issues.push("canonical không trỏ về chính trang");
      if (!pg.title) pg.issues.push("thiếu title");
      if (!pg.description) pg.issues.push("thiếu mô tả");
      else if (pg.description.length > 170) pg.issues.push(`mô tả dài ${pg.description.length} ký tự`);
      if (pg.h1 !== 1) pg.issues.push(`${pg.h1} thẻ H1`);
      if (pg.inbound.size === 0 && pg.path !== "/") pg.issues.push("trang mồ côi (không trang nào trỏ tới, ngoài menu/footer)");
      if (!pg.noindex) titles.set(pg.title, [...(titles.get(pg.title) ?? []), pg.path]);
    }
  }
  for (const [t, ps] of titles) if (t && ps.length > 1) for (const p of ps) pages.get(p)!.issues.push(`trùng tiêu đề với ${ps.filter((x) => x !== p).join(" ")}`);

  // Báo cáo
  const all = [...pages.values()];
  const ok = all.filter((p) => p.status === 200 && !p.noindex && p.canonicalOk);
  console.log(`\nSẵn sàng lập chỉ mục: ${ok.length}/${all.length} URL (200, không noindex, canonical đúng)`);
  const bySitemap = new Map<string, Page[]>();
  for (const p of all) bySitemap.set(p.sitemap, [...(bySitemap.get(p.sitemap) ?? []), p]);
  for (const [name, list] of bySitemap) {
    const avg = Math.round(list.reduce((s, p) => s + p.inbound.size, 0) / list.length);
    console.log(`  ${name.padEnd(9)} ${String(list.length).padStart(4)} URL · có vấn đề: ${list.filter((p) => p.issues.length).length} · trung bình ${avg} link trỏ về`);
  }
  const counts = new Map<string, number>();
  for (const p of all) for (const i of p.issues) {
    const key = i.replace(/ \d+ ký tự| → .*| với .*/g, "");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (counts.size) {
    console.log("\nVấn đề:");
    for (const [k, n] of [...counts].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)} × ${k}`);
  }
  if (broken.length) {
    console.log("\nLink nội bộ hỏng:");
    for (const [t, s, from] of broken) console.log(`  ${t} (mã ${s}) — có trong ${from}`);
  }

  fs.mkdirSync("reports", { recursive: true });
  const file = path.join("reports", `seo-audit-${new Date().toISOString().slice(0, 10)}.csv`);
  const csv = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [
    ["URL", "Sitemap", "Mã", "Noindex", "Canonical đúng", "Tiêu đề", "Độ dài mô tả", "H1", "Link trỏ về", "Vấn đề"],
    ...all.map((p) => [BASE + p.path, p.sitemap, p.status, p.noindex ? "có" : "", p.canonicalOk ? "đúng" : "SAI", p.title, p.description.length, p.h1, p.inbound.size, p.issues.join("; ")]),
  ];
  fs.writeFileSync(file, "﻿" + rows.map((r) => r.map(csv).join(",")).join("\n"));
  console.log(`\nChi tiết từng URL: ${file}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
