export type AIPlatform =
  | "claude"
  | "gpt"
  | "gemini"
  | "groq"
  | "llama"
  | "mistral"
  | "perplexity"
  | "deepseek";

export type DeliveryTarget =
  | "telegram"
  | "slack"
  | "discord"
  | "whatsapp"
  | "imessage"
  | "teams";

export type VerificationStatus = "working" | "broken" | "unverified";

export type SourceType =
  | "github-awesome"
  | "github-topic"
  | "huggingface"
  | "reddit"
  | "manual";

export interface Code {
  id: string;
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
  last_verified_at: string | null;
  last_verified_status: VerificationStatus | null;
  added_at: string;
  updated_at: string;
  approved: boolean;
  category: string | null;
  featured: boolean;
  editor_note: string | null;
}

export interface Subscriber {
  id: string;
  user_id: string;
  ls_subscription_id: string | null;
  ls_customer_id: string | null;
  status: "active" | "inactive" | "cancelled" | "past_due";
  plan: "monthly" | "annual" | null;
  current_period_end: string | null;
}

export interface SearchMatch {
  id: string;
  why: string;
  install_summary: string;
  confidence: "high" | "medium" | "low";
}

export const AI_PLATFORMS: { id: AIPlatform; label: string }[] = [
  { id: "claude", label: "Claude" },
  { id: "gpt", label: "GPT" },
  { id: "gemini", label: "Gemini" },
  { id: "groq", label: "Groq" },
  { id: "llama", label: "Llama" },
  { id: "mistral", label: "Mistral" },
  { id: "perplexity", label: "Perplexity" },
  { id: "deepseek", label: "DeepSeek" },
];

export const DELIVERY_TARGETS: { id: DeliveryTarget; label: string }[] = [
  { id: "telegram", label: "Telegram" },
  { id: "slack", label: "Slack" },
  { id: "discord", label: "Discord" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "imessage", label: "iMessage" },
  { id: "teams", label: "Teams" },
];
