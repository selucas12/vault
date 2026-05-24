-- Vault seed data — 5 hand-curated entries to prove the schema works.
-- Apply AFTER 0001_init.sql and 0002_featured.sql. Safe to re-run
-- (uses ON CONFLICT on source_url).
--
-- Embeddings are intentionally NULL — the scraper or a manual backfill
-- (UPDATE codes SET embedding = ... ) will populate them. /api/search
-- returns 0 matches against null embeddings, which is the expected
-- "search is offline" path until embeddings exist.

insert into codes (
  source_url, source_type, title, description,
  ai_platforms, delivery_targets, install_command,
  language, github_url, stars, license, author,
  last_verified_at, last_verified_status,
  approved, category, featured, editor_note
) values
-- 1. Cheesyboy itself — the parent product, ground truth for the schema.
(
  'https://cheesyboy.dev',
  'manual',
  'Cheesyboy',
  'Control Claude Code from Telegram. Approve permission prompts, see session events, and stay reachable away from your desk. macOS, $9.99 lifetime.',
  array['claude']::text[],
  array['telegram']::text[],
  'bash <(curl -fsSL https://cheesyboy.dev/install.sh)',
  'TypeScript',
  'https://github.com/selucas12/cheesy',
  0,
  'MIT',
  'selucas12',
  now(),
  'working',
  true,
  'featured',
  true,
  'The reason Vault exists. We use this every day to keep working from anywhere — Claude Code in tmux on the Mac mini, permission prompts on the phone. The only Telegram bridge we trust with our own builds.'
),
-- 2. yym68686/ChatGPT-Telegram-Bot — multi-model bot (GPT, Claude, Gemini, Groq).
(
  'https://github.com/yym68686/ChatGPT-Telegram-Bot',
  'github-awesome',
  'ChatGPT-Telegram-Bot',
  'Multi-model Telegram bot supporting GPT-5, Claude, Gemini, Groq, and more. Configure providers via env vars; one bot, many backends.',
  array['gpt', 'claude', 'gemini', 'groq']::text[],
  array['telegram']::text[],
  'git clone https://github.com/yym68686/ChatGPT-Telegram-Bot && cd ChatGPT-Telegram-Bot && pip install -r requirements.txt',
  'Python',
  'https://github.com/yym68686/ChatGPT-Telegram-Bot',
  3200,
  'MIT',
  'yym68686',
  now(),
  'working',
  true,
  'multi-model',
  false,
  null
),
-- 3. n3d1117/chatgpt-telegram-bot — the classic OpenAI-only Telegram bot.
(
  'https://github.com/n3d1117/chatgpt-telegram-bot',
  'github-awesome',
  'chatgpt-telegram-bot',
  'A Telegram bot that integrates with the OpenAI API. Supports streaming responses, image generation, voice transcription. Docker-ready.',
  array['gpt']::text[],
  array['telegram']::text[],
  'docker run -d --env-file .env n3d1117/chatgpt-telegram-bot',
  'Python',
  'https://github.com/n3d1117/chatgpt-telegram-bot',
  3800,
  'GPL-2.0',
  'n3d1117',
  now(),
  'working',
  true,
  'openai-classic',
  false,
  null
),
-- 4. father-bot/chatgpt_telegram_bot — long-running conversational bot with memory.
(
  'https://github.com/father-bot/chatgpt_telegram_bot',
  'github-awesome',
  'chatgpt_telegram_bot',
  'Conversational ChatGPT Telegram bot with persistent context, custom chat modes, voice messages, and group chat support.',
  array['gpt']::text[],
  array['telegram']::text[],
  'docker-compose --env-file config/config.env up --build',
  'Python',
  'https://github.com/father-bot/chatgpt_telegram_bot',
  8400,
  'MIT',
  'father-bot',
  now(),
  'working',
  true,
  'conversational',
  false,
  null
),
-- 5. A Gemini Telegram bot — proves we cover the non-OpenAI side.
(
  'https://github.com/H-T-H/Gemini-Telegram-Bot',
  'github-awesome',
  'Gemini-Telegram-Bot',
  'Telegram bot powered by Google Gemini Pro / Pro Vision. Supports image input, multi-turn chat, configurable system prompt.',
  array['gemini']::text[],
  array['telegram']::text[],
  'pip install -r requirements.txt && python main.py',
  'Python',
  'https://github.com/H-T-H/Gemini-Telegram-Bot',
  420,
  'MIT',
  'H-T-H',
  now(),
  'working',
  true,
  'gemini',
  false,
  null
)
on conflict (source_url) do update set
  title = excluded.title,
  description = excluded.description,
  ai_platforms = excluded.ai_platforms,
  delivery_targets = excluded.delivery_targets,
  install_command = excluded.install_command,
  language = excluded.language,
  github_url = excluded.github_url,
  stars = excluded.stars,
  license = excluded.license,
  author = excluded.author,
  last_verified_at = excluded.last_verified_at,
  last_verified_status = excluded.last_verified_status,
  approved = excluded.approved,
  category = excluded.category,
  featured = excluded.featured,
  editor_note = excluded.editor_note,
  updated_at = now();
