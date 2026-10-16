import "server-only";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu biến môi trường DATABASE_URL");
  const pool = mysql.createPool({ uri: url, connectionLimit: 5, timezone: "+07:00", dateStrings: ["DATE"] });
  // Để CURRENT_TIMESTAMP / CURDATE() của MySQL dùng giờ Việt Nam, khớp với cách mysql2 đọc DATETIME
  pool.pool.on("connection", (conn) => {
    conn.query("SET time_zone = '+07:00'");
  });
  return pool;
}

export const pool = globalForDb.pool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
export * from "./schema";
