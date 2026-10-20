import type { Metadata } from "next";
import Image from "next/image";
import { seoMetadata } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Camera, Gift, HandCoins, Flower2, Truck, Users, Wallet, Zap } from "lucide-react";
import { HeroSlider } from "@/components/hero-slider";
import { ProductCard } from "@/components/product-card";
import { homeSections } from "@/lib/menu";
import { ReadMore } from "@/components/read-more";
import { getCategoryBySlug, getHomeSeo, getProductsInCategory } from "@/lib/queries";
import { cleanHtml } from "@/lib/sanitize";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return seoMetadata("/", { title: site.title, description: site.description });
}

const perks = [
  { icon: Zap, title: "Giao hoa hỏa tốc", text: "60 phút nội thành, 90 phút ngoại thành" },
  { icon: Gift, title: "Miễn phí thiệp & băng rôn", text: "Ghi lời chúc theo yêu cầu của bạn" },
  { icon: Truck, title: "Miễn phí giao hoa", text: "Đơn từ 500k (hoa bó, giỏ), 900k (kệ hoa)" },
  { icon: Camera, title: "Chụp hình trước khi giao", text: "Báo ngay khi hoa đã đến tay người nhận" },
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

export default async function HomePage() {
  const seoHtmlPromise = getHomeSeo();
  const sections = await Promise.all(
    homeSections.map(async (s) => {
      const category = await getCategoryBySlug(s.slug);
      if (!category) return null;
      const { items } = await getProductsInCategory(category, { perPage: 10 });
      return { ...s, items };
    }),
  );

  const seoHtml = await seoHtmlPromise;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd()).replace(/</g, "\\u003c") }} />
      <div className="container-x pt-4 sm:pt-6">
        <HeroSlider />
      </div>

      <section className="container-x mt-10 text-center">
        <p className="eyebrow">Since 2012 · {site.tagline}</p>
        <h1 className="heading-display mx-auto mt-3 max-w-3xl text-3xl leading-tight sm:text-5xl">
          Shop hoa tươi Thanh Nhã – đặt hoa online, giao hoa miễn phí
        </h1>
      </section>

      <section aria-label="Ưu đãi dịch vụ" className="container-x mt-10">
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {perks.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-5 text-center sm:flex-row sm:text-left">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-strong">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cat-heading" className="container-x mt-16">
        <h2 id="cat-heading" className="heading-display text-center text-3xl sm:text-4xl">
          Danh mục sản phẩm
        </h2>
        <ul className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-6">
          {homeSections.map((s) => (
            <li key={s.slug}>
              <a href={`#${s.slug}`} className="group flex flex-col items-center gap-3 text-center">
                <span className="grid size-20 place-items-center rounded-full bg-surface ring-1 ring-border transition-all duration-300 group-hover:ring-2 group-hover:ring-brand sm:size-24">
                  <Image src={s.icon} alt="" width={64} height={64} className="size-12 object-contain sm:size-14" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider sm:text-sm">{s.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {sections.map((s, i) =>
        s && s.items.length > 0 ? (
          <section key={s.slug} id={s.slug} aria-labelledby={`${s.slug}-h`} className="container-x mt-16 scroll-mt-40">
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
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
              {s.items.map((p, j) => (
                <ProductCard key={p.id} product={p} priority={i === 0 && j < 2} />
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
                  <span className="block font-display text-2xl font-semibold sm:text-3xl">Cần tư vấn chọn hoa?</span>
                  <span className="mt-1 block text-sm text-white/80">Florist của Thanh Nhã hỗ trợ 24/7, lên mẫu theo ngân sách của bạn.</span>
                </span>
                <span className="btn bg-white text-leaf hover:bg-white/90">Gọi {site.phoneDisplay}</span>
              </a>
            )}
          </section>
        ) : null,
      )}

      <section aria-labelledby="why-h" className="mt-20 bg-surface-muted py-16">
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
