import type { FeedStory } from "./stories";

export const SPONSOR_EVERY = 7;
export const NEWSLETTER_AFTER = 4;

export type Slide =
  | { kind: "story"; key: string; story: FeedStory }
  | { kind: "sponsored"; key: string; story: FeedStory }
  | { kind: "newsletter"; key: string }
  | { kind: "end"; key: string };

/**
 * Hikâyelerin arasına bülten kartını ve sponsorlu kartları serpiştirir.
 * Sponsorlu kartlar her SPONSOR_EVERY hikâyede bir, sırayla döner.
 */
export function buildSlides(stories: FeedStory[], sponsored: FeedStory[], hasMore: boolean): Slide[] {
  const slides: Slide[] = [];
  stories.forEach((story, i) => {
    slides.push({ kind: "story", key: `s-${story.id}`, story });
    const n = i + 1;
    if (n === NEWSLETTER_AFTER) slides.push({ kind: "newsletter", key: "newsletter" });
    if (sponsored.length && n % SPONSOR_EVERY === 0) {
      const slot = n / SPONSOR_EVERY - 1;
      const ad = sponsored[slot % sponsored.length];
      slides.push({ kind: "sponsored", key: `ad-${slot}-${ad.id}`, story: ad });
    }
  });
  if (!hasMore) slides.push({ kind: "end", key: "end" });
  return slides;
}
