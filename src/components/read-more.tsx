"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Thu gọn nội dung dài; toàn bộ HTML vẫn được render sẵn để Google đọc được. */
export function ReadMore({ html, children, collapsedHeight = 360 }: { html?: string; children?: ReactNode; collapsedHeight?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="relative overflow-hidden transition-[max-height] duration-500" style={{ maxHeight: open ? "none" : collapsedHeight }}>
        {html !== undefined ? <div className="prose-shop" dangerouslySetInnerHTML={{ __html: html }} /> : children}
        {!open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" aria-hidden />}
      </div>
      <div className="mt-4 text-center">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="btn-outline">
          {open ? "Thu gọn" : "Xem thêm"}
          <ChevronDown className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </div>
    </div>
  );
}
