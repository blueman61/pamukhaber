import type { EmbedType } from "./media";

/** Gömülü oynatıcının sesini dışarıdan açıp kapatan postMessage gövdesi; denetlenemeyen platform için null. */
export function audioMessage(type: EmbedType, muted: boolean): string | object | null {
  if (type === "youtube") return JSON.stringify({ event: "command", func: muted ? "mute" : "unMute", args: "" });
  if (type === "tiktok") return { type: muted ? "mute" : "unMute", "x-tiktok-player": true };
  return null;
}

/** Ses komutlarının gönderileceği, iframe adresinden türetilen hedef origin. */
export function embedOrigin(src: string): string {
  try {
    return new URL(src).origin;
  } catch {
    return "*";
  }
}
