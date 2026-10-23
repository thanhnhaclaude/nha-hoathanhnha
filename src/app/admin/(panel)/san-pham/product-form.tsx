"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import type { Category, Product } from "@/lib/db/schema";
import { saveProduct, type ProductFormState } from "../actions";

export function ProductForm({ product, categories, selected, tagsText = "" }: { product?: Product; categories: Category[]; selected: number[]; tagsText?: string }) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(saveProduct, undefined);
  const [images, setImages] = useState((product?.images ?? []).join("\n"));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const roots = categories.filter((c) => c.parentId == null);
  const childrenOf = (id: number) => categories.filter((c) => c.parentId === id);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Tải ảnh thất bại");
        urls.push(json.url);
      }
      setImages((prev) => [prev.trim(), ...urls].filter(Boolean).join("\n"));
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const preview = images
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1fr_380px]">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-border">
          <div>
            <label htmlFor="name" className="label">
              Tên sản phẩm *
            </label>
            <input id="name" name="name" required defaultValue={product?.name} className="field" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="slug" className="label">
                Đường dẫn (để trống sẽ tự tạo)
              </label>
              <input id="slug" name="slug" defaultValue={product?.slug} className="field" placeholder="hoa-bo-hb001" />
            </div>
            <div>
              <label htmlFor="sku" className="label">
                Mã sản phẩm
              </label>
              <input id="sku" name="sku" defaultValue={product?.sku ?? ""} className="field" />
            </div>
            <div>
              <label htmlFor="price" className="label">
                Giá bán (VND, 0 = Liên hệ)
              </label>
              <input id="price" name="price" type="number" min={0} step={1000} defaultValue={product?.price ?? 0} className="field" />
            </div>
            <div>
              <label htmlFor="salePrice" className="label">
                Giá khuyến mãi (VND)
              </label>
              <input id="salePrice" name="salePrice" type="number" min={0} step={1000} defaultValue={product?.salePrice ?? ""} className="field" />
            </div>
          </div>
          <div>
            <label htmlFor="shortDescription" className="label">
              Mô tả ngắn (HTML)
            </label>
            <textarea id="shortDescription" name="shortDescription" rows={4} defaultValue={product?.shortDescription ?? ""} className="field font-mono text-sm" />
          </div>
          <div>
            <label htmlFor="description" className="label">
              Mô tả chi tiết (HTML)
            </label>
            <textarea id="description" name="description" rows={12} defaultValue={product?.description ?? ""} className="field font-mono text-sm" />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Hình ảnh</h2>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-outline h-10 min-h-0">
              {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
              Tải ảnh lên
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
          </div>
          {uploadError && (
            <p role="alert" className="text-sm text-danger">
              {uploadError}
            </p>
          )}
          {preview.length > 0 && (
            <ul className="flex flex-wrap gap-3">
              {preview.map((src, i) => (
                <li key={src + i} className="relative size-24 overflow-hidden rounded-xl bg-surface-muted ring-1 ring-border">
                  <img src={src} alt="" className="size-full object-cover" />
                  {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/60 text-center text-xs text-white">Ảnh chính</span>}
                </li>
              ))}
            </ul>
          )}
          <div>
            <label htmlFor="images" className="label">
              Đường dẫn ảnh (mỗi dòng một ảnh, dòng đầu là ảnh chính)
            </label>
            <textarea id="images" name="images" rows={4} value={images} onChange={(e) => setImages(e.target.value)} className="field font-mono text-xs" />
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-4 xl:sticky xl:top-8">
        <section className="space-y-3 rounded-2xl bg-surface p-6 ring-1 ring-border">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} className="size-4 accent-[var(--brand)]" /> Hiển thị trên website
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured ?? false} className="size-4 accent-[var(--brand)]" /> Sản phẩm nổi bật
          </label>
          {state?.error && (
            <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
              {state.error}
            </p>
          )}
          <button disabled={pending} className="btn-primary h-11 w-full">
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Lưu sản phẩm
          </button>
        </section>
        <section className="rounded-2xl bg-surface p-6 ring-1 ring-border">
          <label htmlFor="tags" className="text-lg font-semibold">
            Thẻ (tag)
          </label>
          <p className="mt-1 text-xs text-muted">Cách nhau bằng dấu phẩy, vd: hoa hồng, tặng mẹ, màu đỏ. Thẻ mới tự được tạo.</p>
          <textarea id="tags" name="tags" rows={2} defaultValue={tagsText} className="field mt-3" placeholder="hoa hồng, tặng mẹ" />
        </section>
        <section className="rounded-2xl bg-surface p-6 ring-1 ring-border">
          <h2 className="text-lg font-semibold">Danh mục</h2>
          <div className="mt-3 max-h-[60vh] space-y-3 overflow-y-auto pr-2 text-sm">
            {roots.map((r) => (
              <fieldset key={r.id}>
                <label className="flex cursor-pointer items-center gap-2 font-semibold">
                  <input type="checkbox" name="categoryIds" value={r.id} defaultChecked={selected.includes(r.id)} className="accent-[var(--brand)]" /> {r.name}
                </label>
                <div className="mt-1 space-y-1 pl-6">
                  {childrenOf(r.id).map((c) => (
                    <div key={c.id}>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" name="categoryIds" value={c.id} defaultChecked={selected.includes(c.id)} className="accent-[var(--brand)]" /> {c.name}
                      </label>
                      {/* Cấp 3, vd. KHU VỰC > TP. Hồ Chí Minh > Quận 1 */}
                      {childrenOf(c.id).length > 0 && (
                        <div className="mt-1 space-y-1 pl-6">
                          {childrenOf(c.id).map((g) => (
                            <label key={g.id} className="flex cursor-pointer items-center gap-2 text-muted">
                              <input type="checkbox" name="categoryIds" value={g.id} defaultChecked={selected.includes(g.id)} className="accent-[var(--brand)]" /> {g.name}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </section>
      </aside>
    </form>
  );
}
