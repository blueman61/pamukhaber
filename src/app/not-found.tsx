import Link from "next/link";
import { CategoryArt } from "@/components/CategoryArt";

export default function NotFound() {
  return (
    <main className="relative mx-auto h-dvh max-w-[480px] overflow-hidden">
      <CategoryArt motif="moon" focusY={0.34} />
      <div className="absolute inset-x-0 bottom-0 px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        <div className="glass rounded-[30px] p-6 text-center shadow-float">
          <p className="chip mx-auto bg-accent-soft text-accent">404</p>
          <h1 className="display mt-3 text-[26px] text-balance">Bu sayfa bir bulutun arkasında kaybolmuş</h1>
          <Link href="/" className="btn btn-primary mt-5 w-full">
            Güzel haberlere dön
          </Link>
        </div>
      </div>
    </main>
  );
}
