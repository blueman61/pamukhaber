import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
      <span className="text-7xl" aria-hidden>
        ☁️
      </span>
      <h1 className="mt-6 text-2xl font-extrabold">Bu sayfa bir bulutun arkasında kaybolmuş</h1>
      <Link href="/" className="mt-6 rounded-2xl bg-accent px-6 py-3 font-bold text-white shadow-md">
        Güzel haberlere dön
      </Link>
    </main>
  );
}
