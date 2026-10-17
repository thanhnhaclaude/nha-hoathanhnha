/**
 * Báo cáo index + thứ hạng từ Google Search Console (API chính thức của Google).
 *
 *   npm run seo:gsc                 # thứ hạng từ khóa + kiểm tra index các bài trong content/bai-viet
 *   npm run seo:gsc -- --index-all  # kiểm tra index thêm 200 URL đầu trong sitemap (hạn mức 2.000 URL/ngày)
 *
 * Cài đặt một lần (khoảng 10 phút):
 *  1. https://console.cloud.google.com → tạo dự án → "APIs & Services" → bật "Google Search Console API".
 *  2. "Credentials" → "Create credentials" → "Service account" → tạo xong vào tab "Keys" → "Add key" → JSON.
 *     Lưu file vào thư mục dự án với tên google-key.json (đã nằm trong .gitignore, không lên GitHub).
 *  3. Search Console → Cài đặt → Người dùng và quyền → Thêm người dùng: email của service account
 *     (dạng ...@...iam.gserviceaccount.com), quyền "Đầy đủ".
 *  4. Trong .env: GSC_SITE="sc-domain:hoathanhnha.com" (thuộc tính Miền) hoặc "https://hoathanhnha.com/"
 *     (thuộc tính Tiền tố URL) — đúng loại thuộc tính bạn đang có trong Search Console.
 *
 * Kết quả: tóm tắt trên màn hình + reports/gsc-tu-khoa-<ngày>.csv và reports/gsc-index-<ngày>.csv
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { SignJWT, importPKCS8 } from "jose";

const KEY_FILE = process.env.GSC_KEY_FILE || "google-key.json";
const SITE = process.env.GSC_SITE || "sc-domain:hoathanhnha.com";
const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL_PRODUCTION || "https://hoathanhnha.com").replace(/\/$/, "");
const KEYWORDS_FILE = path.join("content", "tu-khoa.txt");
const ARTICLES_DIR = path.join("content", "bai-viet");

async function accessToken() {
  if (!fs.existsSync(KEY_FILE)) {
    throw new Error(`Chưa có ${KEY_FILE}. Xem hướng dẫn cài đặt ở đầu file scripts/gsc-report.ts`);
  }
  const key = JSON.parse(fs.readFileSync(KEY_FILE, "utf8")) as { client_email: string; private_key: string };
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ scope: "https://www.googleapis.com/auth/webmasters.readonly" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(key.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(await importPKCS8(key.private_key, "RS256"));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  const j = (await r.json()) as { access_token?: string; error_description?: string };
  if (!j.access_token) throw new Error(`Không lấy được quyền truy cập: ${j.error_description ?? r.status}`);
  return j.access_token;
}

async function api<T>(token: string, url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) {
    const msg = (j as { error?: { message?: string } }).error?.message ?? r.statusText;
    if (r.status === 403) throw new Error(`Search Console từ chối (${msg}). Đã thêm email service account vào Search Console và GSC_SITE đúng loại thuộc tính chưa?`);
    throw new Error(msg);
  }
  return j as T;
}

const day = (offset: number) => new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
const lower = (s: string) => s.toLocaleLowerCase("vi").trim();

type Row = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function searchAnalytics(token: string, start: string, end: string) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`;
  const rows: Row[] = [];
  for (let startRow = 0; startRow < 25000; startRow += 5000) {
    const res = await api<{ rows?: Row[] }>(token, url, { startDate: start, endDate: end, dimensions: ["query", "page"], rowLimit: 5000, startRow, dataState: "final" });
    rows.push(...(res.rows ?? []));
    if ((res.rows ?? []).length < 5000) break;
  }
  return rows;
}

/** Gộp theo từ khóa: vị trí trung bình có trọng số theo lượt hiển thị; trang có nhiều lượt hiển thị nhất. */
function byQuery(rows: Row[]) {
  const m = new Map<string, { clicks: number; impressions: number; posSum: number; page: string; pageImpr: number }>();
  for (const r of rows) {
    const q = lower(r.keys[0]);
    const e = m.get(q) ?? { clicks: 0, impressions: 0, posSum: 0, page: "", pageImpr: 0 };
    e.clicks += r.clicks;
    e.impressions += r.impressions;
    e.posSum += r.position * r.impressions;
    if (r.impressions > e.pageImpr) {
      e.page = r.keys[1];
      e.pageImpr = r.impressions;
    }
    m.set(q, e);
  }
  return m;
}

function targetKeywords() {
  const fromFile = fs.existsSync(KEYWORDS_FILE)
    ? fs.readFileSync(KEYWORDS_FILE, "utf8").split(/\r?\n/).map((l) => l.replace(/#.*/, "").trim()).filter(Boolean)
    : [];
  const fromArticles = fs.existsSync(ARTICLES_DIR)
    ? fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".md")).map((f) => fs.readFileSync(path.join(ARTICLES_DIR, f), "utf8").match(/^keyword:\s*(.+)$/m)?.[1].trim() ?? "")
    : [];
  return [...new Set([...fromFile, ...fromArticles].map(lower).filter(Boolean))];
}

function articleUrls() {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  const today = new Date().toISOString().slice(0, 10);
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => fs.readFileSync(path.join(ARTICLES_DIR, f), "utf8"))
    .filter((t) => (t.match(/^publish:\s*(\S+)/m)?.[1] ?? "9999") <= today) // chỉ bài đã tới ngày đăng
    .map((t) => `${ORIGIN}/${t.match(/^slug:\s*(\S+)/m)?.[1]}/`);
}

