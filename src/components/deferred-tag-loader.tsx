"use client";

import { useEffect } from "react";

/** Trang cần tải gtag.js ngay (sự kiện mua hàng gửi lúc tải trang). */
const IMMEDIATE = /^\/thanh-toan\/don-hang-da-nhan\//;
const EVENTS = ["pointerdown", "keydown", "touchstart", "scroll", "wheel", "mousemove"] as const;

type W = Window & { __htnTagsLoaded?: boolean };

function inject(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

/**
 * Tải gtag.js khi khách thao tác lần đầu (chạm, cuộn, di chuột, gõ phím).
 * Các lệnh gtag/dataLayer gọi trước đó đã nằm trong hàng đợi và được gửi đủ khi file tải xong.
 */
export function DeferredTagLoader({ gaId }: { gaId: string }) {
  useEffect(() => {
    const w = window as W;
    const load = () => {
      if (w.__htnTagsLoaded) return;
      w.__htnTagsLoaded = true;
      inject(`https://www.googletagmanager.com/gtag/js?id=${gaId}`);
      EVENTS.forEach((e) => window.removeEventListener(e, load));
    };
    if (w.__htnTagsLoaded) return;
    if (IMMEDIATE.test(location.pathname)) return load();
    EVENTS.forEach((e) => window.addEventListener(e, load, { passive: true, once: true }));
    return () => EVENTS.forEach((e) => window.removeEventListener(e, load));
  }, [gaId]);
  return null;
}
