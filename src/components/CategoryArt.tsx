import { useId } from "react";
import { getCategory, type ArtPalette, type CategorySlug } from "@/lib/categories";

export type ArtMotif = CategorySlug | "mail" | "moon";

const SPECIAL: Record<"mail" | "moon", ArtPalette> = {
  mail: { sky: ["#ffe6f0", "#dbe9ff"], sun: "#fff6fb", hills: ["#f9c3da", "#b9d5ff"], motif: "#e2508f" },
  moon: { sky: ["#e7dcff", "#ffd6c9"], sun: "#fff4e0", hills: ["#cdb8ff", "#b49bf0"], motif: "#8a63dd" },
};

type Props = {
  motif: ArtMotif;
  /** Aynı kategorideki kartlar birbirinin kopyası olmasın diye küçük varyasyon. */
  seed?: number;
  /** Motif dikeyde nerede dursun (0–1, ekran yüksekliğine göre). */
  focusY?: number;
  className?: string;
};

/** Pamuk Bulut illüstrasyonu: pastel gökyüzü, güneş, süzülen bulutlar, tepeler ve kategori motifi. */
export function CategoryArt({ motif, seed = 0, focusY = 0.4, className = "absolute inset-0 h-full w-full" }: Props) {
  const uid = useId().replace(/:/g, "");
  const p = motif === "mail" || motif === "moon" ? SPECIAL[motif] : getCategory(motif).art;
  const r = (n: number) => ((seed * 9301 + n * 49297) % 233280) / 233280; // deterministik "rastgele"
  // Güneş, motifin hâlesiyle çakışmasın diye bir yana yaslanır.
  const sunX = r(1) < 0.5 ? 56 + r(3) * 40 : 294 + r(3) * 40;
  const sunY = 236 + r(4) * 30;
  const cloudShift = (r(2) - 0.5) * 60;
  const cy = 844 * focusY;

  return (
    <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="1" stopColor={p.sky[1]} />
        </linearGradient>
        <radialGradient id={`glow-${uid}`}>
          <stop offset="0" stopColor={p.sun} stopOpacity="0.95" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="390" height="844" fill={`url(#sky-${uid})`} />
      <circle cx={sunX} cy={sunY} r={120} fill={`url(#glow-${uid})`} />
      <circle cx={sunX} cy={sunY} r={36} fill={p.sun} />

      <g className="animate-drift">
        <Cloud x={40 + cloudShift} y={225} s={1.1} />
        <Cloud x={250 - cloudShift} y={115} s={0.8} o={0.75} />
      </g>
      <g className="animate-drift-slow">
        <Cloud x={280 + cloudShift / 2} y={280} s={0.65} o={0.7} />
      </g>

      {/* Parıltılar */}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={30 + r(10 + i) * 330} cy={120 + r(20 + i) * 380} r={2 + r(30 + i) * 2.5} fill="#fff" opacity={0.8} />
      ))}

      {/* Motif ve hâlesi */}
      <g transform={`translate(195 ${cy})`}>
        <circle r={118} fill="#fff" opacity={0.32} />
        <circle r={86} fill="#fff" opacity={0.42} />
        <g className="animate-float">
          <Motif motif={motif} color={p.motif} light={p.hills[0]} seed={seed} uid={uid} />
        </g>
      </g>

      {/* Tepeler */}
      <path d="M0 610 C 90 560, 210 585, 390 535 L390 844 L0 844 Z" fill={p.hills[0]} />
      <path d="M0 690 C 130 640, 250 712, 390 655 L390 844 L0 844 Z" fill={p.hills[1]} />
      <g className="animate-drift-slow" opacity={0.85}>
        <Cloud x={-20} y={600} s={1.3} />
        <Cloud x={270} y={630} s={1.1} />
      </g>

      {/* Karanlık modda gece tonu */}
      <rect width="390" height="844" fill="#1c1622" className="opacity-0 dark:opacity-30" />
    </svg>
  );
}

