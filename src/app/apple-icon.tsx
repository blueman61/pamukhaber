import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS ana ekran simgesi: pastel zeminde gülümseyen pamuk bulut. */
export default function AppleIcon() {
  const puff = (left: number, top: number, d: number) => (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: d,
        height: d,
        borderRadius: d,
        background: "#ffffff",
      }}
    />
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "linear-gradient(135deg, #fbcfe8, #bfdbfe)",
        }}
      >
        {puff(40, 70, 56)}
        {puff(62, 44, 70)}
        {puff(96, 76, 50)}
        <div style={{ position: "absolute", left: 52, top: 100, width: 84, height: 30, borderRadius: 15, background: "#fff" }} />
        <div style={{ position: "absolute", left: 80, top: 92, width: 8, height: 8, borderRadius: 8, background: "#3b2f3a" }} />
        <div style={{ position: "absolute", left: 104, top: 92, width: 8, height: 8, borderRadius: 8, background: "#3b2f3a" }} />
      </div>
    ),
    size,
  );
}
