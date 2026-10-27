import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * WooCommerce Store API bỏ thẻ <style> của page builder Flatsome nhưng giữ lại nội dung CSS
 * (vd. "#text-123 { text-align: left; }"), khiến CSS hiện ra như chữ. Xóa các luật CSS đó.
 */
const STRAY_CSS = /(^|>)([^<]*?)((?:\s*[#.][\w-][^<>{}]*\{[^<>{}]*\})+)/g;

/** Ký tự điều khiển lẫn trong nội dung cũ (vd. \b) hiển thị thành ô vuông lỗi. */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Shortcode của theme Flatsome/WordPress còn sót trong nội dung cũ, vd. [ux_products cat="1270"]. */
const SHORTCODE = /\[\/?(?:ux_[a-z_]+|section|row|col|gap|button|title|accordion(?:_item)?|tabgroup|tab|block)\b[^\]]*\]/gi;

/** Shortcode hàng sản phẩm, kèm nhãn in đậm ngay trước nó (vd. "<strong>Hoa chia buồn</strong> [ux_products cat="1288"]"). */
const PRODUCT_SHORTCODE = /(?:<(strong|b)\b[^>]*>\s*([^<]{1,80}?)\s*<\/\1>\s*)?\[ux_products\b[^\]]*?\bcat="(\d+)"[^\]]*\]/gi;

function preClean(html: string) {
  return html
    .replace(CONTROL_CHARS, "")
    .replace(STRAY_CSS, (_m, open: string, before: string) => open + before)
    .replace(SHORTCODE, " ");
}

