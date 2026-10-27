import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Clock, Mail, MapPin, MessageCircle, Phone, Search } from "lucide-react";
import { site } from "@/lib/site";
import { FacebookIcon, InstagramIcon, YoutubeIcon, ZaloIcon } from "./icons";

const SOCIAL_STYLE: Record<string, { bg: string; Icon: (p: { className?: string }) => React.ReactElement }> = {
  Facebook: { bg: "bg-[#1877f2]", Icon: FacebookIcon },
  Instagram: { bg: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]", Icon: InstagramIcon },
  YouTube: { bg: "bg-[#ff0000]", Icon: YoutubeIcon },
};

// Giữ nguyên tiêu đề, thứ tự và đường dẫn như footer website cũ
const columns = [
  {
    title: "Hướng dẫn",
    links: [
      { label: "Câu hỏi thường gặp", href: "/cau-hoi-thuong-gap/" },
      { label: "Chính sách đổi/trả", href: "/huong-dan-doi-tra/" },
      { label: "Hướng dẫn đặt hàng", href: "/huong-dan-dat-hang/" },
      { label: "Hướng dẫn thanh toán", href: "/huong-dan-thanh-toan/" },
      { label: "Chính sách bảo mật", href: "/chinh-sach-bao-mat/" },
      { label: "Liên hệ", href: "/lien-he/" },
    ],
  },
  {
    title: "Chăm sóc khách hàng",
    links: [
      { label: "Quy định chuyển phát", href: "/quy-dinh-chuyen-phat/" },
      { label: "Quy trình điện hoa", href: "/quy-trinh-dien-hoa/" },
      { label: "Khiếu nại - Phản hồi", href: "/gop-y-khieu-nai-phan-hoi/" },
      { label: "Khách hàng & đối tác", href: "/khach-hang-doi-tac/" },
      { label: "Tin tức", href: "/tin-tuc/" },
      { label: "Giới thiệu", href: "/gioi-thieu/" },
    ],
  },
];

const payments = ["Chuyển khoản VietQR", "Tiền mặt", "Thanh toán khi nhận hoa"];

const storeCount = site.stores.reduce((n, s) => n + s.addresses.length, 0);

/** Địa chỉ "Đà Nẵng: 05 Trần Văn Cẩn…" -> link Google Maps, khách bấm là có đường đi tới cửa hàng */
function mapsUrl(address: string, city: string) {
  const [c, street] = address.includes(": ") ? address.split(": ") : [city, address];
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Hoa Thanh Nhã, ${street}, ${c}`)}`;
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 font-display text-xl font-bold text-white">{children}</h2>;
}

