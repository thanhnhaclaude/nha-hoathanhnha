"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Hàng nút danh mục cuộn ngang: ẩn thanh cuộn của trình duyệt, vuốt trên điện thoại,
 * nút mũi tên + viền mờ hai bên trên máy tính khi còn mục bị khuất. Tự cuộn tới mục đang chọn.
 */
export function ChipScroller({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>('[aria-current="page"]');
    if (active) el.scrollLeft = active.offsetLeft - el.clientWidth / 2 + active.offsetWidth / 2;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const scrollBy = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: "smooth" });

  return (
    <nav aria-label={label} className="relative -mx-4 mt-6">
      <div ref={ref} onScroll={update} className="scrollbar-none overflow-x-auto scroll-smooth px-4 py-1">
        {children}
      </div>
      {edge.left && (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Xem danh mục trước"
            className="absolute left-1 top-1/2 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-surface shadow ring-1 ring-border transition hover:ring-brand md:grid"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
        </>
      )}
      {edge.right && (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Xem thêm danh mục"
            className="absolute right-1 top-1/2 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-surface shadow ring-1 ring-border transition hover:ring-brand md:grid"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </>
      )}
    </nav>
  );
}
