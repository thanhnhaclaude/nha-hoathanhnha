import { site } from "./site";

export type InfoPage = { title: string; description: string; sections: { heading?: string; body: string[] }[] };

/** Nội dung các trang thông tin. Chỉnh sửa trực tiếp tại đây. */
export const infoPages: Record<string, InfoPage> = {
  "huong-dan-dat-hang": {
    title: "Hướng dẫn đặt hàng",
    description: "Các bước đặt hoa online tại Hoa Thanh Nhã.",
    sections: [
      {
        body: [
          "1. Chọn mẫu hoa yêu thích và bấm “Đặt hoa ngay” hoặc “Thêm vào giỏ”.",
          "2. Điền thông tin người đặt, người nhận, địa chỉ, ngày và khung giờ giao.",
          "3. Ghi nội dung thiệp hoặc băng rôn (miễn phí).",
          "4. Chọn hình thức thanh toán: chuyển khoản VietQR hoặc thanh toán khi nhận hoa.",
          `5. Shop gọi xác nhận đơn trong ít phút. Cần hỗ trợ gấp, gọi ${site.phoneDisplay}.`,
        ],
      },
    ],
  },
  "huong-dan-thanh-toan": {
    title: "Hướng dẫn thanh toán",
    description: "Các hình thức thanh toán khi đặt hoa tại Hoa Thanh Nhã.",
    sections: [
      { heading: "Chuyển khoản VietQR", body: ["Sau khi đặt hàng, trang xác nhận hiển thị mã QR với số tiền và nội dung chuyển khoản điền sẵn. Mở app ngân hàng, quét mã và xác nhận."] },
      { heading: "Thanh toán khi nhận hoa", body: ["Áp dụng tại các khu vực có cửa hàng. Nhân viên giao hoa sẽ thu tiền khi giao."] },
      { heading: "Cam kết", body: ["Nếu hoa nhận được không đúng như hình đặt, bạn không cần thanh toán."] },
    ],
  },
  "cau-hoi-thuong-gap": {
    title: "Câu hỏi thường gặp",
    description: "Giải đáp các thắc mắc thường gặp khi đặt hoa tại Hoa Thanh Nhã.",
    sections: [
      { heading: "Bao lâu thì hoa được giao?", body: ["Khoảng 60 phút với khu vực nội thành và 90 phút với ngoại thành, tính từ khi shop xác nhận đơn."] },
      { heading: "Tôi có được xem hoa trước khi giao không?", body: ["Có. Shop chụp ảnh hoa thực tế gửi bạn trước khi giao và báo lại khi giao xong."] },
      { heading: "Có ghi thiệp, băng rôn được không?", body: ["Có, miễn phí. Bạn ghi nội dung ở bước đặt hàng hoặc nhắn cho shop qua Zalo."] },
      { heading: "Phí giao hoa thế nào?", body: ["Miễn phí giao cho đơn từ 500.000₫ với hoa bó, hoa giỏ và từ 900.000₫ với kệ hoa. Đơn nhỏ hơn tính phí theo khu vực."] },
      { heading: "Tôi có thể đặt hoa theo mẫu riêng không?", body: [`Có. Gửi ảnh mẫu hoặc ngân sách qua Zalo ${site.phoneDisplay}, florist sẽ tư vấn và lên mẫu cho bạn.`] },
    ],
  },
  "huong-dan-doi-tra": {
    title: "Chính sách đổi/trả",
    description: "Chính sách đổi trả hoa tại Hoa Thanh Nhã.",
    sections: [
      {
        body: [
          "Shop chụp ảnh hoa trước khi giao để bạn xác nhận mẫu.",
          "Nếu hoa bị hư hỏng khi giao hoặc không đúng mẫu đã đặt, vui lòng báo shop trong vòng 2 giờ kể từ khi nhận để được đổi mới hoặc hoàn tiền.",
          "Do hoa tươi là sản phẩm có thời hạn, shop không nhận đổi trả vì lý do thay đổi ý định sau khi đã giao thành công.",
        ],
      },
    ],
  },
  "chinh-sach-bao-mat": {
    title: "Chính sách bảo mật",
    description: "Cách Hoa Thanh Nhã thu thập và bảo vệ thông tin khách hàng.",
    sections: [
      {
        body: [
          "Thông tin bạn cung cấp (họ tên, số điện thoại, địa chỉ, email) chỉ được dùng để xử lý và giao đơn hàng, liên hệ hỗ trợ.",
          "Shop không bán hoặc chia sẻ thông tin khách hàng cho bên thứ ba, trừ đơn vị giao hàng trong phạm vi cần thiết.",
          `Để yêu cầu xem hoặc xóa thông tin, vui lòng liên hệ ${site.email}.`,
        ],
      },
    ],
  },
  "lien-he": {
    title: "Liên hệ",
    description: "Thông tin liên hệ Shop hoa tươi Thanh Nhã.",
    sections: [
      { body: [`Hotline/Zalo: ${site.phoneDisplay} (24/7)`, `Email: ${site.email}`, `Giờ làm việc: ${site.hours}`] },
      ...site.stores.map((s) => ({ heading: s.city, body: [...s.addresses] })),
    ],
  },
  "quy-dinh-chuyen-phat": {
    title: "Quy định chuyển phát",
    description: "Quy định giao hoa của Hoa Thanh Nhã.",
    sections: [
      {
        body: [
          "Shop giao hoa hằng ngày từ 6h00 đến 21h00, kể cả cuối tuần và ngày lễ.",
          "Đơn giao gấp trong ngày vui lòng đặt trước tối thiểu 60 phút (nội thành) hoặc 90 phút (ngoại thành).",
          "Nếu không liên lạc được với người nhận, shop sẽ gọi người đặt để thống nhất cách giao hoặc gửi lại hoa.",
          "Ngày lễ, Tết có thể phát sinh phụ phí giao hoa; shop sẽ báo trước khi xác nhận đơn.",
        ],
      },
    ],
  },
  "quy-trinh-dien-hoa": {
    title: "Quy trình điện hoa",
    description: "Các bước gửi điện hoa đi tỉnh tại Hoa Thanh Nhã.",
    sections: [
      {
        body: [
          "1. Bạn chọn mẫu hoa và đặt hàng, ghi rõ địa chỉ người nhận ở tỉnh/thành bất kỳ.",
          "2. Shop xác nhận đơn và chuyển cho cửa hàng hoặc đối tác gần người nhận nhất.",
          "3. Hoa được cắm theo mẫu, chụp ảnh gửi bạn duyệt trước khi giao.",
          "4. Giao hoa và báo hoàn thành kèm ảnh người nhận (nếu người nhận đồng ý).",
        ],
      },
    ],
  },
  "gop-y-khieu-nai-phan-hoi": {
    title: "Khiếu nại – Phản hồi",
    description: "Gửi góp ý, khiếu nại về dịch vụ của Hoa Thanh Nhã.",
    sections: [
      {
        body: [
          "Mọi góp ý giúp Thanh Nhã phục vụ bạn tốt hơn. Vui lòng gửi kèm mã đơn hàng để shop xử lý nhanh nhất.",
          `Hotline/Zalo: ${site.phoneDisplay} (24/7)`,
          `Email: ${site.email}`,
          "Shop phản hồi khiếu nại trong vòng 24 giờ.",
        ],
      },
    ],
  },
  "khach-hang-doi-tac": {
    title: "Khách hàng & đối tác",
    description: "Hợp tác cùng Hoa Thanh Nhã.",
    sections: [
      {
        body: [
          "Thanh Nhã cung cấp hoa định kỳ cho doanh nghiệp, khách sạn, nhà hàng và hoa sự kiện, khai trương với số lượng lớn.",
          `Shop hoa tại các tỉnh muốn trở thành đối tác điện hoa, vui lòng liên hệ ${site.email} hoặc ${site.phoneDisplay}.`,
        ],
      },
    ],
  },
  "tin-tuc": {
    title: "Tin tức",
    description: "Tin tức và cẩm nang hoa tươi từ Hoa Thanh Nhã.",
    sections: [{ body: ["Chuyên mục đang được cập nhật. Mời bạn xem các mẫu hoa mới nhất tại trang chủ."] }],
  },
  "gioi-thieu": {
    title: "Giới thiệu",
    description: "Về Shop hoa tươi Thanh Nhã.",
    sections: [
      {
        body: [
          `Hoa Thanh Nhã được thành lập từ tháng 10/2012 với sứ mệnh “${site.tagline}”.`,
          "Sau hơn 10 năm, hệ thống cửa hàng và đối tác của Thanh Nhã đã phủ khắp các tỉnh thành, mang đến dịch vụ đặt hoa online, giao nhanh với hàng nghìn mẫu hoa.",
        ],
      },
    ],
  },
};
