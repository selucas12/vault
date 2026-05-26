import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <div className="mb-6 flex justify-center">
        <Image
          src="/cheesy/circle%20cheesy%20160x160.png"
          alt="Cheesyboy"
          width={80}
          height={80}
          className="rounded-full opacity-60"
        />
      </div>
      <h1 className="text-3xl font-bold mb-3">Lost your way?</h1>
      <p className="text-[var(--color-ink-muted)] mb-8">
        This page doesn&apos;t exist &mdash; but our directory has 127+ AI integrations that do.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/directory" className="btn-primary">
          Browse the Directory
        </Link>
        <Link href="/search" className="btn-ghost">
          Search with AI
        </Link>
      </div>
    </div>
  );
}
