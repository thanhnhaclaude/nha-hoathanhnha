"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Banknote, Loader2, QrCode } from "lucide-react";
import { useCart } from "@/components/cart";
import { formatVND } from "@/lib/format";
import { gaItem, trackEvent } from "@/lib/google";
import { placeOrder } from "./actions";

const timeSlots = ["Càng sớm càng tốt", "07:00 – 09:00", "09:00 – 11:00", "11:00 – 13:00", "13:00 – 15:00", "15:00 – 17:00", "17:00 – 19:00", "19:00 – 21:00"];

const cities = ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Bình Dương", "Đồng Nai", "Bà Rịa – Vũng Tàu", "Khánh Hòa", "Thừa Thiên Huế", "Tỉnh/thành khác"];

type Errors = Record<string, string[] | undefined>;

function Field({ name, label, errors, required, children }: { name: string; label: string; errors: Errors; required?: boolean; children: React.ReactNode }) {
  const err = errors[name]?.[0];
  return (
    <div>
      <label htmlFor={name} className="label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {err && (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-danger" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm({ shipping, today }: { shipping: { fee: number; freeThreshold: number }; today: string }) {
  const { lines, subtotal, ready, clear } = useCart();
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [payment, setPayment] = useState<"vietqr" | "cod">("vietqr");
  const [pending, startTransition] = useTransition();

  const shippingFee = subtotal >= shipping.freeThreshold ? 0 : shipping.fee;

  // GA4: bắt đầu thanh toán (một lần khi giỏ hàng đã sẵn sàng)
  const tracked = useRef(false);
  useEffect(() => {
    if (!ready || !lines.length || tracked.current) return;
    tracked.current = true;
    trackEvent("begin_checkout", { value: subtotal, items: lines.map((l) => gaItem(l)) });
  }, [ready, lines, subtotal]);

  if (!ready) return <div className="mt-8 h-96 animate-pulse rounded-3xl bg-surface-muted" />;
  if (lines.length === 0) {
    return (
      <div className="mt-8 rounded-3xl bg-surface p-10 text-center">
        <p className="text-muted">Giỏ hàng đang trống.</p>
        <Link href="/" className="btn-primary mt-4">
          Chọn hoa ngay
        </Link>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as Record<string, string>;
    setMessage(null);
    startTransition(async () => {
      const res = await placeOrder({ ...data, paymentMethod: payment, items: lines.map((l) => ({ id: l.id, quantity: l.quantity })) });
      if (res.ok) {
        clear();
        // Tải lại toàn trang tại đường dẫn "đơn hàng đã nhận" giống WooCommerce cũ:
        // GA4 ghi sự kiện mua hàng khi trang này tải (gtag.js tải ngay ở đường dẫn này).
        window.location.assign(`/thanh-toan/don-hang-da-nhan/${res.code}/?t=${res.accessToken}`);
      } else {
        setErrors(res.errors);
        setMessage(res.message);
        const first = Object.keys(res.errors).find((k) => res.errors[k]?.length);
        if (first) document.getElementById(first)?.focus();
      }
    });
  };

  const inputProps = (name: string) => ({
    id: name,
    name,
    className: "field",
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-8">
        <fieldset className="rounded-3xl border border-border bg-surface p-6">
          <legend className="px-2 font-display text-2xl font-bold">Người đặt hoa</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <Field name="senderName" label="Họ và tên" errors={errors} required>
              <input {...inputProps("senderName")} autoComplete="name" required />
            </Field>
            <Field name="senderPhone" label="Số điện thoại" errors={errors} required>
              <input {...inputProps("senderPhone")} type="tel" inputMode="tel" autoComplete="tel" required />
            </Field>
            <div className="sm:col-span-2">
              <Field name="senderEmail" label="Email (nhận xác nhận đơn)" errors={errors}>
                <input {...inputProps("senderEmail")} type="email" autoComplete="email" />
              </Field>
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-border bg-surface p-6">
          <legend className="px-2 font-display text-2xl font-bold">Người nhận & giao hoa</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <Field name="recipientName" label="Tên người nhận" errors={errors} required>
              <input {...inputProps("recipientName")} required />
            </Field>
            <Field name="recipientPhone" label="SĐT người nhận" errors={errors} required>
              <input {...inputProps("recipientPhone")} type="tel" inputMode="tel" required />
            </Field>
            <div className="sm:col-span-2">
              <Field name="address" label="Địa chỉ giao hoa" errors={errors} required>
                <input {...inputProps("address")} placeholder="Số nhà, tên đường, phường/xã, quận/huyện" autoComplete="street-address" required />
              </Field>
            </div>
            <Field name="city" label="Tỉnh/thành phố" errors={errors} required>
              <select {...inputProps("city")} defaultValue="TP. Hồ Chí Minh">
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field name="deliveryDate" label="Ngày giao" errors={errors} required>
              <input {...inputProps("deliveryDate")} type="date" min={today} defaultValue={today} required />
            </Field>
            <div className="sm:col-span-2">
              <Field name="deliveryTime" label="Khung giờ giao" errors={errors} required>
                <select {...inputProps("deliveryTime")} defaultValue={timeSlots[0]}>
                  {timeSlots.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-border bg-surface p-6">
          <legend className="px-2 font-display text-2xl font-bold">Lời nhắn (miễn phí)</legend>
          <div className="mt-2 grid gap-4">
            <Field name="cardMessage" label="Nội dung thiệp" errors={errors}>
              <textarea {...inputProps("cardMessage")} rows={3} placeholder="Ví dụ: Chúc mừng sinh nhật em yêu!" />
            </Field>
            <Field name="bannerMessage" label="Nội dung băng rôn (hoa khai trương, chia buồn)" errors={errors}>
              <textarea {...inputProps("bannerMessage")} rows={2} placeholder="Ví dụ: Chúc mừng khai trương – Hồng phát" />
            </Field>
            <Field name="note" label="Ghi chú cho shop" errors={errors}>
              <textarea {...inputProps("note")} rows={2} placeholder="Giấu tên người gửi, gọi trước khi giao…" />
            </Field>
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-border bg-surface p-6">
          <legend className="px-2 font-display text-2xl font-bold">Phương thức thanh toán</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {(
              [
                { key: "vietqr", icon: QrCode, title: "Chuyển khoản VietQR", text: "Quét mã QR bằng app ngân hàng sau khi đặt" },
                { key: "cod", icon: Banknote, title: "Thanh toán khi nhận hoa", text: "Trả tiền mặt cho nhân viên giao hoa" },
              ] as const
            ).map(({ key, icon: Icon, title, text }) => (
              <label
                key={key}
                className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors ${payment === key ? "border-brand bg-brand-soft" : "border-border hover:border-brand/50"}`}
              >
                <input type="radio" name="paymentMethodRadio" value={key} checked={payment === key} onChange={() => setPayment(key)} className="mt-1 accent-[var(--brand)]" />
                <span>
                  <span className="flex items-center gap-2 font-semibold">
                    <Icon className="size-4 text-brand-strong" aria-hidden /> {title}
                  </span>
                  <span className="mt-1 block text-sm text-muted">{text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className="h-fit rounded-3xl border border-border bg-surface p-6 lg:sticky lg:top-44">
        <h2 className="font-display text-2xl font-bold">Đơn hàng của bạn</h2>
        <ul className="mt-4 divide-y divide-border">
          {lines.map((l) => (
            <li key={l.id} className="flex gap-3 py-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                {l.image && <Image src={l.image} alt="" fill sizes="64px" className="object-cover" />}
                <span className="absolute -right-0 -top-0 grid size-5 place-items-center rounded-bl-lg bg-foreground text-xs font-bold text-white">{l.quantity}</span>
              </div>
              <span className="flex-1 text-sm">{l.name}</span>
              <span className="text-sm font-semibold">{formatVND(l.price * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Tạm tính</dt>
            <dd>{formatVND(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Phí giao hoa</dt>
            <dd>{shippingFee === 0 ? <span className="font-semibold text-leaf">Miễn phí</span> : formatVND(shippingFee)}</dd>
          </div>
          {shippingFee > 0 && <p className="text-xs text-muted">Miễn phí giao hoa cho đơn từ {formatVND(shipping.freeThreshold)}.</p>}
          <div className="flex justify-between border-t border-border pt-3 text-base">
            <dt className="font-semibold">Tổng cộng</dt>
            <dd className="text-xl font-semibold text-brand-strong">{formatVND(subtotal + shippingFee)}</dd>
          </div>
        </dl>
        {message && (
          <p className="mt-4 rounded-xl bg-danger/10 p-3 text-sm text-danger" role="alert">
            {message}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn-primary mt-6 h-12 w-full">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending ? "Đang gửi đơn…" : "Xác nhận đặt hoa"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">Không đúng mẫu như hình – bạn không cần thanh toán.</p>
      </aside>
    </form>
  );
}
