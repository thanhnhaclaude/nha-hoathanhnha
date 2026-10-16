import Image from "next/image";
import Link from "next/link";
import { Clock, Phone, Search } from "lucide-react";
import { site } from "@/lib/site";
import { mainMenu } from "@/lib/menu";
import { CartButton } from "./cart-button";
import { MobileMenu } from "./mobile-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="bg-leaf text-white">
        <div className="container-x flex h-9 items-center justify-between gap-4 text-xs sm:text-[13px]">
          <p className="truncate font-medium">{site.promo}</p>
          <div className="hidden shrink-0 items-center gap-5 md:flex">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden /> {site.hours}
            </span>
            <a href={`tel:${site.phone}`} className="inline-flex items-center gap-1.5 hover:underline">
              <Phone className="size-3.5" aria-hidden /> {site.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      <div className="container-x flex h-16 items-center gap-3 sm:h-20 sm:gap-6">
        <MobileMenu menu={mainMenu} />
        <Link href="/" className="shrink-0" aria-label={`${site.name} – trang chủ`}>
          <Image src="/brand/logo-hoa-thanhnha.webp" alt={site.name} width={500} height={157} priority className="h-10 w-auto sm:h-14" />
        </Link>

        <form action="/tim-kiem/" className="relative mx-auto hidden w-full max-w-md md:block" role="search">
          <label htmlFor="q" className="sr-only">
            Tìm kiếm sản phẩm
          </label>
          <input id="q" name="q" type="search" placeholder="Tìm mẫu hoa, mã sản phẩm…" className="field h-11 rounded-full py-0 pr-12" />
          <button
            type="submit"
            aria-label="Tìm kiếm"
            className="absolute right-1 top-1 grid size-9 cursor-pointer place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-strong"
          >
            <Search className="size-4" aria-hidden />
          </button>
        </form>

        <div className="ml-auto flex items-center gap-2 sm:gap-4 md:ml-0">
          <a href={`tel:${site.phone}`} className="hidden items-center gap-3 lg:flex">
            <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand-strong">
              <Phone className="size-4" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] uppercase tracking-wider text-muted">Đặt hoa 24/7</span>
              <span className="block font-semibold text-brand-strong">{site.phoneDisplay}</span>
            </span>
          </a>
          <Link href="/tim-kiem/" className="grid size-11 place-items-center rounded-full text-foreground hover:bg-surface-muted md:hidden" aria-label="Tìm kiếm">
            <Search className="size-5" aria-hidden />
          </Link>
          <CartButton />
        </div>
      </div>

      <nav aria-label="Danh mục chính" className="hidden border-t border-border lg:block">
        <ul className="container-x flex items-center justify-between">
          {mainMenu.map((group) => (
            <li key={group.slug} className="group relative">
              <Link
                href={`/${group.slug}/`}
                className="flex h-12 items-center px-2 text-[13px] font-semibold uppercase tracking-wider text-foreground transition-colors hover:text-brand-strong xl:px-3"
              >
                {group.label}
              </Link>
              <div className="invisible absolute left-0 top-full z-50 w-64 translate-y-1 rounded-b-2xl border border-border bg-surface p-2 opacity-0 shadow-xl transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <ul className="max-h-[70vh] overflow-auto">
                  {group.children.map((item) => (
                    <li key={item.slug}>
                      <Link href={`/${item.slug}/`} className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-brand-soft hover:text-brand-strong">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
