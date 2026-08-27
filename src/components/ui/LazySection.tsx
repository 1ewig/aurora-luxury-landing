/**
 * Aurora — src/components/ui/LazySection.tsx
 *
 * LazySection component wraps below-the-fold sections and defers rendering
 * until they enter (or get close to) the viewport using IntersectionObserver.
 * This drastically reduces initial main-thread work and bundle hydration storms (TBT).
 */

"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  height?: string; // height CSS class to prevent layout shifts (CLS) on lazy load
  id?: string; // anchor id rendered on the always-present wrapper so section links resolve before mount
}

export function LazySection({ children, height = "min-h-[400px]", id }: LazySectionProps) {
  const [inView, setInView] = useState(() => typeof window !== "undefined" && !("IntersectionObserver" in window));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "300px", // Preload slightly before scroll brings it into viewport
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} id={id} className={`${inView ? "" : height} scroll-mt-20`}>
      {inView ? children : null}
    </div>
  );
}