export function Footer() {
  return (
    <footer className="defer-render mt-20 bg-[#1f3a31] pt-12 text-white/80">
      <div className="container-x">
        {/* Không đẩy dải này nhô lên trên: defer-render (content-visibility) cắt phần tràn ra ngoài footer */}
        <div className="mb-12 rounded-[2rem] bg-brand-strong px-6 py-8 text-white shadow-[0_24px_50px_-24px_rgba(31,26,23,0.5)] sm:px-10 md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <p className="font-display text-2xl font-bold sm:text-3xl">Cần hoa gấp hôm nay?</p>
            <p className="mt-1 text-sm text-white/85 sm:text-base">Florist tư vấn mẫu theo ngân sách, giao hỏa tốc 60 phút nội thành.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 md:mt-0 md:shrink-0">
            <a href={`tel:${site.phone}`} className="btn bg-white px-6 text-base text-brand-strong hover:bg-white/90">
              <Phone className="size-4" aria-hidden /> {site.phoneDisplay}
            </a>
            <a href={site.zalo} target="_blank" rel="noopener noreferrer" className="btn bg-[#0068ff] px-6 text-base text-white hover:bg-[#0057d6]">
              <MessageCircle className="size-4" aria-hidden /> Chat Zalo
            </a>
          </div>
        </div>
      </div>

      <div className="container-x grid gap-10 pb-12 pt-2 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Image src="/brand/logo-thanh-nha.webp" alt={site.name} width={957} height={213} sizes="252px" className="h-14 w-auto rounded-xl bg-white px-3 py-1.5" />
          <p className="text-sm leading-relaxed">
            <span className="font-semibold text-white">Shop hoa tươi Thanh Nhã – {site.tagline}.</span> Hệ thống cửa hàng & đối tác trên 63 tỉnh thành. Đặt hoa
            online giao nhanh, miễn phí thiệp và băng rôn.
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`tel:${site.phone}`} className="inline-flex items-center gap-2 hover:text-white">
                <Phone className="size-4 text-brand" aria-hidden /> Hotline: {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 hover:text-white">
                <Mail className="size-4 text-brand" aria-hidden /> {site.email}
              </a>
            </li>
            <li>
              <Link href="/tra-cuu-don-hang/" className="inline-flex items-center gap-2 hover:text-white">
                <Search className="size-4 text-brand" aria-hidden /> Tra cứu đơn hàng
              </Link>
            </li>
          </ul>
          <ul aria-label="Mạng xã hội của Hoa Thanh Nhã" className="flex flex-wrap gap-3 pt-1">
            {site.socials.map(({ name, href }) => {
              const { bg, Icon } = SOCIAL_STYLE[name];
              return (
                <li key={name}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${site.name} trên ${name}`}
                    className={`grid size-11 place-items-center rounded-full text-white transition-transform duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${bg}`}
                  >
                    <Icon className="size-5" />
                  </a>
                </li>
              );
            })}
            <li>
              <a
                href={site.zalo}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Chat Zalo với ${site.name}`}
                className="grid size-11 place-items-center overflow-hidden rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <ZaloIcon className="size-11" />
              </a>
            </li>
          </ul>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <Heading>{col.title}</Heading>
            <ul className="space-y-1">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="group inline-flex items-center gap-2 py-1.5 text-[15px] transition-colors hover:text-white">
                    <ChevronRight className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5" aria-hidden />
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
            <li className="flex items-center gap-2">
              <Clock className="size-4 text-brand" aria-hidden /> Sáng 6h00 – 12h00
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4 text-brand" aria-hidden /> Chiều 13h30 – 21h00
            </li>
            <li>
              <a href={`tel:${site.phone}`} className="flex items-center gap-2 font-semibold text-white hover:text-brand">
                <Phone className="size-4 text-brand" aria-hidden /> {site.phoneDisplay} (24/7)
              </a>
            </li>
          </ul>
          <h2 className="mb-3 mt-7 font-display text-xl font-bold text-white">Thanh toán</h2>
          <ul className="flex flex-wrap gap-2">
            {payments.map((p) => (
              <li key={p} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/15">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x py-10">
          <h2 className="font-display text-xl font-bold text-white">
            {storeCount} cửa hàng – ghé chọn hoa trực tiếp hoặc{" "}
            <Link href="/shop-hoa-tuoi-gan-day/" className="text-brand underline-offset-4 hover:underline">
              tìm cửa hàng gần bạn
            </Link>
          </h2>
          <div className="mt-6 grid gap-8 md:grid-cols-3">
            {site.stores.map((s) => (
              <div key={s.city}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">{s.city === "Các tỉnh" ? "Shop hoa các tỉnh" : `Shop hoa tại ${s.city}`}</h3>
                <ul className="space-y-2 text-sm">
                  {s.addresses.map((a) => (
                    <li key={a}>
                      <a href={mapsUrl(a, s.city)} target="_blank" rel="noopener noreferrer" className="flex gap-2 transition-colors hover:text-white">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                        {a}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="container-x py-5 text-center text-xs text-white/60">
          © {new Date().getFullYear()} {new URL(site.url).host} – Bản quyền thuộc về Hoa Tươi Thanh Nhã.
        </p>
      </div>
    </footer>
  );
}
