import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createSession, getSession, verifyCredentials } from "@/lib/auth";

export const metadata: Metadata = { title: "Đăng nhập quản trị", robots: { index: false } };
export const dynamic = "force-dynamic";

async function login(formData: FormData) {
  "use server";
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  // Chậm lại một chút để hạn chế dò mật khẩu
  await new Promise((r) => setTimeout(r, 400));
  if (!(await verifyCredentials(username, password))) redirect("/admin/login/?err=1");
  await createSession(username);
  redirect("/admin/");
}

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getSession()) redirect("/admin/");
  const { err } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-surface-muted px-4">
      <form action={login} className="w-full max-w-sm space-y-5 rounded-3xl bg-surface p-8 shadow-xl">
        <Image src="/brand/logo-hoa-thanhnha.webp" alt="Hoa Thanh Nhã" width={500} height={157} className="mx-auto h-14 w-auto" priority />
        <h1 className="text-center font-display text-3xl font-semibold">Quản trị cửa hàng</h1>
        <div>
          <label htmlFor="username" className="label">
            Tên đăng nhập
          </label>
          <input id="username" name="username" required autoComplete="username" className="field" />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Mật khẩu
          </label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
        </div>
        {err && (
          <p role="alert" className="text-sm text-danger">
            Sai tên đăng nhập hoặc mật khẩu.
          </p>
        )}
        <button className="btn-primary h-12 w-full">Đăng nhập</button>
      </form>
    </main>
  );
}
