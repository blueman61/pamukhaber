import { describe, expect, it } from "vitest";
import { audioMessage, embedOrigin } from "@/lib/embed-audio";
import { embedSrc } from "@/lib/media";

describe("embed audio", () => {
  it("builds YouTube mute/unMute commands", () => {
    expect(JSON.parse(audioMessage("youtube", false) as string)).toMatchObject({ event: "command", func: "unMute" });
    expect(JSON.parse(audioMessage("youtube", true) as string)).toMatchObject({ func: "mute" });
  });
  it("builds TikTok commands and ignores Instagram", () => {
    expect(audioMessage("tiktok", false)).toEqual({ type: "unMute", "x-tiktok-player": true });
    expect(audioMessage("instagram", false)).toBeNull();
  });
  it("YouTube embed enables the JS API and derives its origin", () => {
    const src = embedSrc("youtube", "https://www.youtube.com/shorts/abc123XYZ_-")!;
    expect(src).toContain("enablejsapi=1");
    expect(embedOrigin(src)).toBe("https://www.youtube-nocookie.com");
  });
});
