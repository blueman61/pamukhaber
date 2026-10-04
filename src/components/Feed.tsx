"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { CategorySlug } from "@/lib/categories";
import { buildSlides } from "@/lib/feed";
import { getLikedServerSnapshot, getLikedSnapshot, setLiked, subscribeLiked } from "@/lib/liked";
import type { FeedStory } from "@/lib/stories";
import { EndCard } from "./EndCard";
import { NewsletterCard } from "./NewsletterCard";
import { StoryCard } from "./StoryCard";
import { TopBar } from "./TopBar";

type Props = {
  initialStories: FeedStory[];
  initialCursor: number | null;
  sponsored: FeedStory[];
  category: CategorySlug | null;
};

const PRELOAD_DISTANCE = 3;

export function Feed({ initialStories, initialCursor, sponsored, category }: Props) {
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
    <main className="relative mx-auto h-dvh w-full max-w-[480px] overflow-hidden bg-neutral-900 sm:my-0 sm:shadow-2xl">
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
              <EndCard empty={stories.length === 0} />
            )}
          </div>
        ))}
      </div>
      {toast && (
        <div role="status" className="absolute inset-x-0 bottom-24 z-30 flex justify-center">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#3b2f3a] shadow-lg">{toast}</span>
        </div>
      )}
    </main>
  );
}
