import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Giữ dấu "/" cuối URL giống hệt WordPress cũ (vd. /hoa-bo/) để Google không phải index lại
  trailingSlash: true,
  // Luôn đặt title/description/canonical trong <head> (không stream) cho mọi trình duyệt và bot,
  // để Google, Facebook, Zalo và công cụ SEO đều đọc được ngay
  htmlLimitedBots: /.*/,
  experimental: {
    // Chèn CSS vào HTML: bỏ một lượt tải file CSS chặn hiển thị. Đo trên máy (không có độ trễ mạng) không thấy khác,
    // nhưng PageSpeed thật (máy chủ Google ở xa Hostinger) nhanh hơn 3–6 điểm; đổi lại HTML nặng thêm ~25 KB nén
    inlineCss: true,
  },
  images: {
    // Ít kích thước hơn mặc định (8 + 8): mỗi ảnh trong HTML ngắn hơn ~1/2, trang chủ 48 ảnh nhẹ hơn đáng kể
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [96, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "hoathanhnha.com", pathname: "/wp-content/uploads/**" },
      { protocol: "https", hostname: "img.vietqr.io" },
    ],
  },
  async redirects() {
    return [
      // Phân trang kiểu WordPress: /hoa-bo/page/2/ -> /hoa-bo/?page=2
      { source: "/:slug/page/:n(\\d+)", destination: "/:slug/?page=:n", permanent: true },
      // Block nội bộ của theme Flatsome (không có nội dung riêng)
      { source: "/blocks/:path*", destination: "/", permanent: true },
      // WordPress cũ: /sitemap.xml không tồn tại, sitemap chính là /sitemap_index.xml
      { source: "/sitemap.xml", destination: "/sitemap_index.xml", permanent: true },
      // Các đường dẫn hệ thống WordPress thường gặp
      { source: "/feed", destination: "/tin-tuc/", permanent: true },
      { source: "/:slug/feed", destination: "/:slug/", permanent: true },
      { source: "/product-category/:slug", destination: "/:slug/", permanent: true },
      { source: "/category/:slug", destination: "/:slug/", permanent: true },
      // Tìm kiếm WordPress: /?s=hoa+hong -> /tim-kiem/?q=hoa+hong
      { source: "/", has: [{ type: "query", key: "s", value: "(?<s>.*)" }], destination: "/tim-kiem/?q=:s", permanent: true },
    ];
  },
};

export default nextConfig;
