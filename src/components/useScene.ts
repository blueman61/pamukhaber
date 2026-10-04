"use client";

import { useSyncExternalStore } from "react";
import type { FeedStory } from "@/lib/stories";

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

/** Medyasız, sponsorsuz haberler canlı sahne olur; hareket azaltma açıksa eski metin paneli kalır. */
export function useIsScene(story: FeedStory) {
  const reduced = usePrefersReducedMotion();
  return story.mediaType === "none" && !story.isSponsored && !reduced;
}
