"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mt-6 flex flex-col gap-3">
      <label htmlFor="password" className="label mb-0">
        Editör şifresi
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="input"
      />
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full"
      >
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
      {state.error && <p className="text-sm font-bold text-rose-600">{state.error}</p>}
    </form>
  );
}
