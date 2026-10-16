import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/admin/login/";

// Kiểm tra nhanh: chưa có cookie phiên thì chuyển tới trang đăng nhập.
// Việc xác thực thật sự nằm ở requireAdmin() trong từng trang/action.
export function proxy(request: NextRequest) {
  // URL có dấu "/" cuối (trailingSlash) -> so sánh sau khi bỏ dấu "/" để không lặp chuyển hướng
  const pathname = request.nextUrl.pathname.replace(/\/+$/, "");
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !request.cookies.has("htn_admin")) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
