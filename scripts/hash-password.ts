import bcrypt from "bcryptjs";

const pw = process.argv[2];
if (!pw) {
  console.error('Cách dùng: npm run hash-password -- "mat-khau"');
  process.exit(1);
}
// Mã hóa base64 để tránh ký tự $ (Next.js hiểu $ trong .env là biến)
const hash = Buffer.from(bcrypt.hashSync(pw, 12)).toString("base64");
console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
