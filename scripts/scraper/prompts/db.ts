import { createClient } from "@supabase/supabase-js";

export interface PromptDbHandle {
  upsertPrompt(entry: Record<string, unknown>): Promise<{ inserted: boolean }>;
  existingSourceUrls(): Promise<Set<string>>;
  existingContentHashes(): Promise<Set<string>>;
}

export function contentHash(body: string): string {
  const normalized = body.toLowerCase().replace(/\s+/g, "");
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

export function getPromptDb(): PromptDbHandle | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async upsertPrompt(entry) {
      const { error, data } = await supabase
        .from("prompts")
        .upsert(entry, { onConflict: "source_url", ignoreDuplicates: false })
        .select("id");
      if (error) throw error;
      return { inserted: !!data?.length };
    },
    async existingSourceUrls() {
      const urls = new Set<string>();
      const pageSize = 1000;
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from("prompts")
          .select("source_url")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        for (const row of data) urls.add(row.source_url as string);
        if (data.length < pageSize) break;
      }
      return urls;
    },
    async existingContentHashes() {
      const hashes = new Set<string>();
      const pageSize = 1000;
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from("prompts")
          .select("body")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        for (const row of data) hashes.add(contentHash(row.body as string));
        if (data.length < pageSize) break;
      }
      return hashes;
    },
  };
}
