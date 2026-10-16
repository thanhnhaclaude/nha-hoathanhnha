"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Tải lại dữ liệu đơn mỗi 6 giây trong lúc chờ chuyển khoản, để khách thấy "Đã thanh toán" ngay khi SePay báo tiền về. */
export function PaymentWatcher() {
  const router = useRouter();
  useEffect(() => {
    let ticks = 0;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (++ticks > 150) return clearInterval(id); // dừng sau ~15 phút
      router.refresh();
    }, 6000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
