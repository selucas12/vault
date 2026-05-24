import * as cheerio from "cheerio";
import pThrottle from "p-throttle";
import { classifyAIPlatforms, classifyDeliveryTargets } from "../classify";
import type { RawEntry, SourceModule } from "../types";

// Make.com template scraper. No public API; HTML scraping of
// https://www.make.com/en/templates?page=N.
//
// Rate limit: 1 request per 2 seconds (Make is aggressive about bot detection).

const BASE = "https://www.make.com/en/templates";
const throttle = pThrottle({ limit: 1, interval: 2200 });

async function fetchPage(page: number): Promise<string | null> {
  const url = page > 1 ? `${BASE}?page=${page}` : BASE;
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) return null;
  return res.text();
}

const throttledFetch = throttle(fetchPage);

interface TemplateCard {
  title: string;
  description: string;
  apps: string[];
  href: string;
}

function parseCards(html: string): TemplateCard[] {
  const $ = cheerio.load(html);
  const cards: TemplateCard[] = [];

  // Try multiple selector patterns — Make.com redesigns occasionally.
  // Pattern A: `.template-card` with `.template-card__title`, etc.
  // Pattern B: `[data-template-id]` wrapper elements.
  // Pattern C: generic link cards with `a[href*="/templates/"]`.
  const selectors = [
    { card: ".template-card", title: ".template-card__title", desc: ".template-card__description", apps: ".template-card__apps img[alt]", link: "a[href]" },
    { card: "[data-template-id]", title: "h3, .title", desc: "p, .description", apps: "img[alt]", link: "a[href]" },
    { card: "a[href*='/templates/']", title: "h3, h4, .title", desc: "p", apps: "img[alt]", link: null },
  ];

  for (const sel of selectors) {
    $(sel.card).each((_, el) => {
      const $el = $(el);
      const title = $el.find(sel.title).first().text().trim();
      if (!title) return;
      const desc = $el.find(sel.desc).first().text().trim();
      const apps: string[] = [];
      $el.find(sel.apps).each((_, img) => {
        const alt = $(img).attr("alt");
        if (alt) apps.push(alt);
      });
      let href = "";
      if (sel.link) {
        href = $el.find(sel.link).first().attr("href") ?? "";
      } else {
        href = $el.attr("href") ?? "";
      }
      if (href && !href.startsWith("http")) {
        href = `https://www.make.com${href}`;
      }
      cards.push({ title, description: desc, apps, href });
    });
    if (cards.length > 0) break; // use the first selector that matched
  }
  return cards;
}

export const makeSource: SourceModule = {
  type: "make",
  name: "Make.com templates",
  maxEntries: 100,
  autoApprove: false,
  async run({ limit, logger }) {
    const results: RawEntry[] = [];
    let page = 1;
    let consecutiveEmpty = 0;

    while (results.length < limit && consecutiveEmpty < 3) {
      logger(`Fetching Make.com page ${page}…`);
      const html = await throttledFetch(page);
      if (!html) {
        logger(`  Page ${page} returned non-200. Stopping.`);
        break;
      }

      const cards = parseCards(html);
      if (cards.length === 0) {
        consecutiveEmpty++;
        logger(`  No cards found on page ${page} (consecutiveEmpty=${consecutiveEmpty})`);
        page++;
        continue;
      }
      consecutiveEmpty = 0;

      for (const card of cards) {
        if (results.length >= limit) break;
        // Classify using app names from the card's icon strip.
        const text = `${card.title} ${card.description} ${card.apps.join(" ")}`;
        const ai = classifyAIPlatforms(text);
        const target = classifyDeliveryTargets(text);
        if (ai.length === 0 || target.length === 0) continue;
        results.push({
          source_url: card.href || `https://www.make.com/en/templates?search=${encodeURIComponent(card.title)}`,
          source_type: "make",
          title: card.title,
          description: card.description || null,
          ai_platforms: ai,
          delivery_targets: target,
          install_command: null,
          language: "make-scenario",
          github_url: null,
          stars: 0,
          license: null,
          author: null,
          category: "make-template",
        });
      }
      logger(`  ${cards.length} cards, ${results.length} kept so far`);
      page++;
    }

    if (results.length === 0 && page > 1) {
      logger(
        "WARNING: Make.com HTML structure may have changed. All selector patterns returned zero cards. See deferred list.",
      );
    }

    return results.slice(0, limit);
  },
};
