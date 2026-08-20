/**
 * Aurora — src/components/landing/LookbookSlider.tsx
 *
 * Full-screen lookbook carousel with Embla, autoplay, prev/next, and dot navigation.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";

interface LookbookSlide {
  imageUrl: string;
  altText: string;
  title?: string;
  link?: string;
}

interface LookbookSliderProps {
  slides: LookbookSlide[];
}

/** Full-screen lookbook carousel with auto-advance and dot navigation. */
export function LookbookSlider({ slides }: LookbookSliderProps) {

  const autoplay = useMemo(
    () => Autoplay({ delay: 6000, stopOnInteraction: true }),
    []
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scheduleResume = useCallback(() => {
    clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      autoplay.play();
    }, 10000);
  }, [autoplay]);

  useEffect(() => {
    return () => clearTimeout(resumeTimerRef.current);
  }, []);

  const scrollTo = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
      scheduleResume();
    },
    [emblaApi, scheduleResume]
  );

  return (
    <section
      aria-labelledby="lookbook-heading"
      aria-roledescription="carousel"
      className="relative w-full overflow-hidden bg-bg-ink"
    >
      <h2 id="lookbook-heading" className="sr-only">
        Lookbook — Aurora SS 2026
      </h2>

      <div className="relative aspect-square md:aspect-[16/9]">
        {/* Embla viewport */}
        <div ref={emblaRef} className="overflow-hidden h-full">
          <div className="flex h-full">
            {slides.map((slide, i) => (
              <figure
                key={i}
                className="relative flex-[0_0_100%] min-w-0 h-full"
                aria-label={`Look ${i + 1} of ${slides.length}`}
              >
                <Image
                  src={slide.imageUrl}
                  alt={slide.altText}
                  fill
                  quality={100}
                  sizes="100vw"
                  className="w-full h-full object-cover object-center"
                />

                {/* Gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Caption + button group (bottom-right) */}
                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
                  <Link href={slide.link || "/products"} className="inline-block">
                    <button className="px-5 py-2 rounded-full border border-white/50 text-white text-sm font-medium backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                      Shop The Look
                    </button>
                  </Link>
                  <figcaption className="text-white/70 text-xs tracking-[0.15em] uppercase font-mono">
                    {slide.title ?? `Look 0${i + 1}`} / {i + 1} of {slides.length}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>

      </div>

      {/* Dot Indicators */}
      <div
        role="tablist"
        aria-label="Lookbook slides"
        className="flex justify-center gap-2 py-2"
      >
        {slides.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === selectedIndex}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => scrollTo(i)}
            className={`h-[3px] rounded-full transition-all duration-300 ${
              i === selectedIndex
                ? "w-6 bg-accent-primary"
                : "w-2 bg-white/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
