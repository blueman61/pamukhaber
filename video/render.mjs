// Kullanım: npm run video -- <slug>   (SITE_URL ortam değişkeni ya da --site=https://… ile)
// Siteden sahne verisini çeker, 1080×1920 / 30 fps MP4 üretir: out/<slug>.mp4
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const site = (args.find((a) => a.startsWith("--site="))?.slice(7) ?? process.env.SITE_URL ?? "").replace(/\/$/, "");
if (!slug || !site) {
  console.error("Kullanım: SITE_URL=https://siteniz.netlify.app npm run video -- <haber-slug>");
  process.exit(1);
}

const res = await fetch(`${site}/api/scene/${encodeURIComponent(slug)}`);
if (!res.ok) {
  console.error(`Sahne verisi alınamadı (${res.status}). Slug doğru mu, haber yayında mı?`);
  process.exit(1);
}
const scene = await res.json();

const bundled = await bundle({
  entryPoint: path.join(here, "src/index.ts"),
  webpackOverride: (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        "@": path.join(here, "../src"),
        // Uygulama dosyaları da videonun react/remotion kopyasını kullansın.
        react: path.join(here, "node_modules/react"),
        "react-dom": path.join(here, "node_modules/react-dom"),
        remotion: path.join(here, "node_modules/remotion"),
      },
    },
  }),
});

const browserExecutable = process.env.CHROME_PATH || undefined;
const composition = await selectComposition({ serveUrl: bundled, id: "Scene", inputProps: scene, browserExecutable });
mkdirSync(path.join(here, "out"), { recursive: true });
const outputLocation = path.join(here, "out", `${slug}.mp4`);
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation,
  inputProps: scene,
  browserExecutable,
  chromiumOptions: { gl: "angle" },
});
console.log(`Hazır: ${outputLocation}`);
