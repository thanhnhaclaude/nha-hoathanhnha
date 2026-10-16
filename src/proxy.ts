import { NextResponse, type NextRequest } from "next/server";

// Kiểm tra nhanh: chưa có cookie phiên thì chuyển tới trang đăng nhập.
// Việc xác thực thật sự nằm ở requireAdmin() trong từng trang/action.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !request.cookies.has("htn_admin")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
