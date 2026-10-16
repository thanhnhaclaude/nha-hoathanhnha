import fs from "node:fs/promises";
import path from "node:path";
import { IMAGE_TYPES, uploadDir } from "@/lib/uploads";

const typeByExt = Object.fromEntries(Object.entries(IMAGE_TYPES).map(([mime, ext]) => [ext, mime]));

/** Phục vụ ảnh đã tải lên từ trang quản trị (lưu ngoài thư mục build). */
export async function GET(_req: Request, { params }: RouteContext<"/media/[...path]">) {
  const { path: parts } = await params;
  const root = uploadDir();
  const file = path.resolve(/*turbopackIgnore: true*/ root, ...parts);
  if (!file.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });
  const type = typeByExt[path.extname(file).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(file);
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
