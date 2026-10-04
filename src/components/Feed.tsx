"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { isCategory, type CategorySlug } from "@/lib/categories";
import { buildSlides } from "@/lib/feed";
import { getLikedServerSnapshot, getLikedSnapshot, setLiked, subscribeLiked } from "@/lib/liked";
import type { FeedStory } from "@/lib/stories";
import type { ArtMotif } from "./CategoryArt";
import { DesktopAside } from "./DesktopAside";
import { DesktopSidebar } from "./DesktopSidebar";
import { EndCard } from "./EndCard";
import { NewsletterCard } from "./NewsletterCard";
import { StoryCard } from "./StoryCard";
import { DesktopBackdrop, PHONE_FRAME } from "./PhoneFrame";
import { TopBar } from "./TopBar";

type Props = {
  initialStories: FeedStory[];
  initialCursor: number | null;
  sponsored: FeedStory[];
  category: CategorySlug | null;
  supportUrl?: string;
};

const PRELOAD_DISTANCE = 3;

export function Feed({ initialStories, initialCursor, sponsored, category, supportUrl }: Props) {
  const [stories, setStories] = useState(initialStories);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const liked = useSyncExternalStore(subscribeLiked, getLikedSnapshot, getLikedServerSnapshot);
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [muted, setMuted] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<() => void>(() => {});

  const slides = useMemo(() => buildSlides(stories, sponsored, cursor !== null), [stories, sponsored, cursor]);

  // Hangi kartın ekranda olduğunu izle (video oynatma ve sonsuz kaydırma için).
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          setActiveIndex(index);
          if (index >= slides.length - PRELOAD_DISTANCE) loadMoreRef.current();
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll<HTMLElement>("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [slides.length]);

  const loadMore = useCallback(async () => {
    if (loading || cursor === null) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ cursor: String(cursor) });
      if (category) params.set("kategori", category);
      const res = await fetch(`/api/stories?${params}`);
      if (!res.ok) throw new Error();
      const page = (await res.json()) as { stories: FeedStory[]; nextCursor: number | null };
      setStories((prev) => [...prev, ...page.stories.filter((s) => !prev.some((p) => p.id === s.id))]);
      setCursor(page.nextCursor);
    } catch {
      // Ağ hatasında bir sonraki kaydırmada tekrar denenir.
    } finally {
      setLoading(false);
    }
  }, [loading, cursor, category]);

  useEffect(() => {
    loadMoreRef.current = () => void loadMore();
  }, [loadMore]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const goTo = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const target = Math.max(0, Math.min(slides.length - 1, index));
      el.scrollTo({ top: target * el.clientHeight, behavior: "smooth" });
    },
    [slides.length],
  );

  // Masaüstü: ↑/↓, PageUp/PageDown, J/K ve boşlukla kart kart gezinme.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      if (document.querySelector("[role=dialog]")) return;
      const forward = ["ArrowDown", "PageDown", "j", "J"].includes(e.key) || (e.key === " " && !e.shiftKey);
      const back = ["ArrowUp", "PageUp", "k", "K"].includes(e.key) || (e.key === " " && e.shiftKey);
      if (e.key === " " && t?.closest("button, a")) return;
      if (!forward && !back) return;
      e.preventDefault();
      goTo(activeIndex + (forward ? 1 : -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, goTo]);

  const activeSlide = slides[activeIndex];
  const backdrop: ArtMotif =
    activeSlide?.kind === "story" || activeSlide?.kind === "sponsored"
      ? isCategory(activeSlide.story.category)
        ? activeSlide.story.category
        : "iyilik"
      : activeSlide?.kind === "newsletter"
        ? "mail"
        : "moon";

  const onLike = useCallback((story: FeedStory, like: boolean) => {
    setLiked(story.id, like);
    setLikeCounts((prev) => ({ ...prev, [story.id]: Math.max(0, (prev[story.id] ?? story.likes) + (like ? 1 : -1)) }));
    void fetch(`/api/stories/${story.id}/like`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ delta: like ? 1 : -1 }),
    });
  }, []);

  return (
    <div className="relative isolate lg:flex lg:h-dvh lg:items-center lg:justify-center lg:gap-6 lg:px-6 xl:gap-10">
      <DesktopBackdrop motif={backdrop} seed={activeSlide && "story" in activeSlide ? activeSlide.story.id : 0} />
      <DesktopSidebar active={category} />
      <div className="lg:flex lg:items-center lg:gap-3">
        <main className={PHONE_FRAME}>
          <TopBar active={category} />
          <div ref={scrollerRef} className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain">
            {slides.map((slide, index) => (
              <div key={slide.key} data-index={index} className="h-full snap-start snap-always">
                {slide.kind === "story" || slide.kind === "sponsored" ? (
                  <StoryCard
                    story={{ ...slide.story, likes: likeCounts[slide.story.id] ?? slide.story.likes }}
                    active={index === activeIndex}
                    liked={liked.has(slide.story.id)}
                    muted={muted}
                    onLike={onLike}
                    onToggleMute={() => setMuted((m) => !m)}
                    onToast={setToast}
                  />
                ) : slide.kind === "newsletter" ? (
                  <NewsletterCard />
                ) : (
                  <EndCard empty={stories.length === 0} supportUrl={supportUrl} />
                )}
              </div>
            ))}
          </div>
          {toast && (
            <div role="status" className="absolute inset-x-0 top-28 z-30 flex justify-center lg:top-6">
              <span className="glass animate-fade rounded-full px-4 py-2.5 text-sm font-extrabold shadow-float">{toast}</span>
            </div>
          )}
        </main>
        <div className="hidden flex-col gap-3 lg:flex">
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Önceki haber"
            className="glass flex h-12 w-12 items-center justify-center rounded-full text-xl font-black shadow-soft transition hover:scale-105 disabled:opacity-40"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex >= slides.length - 1}
            aria-label="Sonraki haber"
            className="glass flex h-12 w-12 items-center justify-center rounded-full text-xl font-black shadow-soft transition hover:scale-105 disabled:opacity-40"
          >
            ↓
          </button>
        </div>
      </div>
      <DesktopAside supportUrl={supportUrl} />
    </div>
  );
}
