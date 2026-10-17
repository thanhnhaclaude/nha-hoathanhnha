import { livePage } from "./published";
import "server-only";
import { cache } from "react";
import { and, count, desc, eq } from "drizzle-orm";
import { categories, db, pages, postCategories, productCategories, products } from "./db";
import { infoPages } from "./info-pages";

/**
 * Link nội bộ theo ngữ cảnh — viết theo hướng dẫn của Google về văn bản liên kết:
 * chữ gắn link là cụm từ tự nhiên vốn có trong câu, mỗi trang đích tối đa 1 lần, mỗi bài tối đa
 * MAX_AUTO_LINKS link, không link tới chính trang đó hay tới danh mục chưa có sản phẩm,
 * không chèn vào tiêu đề hay bên trong link có sẵn. Không nhồi từ khóa, không ẩn link.
 */
const MAX_AUTO_LINKS = 4;

/** Cụm từ → danh mục. Cụm dài đứng trước để "kệ hoa khai trương" không bị "hoa khai trương" lấy mất. */
export const KEYWORD_TARGETS: { phrases: string[]; slug: string }[] = [
  { phrases: ["kệ hoa khai trương"], slug: "ke-hoa-khai-truong" },
  { phrases: ["giỏ hoa khai trương"], slug: "gio-hoa-khai-truong" },
  { phrases: ["lan hồ điệp khai trương"], slug: "lan-ho-diep-khai-truong" },
  { phrases: ["bó hoa sinh nhật"], slug: "bo-hoa-sinh-nhat" },
  { phrases: ["giỏ hoa sinh nhật"], slug: "gio-hoa-sinh-nhat" },
  { phrases: ["hoa cưới cầm tay", "hoa cầm tay cô dâu", "hoa cưới"], slug: "hoa-cuoi-cam-tay" },
  { phrases: ["hoa mừng tốt nghiệp", "hoa tốt nghiệp"], slug: "hoa-mung-tot-nghiep" },
  { phrases: ["hoa khai trương"], slug: "hoa-khai-truong" },
  { phrases: ["hoa sinh nhật"], slug: "hoa-sinh-nhat" },
  { phrases: ["hoa chia buồn", "hoa tang lễ", "hoa viếng"], slug: "hoa-chia-buon" },
  { phrases: ["hoa chúc mừng"], slug: "hoa-chuc-mung" },
  { phrases: ["hoa tình yêu", "hoa tặng người yêu"], slug: "hoa-tinh-yeu" },
  { phrases: ["lan hồ điệp"], slug: "lan-ho-diep" },
  { phrases: ["hoa hướng dương"], slug: "hoa-huong-duong" },
  { phrases: ["hoa cúc mẫu đơn"], slug: "hoa-cuc-mau-don" },
  { phrases: ["hoa baby"], slug: "hoa-baby" },
  { phrases: ["giỏ trái cây"], slug: "gio-trai-cay" },
  { phrases: ["hoa hồng"], slug: "hoa-hong" },
  { phrases: ["bó hoa tươi", "bó hoa"], slug: "hoa-bo" },
  { phrases: ["giỏ hoa"], slug: "hoa-gio" },
];

/** Danh mục đang có sản phẩm (link tới danh mục trống là link tới trang mỏng). */
export const getLinkableCategories = cache(async () => {
  const rows = await db
    .select({ slug: categories.slug, name: categories.name, n: count(productCategories.productId) })
    .from(categories)
    .innerJoin(productCategories, eq(productCategories.categoryId, categories.id))
    .innerJoin(products, and(eq(products.id, productCategories.productId), eq(products.isActive, true)))
    .groupBy(categories.id);
  return new Map(rows.filter((r) => r.n > 0).map((r) => [r.slug, r.name]));
});

const LETTER = "[\\p{L}\\p{N}]";
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/**
 * Cụm ngắn không được khớp khi đang nằm trong một cụm dài hơn của danh sách
 * (vd. "hoa khai trương" trong "kệ hoa khai trương", "bó hoa" trong "bó hoa sinh nhật"),
 * tránh cắt đôi cụm từ khi cụm dài đã có link hoặc không được link.
 */
const ALL_PHRASES = KEYWORD_TARGETS.flatMap((t) => t.phrases);
const phraseRe = (p: string) => {
  const guards = ALL_PHRASES.filter((l) => l !== p && l.includes(p)).map((l) => {
    const i = l.indexOf(p);
    const before = l.slice(0, i);
    const after = l.slice(i + p.length);
    return `${before ? `(?<!${escapeRe(before)})` : ""}${after ? `(?!${escapeRe(after)})` : ""}`;
  });
  return new RegExp(`(?<!${LETTER})${guards.join("")}${escapeRe(p)}(?!${LETTER})`, "iu");
};

