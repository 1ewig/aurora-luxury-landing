/**
 * Aurora — src/app/(store)/error.tsx
 *
 * Segment error boundary for storefront routes (landing, catalog, PDP, checkout).
 * Renders a luxury branded recovery view when an unhandled exception occurs.
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Aurora Storefront Error]:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center bg-bg-primary px-6 py-20 text-center">
      <div className="max-w-lg w-full space-y-8">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-secondary/60 border border-accent-primary/40 text-accent-vivid text-xs font-bold uppercase tracking-[0.2em]">
          Unexpected Occurrence
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-4">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-text-primary tracking-tight">
            Something went amiss.
          </h1>
          <p className="text-text-secondary text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            We encountered an issue preparing this collection view. You may retry or return to our homepage.
          </p>
        </div>

        {/* Optional error digest */}
        {error?.digest && (
          <p className="font-mono text-xs text-text-muted bg-white border border-border-subtle inline-block px-3 py-1.5 rounded-md">
            ID: {error.digest}
          </p>
        )}

        {/* Recovery CTA actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button variant="filled" size="lg" onClick={() => reset()}>
            Try Again
          </Button>
          <Link href="/">
            <Button variant="ghost" size="lg">
              Return Home →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
