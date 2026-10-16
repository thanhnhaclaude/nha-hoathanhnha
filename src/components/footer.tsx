import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { site } from "@/lib/site";

const guides = [
  { label: "Hướng dẫn đặt hàng", href: "/huong-dan-dat-hang" },
  { label: "Hướng dẫn thanh toán", href: "/huong-dan-thanh-toan" },
  { label: "Chính sách đổi/trả", href: "/chinh-sach-doi-tra" },
  { label: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
  { label: "Tra cứu đơn hàng", href: "/tra-cuu-don-hang" },
  { label: "Liên hệ", href: "/lien-he" },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-[#1f1a17] text-white/80">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Image src="/brand/logo-hoa-thanhnha.webp" alt={site.name} width={500} height={157} className="h-14 w-auto rounded-lg bg-white p-1.5" />
          <p className="text-sm leading-relaxed">
            Hệ thống shop hoa tươi Thanh Nhã – {site.tagline.toLowerCase()}. Đặt hoa online, giao nhanh trên toàn quốc, miễn phí thiệp và băng rôn.
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`tel:${site.phone}`} className="inline-flex items-center gap-2 hover:text-white">
                <Phone className="size-4 text-brand" aria-hidden /> {site.phoneDisplay} (24/7)
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 hover:text-white">
                <Mail className="size-4 text-brand" aria-hidden /> {site.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">Hỗ trợ khách hàng</h2>
          <ul className="space-y-2.5 text-sm">
            {guides.map((g) => (
              <li key={g.href}>
                <Link href={g.href} className="hover:text-white">
                  {g.label}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-widest text-white">Thời gian làm việc</h2>
          <p className="text-sm">Sáng 6h00 – 12h00 · Chiều 13h30 – 21h00</p>
        </div>

        {site.stores.slice(0, 2).map((s) => (
          <div key={s.city}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">Shop hoa tại {s.city}</h2>
            <ul className="space-y-2.5 text-sm">
              {s.addresses.map((a) => (
                <li key={a} className="flex gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  {a}
                </li>
              ))}
            </ul>
            {s.city === "Hà Nội" && (
              <>
                <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-widest text-white">Các tỉnh</h2>
                <ul className="space-y-2 text-sm">
                  {site.stores[2].addresses.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="container-x py-5 text-center text-xs text-white/60">
          © {new Date().getFullYear()} {site.name}. Bản quyền thuộc về Hoa Tươi Thanh Nhã.
        </p>
      </div>
    </footer>
  );
}