/** Các link nội bộ đã có trong HTML (đường dẫn dạng /slug/). */
function linkedPaths(html: string) {
  return new Set([...html.matchAll(/<a\b[^>]*href="(\/[^"#?]*)/gi)].map((m) => m[1]));
}

/**
 * Chèn link theo ngữ cảnh vào HTML đã làm sạch. `selfPath` là đường dẫn trang hiện tại (không tự link).
 * Chỉ sửa đoạn chữ nằm ngoài thẻ <a>, <h1>–<h6>, <figcaption>, <button>.
 */
export async function addContextualLinks(html: string, selfPath: string, max = MAX_AUTO_LINKS, exclude: Set<string> = new Set()) {
  if (!html) return html;
  const linkable = await getLinkableCategories();
  // Trang đích đã có link ở bất kỳ đâu trong bài (kể cả đoạn khác) thì không link lại
  const already = new Set([...linkedPaths(html), ...exclude]);
  let out = html;
  let added = 0;
  for (const target of KEYWORD_TARGETS) {
    if (added >= max) break;
    const href = `/${target.slug}/`;
    if (href === selfPath || already.has(href) || !linkable.has(target.slug)) continue;
    for (const phrase of target.phrases) {
      const next = linkFirstOccurrence(out, phraseRe(phrase), href);
      if (next !== out) {
        out = next;
        already.add(href);
        added++;
        break;
      }
    }
  }
  return out;
}

const SKIP_TAGS = /^(a|h[1-6]|figcaption|button|script|style)$/i;

function linkFirstOccurrence(html: string, re: RegExp, href: string) {
  const parts = html.split(/(<[^>]+>)/);
  const stack: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith("<")) {
      const m = part.match(/^<\s*(\/)?\s*([a-z0-9]+)/i);
      if (m && !/\/>$/.test(part) && !/^(br|img|hr|input|source|wbr)$/i.test(m[2])) {
        if (m[1]) {
          const idx = stack.lastIndexOf(m[2].toLowerCase());
          if (idx >= 0) stack.splice(idx);
        } else stack.push(m[2].toLowerCase());
      }
      continue;
    }
    if (!part.trim() || stack.some((t) => SKIP_TAGS.test(t))) continue;
    const m = part.match(re);
    if (!m || m.index === undefined) continue;
    parts[i] = `${part.slice(0, m.index)}<a href="${href}">${m[0]}</a>${part.slice(m.index + m[0].length)}`;
    return parts.join("");
  }
  return html;
}

/** Danh mục phù hợp nhất với một tiêu đề/nội dung (cụm từ đầu tiên khớp, theo thứ tự ưu tiên). */
export async function bestCategoryFor(...texts: (string | null | undefined)[]) {
  const linkable = await getLinkableCategories();
  for (const text of texts) {
    if (!text) continue;
    const plain = text.replace(/<[^>]+>/g, " ");
    for (const t of KEYWORD_TARGETS) {
      if (linkable.has(t.slug) && t.phrases.some((p) => phraseRe(p).test(plain))) return { slug: t.slug, name: linkable.get(t.slug)! };
    }
  }
  return null;
}

// ---------- Bài viết liên quan ----------

type PostLite = { id: number; slug: string; title: string; image: string | null; publishedAt: Date };

const getAllPostsLite = cache(async (): Promise<PostLite[]> =>
  db
    .select({ id: pages.id, slug: pages.slug, title: pages.title, image: pages.image, publishedAt: pages.publishedAt })
    .from(pages)
    .where(and(eq(pages.type, "post"), livePage()))
    .orderBy(desc(pages.publishedAt)),
);

/** Từ không mang nghĩa phân biệt trong tiêu đề bài (vd. "Ý nghĩa của hoa …"). */
const STOP = new Set(
  "ý nghĩa của hoa và các cách những một có là cho với về trong theo từ đến khi được này đó bạn nên không loài màu tặng shop tươi thanh nhã top mẫu đẹp nhất".split(" "),
);

function tokens(s: string) {
  return s
    .toLocaleLowerCase("vi")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

/**
 * Bài liên quan theo từ chung trong tiêu đề (vd. các bài về hoa hồng với nhau), đủ `limit` bài bằng
 * cách xoay vòng theo id để bài cũ cũng nhận được link — tránh bài "mồ côi" chỉ nằm sâu trong phân trang.
 */
export async function getRelatedPosts(text: string, { excludeId, limit = 6 }: { excludeId?: number; limit?: number } = {}) {
  const all = await getAllPostsLite();
  const want = new Set(tokens(text));
  const scored = all
    .filter((p) => p.id !== excludeId)
    .map((p) => {
      const t = tokens(p.title);
      // Ghép 2 từ liền nhau ("hồng đỏ") được tính điểm cao hơn từ đơn
      const bigrams = t.slice(1).filter((w, i) => text.toLocaleLowerCase("vi").includes(`${t[i]} ${w}`)).length;
      return { p, score: t.filter((w) => want.has(w)).length + bigrams * 2 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.publishedAt.getTime() - a.p.publishedAt.getTime())
    .map((x) => x.p);
  // Luôn có bài liền trước và liền sau theo ngày đăng: mỗi bài được ít nhất 2 bài khác trỏ tới
  const idx = excludeId == null ? -1 : all.findIndex((p) => p.id === excludeId);
  const neighbours = idx < 0 ? [] : [all[idx - 1], all[idx + 1]].filter((p): p is PostLite => Boolean(p));
  const picked = [...neighbours, ...scored.filter((p) => !neighbours.includes(p))].slice(0, limit);
  if (picked.length < limit) {
    // Bổ sung bằng các bài "kế bên" theo id (ổn định, không ngẫu nhiên) để mọi bài đều được trỏ tới
    const seed = excludeId ?? text.length;
    const rest = all.filter((p) => p.id !== excludeId && !picked.includes(p));
    rest.sort((a, b) => ((a.id * 7919 + seed) % 997) - ((b.id * 7919 + seed) % 997));
    picked.push(...rest.slice(0, limit - picked.length));
  }
  return picked;
}

/** Bài viết theo chủ đề danh mục/sản phẩm (dùng cho trang danh mục và trang sản phẩm). */
export async function getGuidePosts(text: string, limit = 3) {
  const all = await getAllPostsLite();
  const want = new Set(tokens(text));
  return all
    .map((p) => ({ p, score: tokens(p.title).filter((w) => want.has(w)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.publishedAt.getTime() - a.p.publishedAt.getTime())
    .slice(0, limit)
    .map((x) => x.p);
}

/** Các khu vực cùng thành phố (anh em) + trang thành phố (cha), cho trang "Shop hoa tươi quận …". */
export async function getNearbyAreas(categoryId: number, parentId: number | null, slug = "") {
  const area = (s: string) => s.startsWith("shop-hoa-tuoi") || s === "khu-vuc";
  // Khu vực con (vd. trang Bình Phước -> Đồng Xoài), để trang con không bị "mồ côi"
  const children = area(slug)
    ? await db.select({ id: categories.id, slug: categories.slug, name: categories.name }).from(categories).where(eq(categories.parentId, categoryId)).orderBy(categories.name)
    : [];
  if (parentId == null) return { parent: null, siblings: [], children };
  const [parent] = await db.select({ slug: categories.slug, name: categories.name }).from(categories).where(eq(categories.id, parentId)).limit(1);
  // Cha là trang thành phố (shop-hoa-tuoi-…) hoặc nhóm "khu-vuc" chứa các tỉnh
  if (!parent || !area(parent.slug)) return { parent: null, siblings: [], children };
  const siblings = await db
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories)
    .where(eq(categories.parentId, parentId))
    .orderBy(categories.name);
  return { parent, siblings: siblings.filter((s) => s.id !== categoryId), children };
}

/** Mọi đường dẫn nội bộ đang tồn tại (danh mục, sản phẩm, bài/trang đang hiện, danh mục bài viết, trang hệ thống). */
export const getKnownSlugs = cache(async () => {
  const [cats, prods, pgs, pcats] = await Promise.all([
    db.select({ slug: categories.slug }).from(categories),
    db.select({ slug: products.slug }).from(products).where(eq(products.isActive, true)),
    db.select({ slug: pages.slug }).from(pages).where(livePage()),
    db.select({ slug: postCategories.slug }).from(postCategories),
  ]);
  const fixed = ["", "cua-hang", "gio-hang", "thanh-toan", "tim-kiem", "tra-cuu-don-hang", "danh-sach", "tai-khoan", "don-hang", ...Object.keys(infoPages)];
  return new Set([...cats, ...prods, ...pgs, ...pcats].map((r) => r.slug).concat(fixed));
});

/** Như addContextualLinks nhưng cho bài tách nhiều đoạn (xen khối sản phẩm): giới hạn tính chung cả bài. */
export async function addContextualLinksMany(htmls: string[], selfPath: string, max = MAX_AUTO_LINKS) {
  // Link trỏ về chính trang đang đọc (có trong nội dung cũ) không giúp gì người đọc: giữ chữ, bỏ link
  const selfLink = new RegExp(`<a\\b[^>]*href="${escapeRe(selfPath)}(?:#[^"]*)?"[^>]*>([\\s\\S]*?)<\\/a>`, "gi");
  // Link tới trang không tồn tại (vd. /shop-hoa-tuoi-tay-ninh/ trong nội dung cũ): giữ chữ, bỏ link.
  // Khi trang đó được tạo, link tự hoạt động lại.
  const known = await getKnownSlugs();
  const deadLink = /<a\b[^>]*href="\/([a-z0-9-]*)\/?(?:[?#][^"]*)?"[^>]*>([\s\S]*?)<\/a>/gi;
  htmls = htmls.map((h) => h.replace(selfLink, "$1").replace(deadLink, (m, slug: string, label: string) => (known.has(slug) ? m : label)));
  const out: string[] = [];
  let used = 0;
  const everywhere = new Set(htmls.flatMap((h) => [...linkedPaths(h)]));
  for (const h of htmls) {
    const before = linkedPaths(h);
    const linked = used < max ? await addContextualLinks(h, selfPath, max - used, everywhere) : h;
    const added = [...linkedPaths(linked)].filter((p) => !before.has(p));
    added.forEach((p) => everywhere.add(p));
    used += added.length;
    out.push(linked);
  }
  return out;
}
