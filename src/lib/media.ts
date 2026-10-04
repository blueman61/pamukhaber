export const MEDIA_TYPES = ["none", "image", "video", "youtube"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

/** YouTube (normal, kısa link veya Shorts) URL'sinden video kimliğini çıkarır. */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else {
        const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/);
        id = m?.[1] ?? null;
      }
    }
    return id && /^[\w-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function youtubeEmbedUrl(id: string, autoplay: boolean): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: "1",
    loop: "1",
    playlist: id,
    controls: "0",
    playsinline: "1",
    modestbranding: "1",
    rel: "0",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
