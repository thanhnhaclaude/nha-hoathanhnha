import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { eq } from "drizzle-orm";
import { db, orders, orderItems, type Order, type OrderItem } from "./db";
import { formatVND } from "./format";
import { site } from "./site";

/**
 * Gửi email qua SMTP (Hostinger: smtp.hostinger.com, cổng 465).
 * Thiếu SMTP_HOST/SMTP_USER/SMTP_PASS thì bỏ qua, không làm hỏng việc đặt hàng.
 */
let transporter: Transporter | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    transporter = null;
    return null;
  }
  const port = Number(process.env.SMTP_PORT ?? 465);
  transporter = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  return transporter;
}

const shopEmail = () => process.env.SHOP_EMAIL || process.env.SMTP_USER;
const fromAddress = () => process.env.MAIL_FROM || `"${site.name}" <${process.env.SMTP_USER}>`;

async function send(to: string | undefined | null, subject: string, html: string) {
  const t = getTransporter();
  if (!t || !to) return;
  try {
    await t.sendMail({ from: fromAddress(), to, subject, html });
  } catch (e) {
    console.error("sendMail", subject, e);
  }
}

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function orderUrl(order: Order) {
  return `${site.url}/don-hang/${order.code}/?t=${order.accessToken}`;
}

function orderHtml(order: Order, items: OrderItem[], intro: string, link: string) {
  const rows = items
    .map(
      (it) =>
        `<tr><td style="padding:6px 0">${esc(it.name)} × ${it.quantity}</td><td style="padding:6px 0;text-align:right">${formatVND(it.unitPrice * it.quantity)}</td></tr>`,
    )
    .join("");
  const info: [string, string | null][] = [
    ["Người đặt", `${order.senderName} – ${order.senderPhone}${order.senderEmail ? ` – ${order.senderEmail}` : ""}`],
    ["Người nhận", `${order.recipientName} – ${order.recipientPhone}`],
    ["Địa chỉ", `${order.address}, ${order.city}`],
    ["Giao lúc", `${new Date(order.deliveryDate).toLocaleDateString("vi-VN")} · ${order.deliveryTime}`],
    ["Thanh toán", order.paymentMethod === "vietqr" ? "Chuyển khoản VietQR" : "Khi nhận hoa"],
    ["Thiệp", order.cardMessage],
    ["Băng rôn", order.bannerMessage],
    ["Ghi chú", order.note],
  ];
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#2b2b2b;line-height:1.5">
<h2 style="color:#b9480b;margin:0 0 8px">${esc(site.name)}</h2>
<p>${intro}</p>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #eee;border-bottom:1px solid #eee">${rows}
<tr><td style="padding:6px 0;color:#777">Phí giao hoa</td><td style="padding:6px 0;text-align:right">${order.shippingFee ? formatVND(order.shippingFee) : "Miễn phí"}</td></tr>
<tr><td style="padding:6px 0"><b>Tổng cộng</b></td><td style="padding:6px 0;text-align:right"><b>${formatVND(order.total)}</b></td></tr></table>
<table style="width:100%;margin-top:12px;font-size:14px">${info
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="color:#777;padding:3px 12px 3px 0;vertical-align:top;white-space:nowrap">${k}</td><td style="white-space:pre-line">${esc(v)}</td></tr>`)
    .join("")}</table>
<p style="margin-top:20px"><a href="${link}" style="background:#b9480b;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Xem đơn hàng</a></p>
<p style="font-size:13px;color:#777">Hotline ${site.phoneDisplay} · ${esc(site.url.replace(/^https?:\/\//, ""))}</p></div>`;
}

async function loadOrder(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return { order, items };
}

/** Báo đơn mới cho shop và gửi xác nhận cho khách (nếu khách để lại email). */
export async function sendNewOrderEmails(orderId: number) {
  const data = await loadOrder(orderId);
  if (!data) return;
  const { order, items } = data;
  await Promise.all([
    send(
      shopEmail(),
      `[Đơn mới] ${order.code} – ${formatVND(order.total)} – giao ${order.deliveryTime} ${new Date(order.deliveryDate).toLocaleDateString("vi-VN")}`,
      orderHtml(order, items, `Có đơn hàng mới <b>${order.code}</b>.`, `${site.url}/admin/don-hang/${order.id}/`),
    ),
    send(
      order.senderEmail,
      `Hoa Thanh Nhã đã nhận đơn ${order.code}`,
      orderHtml(
        order,
        items,
        `Chào ${esc(order.senderName)}, cảm ơn bạn đã đặt hoa. Shop sẽ gọi xác nhận trong ít phút.${
          order.paymentMethod === "vietqr" ? ` Nếu chưa chuyển khoản, bạn có thể mở lại mã QR trong trang đơn hàng.` : ""
        }`,
        orderUrl(order),
      ),
    ),
  ]);
}

/** Báo đã nhận tiền chuyển khoản. */
export async function sendPaidEmails(orderId: number, amount: number) {
  const data = await loadOrder(orderId);
  if (!data) return;
  const { order, items } = data;
  await Promise.all([
    send(
      shopEmail(),
      `[Đã thanh toán] ${order.code} – nhận ${formatVND(amount)}`,
      orderHtml(order, items, `Đơn <b>${order.code}</b> đã nhận chuyển khoản ${formatVND(amount)}.`, `${site.url}/admin/don-hang/${order.id}/`),
    ),
    send(
      order.senderEmail,
      `Đơn ${order.code} đã thanh toán thành công`,
      orderHtml(order, items, `Hoa Thanh Nhã đã nhận ${formatVND(amount)} cho đơn <b>${order.code}</b>. Cảm ơn bạn!`, orderUrl(order)),
    ),
  ]);
}
