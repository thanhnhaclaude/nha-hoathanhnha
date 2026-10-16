"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  { src: "/brand/banner2.webp", alt: "Bộ sưu tập hoa tươi Thanh Nhã", href: "/mau-hoa-moi", w: 2306, h: 833 },
  { src: "/brand/banner3.webp", alt: "Hoa khai trương sang trọng", href: "/hoa-khai-truong", w: 2306, h: 833 },
  { src: "/brand/banner1.webp", alt: "Sắc hoa giản đơn – mua ngay", href: "/hoa-bo", w: 1153, h: 417 },
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [paused]);

  const go = (d: number) => setIndex((i) => (i + d + slides.length) % slides.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Banner khuyến mãi"
      className="relative overflow-hidden rounded-3xl bg-surface-muted"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative aspect-[2306/833]">
        {slides.map((s, i) => (
          <Link
            key={s.src}
            href={s.href}
            className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "pointer-events-none opacity-0"}`}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
          >
            <Image src={s.src} alt={s.alt} fill priority={i === 0} sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover" />
          </Link>
        ))}
      </div>
      <button type="button" onClick={() => go(-1)} aria-label="Banner trước" className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/85 text-foreground shadow transition hover:bg-white sm:grid">
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <button type="button" onClick={() => go(1)} aria-label="Banner tiếp theo" className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/85 text-foreground shadow transition hover:bg-white sm:grid">
        <ChevronRight className="size-5" aria-hidden />
      </button>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((s, i) => (
          <button
            key={s.src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Chuyển tới banner ${i + 1}`}
            aria-current={i === index}
            className="grid size-6 cursor-pointer place-items-center"
          >
            <span className={`block h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/60"}`} />
          </button>
        ))}
      </div>
    </section>
  );
}
