"use client";

import { useEffect } from "react";
import { gaItem, trackEvent } from "@/lib/google";

type Item = { id: number; name: string; price: number; quantity: number };

/** GA4 "purchase": gửi một lần cho mỗi đơn (tải lại trang không bị tính trùng). */
export function PurchaseTracker({ code, value, shipping, items }: { code: string; value: number; shipping: number; items: Item[] }) {
  useEffect(() => {
    const key = `htn_ga_purchase_${code}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}
    // Đợi gtag tải xong (afterInteractive) rồi mới gửi
    let tries = 0;
    const id = setInterval(() => {
      const ready = typeof (window as unknown as { gtag?: unknown }).gtag === "function";
      if (ready) trackEvent("purchase", { transaction_id: code, value, shipping, items: items.map((i) => gaItem(i)) });
      if (ready || ++tries > 20) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [code, value, shipping, items]);
  return null;
}
