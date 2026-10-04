"use client";

import { useState } from "react";

/** Bülten aboneliği: akıştaki bülten kartı ve masaüstü yan paneli ortak kullanır. */
export function useSubscribe() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Bir şeyler ters gitti.");
      }
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir şeyler ters gitti.");
      setState("error");
    }
  }

  return { email, setEmail, state, error, submit };
}
