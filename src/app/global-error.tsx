/**
 * Aurora — src/app/global-error.tsx
 *
 * Root Next.js error boundary that catches uncaught exceptions in the root layout.
 * Renders an independent <html> and <body> document structure as required by Next.js.
 */

"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Aurora Global Error]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F7F5] text-[#111111] font-sans antialiased flex flex-col items-center justify-center p-6 select-none">
        <div className="max-w-md w-full text-center space-y-8 bg-white border border-[#E8E8E4] rounded-3xl p-8 sm:p-12 shadow-sm">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8DDD0]/50 border border-[#C8A882]/40 text-[#B8860B] text-xs font-bold uppercase tracking-widest">
            System Fault
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
              Critical Application Error
            </h1>
            <p className="text-[#6B6B6B] text-sm leading-relaxed">
              An unexpected system anomaly interrupted this session. Our telemetry has logged the event.
            </p>
          </div>

          {/* Error Digest (if available) */}
          {error?.digest && (
            <div className="px-3 py-2 bg-[#F7F7F5] border border-[#E8E8E4] rounded-lg text-xs font-mono text-[#6B6B6B] select-all">
              Reference: {error.digest}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => reset()}
              className="px-7 py-3.5 rounded-full bg-[#0D0D0D] text-[#F7F7F5] text-sm font-medium hover:bg-[#111111] transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-7 py-3.5 rounded-full bg-transparent border border-[#111111] text-[#111111] text-sm font-medium hover:bg-[#111111] hover:text-[#F7F7F5] transition-all cursor-pointer active:scale-95"
            >
              Reload Aurora
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
