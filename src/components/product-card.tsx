import Image from "next/image";
import Link from "next/link";
import { effectivePrice, formatVND } from "@/lib/format";
import type { ProductCardData } from "@/lib/queries";

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const price = effectivePrice(product);
  const onSale = price < product.price;
  const discount = onSale ? Math.round((1 - price / product.price) * 100) : 0;
  return (
    <Link
      href={`/${product.slug}/`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow duration-300 hover:shadow-[0_12px_32px_-12px_rgba(60,30,10,0.25)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : null}
        {onSale && (
          <span className="absolute left-3 top-3 rounded-full bg-danger px-2.5 py-1 text-xs font-semibold text-white">
            -{discount}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground sm:text-[15px]">{product.name}</h3>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2">
          {price > 0 ? (
            <>
              <span className="text-base font-semibold text-brand-strong">{formatVND(price)}</span>
              {onSale && <span className="text-xs text-muted line-through">{formatVND(product.price)}</span>}
            </>
          ) : (
            <span className="text-sm font-semibold text-leaf">Liên hệ</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
