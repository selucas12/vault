import { ImageResponse } from "next/og";
import { getSupabaseService } from "@/lib/supabase/server";

export const runtime = "edge";
export const alt = "Vault integration";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseService();
  let title = "AI Integration";
  let platforms: string[] = [];
  let targets: string[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("codes")
      .select("title, ai_platforms, delivery_targets")
      .eq("id", id)
      .maybeSingle();
    if (data) {
      title = data.title as string;
      platforms = (data.ai_platforms as string[]) ?? [];
      targets = (data.delivery_targets as string[]) ?? [];
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          width: "100%",
          height: "100%",
          backgroundColor: "#FFF8F0",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: "#E8590C" }}>Vault</div>
          <div style={{ fontSize: 14, color: "#6B7280", marginLeft: 8 }}>by Cheesyboy</div>
        </div>
        <div style={{ fontSize: 48, fontWeight: 700, color: "#1F2937", lineHeight: 1.2, marginBottom: 32 }}>
          {title}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {platforms.map((p) => (
            <div
              key={p}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                backgroundColor: "#FEF3C7",
                color: "#92400E",
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              {p}
            </div>
          ))}
          {targets.map((t) => (
            <div
              key={t}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                backgroundColor: "#DBEAFE",
                color: "#1E40AF",
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: 40, left: 80, fontSize: 16, color: "#9CA3AF" }}>
          vault.cheesyboy.dev
        </div>
      </div>
    ),
    { ...size },
  );
}
