"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import type { Page, PostCategory, SeoMeta } from "@/lib/db/schema";
import { savePost, type PostFormState } from "../actions";

export function PostForm({
  post,
  type,
  categories,
  selected,
  seo,
  tagsText = "",
}: {
  post?: Page;
  type: "post" | "page";
  categories: PostCategory[];
  selected: number[];
  seo?: Pick<SeoMeta, "title" | "description"> | null;
  tagsText?: string;
}) {
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(savePost, undefined);
  const [image, setImage] = useState(post?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload/", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Tải ảnh thất bại");
      setImage(json.url);
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // published_at lưu giờ Việt Nam; drizzle đọc DATETIME như UTC nên phần "UTC" của Date chính là giờ Việt Nam.
  // Bài mới: lấy giờ hiện tại theo giờ Việt Nam. Đặt giờ tương lai = hẹn giờ, website tự hiện bài khi tới giờ.
  const publishedAt = (post?.publishedAt ?? new Date(Date.now() + 7 * 3600_000)).toISOString().slice(0, 16);

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      {post && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="type" value={type} />
      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-border">
          <div>
            <label htmlFor="title" className="label">
              Tiêu đề *
            </label>
            <input id="title" name="title" required defaultValue={post?.title} className="field" />
          </div>
          <div>
            <label htmlFor="slug" className="label">
              Đường dẫn (để trống sẽ tự tạo từ tiêu đề)
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted">/</span>
              <input id="slug" name="slug" defaultValue={post?.slug} className="field" placeholder="shop-hoa-tuoi-quan-1" />
              <span className="text-sm text-muted">/</span>
            </div>
            {post && <p className="mt-1 text-xs text-muted">Đổi đường dẫn của bài đã được Google index sẽ làm mất thứ hạng của URL cũ.</p>}
          </div>
          <div>
            <label htmlFor="excerpt" className="label">
              Tóm tắt (hiển thị ở danh sách bài)
            </label>
            <textarea id="excerpt" name="excerpt" rows={3} defaultValue={post?.excerpt ?? ""} className="field" />
          </div>
          <div>
            <label htmlFor="content" className="label">
              Nội dung (HTML)
            </label>
            <textarea id="content" name="content" rows={22} defaultValue={post?.content ?? ""} className="field font-mono text-sm" />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-border">
          <h2 className="text-lg font-semibold">SEO</h2>
          <div>
            <label htmlFor="seoTitle" className="label">
              Tiêu đề SEO (để trống = “Tiêu đề | Hoa Thanh Nhã”)
            </label>
            <input id="seoTitle" name="seoTitle" defaultValue={seo?.title ?? ""} maxLength={255} className="field" />
          </div>
          <div>
            <label htmlFor="seoDescription" className="label">
              Mô tả SEO (khoảng 150–160 ký tự)
            </label>
            <textarea id="seoDescription" name="seoDescription" rows={3} defaultValue={seo?.description ?? ""} maxLength={500} className="field" />
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-4 xl:sticky xl:top-8">
        <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-border">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" name="isPublished" defaultChecked={post?.isPublished ?? true} className="size-4 accent-[var(--brand)]" /> Đăng công khai
          </label>
          <div>
            <label htmlFor="publishedAt" className="label">
              Ngày giờ đăng (giờ Việt Nam)
            </label>
            <input id="publishedAt" name="publishedAt" type="datetime-local" defaultValue={publishedAt} className="field" />
            <p className="mt-1 text-xs text-muted">Chọn thời điểm trong tương lai để hẹn giờ: bài hiện ở mục “Hẹn giờ đăng” và tự lên website khi tới giờ.</p>
          </div>
          {state?.error && (
            <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
              {state.error}
            </p>
          )}
          <button disabled={pending} className="btn-primary h-11 w-full">
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Lưu
          </button>
        </section>

        <section className="space-y-3 rounded-2xl bg-surface p-6 ring-1 ring-border">
          <h2 className="text-lg font-semibold">Ảnh đại diện</h2>
          {image && (
            <img src={image} alt="" className="aspect-[16/10] w-full rounded-xl object-cover" />
          )}
          <label htmlFor="image" className="label">
            Đường dẫn ảnh
          </label>
          <input id="image" name="image" value={image} onChange={(e) => setImage(e.target.value)} className="field font-mono text-xs" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-outline h-10 min-h-0 w-full">
            {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />} Tải ảnh lên
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => upload(e.target.files?.[0])} />
          {uploadError && (
            <p role="alert" className="text-sm text-danger">
              {uploadError}
            </p>
          )}
        </section>

        {type === "post" && (
          <section className="rounded-2xl bg-surface p-6 ring-1 ring-border">
          <label htmlFor="tags" className="text-lg font-semibold">
            Thẻ (tag)
          </label>
          <p className="mt-1 text-xs text-muted">Cách nhau bằng dấu phẩy, vd: hoa hồng, tặng mẹ, màu đỏ. Thẻ mới tự được tạo.</p>
          <textarea id="tags" name="tags" rows={2} defaultValue={tagsText} className="field mt-3" placeholder="hoa hồng, tặng mẹ" />
        </section>
        )}
        {type === "post" && (
          <section className="rounded-2xl bg-surface p-6 ring-1 ring-border">
            <h2 className="text-lg font-semibold">Danh mục</h2>
            <div className="mt-3 space-y-2 text-sm">
              {categories.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" name="categoryIds" value={c.id} defaultChecked={selected.includes(c.id)} className="accent-[var(--brand)]" /> {c.name}
                </label>
              ))}
            </div>
          </section>
        )}
      </aside>
    </form>
  );
}