export function Cloud({ x, y, s = 1, o = 0.92 }: { x: number; y: number; s?: number; o?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity={o}>
      <circle cx="22" cy="12" r="20" />
      <circle cx="52" cy="0" r="28" />
      <circle cx="84" cy="12" r="20" />
      <rect x="2" y="12" width="102" height="22" rx="11" />
    </g>
  );
}

const HEART = "M0 42 C -64 2, -54 -56, 0 -24 C 54 -56, 64 2, 0 42 Z";

export function Motif({ motif, color, light, seed, uid }: { motif: ArtMotif; color: string; light: string; seed: number; uid: string }) {
  switch (motif) {
    case "hayvanlar":
      return (
        <g fill={color}>
          <Paw />
          <g transform="translate(62 -64) rotate(24) scale(0.42)" opacity={0.55}>
            <Paw />
          </g>
          <g transform="translate(-66 58) rotate(-18) scale(0.32)" opacity={0.45}>
            <Paw />
          </g>
        </g>
      );
    case "sevgi":
      return (
        <g>
          <path d={HEART} transform="scale(1.25)" fill={color} />
          <path d={HEART} transform="translate(-62 -58) scale(0.3)" fill={color} opacity={0.6} />
          <path d={HEART} transform="translate(66 -36) scale(0.22)" fill={color} opacity={0.5} />
          <ellipse cx="-22" cy="-22" rx="12" ry="8" fill="#fff" opacity={0.55} transform="rotate(-30 -22 -22)" />
        </g>
      );
    case "iyilik":
      // Hediye kutusu: vermenin, paylaşmanın simgesi.
      return (
        <g>
          <rect x="-58" y="-14" width="116" height="78" rx="14" fill={color} />
          <rect x="-66" y="-38" width="132" height="30" rx="12" fill={color} />
          <rect x="-66" y="-38" width="132" height="30" rx="12" fill="#fff" opacity={0.18} />
          <rect x="-10" y="-38" width="20" height="102" fill="#fff" opacity={0.9} />
          <path d="M0 -40 C -18 -78, -62 -66, -36 -44 C -26 -38, -10 -38, 0 -40 Z" fill="#fff" opacity={0.95} />
          <path d="M0 -40 C 18 -78, 62 -66, 36 -44 C 26 -38, 10 -38, 0 -40 Z" fill="#fff" opacity={0.95} />
          <Star x={-78} y={-70} r={10} fill="#fff" />
          <Star x={80} y={-20} r={7} fill="#fff" />
          <Star x={-84} y={40} r={6} fill="#fff" opacity={0.8} />
        </g>
      );
    case "bilim":
      return (
        <g fill="none" stroke={color} strokeWidth={7} strokeLinecap="round">
          <ellipse rx="74" ry="26" />
          <ellipse rx="74" ry="26" transform="rotate(60)" />
          <ellipse rx="74" ry="26" transform="rotate(120)" />
          <circle r="13" fill={color} stroke="none" />
          <circle cx="74" cy="0" r="7" fill="#fff" stroke="none" />
          <circle cx="-37" cy="-64" r="7" fill="#fff" stroke="none" />
          <Star x={70} y={-70} r={9} fill="#fff" />
        </g>
      );
    case "doga":
      return (
        <g>
          <rect x="-9" y="8" width="18" height="70" rx="8" fill="#b07c58" />
          <circle cx="0" cy="-26" r="50" fill={color} />
          <circle cx="-40" cy="0" r="34" fill={color} />
          <circle cx="40" cy="0" r="34" fill={color} />
          <circle cx="-16" cy="-44" r="14" fill="#fff" opacity={0.3} />
          <path d="M60 50 q 18 -22 34 -6 q -18 22 -34 6 Z" fill={light} />
        </g>
      );
    case "saglik":
      // Tıbbi artı + nabız çizgisi.
      return (
        <g>
          <rect x="-26" y="-74" width="52" height="148" rx="18" fill={color} />
          <rect x="-74" y="-26" width="148" height="52" rx="18" fill={color} />
          <path
            d="M-64 0 H-28 L-16 -24 L2 26 L16 -10 L26 0 H64"
            fill="none"
            stroke="#fff"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="-40" cy="-52" r="9" fill="#fff" opacity={0.4} />
        </g>
      );
    case "basari":
      return (
        <g>
          <Star x={0} y={0} r={66} fill={color} />
          <Star x={0} y={0} r={30} fill="#fff" opacity={0.35} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2 + seed;
            return (
              <rect
                key={i}
                x={Math.cos(a) * 92 - 5}
                y={Math.sin(a) * 92 - 3}
                width="10"
                height="6"
                rx="2"
                fill={i % 2 ? color : "#fff"}
                transform={`rotate(${i * 37} ${Math.cos(a) * 92} ${Math.sin(a) * 92})`}
              />
            );
          })}
        </g>
      );
    case "topluluk":
      return (
        <g>
          <path d="M-90 -58 Q 0 -30 90 -58" stroke={color} strokeWidth={3} fill="none" />
          {[-60, -30, 0, 30, 60].map((x, i) => (
            <path key={x} d={`M${x - 7} ${-50 + Math.abs(x) / 6} l7 14 l7 -14 Z`} fill={i % 2 ? "#fff" : color} />
          ))}
          <House x={-58} y={30} s={0.75} color={light} roof={color} />
          <House x={58} y={30} s={0.75} color={light} roof={color} />
          <House x={0} y={22} s={1} color="#fff" roof={color} />
        </g>
      );
    case "mail":
      return (
        <g>
          <rect x="-72" y="-48" width="144" height="98" rx="16" fill="#fff" />
          <path d="M-72 -38 L0 14 L72 -38" fill="none" stroke={color} strokeWidth={6} strokeLinejoin="round" />
          <path d={HEART} transform="translate(0 18) scale(0.36)" fill={color} />
          <path d={HEART} transform="translate(70 -66) scale(0.22)" fill={color} opacity={0.6} />
        </g>
      );
    case "moon":
      return (
        <g>
          <mask id={`moon-${uid}`}>
            <circle r="60" fill="#fff" />
            <circle cx="30" cy="-20" r="52" fill="#000" />
          </mask>
          <circle r="60" fill="#fff6dd" mask={`url(#moon-${uid})`} />
          <Star x={-70} y={-50} r={10} fill="#fff" />
          <Star x={74} y={46} r={7} fill="#fff" />
          <Star x={-50} y={66} r={6} fill="#fff" />
        </g>
      );
  }
}

