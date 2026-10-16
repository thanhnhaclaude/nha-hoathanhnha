import "server-only";
import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "./schema";
import { dbConnection } from "./config";

type Db = MySql2Database<typeof schema>;

const globalForDb = globalThis as unknown as { pool?: mysql.Pool; db?: Db };

function createPool() {
  const conn = dbConnection();
  const common = { connectionLimit: 5, timezone: "+07:00", dateStrings: ["DATE" as const] };
  const pool =
    conn.mode === "parts"
      ? mysql.createPool({ ...common, host: conn.host, port: conn.port, user: conn.user, password: conn.password, database: conn.database })
      : mysql.createPool({ ...common, uri: conn.uri });
  // Để CURRENT_TIMESTAMP / CURDATE() của MySQL dùng giờ Việt Nam, khớp với cách mysql2 đọc DATETIME
  pool.pool.on("connection", (conn) => {
    conn.query("SET time_zone = '+07:00'");
  });
  return pool;
}

/**
 * Chỉ tạo kết nối khi có truy vấn đầu tiên (không phải lúc import), để `next build`
 * không cần DATABASE_URL hay kết nối được tới MySQL.
 */
function getDb(): Db {
  if (!globalForDb.db) {
    globalForDb.pool ??= createPool();
    globalForDb.db = drizzle(globalForDb.pool, { schema, mode: "default" });
  }
  return globalForDb.db;
}

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export * from "./schema";
