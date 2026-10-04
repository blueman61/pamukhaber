import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export function TopBar({ active }: { active: string | null }) {
  const tabs = [{ slug: null, label: "Tümü", emoji: "☁️" }, ...CATEGORIES];
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/45 to-transparent pt-[max(0.75rem,env(safe-area-inset-top))] pb-6">
      <div className="pointer-events-auto flex items-center justify-between px-4">
        <Link href="/" className="text-shadow-soft text-xl font-extrabold tracking-tight text-white">
          Pamuk Haber <span aria-hidden>☁️</span>
        </Link>
        <Link
          href="/hakkinda"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-sm font-bold text-white backdrop-blur-md"
          aria-label="Hakkında"
        >
          ?
        </Link>
      </div>
      <nav aria-label="Kategoriler" className="no-scrollbar pointer-events-auto mt-3 flex gap-2 overflow-x-auto px-4">
        {tabs.map((t) => {
          const selected = (t.slug ?? null) === active;
          return (
            <Link
              key={t.slug ?? "all"}
              href={t.slug ? `/?kategori=${t.slug}` : "/"}
              aria-current={selected ? "page" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap backdrop-blur-md transition ${
                selected ? "bg-white text-[#3b2f3a] shadow" : "bg-white/20 text-white"
              }`}
            >
              {t.emoji} {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
