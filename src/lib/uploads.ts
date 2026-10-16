import "server-only";
import path from "node:path";

/**
 * Thư mục lưu ảnh tải lên từ trang quản trị.
 * Trên Hostinger nên đặt UPLOAD_DIR là đường dẫn tuyệt đối NGOÀI thư mục code
 * (vd: /home/<user>/uploads-hoathanhnha) để ảnh không bị mất khi deploy lại.
 */
export function uploadDir() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads"));
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
