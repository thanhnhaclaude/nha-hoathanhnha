import Image from "next/image";
import Link from "next/link";
import { ExternalLink, FileText, LayoutDashboard, LogOut, Package, ShoppingCart } from "lucide-react";
import { destroySession, requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  await destroySession();
  redirect("/admin/login");
}

const nav = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/don-hang", label: "Đơn hàng", icon: ShoppingCart },
  { href: "/admin/san-pham", label: "Sản phẩm", icon: Package },
  { href: "/admin/bai-viet", label: "Bài viết & trang", icon: FileText },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="flex min-h-screen flex-col bg-surface-muted md:flex-row">
      <aside className="border-b border-border bg-surface md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4 md:block">
          <Link href="/admin">
            <Image src="/brand/logo-hoa-thanhnha.webp" alt="Hoa Thanh Nhã" width={500} height={157} className="h-10 w-auto" />
          </Link>
          <p className="text-xs text-muted md:mt-2">Xin chào, {session.username}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-brand-soft hover:text-brand-strong">
              <Icon className="size-4" aria-hidden /> {label}
            </Link>
          ))}
          <Link href="/" target="_blank" className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-muted">
            <ExternalLink className="size-4" aria-hidden /> Xem website
          </Link>
          <form action={logout} className="md:mt-4">
            <button className="flex w-full shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-muted hover:text-danger">
              <LogOut className="size-4" aria-hidden /> Đăng xuất
            </button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
