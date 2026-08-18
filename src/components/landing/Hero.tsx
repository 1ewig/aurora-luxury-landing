/**
 * Aurora — src/components/landing/Hero.tsx
 *
 * Landing page hero section with animated headline, cascade product cards, and CTAs.
 */

"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { EyebrowLabel } from "@/components/ui/EyebrowLabel";
import { AnimatedText } from "@/components/ui/AnimatedText";
import type { Product } from "@/data/products";
import { CascadeCards } from "./ui/CascadeCards";

interface HeroProps {
  products: Product[];
}

/** Landing page hero with animated headline, cascade cards, and call-to-action buttons. */
export function Hero({ products }: HeroProps) {

  return (
    <section
      id="hero"
      aria-labelledby="hero-headline"
      className="relative flex flex-col items-center justify-center min-h-screen pt-32 md:pt-36 pb-16 overflow-hidden bg-bg-primary"
    >
      {/* Ambient background gradient blobs */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[60vh] rounded-full opacity-[0.08]"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(200,168,130,0.2) 0%, rgba(200,168,130,0.02) 50%, transparent 80%)",
            filter: "blur(120px)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[45vw] h-[45vh] rounded-full opacity-[0.05]"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(200,168,130,0.2) 0%, rgba(200,168,130,0.02) 50%, transparent 80%)",
            filter: "blur(160px)",
          }}
        />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center text-center w-full max-w-6xl mx-auto px-6"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <EyebrowLabel>SS 2026 Collection</EyebrowLabel>
        </motion.div>

        {/* H1 Headline */}
        <h1
          id="hero-headline"
          className="font-sans font-black leading-none tracking-[-0.04em] mt-6 text-text-primary w-full"
          style={{ fontSize: "clamp(3rem, 9vw, 9rem)" }}
        >
          <AnimatedText delay={0.2} immediate>
            <span className="block">Wear What</span>
          </AnimatedText>
          <AnimatedText delay={0.35} immediate>
            <span className="block">The World</span>
          </AnimatedText>
          <AnimatedText delay={0.5} immediate>
            <span className="block text-accent-primary">
              Whispers.
            </span>
          </AnimatedText>
        </h1>

        {/* Cascade Cards — positioned relative to create space */}
        <div className="relative w-full mt-12 md:mt-14 min-h-[260px] md:min-h-[440px]">
          <CascadeCards products={products} />
        </div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-text-secondary text-base md:text-lg font-light max-w-sm md:max-w-md mt-10 md:mt-8 leading-relaxed"
        >
          Singular pieces for the considered wardrobe. Designed in solitude.
          Worn with intention.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-row gap-2 sm:gap-4 mt-8"
        >
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex-1 min-w-0 sm:flex-none"
          >
            <Link href="/products" prefetch={false}>
              <Button
                variant="filled"
                size="lg"
                className="whitespace-nowrap w-full px-3.5 py-3 text-[12px] min-[380px]:px-4 min-[380px]:text-[13px] sm:w-auto sm:px-9 sm:py-4 sm:text-base"
              >
                Shop the Collection
              </Button>
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex-1 min-w-0 sm:flex-none"
          >
            <Button
              variant="ghost"
              size="lg"
              className="whitespace-nowrap w-full px-3.5 py-3 text-[12px] min-[380px]:px-4 min-[380px]:text-[13px] sm:w-auto sm:px-9 sm:py-4 sm:text-base"
              onClick={() => {
                document
                  .getElementById("story")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Read the Story →
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>


    </section>
  );
}
