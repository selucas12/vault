import { createClient } from "@supabase/supabase-js";

export interface DbHandle {
  upsertCode(entry: Record<string, unknown>): Promise<{ inserted: boolean }>;
  recordRun(stats: {
    source_type: string;
    started_at: string;
    finished_at: string;
    entries_found: number;
    entries_new: number;
    entries_updated: number;
    errors: string[];
  }): Promise<void>;
  existingSourceUrls(): Promise<{ urls: Set<string>; manual: Set<string> }>;
}

export function getDb(): DbHandle | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async upsertCode(entry) {
      // Upsert on source_url unique index. If exists, update mutable fields only.
      const { error, data } = await supabase
        .from("codes")
        .upsert(entry, { onConflict: "source_url", ignoreDuplicates: false })
        .select("id");
      if (error) throw error;
      return { inserted: !!data?.length };
    },
    async recordRun(stats) {
      await supabase.from("scrape_runs").insert(stats);
    },
    async existingSourceUrls() {
      const urls = new Set<string>();
      const manual = new Set<string>();
      const pageSize = 1000;
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from("codes")
          .select("source_url, source_type")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        for (const row of data) {
          const url = row.source_url as string;
          urls.add(url);
          if ((row.source_type as string) === "manual") manual.add(url);
        }
        if (data.length < pageSize) break;
      }
      return { urls, manual };
    },
  };
}
