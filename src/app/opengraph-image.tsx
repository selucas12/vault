import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Vault — the curated AI ↔ chat-platform integration index";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFF8F0",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: 80,
        }}
      >
        <div style={{ fontSize: 96, marginBottom: 24 }}>🗝️🐈</div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "#1A1A1A",
            letterSpacing: -2,
            textAlign: "center",
            lineHeight: 1.05,
            marginBottom: 24,
          }}
        >
          Vault
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#4A4A4A",
            textAlign: "center",
            lineHeight: 1.3,
            maxWidth: 900,
          }}
        >
          The curated index of AI ↔ chat-platform integrations.
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 48,
            display: "flex",
            gap: 16,
            color: "#FF6B35",
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          <span>vault.cheesyboy.dev</span>
          <span style={{ color: "#E8DFD2" }}>·</span>
          <span>by Cheesyboy</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
