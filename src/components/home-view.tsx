import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Camera, Clock, Gift, HandCoins, Flower2, Phone, Truck, Users, Wallet, Zap } from "lucide-react";
import { ZaloIcon } from "@/components/icons";
import { upcomingOccasion } from "@/lib/occasions";
import { ProductCard } from "@/components/product-card";
import { homeSections } from "@/lib/menu";
import { ReadMore } from "@/components/read-more";
import { getCategoryBySlug, getHomeSeo, getProductsInCategory } from "@/lib/queries";
import { cleanHtml } from "@/lib/sanitize";
import { site } from "@/lib/site";

// Cam kết khách lo nhất khi đặt hoa online: có đúng mẫu không, có kịp giờ không, có tốn thêm phí không
const promises = [
  { icon: Camera, text: "Gửi ảnh hoa thật trước khi giao" },
  { icon: BadgeCheck, text: "Không đúng mẫu, không cần thanh toán" },
  { icon: Gift, text: "Miễn phí thiệp, băng rôn ghi lời chúc" },
];

// Khách tìm hoa theo dịp tặng, không theo kiểu cắm: đưa thẳng tới đúng danh mục
const occasions = [
  { href: "/hoa-sinh-nhat/", title: "Sinh nhật", text: "Bó, giỏ hoa theo người nhận", icon: "/brand/cat-sinh-nhat.webp" },
  { href: "/hoa-khai-truong/", title: "Khai trương", text: "Kệ, giỏ hoa in băng rôn miễn phí", icon: "/brand/cat-khai-truong.webp" },
  { href: "/hoa-tinh-yeu/", title: "Tình yêu", text: "Hồng đỏ, hồng phấn, tulip", icon: "/brand/cat-tinh-yeu.webp" },
  { href: "/hoa-chia-buon/", title: "Chia buồn", text: "Kệ, vòng hoa viếng giao gấp", icon: "/brand/cat-chia-buon.webp" },
  { href: "/lan-ho-diep/", title: "Lan hồ điệp", text: "Quà biếu sang trọng, bền lâu", icon: "/brand/cat-lan-ho-diep.webp" },
  { href: "/hoa-gio/", title: "Giỏ hoa", text: "Đặt bàn, không cần bình cắm", icon: "/brand/cat-hoa-gio.webp" },
];

const moreOccasions = [
  { href: "/hoa-tang-me/", title: "Tặng mẹ" },
  { href: "/hoa-tang-sep/", title: "Tặng sếp" },
  { href: "/hoa-mung-tot-nghiep/", title: "Tốt nghiệp" },
  { href: "/hoa-cuoi-cam-tay/", title: "Hoa cưới" },
  { href: "/hoa-chuc-mung/", title: "Chúc mừng" },
  { href: "/hoa-mung-tan-gia/", title: "Tân gia" },
];

const steps = [
  { title: "Chọn mẫu và giờ giao", text: "Hơn 700 mẫu theo dịp, theo ngân sách. Giao hỏa tốc 60 phút nội thành." },
  { title: "Ghi lời chúc", text: "Shop viết thiệp tay hoặc in băng rôn đúng nội dung bạn gửi, miễn phí." },
  { title: "Nhận ảnh hoa thật", text: "Ảnh gửi qua Zalo trước khi giao. Báo lại ngay khi hoa đến tay người nhận." },
];

const reasons = [
  { icon: Flower2, title: "Hoa tươi mỗi ngày", text: "Nhập hoa mới hằng ngày từ nhà vườn, cam kết tươi trên 3 ngày." },
  { icon: BadgeCheck, title: "Đúng mẫu như hình", text: "Mọi mẫu hoa đều do shop thực hiện. Không đúng hình, bạn không cần thanh toán." },
  { icon: Users, title: "Thợ cắm hoa tay nghề cao", text: "Đội ngũ florist giàu kinh nghiệm, tư vấn tận tâm và sáng tạo." },
  { icon: Wallet, title: "Thanh toán linh hoạt", text: "Chuyển khoản VietQR, tiền mặt hoặc thanh toán khi nhận hoa." },
  { icon: HandCoins, title: "Giá hợp lý quanh năm", text: "Nguồn hoa ổn định giúp giữ mức giá tốt kể cả dịp lễ, Tết." },
  { icon: Truck, title: "Giao hoa toàn quốc", text: "Mạng lưới cửa hàng và đối tác trên khắp 63 tỉnh thành." },
];

