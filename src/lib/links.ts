import { isTiktokShortLink } from "./media";

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * vm.tiktok.com gibi kısa paylaşım linklerini yönlendirmeyi takip ederek tam
 * video adresine çevirir. Çözülemezse linki olduğu gibi döndürür.
 */
export async function resolveShortLink(url: string, fetchImpl: FetchLike = fetch): Promise<string> {
  if (!isTiktokShortLink(url)) return url;
  try {
    const res = await fetchImpl(url, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; PamukHaberBot/0.1)" },
      signal: AbortSignal.timeout(8_000),
    });
    return res.url || url;
  } catch {
    return url;
  }
}
