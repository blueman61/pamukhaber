"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildScene } from "@/remotion/scene-data";
import { useIsScene } from "./useScene";
import { isCategory } from "@/lib/categories";
import { CategoryArt } from "./CategoryArt";
import { audioMessage, embedOrigin } from "@/lib/embed-audio";
import { embedSrc, isEmbedType, PLATFORM_LABELS, youtubeId, youtubeThumbnail, type EmbedType } from "@/lib/media";
import type { FeedStory } from "@/lib/stories";

const StoryScene = dynamic(() => import("@/remotion/StoryScene"), { ssr: false });

type Props = { story: FeedStory; active: boolean; muted: boolean };

/** Kartın tam ekran arka planı: görsel, video, gömülü platform videosu ya da pastel degrade. */
export function StoryMedia({ story, active, muted }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isScene = useIsScene(story);
  const scene = useMemo(() => (isScene ? buildScene(story) : null), [isScene, story]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) video.play().catch(() => {});
    else video.pause();
  }, [active]);

  if (story.mediaType === "video" && story.mediaUrl) {
    return (
      <video
        ref={videoRef}
        src={story.mediaUrl}
        className="absolute inset-0 h-full w-full object-cover"
        muted={muted}
        loop
        playsInline
        preload={active ? "auto" : "metadata"}
      />
    );
  }

  if (isEmbedType(story.mediaType) && story.mediaUrl) {
    const src = embedSrc(story.mediaType, story.mediaUrl);
    if (src) {
      // Aktiflik değişince durum sıfırlansın diye yeniden bağlanır.
      return <Embed key={String(active)} type={story.mediaType} src={src} story={story} active={active} muted={muted} />;
    }
  }

  if (story.mediaType === "image" && story.mediaUrl) {
    return <ImageMedia story={story} active={active} />;
  }

  if (scene) {
    // Etkin olmayan kartlar illüstrasyon posterini gösterir; yalnızca etkin kart oynatıcıyı bağlar.
    return (
      <>
        <PastelBackground category={story.category} seed={story.id} />
        {active && <StoryScene key={story.id} scene={scene} />}
      </>
    );
  }

  return <PastelBackground category={story.category} seed={story.id} />;
}

/**
 * Görsel, metin panelinin üstündeki boş alana kırpılmadan sığar (panel yüksekliği --panel-h ile gelir).
 * Dokununca tam ekran görüntüleyici açılır; çift dokunma beğeni olarak kartta kalır.
 */
function ImageMedia({ story, active }: { story: FeedStory; active: boolean }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  function onTap(e: React.MouseEvent) {
    if (timer.current) clearTimeout(timer.current);
    if (e.detail > 1) return; // çift dokunma: beğeni
    timer.current = setTimeout(() => setOpen(true), 260);
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={story.mediaUrl!} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl" />
      <div className="absolute inset-0 bg-black/10" />
      <button
        type="button"
        data-image-open
        onClick={onTap}
        aria-label={`Görseli büyüt: ${story.title}`}
        className="absolute inset-x-0 top-[4.5rem] bottom-[var(--panel-h,42%)] cursor-zoom-in p-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.mediaUrl!}
          alt={story.title}
          className="h-full w-full rounded-2xl object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
          loading={active ? "eager" : "lazy"}
        />
      </button>
      {open && <ImageViewer src={story.mediaUrl!} alt={story.title} onClose={() => setOpen(false)} />}
    </>
  );
}

function ImageViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={alt} className="animate-fade fixed inset-0 z-50 flex flex-col bg-black/95">
      <button
        type="button"
        onClick={onClose}
        aria-label="Kapat"
        className="absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl font-black text-white"
      >
        ✕
      </button>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto [touch-action:pinch-zoom_pan-x_pan-y]" onClick={onClose}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
      </div>
    </div>
  );
}

function PastelBackground({ category, seed, label }: { category: string; seed: number; label?: string }) {
  const motif = isCategory(category) ? category : "iyilik";
  return (
    <>
      <CategoryArt motif={motif} seed={seed} focusY={0.42} />
      {label && (
        <div className="absolute inset-x-0 top-[50%] flex justify-center">
          <span className="glass chip px-4 py-2 text-sm shadow-soft">▶ {label}</span>
        </div>
      )}
    </>
  );
}

/**
 * Platform oynatıcısı (YouTube / TikTok / Instagram). Tam ekran iframe dokunmaları
 * yuttuğu için üstünde şeffaf bir katman durur: kaydırma akışa gider. "Oynatıcıyı kullan"
 * ile katman kalkar, "Kaydırmaya dön" ile geri gelir.
 */
function Embed({ type, src, story, active, muted }: { type: EmbedType; src: string; story: FeedStory; active: boolean; muted: boolean }) {
  const [interactive, setInteractive] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Ses: iframe sessiz başlar (otomatik oynatma şartı); okur sesi açınca komut gönderilir.
  // Oynatıcı hazır olmadan gelen komut kaybolabileceği için birkaç kez tekrarlanır.
  const sendAudio = useCallback(() => {
    const msg = audioMessage(type, muted);
    const win = frameRef.current?.contentWindow;
    if (msg && win) win.postMessage(msg, embedOrigin(src));
  }, [type, muted, src]);

  useEffect(() => {
    if (!active) return;
    sendAudio();
    const timers = [600, 1500, 3000].map((ms) => setTimeout(sendAudio, ms));
    return () => timers.forEach(clearTimeout);
  }, [active, sendAudio]);

  const label = PLATFORM_LABELS[type];

  if (!active) {
    const ytId = type === "youtube" && story.mediaUrl ? youtubeId(story.mediaUrl) : null;
    return ytId ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={youtubeThumbnail(ytId)} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
    ) : (
      <PastelBackground category={story.category} seed={story.id} label={`${label} videosu`} />
    );
  }

  const isInstagram = type === "instagram";
  return (
    <div className="absolute inset-0 bg-[#1c1622]">
      {isInstagram && <PastelBackground category={story.category} seed={story.id} />}
      <iframe
        ref={frameRef}
        onLoad={sendAudio}
        src={src}
        title={`${label}: ${story.title}`}
        data-embed={type}
        className={
          isInstagram
            ? "absolute inset-x-3 top-28 bottom-[36%] mx-auto h-auto w-[calc(100%-1.5rem)] max-w-[400px] rounded-[26px] bg-white shadow-float"
            : type === "youtube"
              ? "absolute inset-0 h-full w-full scale-[1.35]"
              : "absolute inset-0 h-full w-full"
        }
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="eager"
      />
      {interactive ? (
        <button
          type="button"
          onClick={() => setInteractive(false)}
          className="glass btn btn-sm absolute top-32 right-3 z-10 shadow-float"
        >
          ↕ Kaydırmaya dön
        </button>
      ) : (
        <div data-embed-shield className="absolute inset-0">
          <button
            type="button"
            onClick={() => setInteractive(true)}
            className="glass-dark btn btn-sm absolute top-32 right-3 shadow-float"
          >
            {isInstagram ? "▶ Oynat" : "🎛 Oynatıcıyı kullan"}
          </button>
        </div>
      )}
    </div>
  );
}
