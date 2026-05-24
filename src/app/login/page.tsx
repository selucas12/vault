import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Vault with a magic link.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Sign in</h1>
      <p className="text-[var(--color-ink-muted)] text-sm mb-6">
        We&apos;ll email you a magic link. No password required.
      </p>
      <Suspense fallback={<div className="card animate-pulse h-40" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
