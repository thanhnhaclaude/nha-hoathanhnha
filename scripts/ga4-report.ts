/**
 * Báo cáo Google Analytics 4: khách từ Google (Organic Search) vào trang nào, ở lại bao lâu, ra đơn ở đâu.
 *
 *   npm run seo:ga4             # 28 ngày gần nhất so với 28 ngày trước
 *
 * Dùng chung service account với seo:gsc (google-key.json). Cần:
 *  - Google Cloud: bật "Google Analytics Data API" (+ "Admin API" nếu muốn tự tìm mã thuộc tính).
 *  - GA4 → Quản trị → Quản lý quyền truy cập: thêm email service account, vai trò "Người xem".
 *  - .env: GA4_PROPERTY="properties/333704311" (thuộc tính hoathanhnha, luồng G-5DQSG3PGJ2).
 * Kết quả: tóm tắt trên màn hình + reports/ga4-trang-<ngày>.csv
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { SignJWT, importPKCS8 } from "jose";

const KEY_FILE = process.env.GSC_KEY_FILE || "google-key.json";
const PROPERTY = process.env.GA4_PROPERTY || "properties/333704311";

async function token() {
  if (!fs.existsSync(KEY_FILE)) throw new Error(`Chưa có ${KEY_FILE} (xem hướng dẫn ở đầu scripts/gsc-report.ts)`);
  const key = JSON.parse(fs.readFileSync(KEY_FILE, "utf8")) as { client_email: string; private_key: string };
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ scope: "https://www.googleapis.com/auth/analytics.readonly" })
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
  if (!j.access_token) throw new Error(`Không lấy được quyền truy cập: ${j.error_description}`);
  return j.access_token;
}

type Report = { rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] };

async function run(tok: string, body: unknown): Promise<Report> {
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/${PROPERTY}:runReport`, {
    method: "POST",
    headers: { authorization: `Bearer ${tok}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`GA4: ${(j as { error?: { message?: string } }).error?.message ?? r.status}`);
  return j as Report;
}

const RANGES = [
  { startDate: "28daysAgo", endDate: "yesterday", name: "nay" },
  { startDate: "56daysAgo", endDate: "29daysAgo", name: "truoc" },
];
const n = (v?: string) => Number(v ?? 0);
const fmt = (v: number) => v.toLocaleString("vi-VN");

async function main() {
  const tok = await token();

  // 1) Tổng quan theo kênh
  const channels = await run(tok, {
    dateRanges: RANGES,
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "keyEvents" }, { name: "ecommercePurchases" }, { name: "totalRevenue" }],
  });
  const byChannel = new Map<string, { nay: number[]; truoc: number[] }>();
  for (const row of channels.rows ?? []) {
    const [ch, range] = row.dimensionValues.map((d) => d.value);
    const e = byChannel.get(ch) ?? { nay: [0, 0, 0, 0, 0], truoc: [0, 0, 0, 0, 0] };
    e[range === "nay" ? "nay" : "truoc"] = row.metricValues.map((m) => n(m.value));
    byChannel.set(ch, e);
  }
  console.log(`GA4 ${PROPERTY} — 28 ngày qua so với 28 ngày trước`);
  console.log("Kênh                     Phiên (trước)        Tương tác   Sự kiện chính   Đơn   Doanh thu");
  for (const [ch, e] of [...byChannel].sort((a, b) => b[1].nay[0] - a[1].nay[0])) {
    const [s, eng, key, buy, rev] = e.nay;
    console.log(
      `${ch.padEnd(24)} ${fmt(s).padStart(7)} (${fmt(e.truoc[0]).padStart(6)})   ${s ? Math.round((eng * 100) / s) : 0}%`.padEnd(60) +
        `${fmt(key).padStart(8)}   ${fmt(buy).padStart(5)}   ${fmt(rev)}đ`,
    );
  }

  // 2) Trang đích của khách đến từ Google tìm kiếm tự nhiên
  const pages = await run(tok, {
    dateRanges: [RANGES[0]],
    dimensions: [{ name: "landingPage" }],
    metrics: [{ name: "sessions" }, { name: "engagedSessions" }, { name: "averageSessionDuration" }, { name: "keyEvents" }, { name: "ecommercePurchases" }],
    dimensionFilter: { filter: { fieldName: "sessionDefaultChannelGroup", stringFilter: { value: "Organic Search" } } },
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 500,
  });
  const rows = (pages.rows ?? []).map((r) => {
    const [s, eng, dur, key, buy] = r.metricValues.map((m) => n(m.value));
    return { page: r.dimensionValues[0].value, s, engRate: s ? Math.round((eng * 100) / s) : 0, dur: Math.round(dur), key, buy };
  });
  console.log(`\nTrang đích từ Google (Organic Search), top 15 / ${rows.length} trang:`);
  for (const r of rows.slice(0, 15)) {
    console.log(`  ${String(r.s).padStart(5)} phiên · ${String(r.engRate).padStart(3)}% tương tác · ${String(r.dur).padStart(4)}s · ${r.key} sự kiện chính · ${r.buy} đơn  ${r.page}`);
  }
  const converting = rows.filter((r) => r.key > 0 || r.buy > 0).sort((a, b) => b.key + b.buy * 10 - (a.key + a.buy * 10));
  if (converting.length) {
    console.log("\nTrang từ Google tạo ra sự kiện chính / đơn hàng (ưu tiên SEO các trang này):");
    for (const r of converting.slice(0, 15)) console.log(`  ${r.key} sự kiện chính · ${r.buy} đơn · ${r.s} phiên  ${r.page}`);
  }
  const weak = rows.filter((r) => r.s >= 20 && r.engRate < 40).slice(0, 10);
  if (weak.length) {
    console.log("\nTrang nhiều khách nhưng tỷ lệ tương tác < 40% (nội dung chưa khớp ý định tìm kiếm):");
    for (const r of weak) console.log(`  ${r.engRate}% · ${r.s} phiên  ${r.page}`);
  }

  // 3) Sự kiện chính đang được ghi nhận (để biết GA4 đo được những gì)
  const events = await run(tok, {
    dateRanges: [RANGES[0]],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }, { name: "keyEvents" }],
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: 25,
  });
  console.log("\nSự kiện GA4 ghi nhận (28 ngày):");
  console.log(
    "  " +
      (events.rows ?? [])
        .map((r) => `${r.dimensionValues[0].value} ${fmt(n(r.metricValues[0].value))}${n(r.metricValues[1].value) ? " ★" : ""}`)
        .join(" · "),
  );
  console.log("  (★ = đang được đánh dấu là sự kiện chính / chuyển đổi)");

  fs.mkdirSync("reports", { recursive: true });
  const file = path.join("reports", `ga4-trang-${new Date().toISOString().slice(0, 10)}.csv`);
  const csv = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  fs.writeFileSync(
    file,
    "﻿" +
      [["Trang đích (Organic Search)", "Phiên", "Tỷ lệ tương tác %", "Thời gian TB (giây)", "Sự kiện chính", "Đơn hàng"], ...rows.map((r) => [r.page, r.s, r.engRate, r.dur, r.key, r.buy])]
        .map((l) => l.map(csv).join(","))
        .join("\n"),
  );
  console.log(`\nĐã lưu: ${file}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
