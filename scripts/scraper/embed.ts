import OpenAI from "openai";
import pThrottle from "p-throttle";

const throttle = pThrottle({ limit: 5, interval: 1000 });

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (client) return client;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  client = new OpenAI({ apiKey: key });
  return client;
}

async function embedOne(text: string): Promise<number[] | null> {
  const c = getClient();
  if (!c) return null;
  const trimmed = text.slice(0, 8000); // text-embedding-3-small handles long input but we cap defensively
  const res = await c.embeddings.create({ model: "text-embedding-3-small", input: trimmed });
  return res.data[0]!.embedding;
}

export const embedText = throttle(embedOne);
