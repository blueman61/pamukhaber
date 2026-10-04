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

  const hasMedia = story.mediaType !== "none";
  const sourceLabel = story.isSponsored ? "Daha fazlası" : `Kaynak · ${story.sourceName || hostOf(outbound)}`;
  const chipTone = hasMedia ? "bg-white/15 text-white" : "bg-white/85 text-ink shadow-sm dark:bg-white/10 dark:text-foreground";

  return (
    <article
      data-active={active}
      className="group relative h-full w-full overflow-hidden bg-background select-none"
      onDoubleClick={doubleTapLike}
    >
      <StoryMedia story={story} active={active} muted={muted} />

      {burst > 0 && (
        <div key={burst} className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <HeartIcon filled className="animate-burst h-32 w-32 text-accent-2 drop-shadow-[0_10px_30px_rgba(226,80,143,0.55)]" />
        </div>
      )}

      {hasMedia && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-end gap-3 px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        <div className={`${hasMedia ? "glass-dark" : "glass"} flex flex-col items-center gap-1 rounded-full p-1.5 shadow-float`}>
          <RailButton
            label={liked ? "Beğeniyi geri al" : "Beğen"}
            caption={story.likes > 0 ? String(story.likes) : "Beğen"}
            pressed={liked}
            onClick={() => onLike(story, !liked)}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                liked ? "bg-gradient-to-br from-accent to-accent-2 text-white shadow-soft" : ""
              }`}
            >
              <HeartIcon filled={liked} className={`h-6 w-6 ${liked ? "animate-pop" : ""}`} />
            </span>
          </RailButton>
          <RailButton label="Paylaş" caption="Paylaş" onClick={share}>
            <span className="flex h-11 w-11 items-center justify-center">
              <ShareIcon className="h-6 w-6" />
            </span>
          </RailButton>
          <RailButton label="Haber bilgisi ve bildirim" caption="Bilgi" onClick={() => setInfoOpen(true)} dialog>
            <span className="flex h-11 w-11 items-center justify-center">
              <DotIcon className="h-[26px] w-[26px]" />
            </span>
          </RailButton>
          {isVideo && (
            <RailButton label={muted ? "Sesi aç" : "Sesi kapat"} onClick={onToggleMute}>
              <span className="flex h-11 w-11 items-center justify-center">
                <VolumeIcon filled={!muted} className="h-6 w-6" />
              </span>
            </RailButton>
          )}
        </div>

        <section
          className={`reveal w-full translate-y-3 rounded-[30px] p-5 opacity-0 shadow-float transition duration-500 ease-out group-data-[active=true]:translate-y-0 group-data-[active=true]:opacity-100 ${
            hasMedia ? "glass-dark" : "glass"
          }`}
        >
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {story.isSponsored ? (
              <span className="chip bg-butter text-[#6b4a00]">
                Sponsorlu{story.sponsorName ? ` · ${story.sponsorName}` : ""}
              </span>
            ) : (
              <span className={`chip ${chipTone}`}>
                <span className="h-2 w-2 rounded-full" style={{ background: category.color }} aria-hidden />
                {category.label}
              </span>
            )}
            {isEmbedType(story.mediaType) && <span className={`chip ${chipTone}`}>▶ {PLATFORM_LABELS[story.mediaType]}</span>}
            {story.isDemo && <span className="chip bg-sky-soft/90 text-[#123a5c]">Örnek içerik</span>}
          </div>
          <h2 className="display text-[26px] text-balance">{story.title}</h2>
          <p className={`mt-2 text-[15.5px] leading-relaxed ${hasMedia ? "text-white/85" : "text-ink/80 dark:text-foreground/80"}`}>
            {story.summary}
          </p>
          {(outbound || story.mediaCredit) && (
            <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
              {outbound && (
                <a
                  href={outbound}
                  target="_blank"
                  rel={story.isSponsored ? "sponsored noopener" : "noopener"}
                  className={`chip max-w-full ${chipTone} hover:opacity-90`}
                >
                  <ExternalIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{sourceLabel}</span>
                </a>
              )}
              {story.mediaCredit && (
                <span className={hasMedia ? "text-white/65" : "text-muted"}>Görsel: {story.mediaCredit}</span>
              )}
            </div>
          )}
        </section>
      </div>
      {infoOpen && <StoryInfoSheet story={story} onClose={closeInfo} />}
    </article>
  );
}

function hostOf(url: string | null) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function RailButton({
  label,
  caption,
  pressed,
  dialog,
  onClick,
  children,
}: {
  label: string;
  caption?: string;
  pressed?: boolean;
  dialog?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      aria-haspopup={dialog ? "dialog" : undefined}
      className="flex w-14 flex-col items-center rounded-full pb-1 transition active:scale-90"
    >
      {children}
      {caption && <span className="-mt-0.5 text-[10.5px] leading-none font-extrabold">{caption}</span>}
    </button>
  );
}
