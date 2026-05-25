# Vault

The curated index of AI-to-chat-platform integrations. Find the tool, copy the install command, ship.

**Live at [vault.cheesyboy.dev](https://vault.cheesyboy.dev)**

## Why this exists

Every week there's a new repo that connects Claude or GPT to Telegram or Slack. They're scattered across awesome-lists, GitHub topics, and Hugging Face. Vault pulls them into one searchable directory so you stop spelunking GitHub and start building.

## How it works

- **Sources** — We scrape awesome-lists, GitHub topics, Hugging Face, n8n, Pipedream, and Make daily for new integrations.
- **Embedding** — Each entry is embedded with OpenAI `text-embedding-3-small` for semantic search.
- **Search** — Describe what you want in plain English. Vault matches it against the directory using vector similarity.
- **Ranking** — Claude re-ranks the top candidates and explains why each one fits your query.
- **Gating** — Browsing is free. Full AI search with reasoning requires a subscription ($9.99/mo or $99/yr).

## Tech stack

- Next.js 16 (App Router, React 19)
- Tailwind CSS v4
- Supabase (Postgres + Auth + pgvector)
- Vercel
- LemonSqueezy (subscriptions)
- OpenAI (embeddings)
- Anthropic Claude (search ranking)

## Local dev

```bash
git clone git@github.com:selucas12/vault.git
cd vault
cp .env.example .env.local
npm install
npm run dev
```

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
GITHUB_TOKEN
NEXT_PUBLIC_LS_CHECKOUT_MONTHLY_URL
NEXT_PUBLIC_LS_CHECKOUT_ANNUAL_URL
LS_PRODUCT_UUID
LS_WEBHOOK_SECRET
LS_API_KEY
LS_VARIANT_MONTHLY
LS_VARIANT_ANNUAL
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_TALLY_VAULT_FORM_ID
ADMIN_EMAIL
```

Fill in your own Supabase project + API keys. The app degrades gracefully when keys are missing — pages render "coming soon" states instead of crashing.

## Contributing

PRs welcome. Open an issue first so we can discuss the approach before you write code.

## License

MIT

---

A [Cheesyboy](https://cheesyboy.dev) product. Email [meow@cheesyboy.dev](mailto:meow@cheesyboy.dev).
