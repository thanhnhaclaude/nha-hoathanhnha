"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return <div className="aspect-[4/5] rounded-3xl bg-surface-muted" />;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-surface-muted">
        {/* Ảnh lớn nhất màn hình đầu (LCP): giải mã đồng bộ để vẽ cùng lần hiển thị đầu tiên */}
        <Image src={images[active]} alt={name} fill preload fetchPriority="high" decoding={active === 0 ? "sync" : "async"} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
      {images.length > 1 && (
        <ul className="flex gap-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-current={i === active}
                className={`relative block size-20 cursor-pointer overflow-hidden rounded-xl ring-2 transition ${i === active ? "ring-brand" : "ring-transparent hover:ring-border"}`}
              >
                <Image src={src} alt={`${name} – ảnh ${i + 1}`} fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
