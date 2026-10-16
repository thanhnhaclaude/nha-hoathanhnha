import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Mail, MapPin, Phone, Search } from "lucide-react";
import { site } from "@/lib/site";

// Giữ nguyên tiêu đề, thứ tự và đường dẫn như footer website cũ
const columns = [
  {
    title: "Hướng dẫn",
    links: [
      { label: "Câu hỏi thường gặp", href: "/cau-hoi-thuong-gap" },
      { label: "Chính sách đổi/trả", href: "/huong-dan-doi-tra" },
      { label: "Hướng dẫn đặt hàng", href: "/huong-dan-dat-hang" },
      { label: "Hướng dẫn thanh toán", href: "/huong-dan-thanh-toan" },
      { label: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
      { label: "Liên hệ", href: "/lien-he" },
    ],
  },
  {
    title: "Chăm sóc khách hàng",
    links: [
      { label: "Quy định chuyển phát", href: "/quy-dinh-chuyen-phat" },
      { label: "Quy trình điện hoa", href: "/quy-trinh-dien-hoa" },
      { label: "Khiếu nại - Phản hồi", href: "/gop-y-khieu-nai-phan-hoi" },
      { label: "Khách hàng & đối tác", href: "/khach-hang-doi-tac" },
      { label: "Tin tức", href: "/tin-tuc" },
      { label: "Giới thiệu", href: "/gioi-thieu" },
    ],
  },
];

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-white">{children}</h2>;
}

export function Footer() {
  return (
    <footer className="mt-20 bg-[#273647] text-[#f1f1f1]">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Image src="/brand/logo-hoa-thanhnha.webp" alt={site.name} width={500} height={157} className="h-14 w-auto rounded-lg bg-white p-1.5" />
          <p className="text-sm font-semibold uppercase tracking-wide text-white">Shop hoa tươi Thanh Nhã – {site.tagline}</p>
          <p className="text-sm leading-relaxed text-white/75">
            Hệ thống cửa hàng & đối tác trên 63 tỉnh thành. Đặt hoa online giao nhanh, miễn phí thiệp và băng rôn.
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`tel:${site.phone}`} className="inline-flex items-center gap-2 hover:text-white">
                <Phone className="size-4 text-[#fc9cc4]" aria-hidden /> Hotline: {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 hover:text-white">
                <Mail className="size-4 text-[#fc9cc4]" aria-hidden /> {site.email}
              </a>
            </li>
            <li>
              <Link href="/tra-cuu-don-hang" className="inline-flex items-center gap-2 hover:text-white">
                <Search className="size-4 text-[#fc9cc4]" aria-hidden /> Tra cứu đơn hàng
              </Link>
            </li>
          </ul>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <Heading>{col.title}</Heading>
            <ul>
              {col.links.map((l) => (
                <li key={l.href} className="border-b border-white/20">
                  <Link href={l.href} className="flex items-center gap-3 py-2.5 text-[15px] transition-colors hover:text-[#fc9cc4]">
                    <ChevronRight className="size-4 shrink-0 text-[#fc9cc4]" aria-hidden />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <Heading>Thời gian làm việc</Heading>
          <ul className="space-y-2 text-[15px]">
            <li>Sáng 6h00 – 12h00</li>
            <li>Chiều 13h30 – 21h00</li>
            <li className="pt-2 text-white/75">Điện thoại: {site.phoneDisplay} (24/7)</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x grid gap-8 py-10 md:grid-cols-3">
          {site.stores.map((s) => (
            <div key={s.city}>
              <h2 className="mb-3 font-semibold text-white">{s.city === "Các tỉnh" ? "Shop hoa các tỉnh" : `Shop hoa tại ${s.city}`}</h2>
              <ul className="space-y-2 text-sm text-white/75">
                {s.addresses.map((a) => (
                  <li key={a} className="flex gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-[#fc9cc4]" aria-hidden />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="container-x py-5 text-center text-xs text-white/60">
          © {new Date().getFullYear()} hoathanhnha.com – Bản quyền thuộc về Hoa Tươi Thanh Nhã.
        </p>
      </div>
    </footer>
  );
}
