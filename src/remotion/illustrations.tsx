import { Cloud, Motif, Star } from "@/components/CategoryArt";
import { getCategory, isCategory, type ArtPalette } from "@/lib/categories";
import type { SceneMotif } from "./scene-data";

const FALLBACK: ArtPalette = getCategory("iyilik").art;

export function paletteFor(category: string): ArtPalette {
  return isCategory(category) ? getCategory(category).art : FALLBACK;
}

/** Çerçevenin (0–1) ilerlemesine bağlı, CSS animasyonsuz çizimler: Remotion kare kare çizer. */
export function SceneMotif({ motif, p, t, seed }: { motif: SceneMotif; p: ArtPalette; t: number; seed: number }) {
  const color = p.motif;
  switch (motif) {
    case "kitap":
      return (
        <g>
          <path d="M0 -50 C -30 -66, -76 -66, -96 -52 L-96 56 C -76 44, -30 44, 0 62 Z" fill="#fff" />
          <path d="M0 -50 C 30 -66, 76 -66, 96 -52 L96 56 C 76 44, 30 44, 0 62 Z" fill="#fff" opacity={0.9} />
          <path d="M-84 -30 C -56 -38, -30 -34, -10 -24 M-84 -6 C -56 -14, -30 -10, -10 0 M-84 18 C -56 10, -30 14, -10 24" stroke={color} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.7} />
          <path d="M84 -30 C 56 -38 30 -34 10 -24 M84 -6 C 56 -14 30 -10 10 0" stroke={color} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.7} />
          <rect x="-4" y="-50" width="8" height="112" rx="4" fill={color} />
          <Star x={0} y={-96 - Math.sin(t * Math.PI * 4) * 6} r={14} fill={color} />
        </g>
      );
    case "ekmek":
      return (
        <g>
          <ellipse cx="0" cy="12" rx="92" ry="52" fill="#e9a55a" />
          <ellipse cx="0" cy="4" rx="82" ry="42" fill="#f4c27f" />
          {[-44, -10, 24].map((x) => (
            <path key={x} d={`M${x} -24 q 12 20 -2 40`} stroke="#d58a3c" strokeWidth={7} strokeLinecap="round" fill="none" />
          ))}
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${-30 + i * 30} ${-70 - ((t * 60 + i * 20) % 40)} q 10 -12 0 -24`} stroke="#fff" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.7 - ((t * 60 + i * 20) % 40) / 80} />
          ))}
        </g>
      );
    case "cicek":
      return (
        <g>
          <rect x="-5" y="10" width="10" height="84" rx="5" fill="#4aa876" />
          <path d="M5 62 q 40 -22 56 -2 q -34 22 -56 2 Z" fill="#6fc79a" />
          {Array.from({ length: 6 }, (_, i) => (
            <ellipse key={i} cx="0" cy="-42" rx="19" ry="38" fill={i % 2 ? color : "#fff"} opacity={0.95} transform={`rotate(${i * 60 + Math.sin(t * Math.PI * 2) * 4} 0 -4)`} />
          ))}
          <circle cx="0" cy="-4" r="20" fill="#ffd966" />
        </g>
      );
    case "dalga":
      return (
        <g>
          <circle cx="0" cy="-34" r="34" fill="#fff6dd" opacity={0.9} />
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M-110 ${10 + i * 34} q 28 -${24 + Math.sin(t * Math.PI * 2 + i) * 6} 55 0 t 55 0 t 55 0 t 55 0`}
              stroke={i === 0 ? "#fff" : color}
              strokeWidth={14}
              strokeLinecap="round"
              fill="none"
              opacity={1 - i * 0.22}
              transform={`translate(${Math.sin(t * Math.PI * 2 + i) * 10} 0)`}
            />
          ))}
        </g>
      );
    case "kedi":
      return (
        <g>
          <path d="M-62 -34 L-52 -92 L-16 -56 Z M62 -34 L52 -92 L16 -56 Z" fill={color} />
          <ellipse cx="0" cy="-8" rx="74" ry="64" fill={color} />
          <ellipse cx="0" cy="12" rx="40" ry="30" fill="#fff" opacity={0.35} />
          <ellipse cx="-28" cy="-12" rx="9" ry={Math.abs(Math.sin(t * Math.PI * 3)) > 0.97 ? 1.5 : 12} fill="#2e2433" />
          <ellipse cx="28" cy="-12" rx="9" ry={Math.abs(Math.sin(t * Math.PI * 3)) > 0.97 ? 1.5 : 12} fill="#2e2433" />
          <path d="M-10 8 h20 l-10 10 Z" fill="#fff" />
          <path d="M-14 24 q 14 12 28 0" stroke="#2e2433" strokeWidth={4} strokeLinecap="round" fill="none" />
          <path d="M-70 4 h-40 M-68 20 l-38 10 M70 4 h40 M68 20 l38 10" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
        </g>
      );
    case "gunes":
      return (
        <g>
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x="-6" y="-112" width="12" height="32" rx="6" fill="#fff" opacity={0.9} transform={`rotate(${i * 30 + t * 40})`} />
          ))}
          <circle r="62" fill="#ffd966" />
          <circle cx="-18" cy="-18" r="16" fill="#fff" opacity={0.45} />
        </g>
      );
    case "damla":
      return (
        <g>
          <path d="M0 -92 C 44 -34, 62 -6, 62 24 A 62 62 0 0 1 -62 24 C -62 -6, -44 -34, 0 -92 Z" fill="#fff" opacity={0.95} />
          <path d="M0 -92 C 44 -34, 62 -6, 62 24 A 62 62 0 0 1 -62 24 C -62 -6, -44 -34, 0 -92 Z" fill={color} opacity={0.35} />
          <ellipse cx="-24" cy="12" rx="9" ry="18" fill="#fff" opacity={0.7} transform="rotate(20 -24 12)" />
          <ellipse cx="0" cy="92" rx={30 + (t * 60) % 24} ry={8 + ((t * 60) % 24) / 4} fill="none" stroke="#fff" strokeWidth={4} opacity={0.8 - ((t * 60) % 24) / 40} />
        </g>
      );
    default:
      return <Motif motif={motif} color={color} light={p.hills[0]} seed={seed} uid={`s${seed}`} />;
  }
}

