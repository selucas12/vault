import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { getSupabaseServer } from "@/lib/supabase/server";

export const revalidate = 3600; // refresh hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl().replace(/\/$/, "");
  const supabase = await getSupabaseServer();

  let codeRows: { id: string; updated_at: string }[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("codes")
      .select("id, updated_at")
      .eq("approved", true);
    codeRows = (data ?? []) as { id: string; updated_at: string }[];
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/directory`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/search`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const entries: MetadataRoute.Sitemap = codeRows.map((c) => ({
    url: `${base}/code/${c.id}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...entries];
}
