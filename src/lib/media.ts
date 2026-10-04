export const MEDIA_TYPES = ["none", "image", "video", "youtube", "tiktok", "instagram"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

/** Platformun kendi oynatıcısıyla gömülen medya türleri (iframe). */
export const EMBED_TYPES = ["youtube", "tiktok", "instagram"] as const satisfies readonly MediaType[];
export type EmbedType = (typeof EMBED_TYPES)[number];

export function isEmbedType(type: MediaType): type is EmbedType {
  return (EMBED_TYPES as readonly MediaType[]).includes(type);
}

export const PLATFORM_LABELS: Record<EmbedType, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
};

function parseUrl(url: string): { host: string; path: string; u: URL } | null {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return { host: u.hostname.replace(/^(www\.|m\.)/, ""), path: u.pathname, u };
  } catch {
    return null;
  }
}

/** YouTube (normal, kısa link veya Shorts) URL'sinden video kimliğini çıkarır. */
export function youtubeId(url: string): string | null {
  const p = parseUrl(url);
  if (!p) return null;
  let id: string | null = null;
  if (p.host === "youtu.be") id = p.path.slice(1);
  else if (p.host === "youtube.com" || p.host === "youtube-nocookie.com") {
    if (p.path === "/watch") id = p.u.searchParams.get("v");
    else id = p.path.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null;
  }
  return id && /^[\w-]{6,20}$/.test(id) ? id : null;
}

/** TikTok video kimliği: tiktok.com/@kullanici/video/123…, /embed/v2/123…, /player/v1/123… */
export function tiktokId(url: string): string | null {
  const p = parseUrl(url);
  if (!p || p.host !== "tiktok.com") return null;
  const m = p.path.match(/^\/(?:@[^/]+\/video|embed(?:\/v2)?|player\/v1)\/(\d{8,25})/);
  return m?.[1] ?? null;
}

/** vm.tiktok.com / vt.tiktok.com kısa linkleri sunucuda çözülmelidir. */
export function isTiktokShortLink(url: string): boolean {
  const p = parseUrl(url);
  return !!p && (p.host === "vm.tiktok.com" || p.host === "vt.tiktok.com" || (p.host === "tiktok.com" && p.path.startsWith("/t/")));
}

export function tiktokEmbedUrl(id: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    loop: "1",
    music_info: "0",
    description: "0",
    rel: "0",
  });
  return `https://www.tiktok.com/player/v1/${id}?${params}`;
}

/** Instagram Reels/gönderi kısa kodu: /reel/X, /reels/X, /p/X, /tv/X (kullanıcı adlı yollar dahil). */
export function instagramShortcode(url: string): string | null {
  const p = parseUrl(url);
  if (!p || p.host !== "instagram.com") return null;
  const m = p.path.match(/^\/(?:[\w.]+\/)?(?:reels?|p|tv)\/([\w-]{5,40})/);
  return m?.[1] ?? null;
}

export function instagramEmbedUrl(code: string): string {
  return `https://www.instagram.com/reel/${code}/embed/`;
}

/** Medya türü için iframe adresi; geçersizse null. */
export function embedSrc(type: EmbedType, url: string): string | null {
  if (type === "youtube") {
    const id = youtubeId(url);
    return id ? youtubeEmbedUrl(id, true) : null;
  }
  if (type === "tiktok") {
    const id = tiktokId(url);
    return id ? tiktokEmbedUrl(id) : null;
  }
  const code = instagramShortcode(url);
  return code ? instagramEmbedUrl(code) : null;
}

export function youtubeEmbedUrl(id: string, autoplay: boolean): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: "1",
    loop: "1",
    playlist: id,
    controls: "1",
    playsinline: "1",
    modestbranding: "1",
    rel: "0",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
