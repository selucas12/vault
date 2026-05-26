import type { AIPlatform, PromptSource, PromptCategory } from "@/lib/types";

export interface RawPrompt {
  title: string;
  body: string;
  source: PromptSource;
  source_url: string;
  ai_platforms: AIPlatform[];
  use_case: string | null;
  category: PromptCategory | null;
  tags: string[];
}

export interface PromptSourceModule {
  source: PromptSource;
  name: string;
  maxEntries: number;
  run(opts: { limit: number; logger: (msg: string) => void }): Promise<RawPrompt[]>;
}
