import { CategoryArt, type ArtMotif } from "./CategoryArt";

/** Masaüstünde kart sütununu "telefon çerçevesi" gibi gösteren sınıflar (mobilde tam ekran). */
export const PHONE_FRAME =
  "relative mx-auto h-dvh w-full max-w-[480px] overflow-hidden bg-background " +
  "lg:mx-0 lg:h-[calc(100dvh-3rem)] lg:w-[min(460px,calc((100dvh-3rem)*0.56))] lg:shrink-0 lg:rounded-[36px] " +
  "lg:shadow-float lg:ring-1 lg:ring-white/60 dark:lg:ring-white/10";

/** Masaüstünde sayfanın arkasındaki yumuşatılmış illüstrasyon (mobilde görünmez). */
export function DesktopBackdrop({ motif, seed }: { motif: ArtMotif; seed?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden lg:block" aria-hidden>
      <div key={motif} className="animate-fade absolute inset-[-8%]">
        <CategoryArt motif={motif} seed={seed} focusY={0.5} className="h-full w-full scale-110 opacity-70 blur-2xl" />
      </div>
      <div className="absolute inset-0 bg-background/45" />
    </div>
  );
}

/** Tek kartlık sayfalar (giriş, 404): mobilde tam ekran, masaüstünde ortalanmış çerçeve. */
export function PhoneFrame({ motif, children }: { motif: ArtMotif; children: React.ReactNode }) {
  return (
    <div className="relative isolate lg:flex lg:h-dvh lg:items-center lg:justify-center">
      <DesktopBackdrop motif={motif} />
      <main className={PHONE_FRAME}>{children}</main>
    </div>
  );
}
