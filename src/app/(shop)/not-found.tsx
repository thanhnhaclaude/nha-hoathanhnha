import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <p className="eyebrow">Lỗi 404</p>
      <h1 className="heading-display mt-3 text-4xl sm:text-5xl">Không tìm thấy trang</h1>
      <p className="mt-4 max-w-md text-muted">Mẫu hoa hoặc trang bạn tìm có thể đã được đổi tên. Hãy thử tìm kiếm hoặc quay về trang chủ.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-primary">
          Về trang chủ
        </Link>
        <Link href="/tim-kiem" className="btn-outline">
          Tìm kiếm
        </Link>
      </div>
    </div>
  );
}
