/**
 * Đưa chữ về phí giao trong dữ liệu nhập từ WordPress về một chính sách: nội thành miễn phí,
 * ngoại thành 50.000đ – 200.000đ tùy khoảng cách (chủ shop chốt 8/11/2026).
 * Chạy nhiều lần vẫn an toàn: lần sau không còn gì để thay.
 */
import type { Connection, ResultSetHeader } from "mysql2/promise";

const PRODUCT_OLD =
  "Đơn hàng sẽ được miễn phí đối với sản phẩm được giao ở nội thành trên 500,000VND tại các thành phố lớn như Hà Nội, TPHCM, Đà Nẵng. Đơn hàng giao ở Ngoại thành các khu vực trên trong phạm vi dưới 10km thì phí ship là 50,000VND &#8211; 80,000VND. Trong trường hợp trên 10km đối với địa chỉ các TP. Lớn nêu trên thì phí ship là 80,000VND &#8211; 150,000VND tùy khu vực.";
const PRODUCT_NEW = "Đơn hàng được miễn phí giao trong nội thành. Ngoại thành phí giao từ 50.000đ – 200.000đ tùy khoảng cách, shop báo phí khi xác nhận đơn.";

const PAGE_PAIRS: [string, string][] = [
  ["những đơn hàng trị giá trên 500.000 VNĐ có địa điểm", "tất cả đơn hàng có địa điểm"],
  ["các đơn hàng trị giá dưới 500.000 VNĐ hoặc các đơn hàng có địa chỉ", "các đơn hàng có địa chỉ"],
  ["tùy vào giá trị và quãng đường", "tùy vào quãng đường"],
  ["Miễn phí ship với đơn hàng &gt; 500K", "Miễn phí ship trong nội thành"],
  ["dịch vụ ship hàng miễn phí đối với những đơn hàng giá trị &gt; 500K đối với hoa giỏ, hoa bó và 900K đối với hoa kệ cao", "dịch vụ ship hàng miễn phí trong nội thành"],
];

const TARGETS: [string, string, [string, string][]][] = [
  ["products", "description", [[PRODUCT_OLD, PRODUCT_NEW]]],
  ["pages", "content", PAGE_PAIRS],
  ["pages", "excerpt", PAGE_PAIRS],
  ["seo_meta", "description", PAGE_PAIRS],
];

export async function syncShippingText(db: Connection): Promise<string[]> {
  const log: string[] = [];
  for (const [table, column, pairs] of TARGETS) {
    let changed = 0;
    for (const [from, to] of pairs) {
      const [res] = await db.query<ResultSetHeader>(`update \`${table}\` set \`${column}\` = replace(\`${column}\`, ?, ?) where instr(\`${column}\`, ?) > 0`, [from, to, from]);
      changed += res.affectedRows;
    }
    if (changed) log.push(`phí giao: sửa ${changed} chỗ ở ${table}.${column}`);
  }
  return log;
}
