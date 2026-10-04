import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { MailIcon, UserIcon } from "./icons";
import { Logo } from "./Logo";

/** Masaüstü sol paneli: logo, kategoriler ve ana bağlantılar. */
export function DesktopSidebar({ active }: { active: string | null }) {
  const tabs = [{ slug: null, label: "Tüm haberler", color: null }, ...CATEGORIES];
  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-5 lg:flex xl:w-64" aria-label="Gezinme">
      <Link href="/" aria-label="Pamuk Haber ana sayfa" className="glass self-start rounded-full py-2 pr-5 pl-2 shadow-soft">
        <Logo />
      </Link>
      <p className="px-2 text-[15px] leading-relaxed font-semibold text-muted">
        Kötü haberden yorulanlar için yalnızca iç ısıtan, doğrulanmış haberler.
      </p>

      <nav aria-label="Kategoriler (masaüstü)" className="glass flex flex-col gap-0.5 rounded-[28px] p-2 shadow-soft">
        {tabs.map((t) => {
          const selected = (t.slug ?? null) === active;
          return (
            <Link
              key={t.slug ?? "all"}
              href={t.slug ? `/?kategori=${t.slug}` : "/"}
              aria-current={selected ? "page" : undefined}
              className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-[15px] font-extrabold transition ${
                selected ? "bg-foreground text-background shadow-soft" : "hover:bg-white/60 dark:hover:bg-white/10"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: t.color ?? "linear-gradient(135deg, #f58fb5, #a9d8ff)" }}
                aria-hidden
              />
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2">
        <Link href="/gonder" className="btn btn-primary justify-start">
          <MailIcon className="h-5 w-5" /> Haber gönder
        </Link>
        <Link href="/hakkinda" className="btn btn-ghost justify-start">
          <UserIcon className="h-5 w-5" /> Biz kimiz?
        </Link>
      </div>
    </aside>
  );
}
