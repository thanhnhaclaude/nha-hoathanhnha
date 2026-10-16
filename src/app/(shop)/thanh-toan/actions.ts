"use server";

import { createOrder } from "@/lib/orders";

export type PlaceOrderResult =
  | { ok: true; code: string; accessToken: string }
  | { ok: false; message: string; errors: Record<string, string[] | undefined> };

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  try {
    const res = await createOrder(input);
    if (!res.ok) return { ok: false, message: res.message, errors: res.errors };
    return { ok: true, code: res.code, accessToken: res.accessToken };
  } catch (e) {
    console.error("placeOrder", e);
    return { ok: false, message: "Hệ thống đang bận, vui lòng thử lại hoặc gọi hotline để đặt hoa.", errors: {} };
  }
}
