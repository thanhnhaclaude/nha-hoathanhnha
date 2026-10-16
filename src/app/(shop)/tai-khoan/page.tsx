import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Phone, Search } from "lucide-react";
import { seoMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export function generateMetadata(): Promise<Metadata> {
  return seoMetadata("/tai-khoan/", { title: "Tài khoản", noindex: true });
}

/** Website mới không cần đăng ký tài khoản: khách tra cứu đơn bằng mã đơn + số điện thoại. */
export default function AccountPage() {
  const links = [
    { href: "/tra-cuu-don-hang/", icon: Search, title: "Tra cứu đơn hàng", text: "Xem trạng thái đơn bằng mã đơn và số điện thoại." },
    { href: "/danh-sach/", icon: Heart, title: "Danh sách yêu thích", text: "Các mẫu hoa bạn đã lưu trên thiết bị này." },
  ];
  return (
    <div className="container-x max-w-3xl py-14">
      <h1 className="heading-display text-4xl sm:text-5xl">Tài khoản</h1>
      <p className="mt-3 text-muted">Đặt hoa tại Thanh Nhã không cần đăng ký tài khoản.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {links.map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link href={href} className="flex h-full gap-4 rounded-2xl border border-border bg-surface p-5 hover:border-brand">
              <Icon className="size-6 shrink-0 text-brand-strong" aria-hidden />
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="mt-1 block text-sm text-muted">{text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <a href={`tel:${site.phone}`} className="btn-leaf mt-8 h-12">
        <Phone className="size-4" aria-hidden /> Hỗ trợ: {site.phoneDisplay}
      </a>
    </div>
  );
}
