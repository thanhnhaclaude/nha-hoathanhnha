import type { Metadata } from "next";
import { Search } from "lucide-react";
import { Pagination, SortBar, parseListingParams } from "@/components/listing";
import { ProductGrid } from "@/components/product-card";
import { searchProducts } from "@/lib/queries";

export const metadata: Metadata = { title: "Tìm kiếm", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: PageProps<"/tim-kiem">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const { page, sort } = parseListingParams(sp);
  const result = q ? await searchProducts(q, { page, sort }) : null;

  return (
    <div className="container-x py-10">
      <h1 className="heading-display text-4xl sm:text-5xl">{q ? `Kết quả cho “${q}”` : "Tìm kiếm"}</h1>
      <form action="/tim-kiem/" role="search" className="relative mt-6 max-w-xl">
        <label htmlFor="search-q" className="sr-only">
          Từ khóa
        </label>
        <input id="search-q" name="q" type="search" defaultValue={q} placeholder="Tìm mẫu hoa, mã sản phẩm…" className="field h-12 rounded-full pr-14" autoFocus={!q} />
        <button type="submit" aria-label="Tìm kiếm" className="absolute right-1.5 top-1.5 grid size-9 cursor-pointer place-items-center rounded-full bg-brand text-white hover:bg-brand-strong">
          <Search className="size-4" aria-hidden />
        </button>
      </form>
      {result && (
        <>
          <div className="mt-8">
            <SortBar base="/tim-kiem/" sort={sort} total={result.total} extra={{ q }} />
          </div>
          <div className="mt-6">
            {result.items.length ? (
              <ProductGrid products={result.items} priorityCount={5} />
            ) : (
              <p className="rounded-2xl bg-surface p-10 text-center text-muted">Không tìm thấy mẫu hoa phù hợp. Thử từ khóa khác như “hoa hồng”, “khai trương”, “HB0”.</p>
            )}
          </div>
          <Pagination base="/tim-kiem/" page={page} pages={result.pages} sort={sort} extra={{ q }} />
        </>
      )}
    </div>
  );
}
