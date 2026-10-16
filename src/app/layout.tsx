import type { Metadata, Viewport } from "next";
import { Playfair_Display, Be_Vietnam_Pro } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

// Playfair Display: font tiêu đề hiển thị dấu tiếng Việt chuẩn (Cormorant xếp dấu mũ sai, vd "Câu" trông như "Cầu")
const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const body = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s | ${site.name}` },
  description: site.description,
  icons: { icon: "/brand/icon-hoathanhnha-100x100.png" },
  openGraph: { type: "website", locale: "vi_VN", siteName: site.name, images: ["/brand/banner2.webp"] },
};

export const viewport: Viewport = { themeColor: "#e8641b" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
