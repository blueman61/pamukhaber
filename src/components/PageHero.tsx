import Link from "next/link";
import { CategoryArt, type ArtMotif } from "./CategoryArt";
import { ArrowLeftIcon } from "./icons";

type Props = {
  motif: ArtMotif;
  title: string;
  eyebrow?: string;
  description?: React.ReactNode;
  back?: { href: string; label: string };
};

/** İç sayfaların illüstrasyonlu başlığı: bulutlu sahne + üstüne binen başlık kartı. */
export function PageHero({ motif, title, eyebrow, description, back = { href: "/", label: "Akışa dön" } }: Props) {
  return (
    <>
      <div className="relative h-52 overflow-hidden rounded-b-[44px] lg:mt-6 lg:h-72 lg:rounded-[44px]">
        <CategoryArt motif={motif} focusY={0.5} />
        <Link
          href={back.href}
          className="glass btn btn-sm absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 shadow-soft"
        >
          <ArrowLeftIcon className="h-4 w-4" /> {back.label}
        </Link>
      </div>
      <div className="card relative mx-4 -mt-12 p-6 lg:mx-10 lg:-mt-16 lg:p-8">
        {eyebrow && <p className="chip mb-2 bg-accent-soft text-accent">{eyebrow}</p>}
        <h1 className="display text-[30px] text-balance">{title}</h1>
        {description && <div className="mt-2 text-[15px] leading-relaxed text-muted">{description}</div>}
      </div>
    </>
  );
}
