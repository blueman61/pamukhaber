"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mt-8 flex flex-col gap-3">
      <label htmlFor="password" className="text-sm font-semibold">
        Editör şifresi
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-2xl bg-accent px-4 py-3 font-bold text-white shadow-md disabled:opacity-60"
      >
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
    </form>
  );
}
