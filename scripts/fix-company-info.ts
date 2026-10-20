/**
 * Thay thông tin công ty (CÔNG TY TNHH CÔNG NGHỆ VÀ TRUYỀN THÔNG HẠNH PHÚC, mã số thuế…) trong nội dung
 * nhập từ WordPress bằng thông tin Shop Hoa Thanh Nhã: trang /gioi-thieu/ và /huong-dan-thanh-toan/.
 *
 *   npm run content:fix-company     # chạy với DATABASE_URL hoặc DB_HOST/DB_USER/... (máy hoặc Hostinger)
 *
 * Chạy nhiều lần vẫn an toàn: lần sau không còn gì để thay.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const COMPANY_VN = /C[ÔO]NG TY TNHH C[ÔO]NG NGH[ỆE] V[ÀA] TRUY[ỀE]N TH[ÔO]NG H[ẠA]NH PH[ÚU]C/gi;
const LEFTOVER = /C[ÔO]NG TY TNHH C[ÔO]NG NGH[ỆE]|HANH PHUC COMMUNICATION|0402167464|V[ĂA]N PH[ÒO]NG [ĐD]I[ỀE]U H[ÀA]NH/i;

const ABOUT_SHOP = `<h3><strong>Về Shop Hoa Thanh Nhã</strong></h3>
<p><strong>Shop Hoa Thanh Nhã</strong> là shop hoa tươi và quà tặng, nhận đặt hoa online và giao hoa tận nơi tại TP. Hồ Chí Minh, Hà Nội, Đà Nẵng cùng nhiều tỉnh thành trên cả nước. Mỗi mẫu hoa đều do thợ cắm hoa của shop thực hiện từ hoa tươi nhập trong ngày.</p>
<h3><strong>Sản phẩm và dịch vụ</strong></h3>
<ol>
<li><a href="/hoa-khai-truong/">Hoa khai trương</a>: kệ hoa, giỏ hoa và lan hồ điệp mừng khai trương, in băng rôn miễn phí.</li>
<li><a href="/hoa-sinh-nhat/">Hoa sinh nhật</a> và <a href="/hoa-tinh-yeu/">hoa tình yêu</a>: bó hoa, giỏ hoa tặng người thân, người yêu, đồng nghiệp.</li>
<li><a href="/hoa-chia-buon/">Hoa chia buồn</a>: kệ hoa, lẵng hoa viếng trang nghiêm, giao đúng giờ.</li>
<li><a href="/hoa-cuoi-cam-tay/">Hoa cưới</a> và <a href="/hoa-chuc-mung/">hoa chúc mừng</a> cho các dịp đặc biệt.</li>
<li>Điện hoa toàn quốc: đặt hoa online, giao hỏa tốc 60–90 phút ở nội thành, chụp ảnh hoa gửi khách trước khi giao.</li>
</ol>
`;

const CONTACT = `<h3><strong>THÔNG TIN LIÊN HỆ</strong></h3>
<p>Hoathanhnha.com là website của <strong>Shop Hoa Thanh Nhã</strong>, chuyên hoa tươi và quà tặng. Chúng tôi cam kết mang đến những sản phẩm chất lượng cao và dịch vụ tận tâm cho khách hàng.</p>
<p><strong>Tên cửa hàng:</strong> Shop Hoa Thanh Nhã<br />
<strong>Địa chỉ:</strong> 05 Trần Văn Cẩn, P.Hoà Xuân, Q.Cẩm Lệ, Tp.Đà Nẵng<br />
<strong>Hệ thống cửa hàng:</strong> <a href="/he-thong-cua-hang-cua-chung-toi/">TP. Hồ Chí Minh, Hà Nội, Đà Nẵng và các tỉnh</a><br />
<strong>Email:</strong> contact@hoathanhnha.com<br />
<strong>Điện thoại:</strong> <a href="tel:0396727374">0396.72.73.74</a> (24/7)</p>`;

function fixAbout(html: string) {
  return (
    html
      // Các mục "Về Công ty", "Loại Hình Doanh Nghiệp", "Hoạt Động Kinh Doanh" (mô tả công ty công nghệ) -> giới thiệu shop
      .replace(/<h3><strong>Về Công ty<\/strong><\/h3>[\s\S]*?(?=<h3><strong>Chính Sách Bảo Mật<\/strong><\/h3>)/i, ABOUT_SHOP)
      // Khối "VĂN PHÒNG ĐIỀU HÀNH" + đoạn giới thiệu + thông tin công ty -> thông tin liên hệ của shop
      .replace(/<h3><strong>V[ĂA]N PH[ÒO]NG [ĐD]I[ỀE]U H[ÀA]NH<\/strong><\/h3>\s*<p>[\s\S]*?<\/p>\s*<p>[\s\S]*?\(24\/7\)<\/p>/i, CONTACT)
  );
}

function fixPayment(html: string) {
  return html
    .replace(/<p><strong>Thông tin về Công Ty:<\/strong>[^<]*<\/p>/i, "<p><strong>Đơn vị bán hàng:</strong> Shop Hoa Thanh Nhã</p>")
    .replace(/\s*<p><strong>Mã Số Thuế:<\/strong>\s*\d+<\/p>/i, "")
    .replace(COMPANY_VN, "Shop Hoa Thanh Nhã");
}

async function connect() {
  if (process.env.DB_HOST && process.env.DB_USER) {
    return mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  }
  if (!process.env.DATABASE_URL) throw new Error("Thiếu DATABASE_URL hoặc DB_HOST/DB_USER/DB_PASSWORD/DB_NAME");
  return mysql.createConnection({ uri: process.env.DATABASE_URL });
}

async function main() {
  const db = await connect();
  const fixes: [string, (h: string) => string][] = [
    ["gioi-thieu", fixAbout],
    ["huong-dan-thanh-toan", fixPayment],
  ];
  for (const [slug, fix] of fixes) {
    const [[row]] = (await db.query("select id, content, excerpt from pages where slug = ?", [slug])) as [{ id: number; content: string; excerpt: string | null }[], unknown];
    if (!row) {
      console.log(`- /${slug}/: không có trong database`);
      continue;
    }
    const next = fix(row.content);
    if (next !== row.content) await db.query("update pages set content = ? where id = ?", [next, row.id]);
    // Đoạn tóm tắt (dùng làm mô tả trang) cũng có thể chứa tên công ty
    const excerpt = row.excerpt?.replace(COMPANY_VN, "Shop Hoa Thanh Nhã") ?? null;
    if (excerpt !== row.excerpt) await db.query("update pages set excerpt = ? where id = ?", [excerpt, row.id]);
    const left = next.match(LEFTOVER);
    console.log(`${left ? "!" : "✓"} /${slug}/: ${next === row.content ? "không cần sửa" : "đã sửa"}${left ? ` — còn "${left[0]}"` : ""}`);
  }
  await db.end();
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
