// Renders a JSON-LD structured-data script tag. Use to expose machine-readable
// metadata to Google, Slack/Discord/X unfurls, etc.

interface Props {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // Next.js serializes via dangerouslySetInnerHTML for ld+json. Safe — data
      // is constructed in our own server code, not from user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
