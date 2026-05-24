# Vault — the curated AI ↔ chat-platform integration index

A subscription-gated directory of tools that connect AI (Claude, GPT, Gemini, Groq, …) to chat platforms (Telegram, Slack, Discord, WhatsApp, iMessage, …), with AI-assisted search.

Live: `https://vault.cheesyboy.dev` (pending DNS + deploy)
Repo: `github.com/selucas12/vault`
By: the makers of [Cheesyboy](https://cheesyboy.dev)

---

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Styling:** Tailwind CSS v4 (CSS-first theme)
- **Database:** Supabase (Postgres + Auth + pgvector for embeddings)
- **Hosting:** Vercel (under team `cheesyboy`)
- **Payments:** LemonSqueezy subscriptions
- **Embeddings:** OpenAI `text-embedding-3-small` (1536-dim)
- **Search ranker:** Anthropic Claude (`claude-sonnet-4-6`)
- **Scraper:** TypeScript via `tsx`, scheduled in GitHub Actions

## Project layout

```
src/
  app/                  Next.js App Router
    api/
      search/           POST endpoint — embeds query, ranks via Claude
      ls-webhook/       LemonSqueezy webhook (signature-verified)
    auth/callback/      Supabase magic-link exchange
    account/            User account + subscription state
    code/[id]/          Entry detail page
    directory/          Filterable directory
    login/              Magic-link sign-in
    search/             AI search UI
    page.tsx            Landing
    layout.tsx          Shell w/ nav + footer
  components/           Client + server UI pieces
  lib/
    env.ts              Centralized env access with null-safe getters
    subscription.ts     requireSubscription / getSubscriptionState
    supabase/{server,browser}.ts
    types.ts            Shared TS types + label maps
scripts/scraper/        Cron scraper (run via `npm run scrape`)
supabase/migrations/    SQL migrations (run in Supabase SQL editor)
.github/workflows/
  ci.yml                Lint + build on PR + push
  scrape.yml            Daily 09:00 UTC scrape + manual dispatch
```

## Post-build setup — steps Stephen must do

These are not blocking compile/deploy of the static surface, but the directory, search, auth, and paywall stay in "Coming soon" / 404 states until each is done.

### 1. Create Supabase project (5 min)

1. `https://supabase.com/dashboard` → New project. Region: `us-east-1` (closest to PR + Vercel default).
2. Open SQL editor → paste `supabase/migrations/0001_init.sql` → Run.
3. Settings → API → copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` (never expose to client)
4. Set these three in Vercel Project Settings → Environment Variables (all three envs).

### 2. Create LemonSqueezy Vault subscription product (10 min)

1. `https://cheesyboy.lemonsqueezy.com` → Products → New product.
2. Type: **Subscription** (not single payment).
3. Name: **Vault**. Description: *Curated AI ↔ chat-platform integration directory with AI-assisted search.*
4. Variants:
   - **Monthly** — $9.99/month
   - **Annual** — $99/year (label "Save 17%")
5. License keys: **off** (Vault uses Supabase Auth, not license keys).
6. Save → copy:
   - Each variant's **Buy URL** → `NEXT_PUBLIC_LS_CHECKOUT_MONTHLY_URL` / `NEXT_PUBLIC_LS_CHECKOUT_ANNUAL_URL`
   - Each variant's **Variant ID** → `LS_VARIANT_MONTHLY` / `LS_VARIANT_ANNUAL`
   - Product **UUID** → `LS_PRODUCT_UUID`
7. Settings → Webhooks → New webhook:
   - URL: `https://vault.cheesyboy.dev/api/ls-webhook`
   - Events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`, `subscription_paused`, `subscription_payment_failed`
   - Save → copy the signing secret → `LS_WEBHOOK_SECRET`.
8. Settings → API → create a new API key → `LS_API_KEY` (for any server-side LS calls).
9. When you embed each checkout URL in the LS dashboard, set **Checkout custom data → `user_id`** to map to the buyer's Supabase user id. (TODO: wire `?checkout[custom][user_id]=…` into the subscribe buttons once Supabase Auth is live.)

### 3. Configure `vault.cheesyboy.dev` DNS (5 min)

1. Vercel dashboard → Vault project → Settings → Domains → Add `vault.cheesyboy.dev`.
2. Namecheap → cheesyboy.dev → Advanced DNS → add a `CNAME` record:
   - Host: `vault`
   - Value: `cname.vercel-dns.com`
   - TTL: Automatic
3. Wait 5-15 min for SSL.

### 4. Set GitHub Actions secrets (3 min)

`github.com/selucas12/vault/settings/secrets/actions`. Add:

| Secret | What |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service-role key (NOT anon) |
| `OPENAI_API_KEY` | OpenAI API key — embeddings only |
| `SCRAPER_GITHUB_TOKEN` | Optional. PAT with `public_repo` scope. Bumps the GitHub API limit from 60→5000 req/hr. Without it the scraper still works, just slowly. |

### 5. First scrape run

In the Vault repo → Actions → "Daily scrape" → Run workflow.
- Set `limit` to `200` (or `50` for a smaller smoke test).
- Leave `dry_run` unchecked.

When it finishes, hit `/directory` to confirm rows landed.

### 6. Vercel env vars (Production + Preview)

Set every var from `.env.example` in Vercel Project Settings → Environment Variables. Anything that starts with `NEXT_PUBLIC_` must be set even for previews if you want the preview build to render the surface that uses it.

Also set:
- `NEXT_PUBLIC_SITE_URL` = `https://vault.cheesyboy.dev` (production)
- `NEXT_PUBLIC_SITE_URL` = the preview URL placeholder Vercel exposes (preview)

## Local dev

```bash
git clone git@github.com:selucas12/vault.git
cd vault
cp .env.example .env.local       # fill in your dev Supabase project values
npm install
npm run dev                       # http://localhost:3000
npm run scrape:dry                # 20-entry dry run; no DB writes
```

## Graceful degradation

Every page renders without throwing when env vars are missing:

| Surface | Without env | With env |
|---|---|---|
| `/` | OK — pricing buttons render "Coming soon" if LS env missing | Full pricing flow |
| `/directory` | Yellow "Supabase isn't configured yet" banner | List of approved entries |
| `/code/[id]` | Yellow banner | Entry detail |
| `/search` | Returns `no-supabase` / `no-openai` / `no-anthropic` JSON; UI surfaces a clear error | Real AI ranking |
| `/login`, `/account` | Login form shows error if user submits without Supabase configured | Magic link + account page |
| `/api/ls-webhook` | 503 `no-env` | 200 on valid signed event |

This means a half-configured deployment still ships; finish the wiring incrementally.

## What's deferred (known)

- **Install verification sandbox.** Schema supports `last_verified_at` / `last_verified_status`, but no automated install-and-test loop yet. All entries currently land as `unverified` (auto-approved entries from awesome-lists are still treated as `unverified` until verification ships).
- **Saved entries UI.** `saved_codes` table exists; no UI yet.
- **`user_id` injection into LS checkout.** Needs server action that builds the checkout URL with `checkout[custom][user_id]` after Supabase Auth confirms identity.
- **Manual review queue UI.** `approved=false` entries from GitHub topics + Hugging Face are in the DB but invisible until someone flips the flag in Supabase Studio. A `/admin` page is a follow-up.

## License

MIT.

---

Vault is a Cheesyboy product. Email `meow@cheesyboy.dev`.
