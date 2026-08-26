/**
 * Aurora — src/app/(admin)/admin/error.tsx
 *
 * Segment error boundary for administrative panel sub-routes.
 * Catches uncaught runtime errors in admin pages and contains them within
 * the admin layout shell with diagnostic reference and retry controls.
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Aurora Admin Error]:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white border border-border-subtle rounded-3xl p-8 sm:p-12 shadow-sm space-y-6">
        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-text-primary">
            Admin Operation Failed
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            An unexpected error occurred while loading this admin workspace component.
          </p>
        </div>

        {/* Digest */}
        {error?.digest && (
          <div className="px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg text-xs font-mono text-text-muted select-all">
            Digest: {error.digest}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="filled" size="md" onClick={() => reset()}>
            Retry Operation
          </Button>
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="md">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
