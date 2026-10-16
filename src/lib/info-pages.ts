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
  "chinh-sach-doi-tra": {
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
