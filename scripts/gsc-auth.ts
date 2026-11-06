/** Lấy access token Google bằng service account trong google-key.json (dùng chung cho gsc-report và site-watch). */
import fs from "node:fs";
import { SignJWT, importPKCS8 } from "jose";

const KEY_FILE = process.env.GSC_KEY_FILE || "google-key.json";

export async function accessToken(scope = "https://www.googleapis.com/auth/webmasters.readonly") {
  if (!fs.existsSync(KEY_FILE)) {
    throw new Error(`Chưa có ${KEY_FILE}. Xem hướng dẫn cài đặt ở đầu file scripts/gsc-report.ts`);
  }
  const key = JSON.parse(fs.readFileSync(KEY_FILE, "utf8")) as { client_email: string; private_key: string };
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ scope })
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
