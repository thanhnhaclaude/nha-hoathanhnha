/**
 * Quý I/2027: 15 bài "ý nghĩa hoa" đang ở vị trí 5–10 Google (hàng trăm–hàng nghìn lượt hiển thị/tháng) nhưng
 * không có mẫu hoa hay liên kết nội bộ nào -> người đọc không có đường sang danh mục để đặt hoa.
 * Gắn cuối bài một khối "gợi ý" (mẫu hoa + link danh mục), nằm giữa hai dấu đánh dấu nên ghi lại mỗi lần
 * khởi động không bị lặp. Khối sản phẩm dùng đúng định dạng splitProductBlocks đọc được. Chạy lặp lại an toàn.
 */
import type { Connection } from "mysql2/promise";

const START = "<!-- goi-y-dat-hoa -->";
const END = "<!-- /goi-y-dat-hoa -->";

type Block = { products: string[]; links: [string, string][] };

const ROSES = ["hoa-bo-hb162", "hoa-bo-hb164", "hoa-gio-hg084", "hoa-bo-hb151"];
const BESTSELLERS = ["hoa-bo-hb165", "hoa-gio-hg095", "lan-ho-diep-lhd100", "hoa-bo-hb162"];
const GENERAL: [string, string][] = [
  ["/bo-hoa-tuoi/", "bó hoa tươi"],
  ["/gio-hoa-tuoi/", "giỏ hoa tươi"],
  ["/hoa-sinh-nhat/", "hoa sinh nhật"],
];

const POSTS: Record<string, Block> = {
  "y-nghia-cua-hoa-hong-bach": {
    products: ROSES,
    links: [["/hoa-hong/", "hoa hồng"], ["/hoa-cuoi-cam-tay/", "hoa cưới cầm tay"], ["/bo-hoa-tuoi/", "bó hoa tươi"]],
  },
  "y-nghia-cua-hoa-hong-do": {
    products: ["hoa-bo-hb162", "hoa-bo-hb159", "hoa-bo-hb153", "hoa-bo-hb152"],
    links: [["/hoa-hong/", "hoa hồng"], ["/hoa-tang-nguoi-yeu/", "hoa tặng người yêu"], ["/hoa-valentine/", "hoa Valentine"]],
  },
  "y-nghia-cua-hoa-hong-phan-nhat": {
    products: ["hoa-bo-hb165", "hoa-bo-hb164", "hoa-bo-hb163", "hoa-bo-hb161"],
    links: [["/mau-hong/", "hoa màu hồng"], ["/hoa-tang-me/", "hoa tặng mẹ"], ["/hoa-hong/", "hoa hồng"]],
  },
  "y-nghia-cua-hoa-hong-song-hy": {
    products: ["hoa-cam-tay-ngay-cuoi-1313", "hoa-cam-tay-hope-1311", "hoa-cam-tay-just-married-1330", "hoa-cam-tay-ngay-dac-biet-1329"],
    links: [["/hoa-cuoi-cam-tay/", "hoa cưới cầm tay"], ["/hoa-cuoi/", "hoa cưới"], ["/hoa-hong/", "hoa hồng"]],
  },
  "y-nghia-cua-hoa-huong-duong": {
    products: ["hoa-bo-hb050", "hoa-bo-hb030", "hoa-bo-hb160", "hoa-bo-hb097"],
    links: [["/hoa-huong-duong/", "hoa hướng dương"], ["/hoa-mung-tot-nghiep/", "hoa tốt nghiệp"], ["/hoa-khai-truong/", "hoa khai trương"]],
  },
  "y-nghia-cua-hoa-mau-don": {
    products: ["hoa-bo-hb154", "hoa-gio-hg038", "hoa-gio-hg059", "hoa-bo-hb112"],
    links: [["/hoa-cuc-mau-don/", "cúc mẫu đơn"], ["/bo-hoa-tuoi/", "bó hoa tươi"], ["/hoa-tang-me/", "hoa tặng mẹ"]],
  },
  "y-nghia-cua-hoa-lan-cattleya": {
    products: ["lan-ho-diep-lhd100", "lan-ho-diep-lhd099", "lan-ho-diep-lhd098", "lan-ho-diep-lhd096"],
    links: [["/lan-ho-diep/", "lan hồ điệp"], ["/lan-ho-diep-khai-truong/", "lan hồ điệp khai trương"], ["/hoa-tang-sep/", "hoa tặng sếp"]],
  },
  "y-nghia-cua-hoa-uu-dam": {
    products: BESTSELLERS,
    links: [["/lan-ho-diep/", "lan hồ điệp"], ["/hoa-chuc-mung/", "hoa chúc mừng"], ["/hoa-chia-buon/", "hoa chia buồn"]],
  },
  "y-nghia-cua-hoa-sen-hong": {
    products: BESTSELLERS,
    links: [["/lan-ho-diep/", "lan hồ điệp"], ["/hoa-chuc-mung/", "hoa chúc mừng"], ["/hoa-chia-buon/", "hoa chia buồn"]],
  },
  "y-nghia-cua-hoa-sen-xanh": {
    products: BESTSELLERS,
    links: [["/lan-ho-diep/", "lan hồ điệp"], ["/hoa-chuc-mung/", "hoa chúc mừng"], ["/hoa-chia-buon/", "hoa chia buồn"]],
  },
  "y-nghia-cua-hoa-anemone": { products: BESTSELLERS, links: GENERAL },
  "y-nghia-cua-hoa-freesia": { products: BESTSELLERS, links: GENERAL },
  "y-nghia-cua-hoa-ranunculus": { products: BESTSELLERS, links: GENERAL },
  "y-nghia-cua-hoa-lilac": { products: BESTSELLERS, links: GENERAL },
  "y-nghia-cua-hoa-amaryllis": { products: BESTSELLERS, links: GENERAL },
};

function block(b: Block) {
  const links = b.links.map(([href, text]) => `<a href="${href}">${text}</a>`);
  const list = `${links.slice(0, -1).join(", ")} và ${links.at(-1)}`;
  const items = b.products
    .map((s) => `<div class="product-small col"><a href="https://hoathanhnha.com/${s}/" class="woocommerce-LoopProduct-link">${s}</a></div>`)
    .join("");
  return `${START}
<h2>Đặt hoa tươi tại Hoa Thanh Nhã</h2>
<p>Muốn gửi tặng một bó hoa mang ý nghĩa tương tự? Xem các mẫu ${list}; mỗi đơn đều được ghi thiệp miễn phí và gửi ảnh hoa thật trước khi giao.</p>
<div class="row">${items}</div>
${END}`;
}

export async function syncMeaningLinks(db: Connection): Promise<string[]> {
  let done = 0;
  for (const [slug, b] of Object.entries(POSTS)) {
    const [[row]] = (await db.query("select id, content from pages where slug = ? and type = 'post'", [slug])) as [
      { id: number; content: string | null }[],
      unknown,
    ];
    if (!row) continue;
    const old = row.content ?? "";
    const i = old.indexOf(START);
    const j = old.indexOf(END);
    const base = i >= 0 && j > i ? old.slice(0, i) + old.slice(j + END.length) : old;
    const next = `${base.trimEnd()}\n${block(b)}`;
    if (next !== old) await db.query("update pages set content = ? where id = ?", [next, row.id]);
    done++;
  }
  return [`✓ Bài ý nghĩa hoa: khối gợi ý đặt hoa cho ${done}/${Object.keys(POSTS).length} bài`];
}
