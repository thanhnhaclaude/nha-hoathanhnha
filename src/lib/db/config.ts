/**
 * Thông số kết nối MySQL, khai báo theo MỘT trong hai cách:
 *
 * 1) Tách riêng (khuyên dùng trên Hostinger, mật khẩu có ký tự đặc biệt vẫn được):
 *    DB_HOST=localhost  DB_PORT=3306  DB_USER=u123_user  DB_PASSWORD=...  DB_NAME=u123_db
 * 2) Một chuỗi:  DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DBNAME
 *    (ký tự đặc biệt trong mật khẩu phải mã hóa, vd. @ -> %40)
 */
export type DbConnection =
  | { mode: "parts"; host: string; port: number; user: string; password: string; database: string }
  | { mode: "url"; uri: string };

const env = (k: string) => process.env[k]?.trim().replace(/^(['"])(.*)\1$/, "$2") || undefined;

export function dbConnection(): DbConnection {
  const host = env("DB_HOST");
  const user = env("DB_USER");
  const database = env("DB_NAME");
  if (host || user || database) {
    const missing = [!host && "DB_HOST", !user && "DB_USER", !database && "DB_NAME"].filter(Boolean);
    if (missing.length) throw new Error(`Thiếu biến môi trường: ${missing.join(", ")}`);
    return { mode: "parts", host: host!, port: Number(env("DB_PORT") ?? 3306), user: user!, password: env("DB_PASSWORD") ?? "", database: database! };
  }
  const uri = env("DATABASE_URL");
  if (!uri) throw new Error("Thiếu biến môi trường DATABASE_URL (hoặc DB_HOST/DB_USER/DB_PASSWORD/DB_NAME)");
  return { mode: "url", uri };
}
