"use client";

import { useEffect } from "react";
import { gaItem, trackEvent } from "@/lib/google";

/** GA4 "view_item" khi khách mở trang sản phẩm. */
export function ViewItemTracker({ id, name, price }: { id: number; name: string; price: number }) {
  useEffect(() => {
    const t = setTimeout(() => trackEvent("view_item", { value: price, items: [gaItem({ id, name, price })] }), 1500);
    return () => clearTimeout(t);
  }, [id, name, price]);
  return null;
}