/**
 * Dữ liệu có cấu trúc cho trang chủ: tên website (WebSite) và doanh nghiệp (Florist – một loại LocalBusiness)
 * kèm từng cửa hàng, giúp Google hiển thị đúng tên thương hiệu và hỗ trợ tìm kiếm địa phương ("shop hoa gần đây").
 */
function homeJsonLd() {
  const org = `${site.url}/#organization`;
  const contact = { telephone: "+84" + site.phone.replace(/^0/, ""), openingHours: "Mo-Su 06:00-21:00", priceRange: "300.000₫ - 5.000.000₫" };
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${site.url}/#website`, url: `${site.url}/`, name: site.name, alternateName: ["Shop hoa tươi Thanh Nhã", "Hoa Thanh Nhã"], inLanguage: "vi-VN", publisher: { "@id": org } },
      {
        "@type": "Florist",
        "@id": org,
        name: site.name,
        url: `${site.url}/`,
        logo: `${site.url}/brand/logo-thanh-nha.png`,
        image: `${site.url}/brand/banner2.webp`,
        description: site.description,
        email: site.email,
        sameAs: [site.zalo, ...site.socials.map((s) => s.href)],
        areaServed: { "@type": "Country", name: "Việt Nam" },
        ...contact,
        address: { "@type": "PostalAddress", streetAddress: site.stores[0].addresses[0], addressLocality: site.stores[0].city, addressCountry: "VN" },
      },
      ...site.stores.flatMap((store) =>
        store.addresses.map((a) => {
          const [city, street] = a.includes(": ") ? a.split(": ") : [store.city, a];
          return {
            "@type": "Florist",
            name: `${site.name} – ${street}`,
            parentOrganization: { "@id": org },
            url: `${site.url}/`,
            image: `${site.url}/brand/banner2.webp`,
            ...contact,
            address: { "@type": "PostalAddress", streetAddress: street, addressLocality: city, addressCountry: "VN" },
          };
        }),
      ),
    ],
  };
}

