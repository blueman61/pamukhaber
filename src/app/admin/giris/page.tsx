import type { Metadata } from "next";
import { CategoryArt } from "@/components/CategoryArt";
import { Logo } from "@/components/Logo";
import { isAuthConfigured } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Editör girişi", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="relative mx-auto min-h-dvh max-w-[480px] overflow-hidden">
      <CategoryArt motif="mail" focusY={0.26} />
      <div className="absolute inset-x-0 bottom-0 px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        <div className="glass rounded-[30px] p-6 shadow-float">
          <Logo />
          <h1 className="display mt-4 text-[28px]">Editör masası</h1>
          <p className="mt-1 text-muted">Pamuk Haber yayın paneline hoş geldin.</p>
          {!isAuthConfigured() && (
            <p className="mt-4 rounded-[20px] bg-butter/80 p-4 text-sm text-[#6b4a00]">
              Giriş kapalı: <code>ADMIN_PASSWORD</code> (ve canlıda <code>AUTH_SECRET</code>) ortam değişkenlerini tanımlayın.
            </p>
          )}
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
