import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { IMAGE_TYPES, MAX_UPLOAD_BYTES, uploadDir } from "@/lib/uploads";

function sniff(buf: Buffer) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Thiếu tệp" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Ảnh tối đa 5MB" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type) return NextResponse.json({ error: "Chỉ hỗ trợ ảnh JPG, PNG, WEBP" }, { status: 400 });

  const now = new Date();
  const sub = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const base = slugify(path.parse(file.name).name).slice(0, 60) || "anh";
  const name = `${base}-${randomBytes(3).toString("hex")}${IMAGE_TYPES[type]}`;
  const dir = path.join(/*turbopackIgnore: true*/ uploadDir(), sub);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ dir, name), buf);

  return NextResponse.json({ url: `/media/${sub}/${name}` });
}
