/**
 * Quy tắc SEO cho một bài viết, theo Cẩm nang SEO của Google
 * (https://developers.google.com/search/docs/fundamentals/seo-starter-guide):
 * tiêu đề riêng, rõ ràng, súc tích; mô tả tóm tắt đúng nội dung; nội dung chia mục dễ đọc;
 * văn bản liên kết rõ nghĩa; ảnh có văn bản thay thế; không nhồi từ khóa.
 */
export type Article = {
  file: string;
  title: string;
  slug: string;
  description: string;
  keyword: string;
  publish: string;
  category: string;
  image: string | null;
  markdown: string;
};

type Ctx = { linkable: Set<string>; liveProducts: Set<string>; knownPages: Set<string> };

/** Các đường dẫn hệ thống luôn tồn tại */
const FIXED = new Set(["", "cua-hang", "gio-hang", "thanh-toan", "tim-kiem", "tra-cuu-don-hang", "tin-tuc", "lien-he", "danh-sach", "tai-khoan"]);

const lower = (s: string) => s.toLocaleLowerCase("vi");
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
const words = (s: string) => s.split(/\s+/).filter(Boolean);

export function checkArticle(a: Article, html: string, ctx: Ctx) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const passed: string[] = [];
  const kw = lower(a.keyword);
  const body = text(html);
  const bodyWords = words(body);

  // Đường dẫn
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.slug)) errors.push("slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang");
  if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.test(a.publish)) errors.push(`publish phải dạng YYYY-MM-DD hoặc YYYY-MM-DD HH:mm (đang là "${a.publish}")`);

  // Tiêu đề (Google thường hiển thị khoảng 60 ký tự; site tự thêm " | Hoa Thanh Nhã")
  const titleLen = [...a.title].length;
  if (titleLen < 20 || titleLen > 65) warnings.push(`tiêu đề ${titleLen} ký tự (nên 20–65)`);
  else passed.push(`tiêu đề ${titleLen} ký tự`);
  if (!lower(a.title).includes(kw)) errors.push(`tiêu đề chưa có từ khóa "${a.keyword}"`);
  else passed.push("từ khóa có trong tiêu đề");

  // Mô tả meta
  const descLen = [...a.description].length;
  if (descLen < 110 || descLen > 160) warnings.push(`mô tả ${descLen} ký tự (nên 110–160)`);
  else passed.push(`mô tả ${descLen} ký tự`);
  if (!lower(a.description).includes(kw)) warnings.push("mô tả chưa có từ khóa");

  // Mở đầu: từ khóa trong 100 chữ đầu
  if (!lower(bodyWords.slice(0, 100).join(" ")).includes(kw)) warnings.push("100 chữ đầu chưa nhắc từ khóa");
  else passed.push("từ khóa xuất hiện ở đoạn mở đầu");

  // Cấu trúc: trang đã có H1 = tiêu đề; nội dung dùng H2/H3
  if (/<h1\b/i.test(html)) errors.push('nội dung có H1 ("# …"): dùng "## …" vì tiêu đề trang đã là H1');
  const h2 = (html.match(/<h2\b/gi) || []).length;
  if (h2 < 3) warnings.push(`chỉ có ${h2} mục H2 (nên ≥ 3 để dễ đọc)`);
  else passed.push(`${h2} mục H2`);

  // Độ dài: Google không có con số tối thiểu, nhưng bài hướng dẫn mua cần đủ ý
  if (bodyWords.length < 600) warnings.push(`bài ${bodyWords.length} chữ (bài hướng dẫn nên ≥ 600 chữ để đủ ý)`);
  else passed.push(`${bodyWords.length} chữ`);

  // Chống nhồi từ khóa: mật độ cụm từ khóa trên tổng số chữ
  const occurrences = lower(body).split(kw).length - 1;
  const density = (occurrences * words(kw).length * 100) / Math.max(1, bodyWords.length);
  if (density > 2.5) errors.push(`nhồi từ khóa: "${a.keyword}" lặp ${occurrences} lần (${density.toFixed(1)}%, nên ≤ 2,5%)`);
  else passed.push(`mật độ từ khóa ${density.toFixed(1)}% (${occurrences} lần)`);

  // Link nội bộ: đủ số lượng, văn bản rõ nghĩa, không trỏ vào trang không tồn tại / danh mục trống
  const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].filter((m) => !/woocommerce-LoopProduct-link/.test(m[0]));
  const internal = links.filter((m) => m[1].startsWith("/"));
  for (const [, href, label] of internal) {
    const slug = href.replace(/^\/|\/$/g, "").split(/[?#]/)[0];
    if (!href.endsWith("/") && !href.includes("?") && !href.includes("#")) warnings.push(`link ${href} thiếu dấu "/" cuối`);
    if (ctx.linkable.has(slug) || ctx.liveProducts.has(slug) || ctx.knownPages.has(slug) || FIXED.has(slug)) {
      if (/^(tại đây|xem thêm|click|bấm vào đây|link)$/i.test(text(label))) warnings.push(`văn bản liên kết "${text(label)}" không rõ nghĩa (${href})`);
    } else errors.push(`link ${href} trỏ tới trang không tồn tại hoặc danh mục chưa có sản phẩm`);
  }
  if (internal.length < 3) warnings.push(`chỉ ${internal.length} link nội bộ viết tay (nên ≥ 3, website tự thêm tối đa 4 link ngữ cảnh)`);
  else passed.push(`${internal.length} link nội bộ viết tay`);

  // Sản phẩm chèn trong bài phải còn bán
  for (const m of html.matchAll(/hoathanhnha\.com\/([^/"]+)\/" class="woocommerce-LoopProduct-link/g)) {
    if (!ctx.liveProducts.has(m[1])) errors.push(`sản phẩm "${m[1]}" không tồn tại hoặc đã ẩn`);
  }

  // Ảnh có văn bản thay thế
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)];
  const noAlt = imgs.filter((m) => !/\balt="[^"]+"/i.test(m[0])).length;
  if (noAlt) warnings.push(`${noAlt} ảnh thiếu alt (Markdown: ![mô tả ảnh](/uploads/…))`);
  if (!a.image) warnings.push("chưa có ảnh đại diện (image)");

  return { errors, warnings, passed };
}