type Inspection = { inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; lastCrawlTime?: string; googleCanonical?: string } } };

async function main() {
  const token = await accessToken();
  fs.mkdirSync("reports", { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const csv = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  // 1) Thứ hạng: 28 ngày gần nhất (dữ liệu Search Console trễ ~3 ngày) so với 28 ngày trước đó
  const [now, prev] = await Promise.all([searchAnalytics(token, day(30), day(3)), searchAnalytics(token, day(58), day(31))]);
  const cur = byQuery(now);
  const old = byQuery(prev);
  const total = (m: typeof cur) => [...m.values()].reduce((s, e) => ({ c: s.c + e.clicks, i: s.i + e.impressions }), { c: 0, i: 0 });
  const tc = total(cur);
  const to = total(old);
  console.log(`Search Console ${SITE}: 28 ngày qua ${tc.c} lượt nhấp, ${tc.i} lượt hiển thị (kỳ trước ${to.c} / ${to.i})`);

  const kws = targetKeywords();
  const lines = [["Từ khóa", "Vị trí TB", "Vị trí kỳ trước", "Thay đổi", "Lượt nhấp", "Lượt hiển thị", "CTR %", "Trang xếp hạng"]];
  console.log(`\nTừ khóa mục tiêu (${kws.length}):`);
  for (const k of kws) {
    // Gộp cả các truy vấn chứa từ khóa (vd. "hoa 20/11 đẹp" cho "hoa 20/11")
    const match = (m: typeof cur) => [...m].filter(([q]) => q === k || q.includes(k)).map(([, e]) => e);
    const agg = (list: ReturnType<typeof match>) => {
      const impr = list.reduce((s, e) => s + e.impressions, 0);
      return {
        clicks: list.reduce((s, e) => s + e.clicks, 0),
        impr,
        pos: impr ? list.reduce((s, e) => s + e.posSum, 0) / impr : null,
        page: list.sort((a, b) => b.impressions - a.impressions)[0]?.page ?? "",
      };
    };
    const a = agg(match(cur));
    const b = agg(match(old));
    const change = a.pos != null && b.pos != null ? b.pos - a.pos : null;
    const pos = a.pos != null ? a.pos.toFixed(1) : "chưa có";
    console.log(`  ${k.padEnd(34)} ${String(pos).padStart(8)}  ${change != null ? (change >= 0 ? "▲" : "▼") + Math.abs(change).toFixed(1) : "  "}  ${a.clicks} nhấp / ${a.impr} hiển thị`);
    lines.push([k, pos, b.pos?.toFixed(1) ?? "", change?.toFixed(1) ?? "", String(a.clicks), String(a.impr), a.impr ? ((a.clicks * 100) / a.impr).toFixed(1) : "", a.page]);
  }
  // Cơ hội: truy vấn có nhiều lượt hiển thị đang ở vị trí 5–20 (đẩy lên trang 1 / top 3 dễ nhất)
  const chances = [...cur]
    .map(([q, e]) => ({ q, pos: e.posSum / Math.max(1, e.impressions), ...e }))
    .filter((e) => e.pos >= 5 && e.pos <= 20 && e.impressions >= 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);
  if (chances.length) {
    console.log("\nCơ hội lên top (vị trí 5–20, nhiều lượt hiển thị) — cập nhật nội dung / thêm link nội bộ tới các trang này:");
    for (const c of chances) console.log(`  ${c.q.padEnd(34)} vị trí ${c.pos.toFixed(1).padStart(5)}  ${c.impressions} hiển thị  ${c.page}`);
  }
  const kwFile = path.join("reports", `gsc-tu-khoa-${stamp}.csv`);
  fs.writeFileSync(kwFile, "﻿" + lines.map((l) => l.map(csv).join(",")).join("\n"));

  // 2) Index: bài viết đã tới ngày đăng (+ tùy chọn 200 URL đầu sitemap)
  let urls = articleUrls();
  if (process.argv.includes("--index-all")) {
    const sm = await (await fetch(`${ORIGIN}/sitemap_index.xml`)).text();
    for (const s of [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])) {
      urls.push(...[...(await (await fetch(s)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    }
    urls = [...new Set(urls)].slice(0, 200);
  }
  const idx = [["URL", "Kết luận", "Trạng thái", "Lần thu thập gần nhất", "Google chọn canonical"]];
  if (urls.length) console.log(`\nKiểm tra index ${urls.length} URL:`);
  for (const u of urls) {
    const r = await api<Inspection>(token, "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", { inspectionUrl: u, siteUrl: SITE, languageCode: "vi" });
    const s = r.inspectionResult?.indexStatusResult ?? {};
    console.log(`  ${s.verdict === "PASS" ? "✓" : "✗"} ${u}  ${s.coverageState ?? ""}${s.lastCrawlTime ? ` · ghé ${s.lastCrawlTime.slice(0, 10)}` : ""}`);
    idx.push([u, s.verdict ?? "", s.coverageState ?? "", s.lastCrawlTime ?? "", s.googleCanonical ?? ""]);
  }
  const idxFile = path.join("reports", `gsc-index-${stamp}.csv`);
  if (urls.length) fs.writeFileSync(idxFile, "﻿" + idx.map((l) => l.map(csv).join(",")).join("\n"));
  console.log(`\nĐã lưu: ${kwFile}${urls.length ? `, ${idxFile}` : ""}`);
  console.log("URL chưa được lập chỉ mục: mở Search Console → Kiểm tra URL → Yêu cầu lập chỉ mục.");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
