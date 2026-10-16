import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * WooCommerce Store API bỏ thẻ <style> của page builder Flatsome nhưng giữ lại nội dung CSS
 * (vd. "#text-123 { text-align: left; }"), khiến CSS hiện ra như chữ. Xóa các luật CSS đó.
 */
const STRAY_CSS = /(^|>)([^<]*?)((?:\s*[#.][\w-][^<>{}]*\{[^<>{}]*\})+)/g;

function stripStrayCss(html: string) {
  return html.replace(STRAY_CSS, (_m, open: string, before: string) => open + before);
}

/** Làm sạch HTML mô tả (nhập từ WooCommerce hoặc nhập trong admin) trước khi hiển thị. */
export function cleanHtml(html: string | null | undefined) {
  if (!html) return "";
  return sanitizeHtml(stripStrayCss(html), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h2", "h3", "h4"]),
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener" }),
      img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }),
    },
  });
}

export function plainText(html: string | null | undefined, max = 160) {
  const text = sanitizeHtml(stripStrayCss(html ?? ""), { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
