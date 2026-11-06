/**
 * Theo dõi hoathanhnha.com, in ra các sự kiện mới cần báo cho chủ shop (tác vụ hẹn giờ trong app Claude đọc và đẩy thông báo).
 *
 *   npm run seo:watch
 *
 * Sự kiện: bài đã lên web, bài tới giờ mà chưa lên, bài đã được Google index, website/CSDL lỗi và hoạt động lại,
 * chứng chỉ SSL sắp hết hạn, lỗ hổng npm mức cao (gói chạy trên Hostinger).
 * Trạng thái lưu ở reports/site-watch.json (không lên GitHub) để mỗi sự kiện chỉ báo một lần.
 * Lần chạy đầu chỉ ghi nhận hiện trạng, không báo.
 * Mỗi dòng "BÁO: ..." là một thông báo; dòng cuối "SỐ THÔNG BÁO: n".
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import tls from "node:tls";
import { execSync } from "node:child_process";
import { accessToken } from "./gsc-auth";

const ORIGIN = "https://hoathanhnha.com";
const SITE = process.env.GSC_SITE || "sc-domain:hoathanhnha.com";
const STATE_FILE = path.join("reports", "site-watch.json");
const ARTICLES_DIR = path.join("content", "bai-viet");
const INDEX_DAYS = 60; // chỉ theo dõi index bài đăng trong 60 ngày gần nhất
const INDEX_PER_RUN = 30; // giới hạn Search Console 2.000 lượt kiểm tra/ngày

type State = { live: string[]; indexed: string[]; late: string[]; down: boolean; sslWarnDay: string; auditDay: string; auditHigh: number };
const fresh = !fs.existsSync(STATE_FILE);
const state: State = { live: [], indexed: [], late: [], down: false, sslWarnDay: "", auditDay: "", auditHigh: 0, ...(fresh ? {} : JSON.parse(fs.readFileSync(STATE_FILE, "utf8"))) };
const events: string[] = [];
const say = (m: string) => events.push(m.length > 190 ? m.slice(0, 187) + "..." : m);

// Giờ Việt Nam dạng "YYYY-MM-DD HH:mm" để so với dòng publish trong bài
const vnNow = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 16).replace("T", " ");
const today = vnNow().slice(0, 10);

async function status(url: string) {
  try {
    const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(30_000), headers: { "user-agent": "hoathanhnha-site-watch" } });
    return r.status;
  } catch {
    return 0;
  }
}

function articles() {
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const t = fs.readFileSync(path.join(ARTICLES_DIR, f), "utf8");
      const get = (k: string) => t.match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1].trim() ?? "";
      const publish = get("publish");
      return { slug: get("slug"), title: get("title"), publish: publish.length === 10 ? `${publish} 00:00` : publish };
    })
    .filter((a) => a.slug && a.publish && a.publish <= vnNow());
}

async function checkSite() {
  const home = await status(`${ORIGIN}/`);
  let db = "";
  try {
    const r = await fetch(`${ORIGIN}/api/health/`, { signal: AbortSignal.timeout(30_000) });
    db = ((await r.json()) as { database?: { status?: string; code?: string } }).database?.status ?? "";
  } catch {
    db = "error";
  }
  const ok = home === 200 && db === "ok";
  if (!ok && !state.down) say(`Web hoathanhnha.com lỗi: trang chủ ${home || "không phản hồi"}, CSDL ${db || "?"}. Kiểm tra Hostinger ngay.`);
  if (ok && state.down) say("Web hoathanhnha.com đã hoạt động lại bình thường.");
  state.down = !ok;
  return ok;
}

async function checkPosts() {
  for (const a of articles()) {
    if (state.live.includes(a.slug)) continue;
    const code = await status(`${ORIGIN}/${a.slug}/`);
    if (code === 200) {
      state.live.push(a.slug);
      if (!fresh) say(`Đã lên web: ${a.title} ${ORIGIN}/${a.slug}/`);
    } else {
      // Quá 1 giờ sau giờ hẹn mà chưa lên: báo một lần
      const overdue = Date.parse(a.publish.replace(" ", "T") + ":00+07:00") < Date.now() - 3600_000;
      if (overdue && !state.late.includes(a.slug)) {
        state.late.push(a.slug);
        if (!fresh) say(`Bài chưa lên web dù đã tới giờ (${code || "không phản hồi"}): ${a.title}`);
      }
    }
  }
}

async function checkIndex() {
  const since = new Date(Date.now() - INDEX_DAYS * 86400_000).toISOString().slice(0, 10);
  const todo = articles().filter((a) => state.live.includes(a.slug) && !state.indexed.includes(a.slug) && a.publish.slice(0, 10) >= since).slice(0, INDEX_PER_RUN);
  if (!todo.length) return;
  const token = await accessToken();
  for (const a of todo) {
    const r = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ inspectionUrl: `${ORIGIN}/${a.slug}/`, siteUrl: SITE, languageCode: "vi" }),
    });
    if (!r.ok) throw new Error(`Search Console trả lỗi ${r.status} khi kiểm tra index`);
    const j = (await r.json()) as { inspectionResult?: { indexStatusResult?: { verdict?: string } } };
    if (j.inspectionResult?.indexStatusResult?.verdict === "PASS") {
      state.indexed.push(a.slug);
      if (!fresh) say(`Google đã index: ${a.title}`);
    }
  }
}

function checkSsl() {
  return new Promise<void>((resolve) => {
    const s = tls.connect({ host: "hoathanhnha.com", port: 443, servername: "hoathanhnha.com", timeout: 20_000 }, () => {
      const days = Math.floor((Date.parse(s.getPeerCertificate().valid_to) - Date.now()) / 86400_000);
      if (days <= 14 && state.sslWarnDay !== today) {
        state.sslWarnDay = today;
        say(`Chứng chỉ SSL hoathanhnha.com còn ${days} ngày là hết hạn. Gia hạn trên Hostinger.`);
      }
      s.end();
      resolve();
    });
    s.on("error", () => resolve()); // lỗi kết nối đã được checkSite báo
    s.on("timeout", () => (s.destroy(), resolve()));
  });
}

function checkAudit() {
  if (state.auditDay === today) return; // mỗi ngày một lần
  state.auditDay = today;
  let out = "";
  try {
    out = execSync("npm audit --omit=dev --json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch (e) {
    out = (e as { stdout?: string }).stdout ?? ""; // npm audit trả mã lỗi khi có lỗ hổng
  }
  const v = (JSON.parse(out || "{}") as { metadata?: { vulnerabilities?: Record<string, number> } }).metadata?.vulnerabilities ?? {};
  const high = (v.high ?? 0) + (v.critical ?? 0);
  if (high > state.auditHigh && !fresh) say(`Phát hiện ${high} lỗ hổng npm mức cao trong gói chạy trên web. Workflow tự vá sẽ chạy 08:00, hoặc nhờ Claude xử lý.`);
  state.auditHigh = high;
}

async function main() {
  const siteOk = await checkSite();
  if (siteOk) {
    await checkPosts();
    await checkIndex();
  }
  await checkSsl();
  checkAudit();
  fs.mkdirSync("reports", { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  for (const e of events) console.log(`BÁO: ${e}`);
  console.log(`SỐ THÔNG BÁO: ${events.length}${fresh ? " (lần đầu: chỉ ghi nhận hiện trạng)" : ""}`);
}

main().catch((e) => {
  console.log(`BÁO: Kiểm tra web không chạy được: ${(e as Error).message}`.slice(0, 190));
  console.log("SỐ THÔNG BÁO: 1");
  process.exit(1);
});