/** Banner đầu trang: chữ bên trái, ảnh giỏ hoa bên phải trên nền chuyển màu nhẹ */
function HeroSplit() {
  return (
    <section aria-labelledby="hero-h" className="container-x pt-4 sm:pt-6">
      <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-soft via-surface to-leaf-soft p-6 sm:p-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:p-12">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-leaf ring-1 ring-leaf/15">
            <Clock className="size-3.5" aria-hidden />
            Mở cửa 06:00–21:00 · 13 cửa hàng toàn quốc
          </p>
          <h1 id="hero-h" className="mt-5">
            <span className="eyebrow block">Shop hoa tươi Thanh Nhã · từ 2012</span>
            <span className="heading-display mt-3 block text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
              Hoa tươi giao tận tay <span className="text-brand-strong">trong 60 phút</span>
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Chọn mẫu, ghi lời chúc, nhận ảnh hoa thật trước khi giao. Miễn phí giao hoa cho đơn từ 500K.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {/* Cam đậm thay cam logo: chữ trắng đạt tương phản 4.5:1 */}
            <a href="#dip" className="btn-primary bg-brand-strong px-7 text-base hover:bg-brand-strong/90">
              Chọn hoa theo dịp <ArrowRight className="size-4" aria-hidden />
            </a>
            <a href={`tel:${site.phone}`} className="btn-outline px-6 text-base">
              <Phone className="size-4" aria-hidden /> {site.phoneDisplay}
            </a>
            <a href={site.zalo} target="_blank" rel="noopener" className="btn-outline px-4">
              <ZaloIcon className="size-6" /> Zalo
            </a>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {promises.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-sm font-medium leading-snug">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-brand-strong ring-1 ring-border">
                  <Icon className="size-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          {/* Ảnh lớn nhất màn hình đầu (LCP): tải ngay, giải mã đồng bộ */}
          <Image
            src="/brand/hero-gio-hoa.webp"
            alt="Giỏ hoa hồng phấn, cẩm tú cầu và cúc tana của Hoa Thanh Nhã"
            width={880}
            height={833}
            preload
            fetchPriority="high"
            decoding="sync"
            sizes="(min-width: 1024px) 560px, 92vw"
            className="aspect-[880/833] w-full rounded-[1.75rem] object-cover shadow-[0_24px_60px_-28px_rgba(31,26,23,0.45)]"
          />
          <div className="absolute -bottom-4 left-4 flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-lg ring-1 ring-border sm:left-6">
            <span className="grid size-10 place-items-center rounded-full bg-brand text-white">
              <Zap className="size-5" aria-hidden />
            </span>
            <span className="text-sm leading-tight">
              <span className="block font-semibold">Giao hỏa tốc</span>
              <span className="text-muted">60 phút nội thành</span>
            </span>
          </div>
          <div className="absolute right-4 top-4 rounded-full bg-surface/95 px-3 py-1.5 text-xs font-semibold text-leaf shadow ring-1 ring-border">
            Hoa nhập mới mỗi ngày
          </div>
        </div>
      </div>
    </section>
  );
}

/** Nội dung trang chủ */
export async function HomeView() {
  // Lỗi DB (vd. lúc build chưa có kết nối) -> trang vẫn dựng được, lần làm mới sau (≤ 5 phút) sẽ có đủ dữ liệu
  const seoHtmlPromise = getHomeSeo().catch(() => null);
  const sections = await Promise.all(
    homeSections.map(async (s) => {
      const category = await getCategoryBySlug(s.slug);
      if (!category) return null;
      const { items } = await getProductsInCategory(category, { perPage: 12 });
      return { ...s, items };
    }),
  ).catch(() => [] as null[]);
  // 4 mẫu/mục (1 hàng máy tính, 2 hàng điện thoại), không lặp mẫu đã hiện ở mục trên (vd. Hoa sinh nhật và Hoa bó cùng mẫu mới nhất)
  const shown = new Set<number>();
  for (const s of sections) {
    if (!s) continue;
    s.items = s.items.filter((p) => !shown.has(p.id)).slice(0, 4);
    s.items.forEach((p) => shown.add(p.id));
  }

  const seoHtml = await seoHtmlPromise;
  const occasion = upcomingOccasion();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd()).replace(/</g, "\\u003c") }} />
      <HeroSplit />

      {occasion && (
        // Dịp sắp tới: link nội bộ từ trang chủ tới danh mục theo mùa đúng lúc khách bắt đầu tìm
        <section aria-label="Dịp tặng hoa sắp tới" className="container-x mt-8">
          <Link href={occasion.href} className="group flex items-center justify-between gap-4 rounded-2xl bg-brand-soft px-5 py-4 ring-1 ring-brand/20 transition hover:ring-brand">
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wider text-brand-strong">Dịp sắp tới</span>
              <span className="mt-0.5 block font-semibold">{occasion.label}</span>
              <span className="block text-sm text-muted">{occasion.text}</span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-brand-strong transition group-hover:translate-x-1" aria-hidden />
          </Link>
        </section>
      )}

      <section id="dip" aria-labelledby="dip-h" className="container-x mt-16 scroll-mt-40">
        <div className="text-center">
          <p className="eyebrow">Tìm nhanh</p>
          <h2 id="dip-h" className="heading-display mt-2 text-3xl sm:text-4xl">
            Bạn tặng hoa cho dịp nào?
          </h2>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {occasions.map((o) => (
            <li key={o.href}>
              <Link
                href={o.href}
                className="group flex h-full flex-col items-center rounded-2xl bg-surface p-4 text-center ring-1 ring-border transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand sm:p-5"
              >
                <Image src={o.icon} alt="" width={96} height={96} className="size-20 rounded-full object-cover sm:size-24" />
                <span className="mt-3 font-display text-lg font-bold">{o.title}</span>
                <span className="mt-1 text-xs leading-snug text-muted">{o.text}</span>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-5 flex flex-wrap justify-center gap-2">
          {moreOccasions.map((o) => (
            <li key={o.href}>
              <Link href={o.href} className="inline-flex min-h-10 items-center rounded-full bg-surface px-4 text-sm font-medium ring-1 ring-border transition hover:text-brand-strong hover:ring-brand">
                {o.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="steps-h" className="container-x mt-16">
        <div className="rounded-[2rem] bg-leaf px-6 py-10 text-white sm:px-10">
          <h2 id="steps-h" className="font-display text-2xl font-bold sm:text-3xl">
            Đặt hoa chỉ 3 bước, không cần tới cửa hàng
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white font-display text-lg font-bold text-leaf">{i + 1}</span>
                <span>
                  <span className="block font-semibold">{s.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-white/80">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {sections.map((s, i) =>
        s && s.items.length > 0 ? (
          <section key={s.slug} id={s.slug} aria-labelledby={`${s.slug}-h`} className="container-x defer-render mt-16 scroll-mt-40">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Mẫu mới nhất</p>
                <h2 id={`${s.slug}-h`} className="heading-display mt-1 text-3xl sm:text-4xl">
                  {s.title}
                </h2>
              </div>
              <Link href={`/${s.slug}/`} className="btn-outline hidden shrink-0 sm:inline-flex">
                Xem tất cả <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
              {s.items.map((p) => (
                // Không ưu tiên ảnh sản phẩm: ảnh lớn nhất màn hình đầu là banner
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="mt-6 text-center sm:hidden">
              <Link href={`/${s.slug}/`} className="btn-outline">
                Xem tất cả {s.title.toLowerCase()} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            {i === 2 && (
              <a
                href={`tel:${site.phone}`}
                className="mt-12 flex flex-col items-center justify-between gap-4 rounded-3xl bg-leaf px-6 py-8 text-white sm:flex-row sm:px-10"
              >
                <span>
                  <span className="block font-display text-2xl font-bold sm:text-3xl">Cần tư vấn chọn hoa?</span>
                  <span className="mt-1 block text-sm text-white/80">Florist của Thanh Nhã hỗ trợ 24/7, lên mẫu theo ngân sách của bạn.</span>
                </span>
                <span className="btn bg-white text-leaf hover:bg-white/90">Gọi {site.phoneDisplay}</span>
              </a>
            )}
          </section>
        ) : null,
      )}

      <section aria-labelledby="why-h" className="defer-render mt-20 bg-surface-muted py-16">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Vì sao chọn Thanh Nhã</p>
            <h2 id="why-h" className="heading-display mt-2 text-3xl sm:text-4xl">
              Hơn 10 năm trao gửi yêu thương
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              Thành lập từ tháng 10/2012, Hoa Thanh Nhã đã mở rộng hệ thống chi nhánh ra toàn quốc với sứ mệnh truyền tải trọn vẹn cảm xúc từ
              người tặng đến người nhận.
            </p>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reasons.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-2xl bg-surface p-6">
                <Icon className="size-6 text-brand-strong" aria-hidden />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {seoHtml && (
        <section aria-label="Về chúng tôi" className="container-x mt-16 max-w-4xl">
          <ReadMore html={cleanHtml(seoHtml)} collapsedHeight={280} />
        </section>
      )}
    </>
  );
}
