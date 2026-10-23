/**
 * Danh mục theo mùa (Ngày Nhà giáo, Giáng sinh, Tết, 20/10, 8/3, tặng mẹ, khuyến mãi) nhập từ website cũ nhưng trống
 * -> trang không được lập chỉ mục đúng lúc cao điểm. Gán mẫu theo quy tắc từ danh mục sẵn có (loại hoa, màu, giá, đang giảm giá)
 * và viết mô tả. CHỈ áp dụng khi danh mục chưa có sản phẩm / chưa có mô tả: chỉnh trong admin sau đó được giữ nguyên.
 */
import type { Connection } from "mysql2/promise";

type Rule = { slug: string; label: string; sql: string; params: unknown[]; limit: number; html: string };

/** Mẫu đang bán, có giá, thuộc 1 trong các danh mục `inAny` và (nếu có) thuộc 1 trong `andAny` */
const pick = (inAny: string[], andAny: string[] = [], maxPrice = 0) => ({
  sql: `select distinct p.id, p.created_at from products p
        join product_categories a on a.product_id = p.id join categories ca on ca.id = a.category_id and ca.slug in (?)
        ${andAny.length ? "join product_categories b on b.product_id = p.id join categories cb on cb.id = b.category_id and cb.slug in (?)" : ""}
        where p.is_active = 1 and p.price > 0 ${maxPrice ? "and p.price <= ?" : ""}
        order by p.created_at desc, p.id desc limit ?`,
  params: [inAny, ...(andAny.length ? [andAny] : []), ...(maxPrice ? [maxPrice] : [])],
});

const PHONE = '<a href="tel:0396727374">0396.72.73.74</a>';