function Paw() {
  return (
    <g>
      <ellipse cx="0" cy="22" rx="36" ry="30" />
      <ellipse cx="-42" cy="-16" rx="14" ry="19" transform="rotate(-22 -42 -16)" />
      <ellipse cx="-16" cy="-42" rx="14" ry="19" transform="rotate(-6 -16 -42)" />
      <ellipse cx="16" cy="-42" rx="14" ry="19" transform="rotate(6 16 -42)" />
      <ellipse cx="42" cy="-16" rx="14" ry="19" transform="rotate(22 42 -16)" />
    </g>
  );
}

export function Star({ x, y, r, fill, opacity }: { x: number; y: number; r: number; fill: string; opacity?: number }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    return `${(x + Math.cos(a) * rad).toFixed(1)},${(y + Math.sin(a) * rad).toFixed(1)}`;
  }).join(" ");
  return <polygon points={pts} fill={fill} opacity={opacity} strokeLinejoin="round" />;
}

function House({ x, y, s, color, roof }: { x: number; y: number; s: number; color: string; roof: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-34" y="-20" width="68" height="62" rx="8" fill={color} />
      <path d="M-44 -16 L0 -56 L44 -16 Z" fill={roof} strokeLinejoin="round" />
      <rect x="-10" y="12" width="20" height="30" rx="6" fill={roof} opacity={0.85} />
      <rect x="-26" y="-6" width="12" height="12" rx="3" fill={roof} opacity={0.5} />
      <rect x="14" y="-6" width="12" height="12" rx="3" fill={roof} opacity={0.5} />
    </g>
  );
}
