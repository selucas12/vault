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
  | "github-search"
  | "huggingface"
  | "reddit"
  | "manual"
  | "n8n"
  | "pipedream"
  | "make"
  | "npm"
  | "gitlab";

export type InstallGuideStatus = "missing" | "draft" | "verified" | "broken";

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
  install_guide: string | null;
  install_guide_status: InstallGuideStatus | null;
  install_guide_author: string | null;
  install_guide_updated_at: string | null;
  install_guide_helpful_count: number;
  install_guide_error_reports: number;
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

export type PromptSource =
  | "anthropic-prompt-library"
  | "openai-examples"
  | "awesome-chatgpt-prompts"
  | "awesome-claude-prompts"
  | "flowgpt"
  | "prompthero"
  | "manual";

export type PromptCategory =
  | "coding"
  | "writing"
  | "analysis"
  | "creative"
  | "business"
  | "education"
  | "roleplay"
  | "productivity"
  | "other";

export const PROMPT_CATEGORIES: { id: PromptCategory; label: string }[] = [
  { id: "coding", label: "Coding" },
  { id: "writing", label: "Writing" },
  { id: "analysis", label: "Analysis" },
  { id: "creative", label: "Creative" },
  { id: "business", label: "Business" },
  { id: "education", label: "Education" },
  { id: "roleplay", label: "Roleplay" },
  { id: "productivity", label: "Productivity" },
  { id: "other", label: "Other" },
];

export interface Prompt {
  id: string;
  title: string;
  body: string;
  source: PromptSource;
  source_url: string;
  ai_platforms: AIPlatform[];
  use_case: string | null;
  category: PromptCategory | null;
  tags: string[];
  quality_score: number | null;
  quality_reasoning: string | null;
  hidden_from_directory: boolean;
  is_free: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptSearchMatch {
  id: string;
  why: string;
  confidence: "high" | "medium" | "low";
}
