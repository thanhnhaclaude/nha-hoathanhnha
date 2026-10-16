import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * WooCommerce Store API bỏ thẻ <style> của page builder Flatsome nhưng giữ lại nội dung CSS
 * (vd. "#text-123 { text-align: left; }"), khiến CSS hiện ra như chữ. Xóa các luật CSS đó.
 */
const STRAY_CSS = /(^|>)([^<]*?)((?:\s*[#.][\w-][^<>{}]*\{[^<>{}]*\})+)/g;

/** Ký tự điều khiển lẫn trong nội dung cũ (vd. \b) hiển thị thành ô vuông lỗi. */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function preClean(html: string) {
  return html.replace(CONTROL_CHARS, "").replace(STRAY_CSS, (_m, open: string, before: string) => open + before);
}

/** Link tuyệt đối về website cũ -> đường dẫn tương đối để giữ khách trên website mới. */
function localizeHref(href: string) {
  const m = href.match(/^https?:\/\/(?:www\.)?hoathanhnha\.com(\/(?!wp-content\/)[^\s]*)$/i);
  return m ? m[1] : href;
}

/** Làm sạch HTML mô tả (nhập từ WooCommerce hoặc nhập trong admin) trước khi hiển thị. */
export function cleanHtml(html: string | null | undefined) {
  if (!html) return "";
  return sanitizeHtml(preClean(html), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h2", "h3", "h4"]),
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, href: localizeHref(attribs.href ?? ""), rel: "noopener" } }),
      img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }),
    },
    // Bỏ link "Xem nhanh" (#quick-view) của theme cũ
    exclusiveFilter: (frame) => frame.tag === "a" && /^#quick-view/.test(frame.attribs.href ?? ""),
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
