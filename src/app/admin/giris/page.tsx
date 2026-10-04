import type { Metadata } from "next";
import { isAuthConfigured } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Editör girişi", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="text-3xl font-extrabold">
        Editör masası <span aria-hidden>☁️</span>
      </h1>
      <p className="mt-2 text-muted">Pamuk Haber yayın paneline hoş geldin.</p>
      {!isAuthConfigured() && (
        <p className="mt-6 rounded-2xl bg-amber-100 p-4 text-sm text-amber-900">
          Giriş kapalı: <code>ADMIN_PASSWORD</code> (ve canlıda <code>AUTH_SECRET</code>) ortam değişkenlerini tanımlayın.
        </p>
      )}
      <LoginForm />
    </main>
  );
}
