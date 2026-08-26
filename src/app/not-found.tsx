/**
 * Aurora — src/app/not-found.tsx
 *
 * Global 404 fallback page for unmatched top-level routes outside specific route groups.
 */

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function RootNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary px-6 py-20 text-center">
      <div className="max-w-md w-full space-y-6">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-secondary/60 border border-accent-primary/40 text-accent-vivid text-xs font-bold uppercase tracking-[0.2em]">
          Page Not Found
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-3">
          <h1 className="font-display font-black text-6xl md:text-8xl text-text-primary tracking-tight">
            404
          </h1>
          <p className="text-text-secondary text-base sm:text-lg leading-relaxed">
            The requested destination could not be located across our storefront.
          </p>
        </div>

        {/* Action button */}
        <div className="pt-4">
          <Link href="/">
            <Button variant="filled" size="lg">
              Return to Storefront →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