/** Link tuyệt đối về website cũ -> đường dẫn tương đối để giữ khách trên website mới. */
function localizeHref(href: string) {
  const m = href.match(/^https?:\/\/(?:www\.)?hoathanhnha\.com(\/(?!wp-content\/)[^\s]*)$/i);
  const local = m ? m[1] : href;
  // Đường dẫn nội bộ thiếu "/" cuối (vd. /shop-hoa-tuoi-quan-1) -> thêm luôn, tránh một bước chuyển hướng 308
  return local.replace(/^(\/[^?#.]*[^/?#.])(?=[?#]|$)/, "$1/");
}

/** Nút của theme cũ (class "button", vd. khối "Hotline đặt hoa") -> nút bo tròn theo loại liên hệ (xem .prose-btn trong globals.css) */
function buttonClass(attribs: Record<string, string>) {
  if (!/\bbutton\b/.test(attribs.class ?? "")) return undefined;
  const href = attribs.href ?? "";
  if (href.startsWith("tel:")) return "prose-btn prose-btn-call";
  if (/zalo\.me/i.test(href)) return "prose-btn prose-btn-zalo";
  if (/m\.me|messenger/i.test(href)) return "prose-btn prose-btn-msg";
  return "prose-btn";
}

/** So sánh tiêu đề: bỏ thẻ, emoji/ký hiệu, khoảng trắng, không phân biệt hoa thường. */
function titleKey(s: string) {
  return sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} })
    .replace(/&[a-z#0-9]+;/gi, " ")
    .toLocaleLowerCase("vi")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

/**
 * Bỏ tiêu đề đầu tiên của nội dung nếu nó trùng với tiêu đề trang (H1),
 * vd. trang "Câu hỏi thường gặp" mở đầu bằng "🔆 CÂU HỎI THƯỜNG GẶP". Tránh lặp tiêu đề (tốt cho SEO).
 */
export function removeDuplicateTitleHeading(html: string | null | undefined, title: string) {
  if (!html) return "";
  const m = html.match(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/i);
  if (!m || m.index === undefined) return html;
  // Chỉ xét tiêu đề nằm ở đầu nội dung (trước đó không có chữ)
  const before = sanitizeHtml(preClean(html.slice(0, m.index)), { allowedTags: [], allowedAttributes: {} }).trim();
  if (before) return html;
  const key = titleKey(m[2]);
  const t = titleKey(title);
  // Trùng hẳn, hoặc tiêu đề đầu chỉ là tiêu đề trang kèm phụ đề (vd. "Ý nghĩa của hoa Protea – Vẻ đẹp…")
  if (!key || !t || (key !== t && !(t.length >= 8 && key.startsWith(t)))) return html;
  return html.slice(0, m.index) + html.slice(m.index + m[0].length);
}

/**
 * Chuẩn SEO: trang đã có 1 thẻ H1 (tiêu đề), nên tiêu đề trong nội dung phải bắt đầu từ H2
 * và không nhảy cấp. Dời toàn bộ cấp tiêu đề sao cho cấp cao nhất trong nội dung là H2
 * (vd. nội dung dùng H3/H4 -> H2/H3; H1 -> H2).
 */
export function normalizeHeadings(html: string) {
  const levels = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  if (!levels.length) return html;
  const shift = 2 - Math.min(...levels);
  if (shift === 0) return html;
  return html.replace(/<(\/?)h([1-6])\b/gi, (_m, slash: string, n: string) => `<${slash}h${Math.min(6, Math.max(2, Number(n) + shift))}`);
}

/**
 * Làm sạch HTML mô tả (nhập từ WooCommerce hoặc nhập trong admin) trước khi hiển thị.
 * `normalize: false` khi nội dung đã được chuẩn hóa tiêu đề từ trước (vd. đã tách thành nhiều đoạn).
 */
export function cleanHtml(html: string | null | undefined, { normalize = true, imgAlt = "" }: { normalize?: boolean; imgAlt?: string } = {}) {
  if (!html) return "";
  // Ảnh trong nội dung cũ thường để alt rỗng: lấy tiêu đề trang làm văn bản thay thế (Google dùng alt để hiểu ảnh)
  let imgIndex = 0;
  return sanitizeHtml(preClean(normalize ? normalizeHeadings(html) : html), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h2", "h3", "h4"]),
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
    },
    allowedClasses: { a: ["prose-btn", "prose-btn-call", "prose-btn-zalo", "prose-btn-msg"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      // Link bị cắt cụt trong nội dung cũ (có "…") không mở được: giữ chữ, bỏ link
      a: (tagName, attribs) =>
        (attribs.href ?? "").includes("…") || /%E2%80%A6/i.test(attribs.href ?? "")
          ? { tagName: "span", attribs: {} }
          : { tagName, attribs: { ...attribs, href: localizeHref(attribs.href ?? ""), rel: "noopener", class: buttonClass(attribs) ?? "" } },
      img: (tagName, attribs) => {
        imgIndex++;
        const alt = attribs.alt?.trim() || (imgAlt ? (imgIndex === 1 ? imgAlt : `${imgAlt} – ảnh ${imgIndex}`) : "");
        return { tagName, attribs: { ...attribs, alt, loading: "lazy" } };
      },
    },
    // Bỏ link "Xem nhanh" (#quick-view) của theme cũ và link rỗng (href="#" không có chữ)
    exclusiveFilter: (frame) =>
      frame.tag === "a" && (/^#quick-view/.test(frame.attribs.href ?? "") || (frame.attribs.href === "#" && !frame.text.trim())),
  });
}

export function plainText(html: string | null | undefined, max = 160) {
  const text = sanitizeHtml(preClean(html ?? ""), { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export type ContentSegment = { type: "html"; html: string } | { type: "products"; slugs: string[] };

/** Vị trí thẻ </div> đóng khối <div> bắt đầu tại `start` (đếm độ sâu lồng nhau). */
function closingDivEnd(html: string, start: number) {
  const re = /<div\b|<\/div>/gi;
  re.lastIndex = start;
  let depth = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[0].toLowerCase() === "</div>" ? -1 : 1;
    if (depth === 0) return m.index + m[0].length;
  }
  return html.length;
}

/**
 * Tách các khối slider sản phẩm WooCommerce/Flatsome nhúng trong bài viết thành danh sách slug,
 * để hiển thị bằng lưới sản phẩm của website mới thay vì HTML của theme cũ.
 */
export function splitProductBlocks(html: string | null | undefined): ContentSegment[] {
  if (!html) return [];
  const segments: ContentSegment[] = [];
  let cursor = 0;
  while (true) {
    const item = html.indexOf("product-small col", cursor);
    if (item < 0) break;
    const rowStart = html.lastIndexOf('<div class="row', item);
    if (rowStart < cursor) break;
    const rowEnd = closingDivEnd(html, rowStart);
    const block = html.slice(rowStart, rowEnd);
    const slugs = [
      ...new Set(
        [...block.matchAll(/href="https?:\/\/(?:www\.)?hoathanhnha\.com\/([^/"]+)\/?"[^>]*class="woocommerce-LoopProduct-link/g)]
          .map((m) => m[1])
          .filter((s): s is string => Boolean(s)),
      ),
    ];
    segments.push({ type: "html", html: html.slice(cursor, rowStart) });
    if (slugs.length) segments.push({ type: "products", slugs });
    cursor = rowEnd;
  }
  segments.push({ type: "html", html: html.slice(cursor) });
  return segments.filter((s) => s.type === "products" || s.html.trim());
}

/**
 * Đoạn giới thiệu ngắn dưới tiêu đề: bỏ các thẻ tiêu đề (H1–H6) trong nội dung để tiêu đề phụ
 * không bị dính vào câu văn, cắt tại ranh giới từ.
 */
export function introText(html: string | null | undefined, max = 300) {
  const text = plainText(
    (html ?? "").replace(PRODUCT_SHORTCODE, " ").replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi, " "),
    100_000,
  );
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const i = cut.lastIndexOf(" ");
  return `${(i > max * 0.6 ? cut.slice(0, i) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

export type ShortcodeSegment = { type: "html"; html: string } | { type: "category"; wooId: number; label: string | null };

/**
 * Tách shortcode [ux_products cat="…"] trong mô tả danh mục (nhập từ WordPress) thành các hàng sản phẩm
 * của danh mục tương ứng, như website cũ hiển thị. Nhãn in đậm ngay trước shortcode dùng làm tiêu đề hàng.
 */
export function splitCategoryShortcodes(html: string | null | undefined): ShortcodeSegment[] {
  if (!html) return [];
  const segments: ShortcodeSegment[] = [];
  let cursor = 0;
  for (const m of html.matchAll(PRODUCT_SHORTCODE)) {
    segments.push({ type: "html", html: html.slice(cursor, m.index) });
    segments.push({ type: "category", wooId: Number(m[3]), label: m[2]?.trim() || null });
    cursor = m.index + m[0].length;
  }
  segments.push({ type: "html", html: html.slice(cursor) });
  return segments.filter((s) => s.type === "category" || plainText(s.html, 10).length > 0 || /<img\b/i.test(s.html));
}
