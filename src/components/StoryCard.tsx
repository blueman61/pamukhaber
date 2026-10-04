"use client";

import { useCallback, useState } from "react";
import { getCategory } from "@/lib/categories";
import { isEmbedType, PLATFORM_LABELS } from "@/lib/media";
import type { FeedStory } from "@/lib/stories";
import { DotIcon, ExternalIcon, HeartIcon, ShareIcon, VolumeIcon } from "./icons";
import { StoryInfoSheet } from "./StoryInfoSheet";
import { StoryMedia } from "./StoryMedia";

type Props = {
  story: FeedStory;
  active: boolean;
  liked: boolean;
  muted: boolean;
  onLike: (story: FeedStory, like: boolean) => void;
  onToggleMute: () => void;
  onToast: (message: string) => void;
};

export function StoryCard({ story, active, liked, muted, onLike, onToggleMute, onToast }: Props) {
  const [burst, setBurst] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const closeInfo = useCallback(() => setInfoOpen(false), []);
  const category = getCategory(story.category);
  const isVideo = story.mediaType === "video";
  const outbound = story.isSponsored ? story.sponsorUrl : story.sourceUrl;

  async function share() {
    const url = `${window.location.origin}/h/${story.slug}`;
    const data = { title: story.title, text: `${story.title} — Pamuk Haber`, url };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      onToast("Bağlantı kopyalandı 💌");
    } catch {
      // Kullanıcı paylaşımı iptal etti.
    }
  }

  function doubleTapLike() {
    setBurst((b) => b + 1);
    if (!liked) onLike(story, true);
  }

  return (
    <article className="relative h-full w-full overflow-hidden bg-neutral-900 select-none" onDoubleClick={doubleTapLike}>
      <StoryMedia story={story} active={active} muted={muted} />

      {burst > 0 && (
        <div key={burst} className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <HeartIcon filled className="animate-pop h-28 w-28 text-pink-400 opacity-90 drop-shadow-xl" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
            {story.isSponsored ? (
              <span className="rounded-full bg-amber-300/95 px-2.5 py-1 text-amber-950">
                Sponsorlu{story.sponsorName ? ` · ${story.sponsorName}` : ""}
              </span>
            ) : (
              <span className="rounded-full bg-white/25 px-2.5 py-1 backdrop-blur-md">
                {category.emoji} {category.label}
              </span>
            )}
            {isEmbedType(story.mediaType) && (
              <span className="rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-md">▶ {PLATFORM_LABELS[story.mediaType]}</span>
            )}
            {story.isDemo && (
              <span className="rounded-full bg-sky-200/90 px-2.5 py-1 text-sky-950">Örnek içerik</span>
            )}
          </div>
          <h2 className="text-shadow-soft text-2xl leading-tight font-extrabold text-balance">{story.title}</h2>
          <p className="text-shadow-soft mt-2 text-[15px] leading-snug text-white/90">{story.summary}</p>
          <div className="mt-3 space-y-0.5 text-xs text-white/70">
            {outbound && (
              <a
                href={outbound}
                target="_blank"
                rel={story.isSponsored ? "sponsored noopener" : "noopener"}
                className="inline-flex items-center gap-1 font-semibold text-white/90 underline-offset-2 hover:underline"
              >
                {story.isSponsored ? "Daha fazlası" : `Kaynak: ${story.sourceName || new URL(outbound).hostname}`}
                <ExternalIcon className="h-3.5 w-3.5" />
              </a>
            )}
            {story.mediaCredit && <p>Görsel: {story.mediaCredit}</p>}
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 pb-1">
          <button
            type="button"
            onClick={() => onLike(story, !liked)}
            aria-pressed={liked}
            aria-label={liked ? "Beğeniyi geri al" : "Beğen"}
            className="flex flex-col items-center gap-1 text-xs font-semibold"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <HeartIcon filled={liked} className={`h-7 w-7 ${liked ? "animate-pop text-pink-400" : ""}`} />
            </span>
            {story.likes > 0 ? story.likes : ""}
          </button>
          <button type="button" onClick={share} aria-label="Paylaş" className="flex flex-col items-center gap-1 text-xs font-semibold">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <ShareIcon className="h-6 w-6" />
            </span>
            Paylaş
          </button>
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            aria-label="Haber bilgisi ve bildirim"
            aria-haspopup="dialog"
            className="flex flex-col items-center gap-1 text-xs font-semibold"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <DotIcon className="h-7 w-7" />
            </span>
            Bilgi
          </button>
          {isVideo && (
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "Sesi aç" : "Sesi kapat"}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md"
            >
              <VolumeIcon filled={!muted} className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
      {infoOpen && <StoryInfoSheet story={story} onClose={closeInfo} />}
    </article>
  );
}
