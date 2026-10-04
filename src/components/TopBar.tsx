import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { MailIcon } from "./icons";
import { Logo } from "./Logo";

export function TopBar({ active }: { active: string | null }) {
  const tabs = [{ slug: null, label: "Tümü", color: null }, ...CATEGORIES];
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 pt-[max(0.7rem,env(safe-area-inset-top))] lg:hidden">
      <div className="pointer-events-auto flex items-center justify-between gap-2 px-3">
        <Link href="/" aria-label="Pamuk Haber ana sayfa" className="glass inline-flex h-11 items-center justify-center rounded-full px-2.5 shadow-soft">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/gonder"
            aria-label="Haber gönder"
            className="glass flex h-10 w-10 items-center justify-center rounded-full shadow-soft"
          >
            <MailIcon className="h-5 w-5" />
          </Link>
          <Link
            href="/hakkinda"
            aria-label="Hakkında"
            className="glass flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-black shadow-soft"
          >
            ?
          </Link>
        </div>
      </div>
      <nav aria-label="Kategoriler" className="no-scrollbar fade-x pointer-events-auto mt-2.5 flex gap-1.5 overflow-x-auto px-3 pb-2">
        {tabs.map((t) => {
          const selected = (t.slug ?? null) === active;
          return (
            <Link
              key={t.slug ?? "all"}
              href={t.slug ? `/?kategori=${t.slug}` : "/"}
              aria-current={selected ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.5px] font-extrabold whitespace-nowrap transition ${
                selected ? "bg-foreground text-background shadow-float" : "glass text-foreground/80"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: t.color ?? "linear-gradient(135deg, #f58fb5, #a9d8ff)" }}
                aria-hidden
              />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
