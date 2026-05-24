import type { AIPlatform, DeliveryTarget, SourceType } from "@/lib/types";

export interface RawEntry {
  source_url: string;
  source_type: SourceType;
  title: string;
  description: string | null;
  ai_platforms: AIPlatform[];
  delivery_targets: DeliveryTarget[];
  install_command: string | null;
  language: string | null;
  github_url: string | null;
  stars: number;
  license: string | null;
  author: string | null;
  category: string | null;
}

export interface SourceModule {
  type: SourceType;
  name: string;
  // Hard cap on entries this source contributes per run.
  maxEntries: number;
  // Awesome-list sources are pre-curated → auto-approve.
  // GitHub-topic sources are noisier → manual queue.
  autoApprove: boolean;
  run(opts: { limit: number; logger: (msg: string) => void }): Promise<RawEntry[]>;
}

export interface ScrapeStats {
  source_type: SourceType;
  entries_found: number;
  entries_new: number;
  entries_updated: number;
  errors: string[];
}
