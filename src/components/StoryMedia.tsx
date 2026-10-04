"use client";

import { useEffect, useRef, useState } from "react";
import { getCategory } from "@/lib/categories";
import { embedSrc, isEmbedType, PLATFORM_LABELS, youtubeId, youtubeThumbnail, type EmbedType } from "@/lib/media";
import type { FeedStory } from "@/lib/stories";

type Props = { story: FeedStory; active: boolean; muted: boolean };

/** Kartın tam ekran arka planı: görsel, video, gömülü platform videosu ya da pastel degrade. */
export function StoryMedia({ story, active, muted }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

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
      return <Embed key={String(active)} type={story.mediaType} src={src} story={story} active={active} />;
    }
  }

  if (story.mediaType === "image" && story.mediaUrl) {
    return (
      <>
        {/* Dikey olmayan görselleri bulanık bir zeminle doldur. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={story.mediaUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.mediaUrl}
          alt={story.title}
          className="absolute inset-0 h-full w-full object-contain sm:object-cover"
          loading={active ? "eager" : "lazy"}
        />
      </>
    );
  }

  return <PastelBackground category={story.category} />;
}

function PastelBackground({ category, label }: { category: string; label?: string }) {
  const c = getCategory(category);
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient}`}>
      <div className="absolute inset-x-0 top-[22%] flex flex-col items-center gap-4">
        <span className="animate-float text-[7.5rem] drop-shadow-lg" aria-hidden>
          {label ? "▶️" : c.emoji}
        </span>
        {label && <span className="rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-[#3b2f3a]">{label}</span>}
      </div>
      <div className="absolute -left-10 top-1/2 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
      <div className="absolute -right-8 top-[15%] h-32 w-32 rounded-full bg-white/50 blur-2xl" />
    </div>
  );
}

/**
 * Platform oynatıcısı (YouTube / TikTok / Instagram). Tam ekran iframe dokunmaları
 * yuttuğu için üstünde şeffaf bir katman durur: kaydırma akışa gider. "Oynatıcıyı kullan"
 * ile katman kalkar, "Kaydırmaya dön" ile geri gelir.
 */
function Embed({ type, src, story, active }: { type: EmbedType; src: string; story: FeedStory; active: boolean }) {
  const [interactive, setInteractive] = useState(false);
  const label = PLATFORM_LABELS[type];

  if (!active) {
    const ytId = type === "youtube" && story.mediaUrl ? youtubeId(story.mediaUrl) : null;
    return ytId ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={youtubeThumbnail(ytId)} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
    ) : (
      <PastelBackground category={story.category} label={`${label} videosu`} />
    );
  }

  const isInstagram = type === "instagram";
  return (
    <div className="absolute inset-0 bg-neutral-950">
      {isInstagram && <PastelBackground category={story.category} />}
      <iframe
        src={src}
        title={`${label}: ${story.title}`}
        data-embed={type}
        className={
          isInstagram
            ? "absolute inset-x-2 top-24 bottom-40 mx-auto h-auto w-[calc(100%-1rem)] max-w-[400px] rounded-2xl bg-white shadow-xl"
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
          className="absolute top-28 right-4 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#3b2f3a] shadow-lg"
        >
          ↕ Kaydırmaya dön
        </button>
      ) : (
        <div data-embed-shield className="absolute inset-0">
          <button
            type="button"
            onClick={() => setInteractive(true)}
            className="absolute top-28 right-4 rounded-full bg-black/45 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md"
          >
            {isInstagram ? "▶ Oynat" : "🎛 Oynatıcıyı kullan"}
          </button>
        </div>
      )}
    </div>
  );
}