const RULES: Rule[] = [
  {
    slug: "ngay-nha-giao",
    label: "Ngày Nhà Giáo 20/11",
    ...pick(["hoa-bo"], [], 700_000),
    limit: 24,
    html: `<h2>Hoa tặng thầy cô ngày 20/11</h2>
<p>Những bó hoa gọn, giá vừa phải để học trò và phụ huynh gửi lời tri ân thầy cô dịp Ngày Nhà giáo Việt Nam 20/11. Hoa hồng, cúc họa mi, hướng dương, cát tường được phối nhẹ nhàng, dễ cầm khi trao trên lớp hoặc tại lễ kỷ niệm của trường.</p>
<h3>Gợi ý chọn hoa 20/11</h3>
<ul><li><strong>Học sinh tặng cô giáo chủ nhiệm:</strong> bó hồng hoặc cát tường tông hồng, trắng.</li>
<li><strong>Phụ huynh, cả lớp góp chung:</strong> bó lớn hoặc <a href="/hoa-gio/">giỏ hoa</a> đặt trên bàn giáo viên.</li>
<li><strong>Sinh viên tặng thầy:</strong> hướng dương, màu vàng tươi, ý nghĩa biết ơn và kính trọng.</li></ul>
<p>Ngày 19–20/11 rất nhiều đơn, nên đặt trước 2–3 ngày và hẹn giờ giao trước giờ vào lớp. Shop ghi thiệp tay miễn phí theo lời bạn gửi. Gọi ${PHONE} hoặc xem thêm bài <a href="/hoa-20-11-tang-thay-co/">hoa 20/11 tặng thầy cô</a>.</p>`,
  },
  {
    slug: "giang-sinh",
    label: "Giáng Sinh",
    ...pick(["hoa-bo", "hoa-gio", "hop-hoa-tuoi"], ["mau-do"]),
    limit: 24,
    html: `<h2>Hoa Giáng sinh tông đỏ</h2>
<p>Bó hoa, giỏ hoa và hộp hoa tông đỏ là lựa chọn quen thuộc mùa Noel: tặng người yêu, gia đình, đồng nghiệp hoặc trang trí bàn tiệc cuối năm. Hồng đỏ kết hợp lá xanh và điểm trắng gợi đúng không khí Giáng sinh.</p>
<h3>Đặt hoa Noel đúng hẹn</h3>
<ul><li>Các ngày 23–25/12 đơn tăng cao, nên đặt trước ít nhất 1–2 ngày.</li>
<li>Muốn tặng bất ngờ đúng tối 24/12, ghi rõ khung giờ giao khi đặt.</li>
<li>Gửi lời chúc để shop ghi thiệp tay miễn phí.</li></ul>
<p>Xem thêm <a href="/hoa-tinh-yeu/">hoa tình yêu</a> hoặc gọi ${PHONE} để được tư vấn mẫu theo ngân sách.</p>`,
  },
  {
    slug: "hoa-tet",
    label: "Hoa Tết",
    // Lan hồ điệp (quà Tết bán chạy nhất; nhóm lan không gắn nhãn màu nên không lọc đỏ/vàng)
    ...pick(["lan-ho-diep", "lan-ho-diep-khai-truong"]),
    limit: 24,
    html: `<h2>Hoa Tết: lan hồ điệp và giỏ hoa đỏ vàng</h2>
<p>Chậu lan hồ điệp và giỏ hoa tông đỏ, vàng là quà biếu Tết được chọn nhiều nhất: đặt phòng khách, bàn thờ, văn phòng đầu năm, hoặc biếu đối tác, thầy cô, ông bà. Lan hồ điệp giữ đẹp nhiều tuần nếu để nơi thoáng, tránh nắng gắt.</p>
<h3>Lưu ý đặt hoa Tết</h3>
<ul><li>Giá hoa thường tăng từ 23 tháng Chạp; đặt sớm giữ được mẫu và giá tốt.</li>
<li>Biếu doanh nghiệp: ghi tên công ty và lời chúc năm mới trên thiệp hoặc băng.</li>
<li>Mùng 1–3 Tết lịch giao có hạn, hãy hẹn trước.</li></ul>
<p>Xem thêm <a href="/lan-ho-diep-khai-truong/">lan hồ điệp</a> hoặc gọi ${PHONE}.</p>`,
  },
  {
    slug: "ngay-phu-nu-viet-nam-20-10",
    label: "Ngày Phụ Nữ Việt Nam 20/10",
    ...pick(["hoa-bo", "hoa-gio"], ["mau-hong"]),
    limit: 24,
    html: `<h2>Hoa tặng 20/10 Ngày Phụ nữ Việt Nam</h2>
<p>Bó hoa và giỏ hoa tông hồng nhẹ nhàng để tặng mẹ, vợ, người yêu, chị em đồng nghiệp ngày 20/10. Hồng phấn, cẩm chướng, baby, tulip mang ý nghĩa yêu thương và trân trọng.</p>
<h3>Mẹo chọn hoa 20/10</h3>
<ul><li><strong>Tặng mẹ:</strong> giỏ hoa hoặc <a href="/hoa-tang-me/">hoa tặng mẹ</a> tông hồng, cẩm chướng.</li>
<li><strong>Tặng người yêu, vợ:</strong> bó hồng phấn hoặc hồng đỏ.</li>
<li><strong>Tặng đồng nghiệp nữ:</strong> bó nhỏ cùng mẫu, đặt số lượng để được tư vấn giá tốt.</li></ul>
<p>Ngày 19–20/10 đơn rất đông, nên đặt trước 1–2 ngày. Gọi ${PHONE}.</p>`,
  },
  {
    slug: "ngay-quoc-te-phu-nu",
    label: "Quốc Tế Phụ Nữ 8/3",
    ...pick(["hoa-bo", "hoa-gio"], ["mau-hong"]),
    limit: 24,
    html: `<h2>Hoa tặng 8/3 Quốc tế Phụ nữ</h2>
<p>Hoa tươi tông hồng, pastel cho ngày 8/3: tặng mẹ, vợ, người yêu, cô giáo và đồng nghiệp nữ. Bó hồng phấn, tulip, cẩm chướng hay giỏ hoa đặt bàn đều thể hiện sự quan tâm tinh tế.</p>
<h3>Đặt hoa 8/3</h3>
<ul><li>Đặt trước 2–3 ngày vì 7–8/3 là cao điểm.</li>
<li>Công ty tặng nhân viên nữ: đặt số lượng cùng mẫu, shop giao một lần tại văn phòng.</li>
<li>Thiệp ghi tay miễn phí theo lời chúc bạn gửi.</li></ul>
<p>Xem thêm <a href="/hoa-tinh-yeu/">hoa tình yêu</a> hoặc gọi ${PHONE}.</p>`,
  },
  {
    slug: "hoa-tang-me",
    label: "Hoa Tặng Mẹ",
    ...pick(["hoa-gio", "lan-ho-diep", "lan-ho-diep-khai-truong"]),
    limit: 24,
    html: `<h2>Hoa tặng mẹ</h2>
<p>Giỏ hoa và chậu lan hồ điệp để tặng mẹ dịp sinh nhật, 20/10, 8/3, Ngày của Mẹ hay đơn giản là một lời cảm ơn. Giỏ hoa đặt được trên bàn, lan hồ điệp giữ đẹp lâu, hợp với người lớn tuổi thích chăm cây.</p>
<h3>Chọn hoa tặng mẹ</h3>
<ul><li><strong>Cẩm chướng:</strong> loài hoa gắn với tình mẹ.</li>
<li><strong>Lan hồ điệp:</strong> sang trọng, bền, ít chăm sóc.</li>
<li><strong>Giỏ hoa tông hồng, vàng:</strong> tươi tắn, ấm áp.</li></ul>
<p>Con ở xa có thể đặt online, shop giao tận nhà và gửi ảnh hoa trước khi giao. Gọi ${PHONE}.</p>`,
  },
  {
    slug: "khuyen-mai",
    label: "Khuyến Mãi",
    sql: `select p.id from products p where p.is_active = 1 and p.sale_price > 0 and p.sale_price < p.price order by (p.price - p.sale_price) / p.price desc, p.id desc limit ?`,
    params: [],
    limit: 200,
    html: `<h2>Hoa tươi đang giảm giá</h2>
<p>Tổng hợp các mẫu hoa đang có giá ưu đãi tại Shop hoa Thanh Nhã: hoa bó, giỏ hoa, kệ hoa khai trương, hoa chia buồn. Giá giảm áp dụng khi đặt online, vẫn gồm thiệp ghi tay và ảnh hoa thật gửi trước khi giao.</p>
<p>Danh sách tự cập nhật theo giá trên website. Cần mẫu theo ngân sách riêng, gọi ${PHONE}.</p>`,
  },
];

