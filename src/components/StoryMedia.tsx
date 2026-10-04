"use client";

import { useEffect, useRef } from "react";
import { getCategory } from "@/lib/categories";
import { youtubeEmbedUrl, youtubeId, youtubeThumbnail } from "@/lib/media";
import type { FeedStory } from "@/lib/stories";

type Props = { story: FeedStory; active: boolean; muted: boolean };

/** Kartın tam ekran arka planı: görsel, video, YouTube ya da pastel degrade. */
export function StoryMedia({ story, active, muted }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const category = getCategory(story.category);

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

  if (story.mediaType === "youtube" && story.mediaUrl) {
    const id = youtubeId(story.mediaUrl);
    if (id) {
      return active ? (
        <iframe
          src={youtubeEmbedUrl(id, true)}
          title={story.title}
          className="absolute inset-0 h-full w-full scale-[1.35] object-cover"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={youtubeThumbnail(id)} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      );
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

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient}`}>
      <div className="absolute inset-x-0 top-[22%] flex justify-center">
        <span className="animate-float text-[7.5rem] drop-shadow-lg" aria-hidden>
          {category.emoji}
        </span>
      </div>
      <div className="absolute -left-10 top-1/2 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
      <div className="absolute -right-8 top-[15%] h-32 w-32 rounded-full bg-white/50 blur-2xl" />
    </div>
  );
}
