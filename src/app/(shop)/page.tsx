import type { Metadata } from "next";
import { HomeView } from "@/components/home-view";
import { seoMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

// ISR thay cho force-dynamic: trang chủ dựng sẵn, làm mới mỗi 5 phút. Next gửi Cache-Control s-maxage nên CDN của
// Hostinger (hcdn) được lưu trang -> người dùng không phải chờ máy chủ Node (TTFB thực tế trước đó ~2,7s, LCP 4,2s).
// Không có cookie/giỏ hàng trong HTML (giỏ hàng đọc ở trình duyệt) nên dùng chung một bản cho mọi người.
export const revalidate = 300;

export function generateMetadata(): Promise<Metadata> {
  // Lúc build trên Hostinger mà chưa kết nối được DB: vẫn build được với tiêu đề mặc định
  return seoMetadata("/", { title: site.title, description: site.description }).catch(() => ({ title: site.title, description: site.description }));
}

export default function HomePage() {
  return <HomeView />;
}