/** Sahnenin arka planı: gökyüzü, güneş, kayan bulutlar, tepeler. 390×844 koordinatları. */
export function SceneBackdrop({ p, t, seed, zoom }: { p: ArtPalette; t: number; seed: number; zoom: number }) {
  const r = (n: number) => ((seed * 9301 + n * 49297) % 233280) / 233280;
  const sunX = r(1) < 0.5 ? 70 + r(3) * 40 : 280 + r(3) * 40;
  const drift = (speed: number) => ((t * speed) % 1) * 460 - 70;
  return (
    <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="1" stopColor={p.sky[1]} />
        </linearGradient>
        <radialGradient id="scene-glow">
          <stop offset="0" stopColor={p.sun} stopOpacity="0.95" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={`translate(195 422) scale(${zoom}) translate(-195 -422)`}>
        <rect x="-60" y="-60" width="510" height="964" fill="url(#scene-sky)" />
        <circle cx={sunX} cy={250} r={120} fill="url(#scene-glow)" />
        <circle cx={sunX} cy={250} r={36} fill={p.sun} />
        <Cloud x={drift(1) - 40} y={150} s={0.9} />
        <Cloud x={((drift(0.6) + 200) % 460) - 80} y={300} s={0.7} o={0.75} />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={30 + r(10 + i) * 330} cy={110 + r(20 + i) * 330} r={2 + r(30 + i) * 2.5} fill="#fff" opacity={0.5 + 0.4 * Math.sin(t * Math.PI * 6 + i)} />
        ))}
        <path d="M-20 620 C 90 570, 210 595, 410 545 L410 904 L-20 904 Z" fill={p.hills[0]} />
        <path d="M-20 700 C 130 650, 250 722, 410 665 L410 904 L-20 904 Z" fill={p.hills[1]} />
      </g>
    </svg>
  );
}
