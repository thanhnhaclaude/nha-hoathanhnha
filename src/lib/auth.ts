import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE = "htn_admin";
const MAX_AGE = 60 * 60 * 12; // 12 giờ

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET phải dài ít nhất 32 ký tự");
  return new TextEncoder().encode(s);
}

/**
 * ADMIN_PASSWORD_HASH được lưu dạng base64 của chuỗi bcrypt, vì ký tự `$` trong bcrypt
 * bị hiểu nhầm là biến khi Next.js đọc file .env. Vẫn chấp nhận chuỗi bcrypt gốc.
 */
function passwordHash() {
  const raw = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!raw) return null;
  return raw.startsWith("$2") ? raw : Buffer.from(raw, "base64").toString("utf8");
}

export async function verifyCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const hash = passwordHash();
  if (!hash) return false;
  const passOk = await bcrypt.compare(password, hash);
  return passOk && username === expectedUser;
}

export async function createSession(username: string) {
  const token = await new SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { username: String(payload.sub) };
  } catch {
    return null;
  }
}

/** Gọi ở đầu mọi trang/action quản trị. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login/");
  return session;
}
