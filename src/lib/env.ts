// Centralized env access. Each getter is forgiving: returns null when unset
// so pages can render a graceful "coming soon" state instead of crashing.

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function getSupabaseServiceEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

export function getLemonSqueezyEnv() {
  const monthly = process.env.NEXT_PUBLIC_LS_CHECKOUT_MONTHLY_URL;
  const annual = process.env.NEXT_PUBLIC_LS_CHECKOUT_ANNUAL_URL;
  if (!monthly || !annual) return null;
  return { monthly, annual };
}

export function getLemonSqueezyServerEnv() {
  const productUuid = process.env.LS_PRODUCT_UUID;
  const webhookSecret = process.env.LS_WEBHOOK_SECRET;
  const apiKey = process.env.LS_API_KEY;
  if (!productUuid || !webhookSecret || !apiKey) return null;
  return { productUuid, webhookSecret, apiKey };
}

export function getOpenAIKey() {
  return process.env.OPENAI_API_KEY ?? null;
}

export function getAnthropicKey() {
  return process.env.ANTHROPIC_API_KEY ?? null;
}

export function getGithubToken() {
  return process.env.GITHUB_TOKEN ?? null;
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
