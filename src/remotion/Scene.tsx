import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { getCategory, isCategory } from "@/lib/categories";
import { paletteFor, SceneBackdrop, SceneMotif } from "./illustrations";
import type { SceneData } from "./scene-data";

const FONT = '"Nunito Variable", Nunito, ui-rounded, system-ui, sans-serif';
const SIDE = 170; // 9:16 kompozisyon telefonda yanlardan ~95 px kırpılır
const TOP = 270; // uygulamanın üst çubuğunun altı
const INTRO = 48; // başlık girişi (kare)
const OUTRO = 50; // son 1,7 sn: kaynak ve mühür

/** Beat sınırlarını metin uzunluğuna göre orantılı dağıtır. */
function beatWindows(beats: string[], duration: number) {
  const start = INTRO;
  const end = duration - 24;
  const total = beats.reduce((n, b) => n + b.length + 20, 0) || 1;
  let cursor = start;
  return beats.map((b) => {
    const len = ((b.length + 20) / total) * (end - start);
    const win = { from: cursor, to: cursor + len };
    cursor += len;
    return win;
  });
}

export function Scene({ title, beats, motifs, category, categories, sourceName, seed, durationInFrames }: SceneData) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = paletteFor(category);
  const t = frame / fps;
  const windows = beatWindows(beats, durationInFrames);

  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.12]);
  const words = title.split(/\s+/);
  const cats = categories.filter(isCategory).slice(0, 3).map(getCategory);

  const outroIn = interpolate(frame, [durationInFrames - OUTRO, durationInFrames - OUTRO + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#2e2433", background: p.sky[0], overflow: "hidden" }}>
      <AbsoluteFill>
        <SceneBackdrop p={p} t={t} seed={seed} zoom={zoom} />
      </AbsoluteFill>

      {/* İlerleme çubuğu */}
      <div style={{ position: "absolute", left: SIDE, right: SIDE, top: TOP, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.55)" }}>
        <div style={{ width: `${(frame / durationInFrames) * 100}%`, height: "100%", borderRadius: 4, background: getCategoryColor(category) }} />
      </div>

      {/* Kategori çipleri */}
      <div style={{ position: "absolute", left: SIDE, right: SIDE, top: TOP + 44, display: "flex", gap: 14, flexWrap: "wrap" }}>
        {cats.map((c, i) => {
          const s = spring({ frame: frame - 4 - i * 4, fps, config: { damping: 14 } });
          return (
            <div
              key={c.slug}
              style={{
                transform: `scale(${s})`,
                opacity: s,
                background: "rgba(255,255,255,0.88)",
                borderRadius: 999,
                padding: "10px 26px",
                fontSize: 34,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ width: 18, height: 18, borderRadius: 9, background: c.color }} />
              {c.label}
            </div>
          );
        })}
      </div>

      {/* Başlık: kelime kelime yay animasyonu */}
      <div
        style={{
          position: "absolute",
          left: SIDE,
          right: SIDE,
          top: TOP + 150,
          fontSize: words.length > 9 ? 66 : 76,
          lineHeight: 1.08,
          fontWeight: 900,
          letterSpacing: -1.5,
          display: "flex",
          flexWrap: "wrap",
          gap: "0 20px",
          textShadow: "0 2px 0 rgba(255,255,255,0.7)",
        }}
      >
        {words.map((w, i) => {
          const s = spring({ frame: frame - 8 - i * 4, fps, config: { damping: 13, stiffness: 140 } });
          return (
            <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - s) * 50}px)`, opacity: s }}>
              {w}
            </span>
          );
        })}
      </div>

      {/* Motif (beat başına çapraz geçiş) */}
      {motifs.map((m, i) => {
        const from = windows[i]?.from ?? 0;
        const to = windows[i]?.to ?? durationInFrames;
        const isLast = i === motifs.length - 1;
        const fadeIn = interpolate(frame, [from - 6, from + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const fadeOut = isLast ? 1 : interpolate(frame, [to - 4, to + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const opacity = i === 0 ? Math.min(1, interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" })) * fadeOut : fadeIn * fadeOut;
        if (opacity <= 0.01) return null;
        const pop = spring({ frame: frame - Math.max(0, from), fps, config: { damping: 11, stiffness: 120 } });
        const bob = Math.sin(t * 2.2 + i) * 14;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 690,
              display: "flex",
              justifyContent: "center",
              opacity,
              transform: `translateY(${bob}px) scale(${0.7 + 0.3 * pop})`,
            }}
          >
            <svg width={500} height={500} viewBox="-150 -150 300 300" aria-hidden>
              <circle r={138} fill="#fff" opacity={0.3} />
              <circle r={104} fill="#fff" opacity={0.4} />
              <SceneMotif motif={m} p={p} t={t / 4} seed={seed} />
            </svg>
          </div>
        );
      })}

      {/* Özet parçaları */}
      {beats.map((b, i) => {
        const w = windows[i];
        const isLast = i === beats.length - 1;
        const inP = spring({ frame: frame - w.from, fps, config: { damping: 16 } });
        const out = isLast ? 1 : interpolate(frame, [w.to - 6, w.to + 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        if (frame < w.from - 1 || (!isLast && frame > w.to + 2)) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: SIDE - 40,
              right: SIDE - 40,
              bottom: 480,
              padding: "38px 46px",
              borderRadius: 56,
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0 24px 60px rgba(46,36,51,0.18)",
              fontSize: 46,
              lineHeight: 1.28,
              fontWeight: 700,
              opacity: inP * out,
              transform: `translateY(${(1 - inP) * 60}px)`,
            }}
          >
            {b}
          </div>
        );
      })}

      {/* Kaynak ve mühür */}
      <div
        style={{
          position: "absolute",
          left: SIDE,
          right: SIDE,
          bottom: 130,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: outroIn,
          fontSize: 38,
          fontWeight: 800,
        }}
      >
        <span style={{ color: "rgba(46,36,51,0.7)" }}>{sourceName ? `Kaynak · ${sourceName}` : ""}</span>
        <span>
          pamuk<span style={{ color: "#e2508f" }}>haber</span>
        </span>
      </div>
    </AbsoluteFill>
  );
}

function getCategoryColor(category: string) {
  return isCategory(category) ? getCategory(category).color : "#e2508f";
}
