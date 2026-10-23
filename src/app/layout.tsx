import type { Metadata, Viewport } from "next";
import { Playfair_Display, Be_Vietnam_Pro } from "next/font/google";
import { GoogleTags } from "@/components/google-tags";
import { googleVerification } from "@/lib/google";
import { site } from "@/lib/site";
import "./globals.css";

// Playfair Display: font tiêu đề hiển thị dấu tiếng Việt chuẩn (Cormorant xếp dấu mũ sai, vd "Câu" trông như "Cầu")
const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  // Chỉ dùng 600 (heading-display, font-semibold). Không tải trước: tiêu đề hiện bằng phông dự phòng rồi đổi,
  // để băng thông đầu trang dành cho ảnh banner/sản phẩm (tốc độ điện thoại)
  weight: ["600"],
  display: "swap",
  preload: false,
});

const body = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  // 700 chỉ dùng 3 chỗ (trình duyệt dùng 600 thay thế); bớt 2 file phông tải ở đầu trang
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { type: "website", locale: "vi_VN", siteName: site.name, images: ["/brand/banner2.webp"] },
  // Thẻ xác minh Search Console / Merchant Center chép từ website cũ, để không phải xác minh lại
  verification: { google: googleVerification() },
};

export const viewport: Viewport = { themeColor: "#e8641b" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <GoogleTags />
        {children}
      </body>
    </html>
  );
}
