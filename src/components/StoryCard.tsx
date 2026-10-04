"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCategory, isCategory } from "@/lib/categories";
import { isEmbedType, PLATFORM_LABELS } from "@/lib/media";
import type { FeedStory } from "@/lib/stories";
import { DotIcon, ExternalIcon, HeartIcon, ShareIcon, VolumeIcon } from "./icons";
import { StoryInfoSheet } from "./StoryInfoSheet";
import { StoryMedia } from "./StoryMedia";
import { useIsScene } from "./useScene";

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
  const articleRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeInfo = useCallback(() => setInfoOpen(false), []);
  const isScene = useIsScene(story);
  const category = getCategory(story.category);
  const isVideo = story.mediaType === "video";
  const outbound = story.isSponsored ? story.sponsorUrl : story.sourceUrl;

  // Görsel kartında görsel, panelin üstündeki alana sığsın diye panel yüksekliğini ölçer.
  useEffect(() => {
    // Son çocuk metin paneli; beğeni rayı görselin üstüne binebilir.
    const panel = panelRef.current?.lastElementChild as HTMLElement | null | undefined;
    const article = articleRef.current;
    if (!panel || !article || story.mediaType !== "image") return;
    const update = () => article.style.setProperty("--panel-h", `${panel.offsetHeight + 20}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [story.mediaType]);

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

  // Videolu kartlarda video ön planda: metin kısa bir tanıtımdan sonra küçülür, istenince açılır.
  const videoFirst = story.mediaType === "video" || isEmbedType(story.mediaType);
  const extraCategories = story.categories.filter((c) => c !== story.category && isCategory(c)).slice(0, 2).map(getCategory);

  const chips = (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      {story.isSponsored ? (
        <span className="chip bg-butter text-[#6b4a00]">Sponsorlu{story.sponsorName ? ` · ${story.sponsorName}` : ""}</span>
      ) : (
        [category, ...extraCategories].map((c) => (
          <span key={c.slug} className={`chip ${chipTone}`}>
            <span className="h-2 w-2 rounded-full" style={{ background: c.color }} aria-hidden />
            {c.label}
          </span>
        ))
      )}
      {isEmbedType(story.mediaType) && <span className={`chip ${chipTone}`}>▶ {PLATFORM_LABELS[story.mediaType]}</span>}
      {story.isDemo && <span className="chip bg-sky-soft/90 text-[#123a5c]">Örnek içerik</span>}
    </div>
  );

  const fullText = (
    <>
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
          {story.mediaCredit && <span className={hasMedia ? "text-white/65" : "text-muted"}>Görsel: {story.mediaCredit}</span>}
        </div>
      )}
    </>
  );

  return (
    <article
      ref={articleRef}
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
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent ${
            videoFirst ? "h-1/4 from-black/30" : "h-1/2 from-black/45"
          }`}
        />
      )}

      <div ref={panelRef} className="absolute inset-x-0 bottom-0 flex flex-col items-end gap-3 px-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
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

        {isScene ? (
          <SceneStrip chips={chips} story={story} outbound={outbound} sourceLabel={sourceLabel} chipTone={chipTone} />
        ) : videoFirst ? (
          <VideoCaption key={String(active)} active={active} chips={chips} title={story.title} accent={category.color}>
            {fullText}
          </VideoCaption>
        ) : (
          <section
            className={`reveal w-full translate-y-3 rounded-[30px] p-5 opacity-0 shadow-float transition duration-500 ease-out group-data-[active=true]:translate-y-0 group-data-[active=true]:opacity-100 ${
              hasMedia ? "glass-dark" : "glass"
            }`}
          >
            {chips}
            {fullText}
          </section>
        )}
      </div>
      {infoOpen && <StoryInfoSheet story={story} onClose={closeInfo} />}
    </article>
  );
}

/** Sahne kartının alt şeridi: metin sahnenin içinde olduğundan yalnızca kaynak bağlantısı kalır. */
function SceneStrip({
  story,
  outbound,
  sourceLabel,
  chipTone,
}: {
  chips: React.ReactNode;
  story: FeedStory;
  outbound: string | null;
  sourceLabel: string;
  chipTone: string;
}) {
  return (
    <>
      <div className="sr-only">
        <h2>{story.title}</h2>
        <p>{story.summary}</p>
      </div>
      {outbound && (
        <a
          href={outbound}
          target="_blank"
          rel="noopener"
          data-scene-source
          className={`glass chip max-w-[78%] self-start shadow-float ${chipTone} hover:opacity-90`}
        >
          <ExternalIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{sourceLabel}</span>
        </a>
      )}
    </>
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

const INTRO_MS = 4_000;

/**
 * Videolu kartın metni: önce birkaç saniye kategori + başlık, sonra küçük bir "Haberi oku" düğmesi.
 * Okur dokununca tam metin açılır; kart yeniden ekrana gelince (key ile) tanıtım baştan başlar.
 */
function VideoCaption({
  active,
  chips,
  title,
  accent,
  children,
}: {
  active: boolean;
  chips: React.ReactNode;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<"intro" | "mini" | "open">("intro");

  useEffect(() => {
    if (!active || mode !== "intro") return;
    const t = setTimeout(() => setMode("mini"), INTRO_MS);
    return () => clearTimeout(t);
  }, [active, mode]);

  if (mode === "open") {
    return (
      <section data-caption="open" className="glass-dark animate-fade relative w-full rounded-[30px] p-5 pt-4 shadow-float">
        <button
          type="button"
          onClick={() => setMode("mini")}
          aria-expanded="true"
          aria-label="Metni gizle"
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg font-black"
        >
          ▾
        </button>
        <div className="pr-10">{chips}</div>
        {children}
      </section>
    );
  }

  if (mode === "intro") {
    return (
      <button
        type="button"
        data-caption="intro"
        onClick={() => setMode("open")}
        aria-expanded="false"
        className="glass-dark reveal w-full translate-y-3 rounded-[26px] px-4 pt-3.5 pb-3 text-left opacity-0 shadow-float transition duration-500 ease-out group-data-[active=true]:translate-y-0 group-data-[active=true]:opacity-100"
      >
        <span className="block [&>div]:mb-2">{chips}</span>
        <span className="display line-clamp-2 block text-[20px]">{title}</span>
        <span className="mt-1.5 block text-xs font-extrabold text-white/70">▴ Haberi oku</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      data-caption="mini"
      onClick={() => setMode("open")}
      aria-expanded="false"
      aria-label={`Haberi oku: ${title}`}
      className="glass-dark animate-fade flex max-w-[78%] items-center gap-2 self-start rounded-full py-2 pr-4 pl-3 text-sm font-extrabold shadow-float"
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: accent }} aria-hidden />
      <span className="truncate">{title}</span>
      <span className="shrink-0 text-white/75">▴</span>
    </button>
  );
}
