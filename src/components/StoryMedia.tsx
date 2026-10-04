"use client";

import { useEffect, useRef, useState } from "react";
import { isCategory } from "@/lib/categories";
import { CategoryArt } from "./CategoryArt";
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

  return <PastelBackground category={story.category} seed={story.id} />;
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
function Embed({ type, src, story, active }: { type: EmbedType; src: string; story: FeedStory; active: boolean }) {
  const [interactive, setInteractive] = useState(false);
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
