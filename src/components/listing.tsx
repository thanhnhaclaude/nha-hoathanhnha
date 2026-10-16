import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SortKey } from "@/lib/queries";
import { site } from "@/lib/site";

const sorts: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Mới nhất" },
  { key: "price-asc", label: "Giá thấp → cao" },
  { key: "price-desc", label: "Giá cao → thấp" },
];

function href(base: string, params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "" && !(k === "page" && v === 1) && !(k === "sort" && v === "newest")) sp.set(k, String(v));
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export function parseListingParams(sp: Record<string, string | string[] | undefined>) {
  const page = Math.max(1, Number(sp.page) || 1);
  const sort = (sorts.some((s) => s.key === sp.sort) ? sp.sort : "newest") as SortKey;
  return { page, sort };
}

export function SortBar({ base, sort, total, extra = {} }: { base: string; sort: SortKey; total: number; extra?: Record<string, string> }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">{total.toLocaleString("vi-VN")} mẫu hoa</p>
      <nav aria-label="Sắp xếp" className="flex flex-wrap gap-2">
        {sorts.map((s) => (
          <Link
            key={s.key}
            href={href(base, { ...extra, sort: s.key })}
            aria-current={s.key === sort ? "true" : undefined}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${s.key === sort ? "bg-foreground text-white" : "bg-surface text-foreground ring-1 ring-border hover:ring-brand"}`}
          >
            {s.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Pagination({ base, page, pages, sort, extra = {} }: { base: string; page: number; pages: number; sort: SortKey; extra?: Record<string, string> }) {
  if (pages <= 1) return null;
  const nums = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const list = [...nums].sort((a, b) => a - b);
  const cls = "grid min-w-11 h-11 place-items-center rounded-full px-3 text-sm";
  return (
    <nav aria-label="Phân trang" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={href(base, { ...extra, sort, page: page - 1 })} className={`${cls} ring-1 ring-border hover:ring-brand`} aria-label="Trang trước">
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      )}
      {list.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - list[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={href(base, { ...extra, sort, page: n })}
            aria-current={n === page ? "page" : undefined}
            className={`${cls} ${n === page ? "bg-brand font-semibold text-white" : "ring-1 ring-border hover:ring-brand"}`}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link href={href(base, { ...extra, sort, page: page + 1 })} className={`${cls} ring-1 ring-border hover:ring-brand`} aria-label="Trang sau">
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      )}
    </nav>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  // Dữ liệu có cấu trúc BreadcrumbList: Google hiển thị đường dẫn phân cấp thay cho URL trong kết quả tìm kiếm
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ label: "Trang chủ", href: "/" }, ...items].map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.label,
      ...(it.href ? { item: `${site.url}${it.href}` } : {}),
    })),
  };
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-brand-strong">
            Trang chủ
          </Link>
        </li>
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-1.5">
            <span aria-hidden>/</span>
            {it.href ? (
              <Link href={it.href} className="hover:text-brand-strong">
                {it.label}
              </Link>
            ) : (
              <span className="text-foreground" aria-current="page">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
