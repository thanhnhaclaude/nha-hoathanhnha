import { NextResponse, type NextRequest } from "next/server";
import { legacyRedirects } from "@/lib/legacy-redirects";

const LOGIN_PATH = "/admin/login/";

export function proxy(request: NextRequest) {
  const { pathname: rawPath } = request.nextUrl;

  // SEO: www.hoathanhnha.com là bản trùng -> 301 về hoathanhnha.com (Hostinger không tự chuyển bản https://www)
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim().toLowerCase();
  if (host.startsWith("www.")) {
    return NextResponse.redirect(`https://${host.slice(4)}${rawPath}${request.nextUrl.search}`, 301);
  }

  // SEO: trang của website cũ không còn tồn tại -> 301 về trang gần nghĩa nhất (src/lib/legacy-redirects.ts)
  let key = rawPath;
  try {
    key = decodeURIComponent(rawPath);
  } catch {}
  const target = legacyRedirects[key.replace(/^\/+|\/+$/g, "").toLowerCase()];
  if (target) return NextResponse.redirect(new URL(target, request.url), 301);

  // SEO: đường dẫn có chữ hoa (vd. /HOA-BO/) là bản trùng của /hoa-bo/ -> chuyển hướng 301 về chữ thường.
  // Bỏ qua file tĩnh (có phần mở rộng) vì tên ảnh có thể có chữ hoa, và trang có mã đơn viết hoa (HN123456).
  if (/[A-Z]/.test(rawPath.replace(/%[0-9A-F]{2}/gi, "")) && !/\.[a-z0-9]+$/i.test(rawPath) && !/^\/(don-hang|thanh-toan|admin)\//i.test(rawPath)) {
    const url = request.nextUrl.clone();
    url.pathname = rawPath.toLowerCase();
    return NextResponse.redirect(url, 301);
  }

  // Kiểm tra nhanh: chưa có cookie phiên thì chuyển tới trang đăng nhập.
  // Việc xác thực thật sự nằm ở requireAdmin() trong từng trang/action.
  // URL có dấu "/" cuối (trailingSlash) -> so sánh sau khi bỏ dấu "/" để không lặp chuyển hướng
  const pathname = rawPath.replace(/\/+$/, "");
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !request.cookies.has("htn_admin")) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
  // Tốc độ: trang danh mục/sản phẩm/bài viết ([slug]) phải dựng mới mỗi lượt (đọc ?page, ?sort) và Next trả no-store,
  // nên CDN Hostinger (hcdn) không lưu được -> người dùng thật chờ máy chủ Node (TTFB ~2,7s). Nội dung các trang này
  // giống nhau với mọi người (không đọc cookie), nên cho CDN lưu 5 phút. Bỏ qua trang cá nhân/giao dịch, admin,
  // người đang đăng nhập admin và yêu cầu không phải GET. Áp dụng cả trang chủ (ISR) để thay "stale 1 năm" mặc định
  // của Next bằng 10 phút: giá, bài mới hiển thị chậm tối đa ~15 phút kể cả khi CDN không tự làm mới.
  if (
    (request.method === "GET" || request.method === "HEAD") &&
    !request.cookies.has("htn_admin") &&
    !/^\/(admin|gio-hang|thanh-toan|don-hang|tai-khoan|tra-cuu-don-hang|tim-kiem|danh-sach|cua-hang)(\/|$)/.test(pathname)
  ) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res;
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/|api/|media/|uploads/|brand/).*)"] };