export async function syncSeasonalPages(db: Connection): Promise<string[]> {
  const log: string[] = [];
  for (const r of RULES) {
    const [[cat]] = (await db.query(
      `select c.id, c.description, (select count(*) from product_categories pc where pc.category_id = c.id) n from categories c where c.slug = ?`,
      [r.slug],
    )) as [{ id: number; description: string | null; n: number }[], unknown];
    if (!cat) continue;
    const done: string[] = [];
    if (!cat.description) {
      await db.query("update categories set description = ? where id = ?", [r.html, cat.id]);
      done.push("mô tả");
    }
    // Khuyến mãi tự cập nhật theo giá giảm; danh mục khác chỉ gán khi đang trống
    if (Number(cat.n) === 0 || r.slug === "khuyen-mai") {
      const [rows] = (await db.query(r.sql, [...r.params, r.limit])) as [{ id: number }[], unknown];
      if (r.slug === "khuyen-mai") await db.query("delete from product_categories where category_id = ?", [cat.id]);
      if (rows.length) await db.query("insert ignore into product_categories (product_id, category_id) values ?", [rows.map((x) => [x.id, cat.id])]);
      if (Number(cat.n) === 0 || rows.length !== Number(cat.n)) done.push(`${rows.length} mẫu`);
    }
    if (done.length) log.push(`${r.label}: ${done.join(", ")}`);
  }
  return [`✓ Danh mục mùa: ${log.length ? log.join("; ") : "không đổi"}`];
}
