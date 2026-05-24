# VALIDATE THIS BUILD (start here)

You're returning to a half-wired build. Walk these eight steps in order. Each step shows the **exact command**, the **expected output**, and a **debug hint** if it doesn't match. Skip ahead if you already did one.

> Time budget: ~30 min if everything is happy, ~60 min if Supabase migration friction. Anything longer than that, stop and check the debug hints.

## Step 1 — Create the Supabase project (web UI)

1. Open `https://supabase.com/dashboard` and create a new project named **vault**. Region `us-east-1`. Database password: save it somewhere safe.
2. Wait until provisioning finishes (1-2 min).
3. Settings → API → copy the **Project URL** + **anon public** key + **service_role secret** key.
4. Settings → Database → copy the **Connection string (URI)** — you'll use it for psql.

**Expected:** a green Supabase project dashboard showing 0 tables.
**If stuck:** confirm you're signed in to the right Supabase account. There's no CLI shortcut for project creation; this step is intentionally manual.

## Step 2 — Apply the schema migration

The migration is at `supabase/migrations/0001_init.sql`. Either path works:

**Option A — psql (recommended, no extra install):**

```bash
# Replace the URL with the connection string you copied in step 1.
# Note: use the "URI" connection string, not the "Direct" one.
psql "postgres://postgres.YOURPROJECTREF:YOURPASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  -f supabase/migrations/0001_init.sql
```

**Option B — Supabase SQL editor (UI):**

1. Supabase dashboard → SQL Editor → New query.
2. Paste the contents of `supabase/migrations/0001_init.sql`. Run.

**Expected:** `CREATE EXTENSION`, `CREATE TABLE`, `CREATE INDEX`, `CREATE POLICY`, `CREATE FUNCTION` notices. No errors.
**If stuck:** `extension "vector" does not exist` → Supabase enables it on first use; just rerun. Permission denied → make sure the connection string is the pooler URI (`...pooler.supabase.com:6543`), not the direct one.

## Step 3 — Fill four env vars in `.env.local`

```bash
cp .env.example .env.local
```

Edit `.env.local` and set these four — leave everything else blank for now:

| Var | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role secret key (server-only) |
| `OPENAI_API_KEY` | An OpenAI API key (needed for `npm run scrape` to embed entries) |

**Expected:** `.env.local` exists with four non-empty values.
**If stuck:** the anon key and service-role key look similar but the service-role key starts with `eyJ...` and is much longer. The anon one is fine in browser code; the service one must never reach the browser.

## Step 4 — Install dependencies and start the dev server

```bash
npm install
npm run dev
```

**Expected:** dev server listening on `http://localhost:3000`, landing page renders with the orange "Stop hunting GitHub for AI integrations." hero. `/directory` shows a yellow "Supabase isn't configured" banner if env vars aren't loaded yet (Ctrl-C and restart `npm run dev` to pick up `.env.local`).

**If stuck:** `Module not found '@supabase/ssr'` → `rm -rf node_modules && npm install` from a clean slate. Tailwind classes not applying → confirm `globals.css` was untouched and `@import "tailwindcss"` is at the top.

## Step 5 — Load the seed data

```bash
psql "postgres://postgres.YOURPROJECTREF:YOURPASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  -f supabase/seed.sql
```

Five hand-curated entries get inserted: Cheesyboy itself + 4 real Telegram-AI bots from yym68686, n3d1117, father-bot, and H-T-H. All `approved=true`, all `last_verified_status='working'`.

**Expected:** `INSERT 0 5` (or `INSERT 0 0` and 5 update notices if you re-ran). No errors.
**If stuck:** `relation "codes" does not exist` → step 2 didn't actually run. Re-run step 2.

## Step 6 — Verify the directory page

Open `http://localhost:3000/directory` in your browser (no env reload needed; server components re-query Supabase on every request).

**Expected:** five cards, sorted by stars descending. Top card is `chatgpt_telegram_bot` (8.4k ★), then `chatgpt-telegram-bot` (3.8k), `ChatGPT-Telegram-Bot` (3.2k), `Gemini-Telegram-Bot` (420), `Cheesyboy` (0). Each card shows AI badges (`gpt`/`claude`/`gemini`) and `telegram` target. Filter chips on the left toggle correctly when clicked.

**If stuck:** "Directory is offline" banner → env vars didn't load. Restart `npm run dev`. Empty grid → run `psql ... -c 'select count(*) from codes;'` — should return 5. If 0, step 5 didn't actually insert.

## Step 7 — Run the scraper once

```bash
npm run scrape -- --limit 50
```

**Expected:** ~3-6 minutes. Each source logs its progress. Final line `Total new entries this run: 30-50`. The first run is slow because the GitHub API is unauthenticated → 60 req/hr. Set `GITHUB_TOKEN` in `.env.local` to unblock to 5000/hr.

After it finishes:

```bash
psql "$YOUR_URL" -c "select count(*) from codes;"
# Expected: 35-55 rows total (5 seed + 30-50 scraped).
```

**If stuck:**
- `Refusing to run without Supabase env vars` → `.env.local` not picked up. The scraper reads from `process.env`; either source it (`set -a; source .env.local; set +a`) or set the vars inline.
- GitHub 403 rate limit → wait an hour or set `GITHUB_TOKEN`.
- OpenAI 401 → invalid `OPENAI_API_KEY`. Embeddings will be `null` and `/search` will return no matches.

## Step 8 — Try AI search end-to-end

This step needs one more env var:

```bash
# Add to .env.local:
ANTHROPIC_API_KEY=sk-ant-...
```

Then restart `npm run dev` and open `http://localhost:3000/search`. Type:

```
telegram bot for claude
```

**Expected (logged-out):** one teaser result (Cheesyboy or yym68686's bot), `install_command` hidden, paywall CTA banner above.
**Expected (subscribed, after Tier-4 wire-up):** 2-3 ranked results, each with a `Why this fits:` line written by Claude, install command visible.

**If stuck:**
- `{"ok":false,"reason":"no-anthropic"}` → key missing or invalid.
- 0 results → embeddings are `null`. Run `psql ... -c "select count(*) from codes where embedding is null;"` — should return 0 after a successful scrape. If non-zero, the scraper hit an OpenAI failure mid-run.
- Anthropic JSON parse error → model returned prose instead of JSON. The route soft-falls-back to unranked vector matches; refresh the page to see them.

---

Once steps 1-8 are all green, the foundation is validated and you can resume building the deferred items (install verification, admin queue, streaming search, etc.) on solid ground.

The rest of this README is the original build doc — keep reading for the LemonSqueezy + DNS + GitHub Actions wiring.

---

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

## Helper scripts

Two one-liner scripts handle the irreversible steps the autonomous build deferred:

- `scripts/make-repo-public.sh` — flips `selucas12/vault` from private → public via `gh repo edit`. Prompts y/N before doing it. Manual fallback: `github.com/selucas12/vault/settings` → Danger Zone → Change visibility → Public.
- `scripts/disable-vercel-protection.sh` — disables Vercel team SSO on the production deployment so the URL is world-readable. Uses the local Vercel auth token. Manual fallback: `vercel.com/cheesyboy/vault/settings/deployment-protection` → set to "Disabled" or "Only Preview Deployments."

Run them from the repo root:

```bash
./scripts/make-repo-public.sh
./scripts/disable-vercel-protection.sh
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
