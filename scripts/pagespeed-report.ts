/**
 * Đo tốc độ + Core Web Vitals bằng PageSpeed Insights API (Google), mặc định trên điện thoại.
 *
 *   npm run seo:speed                                   # các trang quan trọng của https://hoathanhnha.com
 *   npm run seo:speed -- https://hoathanhnha.com /hoa-bo/ /y-nghia-cua-hoa-mimosa/
 *   npm run seo:speed -- --desktop                      # đo trên máy tính
 *
 * Hai loại số liệu:
 *  - "Thực tế" (CrUX): đo từ người dùng Chrome thật trong 28 ngày — đây là số Google dùng để xếp hạng.
 *    Trang ít khách có thể chưa có, khi đó dùng số của cả website (origin).
 *  - "Phòng thí nghiệm" (Lighthouse): một lần tải mô phỏng, dùng để tìm nguyên nhân chậm.
 * Cần PAGESPEED_API_KEY trong .env. Kết quả: màn hình + reports/pagespeed-<ngày>.csv
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const strategy = args.includes("--desktop") ? "desktop" : "mobile";
const rest = args.filter((a) => !a.startsWith("--"));
const BASE = (rest.find((a) => /^https?:\/\//.test(a)) || "https://hoathanhnha.com").replace(/\/$/, "");
const DEFAULT_PATHS = ["/", "/hoa-khai-truong/", "/hoa-sinh-nhat/", "/hoa-bo/", "/hoa-chia-buon/", "/shop-hoa-tuoi-quan-1/", "/hoa-bo-hb165/", "/y-nghia-cua-hoa-mimosa/"];
const PATHS = rest.filter((a) => a.startsWith("/")).length ? rest.filter((a) => a.startsWith("/")) : DEFAULT_PATHS;
const KEY = process.env.PAGESPEED_API_KEY;

type Metric = { percentile?: number; category?: string };
type Psi = {
  loadingExperience?: { metrics?: Record<string, Metric>; overall_category?: string; origin_fallback?: boolean };
  originLoadingExperience?: { metrics?: Record<string, Metric>; overall_category?: string };
  lighthouseResult?: {
    categories: { performance: { score: number } };
    audits: Record<string, { numericValue?: number; displayValue?: string; title?: string; details?: { overallSavingsMs?: number }; score?: number | null }>;
  };
  error?: { message: string };
};

const LABEL: Record<string, string> = { FAST: "Tốt", AVERAGE: "Cần cải thiện", SLOW: "Kém" };
const ms = (v?: number) => (v == null ? "-" : v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}ms`);

async function measure(p: string) {
  const url = `${BASE}${p}`;
  const q = new URLSearchParams({ url, strategy, category: "performance", locale: "vi" });
  if (KEY) q.set("key", KEY);
  for (let i = 0; i < 2; i++) {
    const r = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`);
    const j = (await r.json()) as Psi;
    if (r.ok && j.lighthouseResult) return { p, j };
    if (i === 1) return { p, error: j.error?.message ?? `HTTP ${r.status}` };
  }
  return { p, error: "không đo được" };
}

async function main() {
  if (!KEY) console.log("Chưa có PAGESPEED_API_KEY trong .env — vẫn chạy được nhưng dễ bị giới hạn lượt gọi.");
  console.log(`PageSpeed (${strategy === "mobile" ? "điện thoại" : "máy tính"}) — ${BASE}, ${PATHS.length} trang. Mỗi trang mất 15–40 giây…\n`);
  const results: Awaited<ReturnType<typeof measure>>[] = [];
  const queue = [...PATHS];
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (queue.length) results.push(await measure(queue.shift()!));
    }),
  );
  results.sort((a, b) => PATHS.indexOf(a.p) - PATHS.indexOf(b.p));

  const rows = [["URL", "Điểm hiệu năng", "LCP thực tế", "INP thực tế", "CLS thực tế", "Đánh giá thực tế", "Nguồn thực tế", "LCP lab", "TBT lab", "CLS lab", "Cải thiện lớn nhất"]];
  const fixes = new Map<string, { title: string; pages: number; saving: number }>();
  let origin: Psi["originLoadingExperience"] | undefined;

  for (const r of results) {
    if ("error" in r && r.error) {
      console.log(`✗ ${r.p}  lỗi: ${r.error}`);
      continue;
    }
    const j = (r as { j: Psi }).j;
    const lh = j.lighthouseResult!;
    const score = Math.round(lh.categories.performance.score * 100);
    const field = j.loadingExperience;
    origin ??= j.originLoadingExperience;
    const m = field?.metrics ?? {};
    const fieldSource = !m.LARGEST_CONTENTFUL_PAINT_MS ? "chưa đủ dữ liệu" : field?.origin_fallback ? "cả website" : "riêng trang";
    const a = lh.audits;
    // Gợi ý cải thiện: các audit "cơ hội" có thời gian tiết kiệm ước tính
    const opps = Object.values(a)
      .filter((x) => (x.details?.overallSavingsMs ?? 0) > 150 && x.score != null && x.score < 0.9)
      .sort((x, y) => (y.details!.overallSavingsMs ?? 0) - (x.details!.overallSavingsMs ?? 0));
    for (const o of opps) {
      const e = fixes.get(o.title!) ?? { title: o.title!, pages: 0, saving: 0 };
      e.pages++;
      e.saving = Math.max(e.saving, o.details!.overallSavingsMs ?? 0);
      fixes.set(o.title!, e);
    }
    const icon = score >= 90 ? "●" : score >= 50 ? "◐" : "○";
    console.log(
      `${icon} ${String(score).padStart(3)}  ${r.p.padEnd(34)} thực tế: LCP ${ms(m.LARGEST_CONTENTFUL_PAINT_MS?.percentile)} · INP ${ms(m.INTERACTION_TO_NEXT_PAINT?.percentile)} · CLS ${m.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile != null ? (m.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100).toFixed(2) : "-"} (${LABEL[field?.overall_category ?? ""] ?? fieldSource})`,
    );
    rows.push([
      BASE + r.p,
      String(score),
      ms(m.LARGEST_CONTENTFUL_PAINT_MS?.percentile),
      ms(m.INTERACTION_TO_NEXT_PAINT?.percentile),
      m.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile != null ? (m.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100).toFixed(2) : "",
      LABEL[field?.overall_category ?? ""] ?? "",
      fieldSource,
      ms(a["largest-contentful-paint"]?.numericValue),
      ms(a["total-blocking-time"]?.numericValue),
      a["cumulative-layout-shift"]?.displayValue ?? "",
      opps[0]?.title ?? "",
    ]);
  }

  if (origin?.metrics) {
    const o = origin.metrics;
    console.log(
      `\nCả website (người dùng thật, 28 ngày): LCP ${ms(o.LARGEST_CONTENTFUL_PAINT_MS?.percentile)} · INP ${ms(o.INTERACTION_TO_NEXT_PAINT?.percentile)} · CLS ${o.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile != null ? (o.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100).toFixed(2) : "-"} → ${LABEL[origin.overall_category ?? ""] ?? "chưa đủ dữ liệu"}`,
    );
    console.log("Ngưỡng 'Tốt' của Google: LCP ≤ 2,5s · INP ≤ 200ms · CLS ≤ 0,1");
  }
  if (fixes.size) {
    console.log("\nViệc nên sửa (gặp ở nhiều trang, tiết kiệm nhiều nhất):");
    for (const f of [...fixes.values()].sort((a, b) => b.pages - a.pages || b.saving - a.saving).slice(0, 8)) {
      console.log(`  ${f.pages} trang · tiết kiệm tới ${ms(f.saving)} · ${f.title}`);
    }
  }

  fs.mkdirSync("reports", { recursive: true });
  const file = path.join("reports", `pagespeed-${strategy}-${new Date().toISOString().slice(0, 10)}.csv`);
  const csv = (v: string) => `"${v.replace(/"/g, '""')}"`;
  fs.writeFileSync(file, "﻿" + rows.map((r) => r.map(csv).join(",")).join("\n"));
  console.log(`\nĐã lưu: ${file}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
