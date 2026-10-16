/**
 * Khởi động MySQL tạm thời trên máy để phát triển (không cần cài MySQL).
 *   npm run db:local   -> giữ cửa sổ này mở, sau đó dùng DATABASE_URL in ra
 */
import { createDB } from "mysql-memory-server";

async function main() {
  const db = await createDB({ dbName: "hoathanhnha", port: 3307, version: "8.4.x", logLevel: "ERROR" });
  console.log(`MySQL sẵn sàng: DATABASE_URL="mysql://${db.username}@127.0.0.1:${db.port}/${db.dbName}"`);
  process.on("SIGINT", async () => {
    await db.stop();
    process.exit(0);
  });
  setInterval(() => {}, 1 << 30);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
