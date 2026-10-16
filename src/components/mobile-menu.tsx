"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import type { MenuGroup } from "@/lib/menu";
import { site } from "@/lib/site";

export function MobileMenu({ menu }: { menu: MenuGroup[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-11 cursor-pointer place-items-center rounded-full hover:bg-surface-muted"
        aria-label="Mở danh mục"
        aria-expanded={open}
      >
        <Menu className="size-6" aria-hidden />
      </button>
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-sm flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Danh mục"
        inert={!open}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span className="font-display text-xl font-semibold">Danh mục</span>
          <button type="button" onClick={() => setOpen(false)} className="grid size-11 cursor-pointer place-items-center rounded-full hover:bg-surface-muted" aria-label="Đóng">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {menu.map((g) => {
            const isOpen = expanded === g.slug;
            return (
              <div key={g.slug} className="border-b border-border/70 last:border-0">
                <div className="flex items-center">
                  <Link href={`/${g.slug}/`} className="flex-1 px-3 py-3 text-sm font-semibold uppercase tracking-wider">
                    {g.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : g.slug)}
                    className="grid size-11 cursor-pointer place-items-center"
                    aria-label={`${isOpen ? "Thu gọn" : "Mở"} ${g.label}`}
                    aria-expanded={isOpen}
                  >
                    <ChevronDown className={`size-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                  </button>
                </div>
                {isOpen && (
                  <ul className="pb-2 pl-3">
                    {g.children.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/${c.slug}/`} className="block rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-brand-soft hover:text-brand-strong">
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
        <a href={`tel:${site.phone}`} className="btn-primary m-4">
          <Phone className="size-4" aria-hidden /> Gọi đặt hoa {site.phoneDisplay}
        </a>
      </aside>
    </div>
  );
}
