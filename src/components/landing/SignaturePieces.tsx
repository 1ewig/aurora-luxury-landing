/**
 * Aurora — src/components/landing/SignaturePieces.tsx
 *
 * Curated grid of the brand's signature pieces with overlay card presentation.
 */

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { EyebrowLabel } from "@/components/ui/EyebrowLabel";
import { Button } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { cardEnter, fadeInUp, staggerContainer } from "@/animations/variants";
import type { Product } from "@/data/products";

interface SignaturePiecesProps {
  products: Product[];
}

export function SignaturePieces({ products }: SignaturePiecesProps) {
  return (
    <section
      id="signature-pieces"
      aria-labelledby="signature-heading"
      className="py-20 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto bg-bg-primary"
    >
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-16 text-center md:text-left md:flex md:items-end md:justify-between"
      >
        <div>
          <EyebrowLabel>The Foundation</EyebrowLabel>
          <h2
            id="signature-heading"
            className="font-sans font-black leading-tight tracking-[-0.02em] mt-4 text-text-primary"
            style={{ fontSize: "clamp(2.5rem, 5vw, 5.5rem)" }}
          >
            Signature <span className="text-accent-primary">Pieces.</span>
          </h2>
        </div>
        <p className="text-text-secondary font-light text-sm md:text-base max-w-sm mt-4 md:mt-0 leading-relaxed text-center md:text-left">
          Core wardrobe foundations designed in quiet solitude and crafted to endure.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10% 0px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
      >
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            variants={cardEnter(i)}
          >
            <FeatureCard
              image={product.image}
              alt={product.altText}
              eyebrow={product.category}
              title={product.name}
              description={product.description}
              price={product.price}
              href={`/products/${product.slug}`}
              imagePosition="top"
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="flex justify-center mt-16">
        <Link href="/products">
          <Button variant="ghost" size="lg">
            View All Products →
          </Button>
        </Link>
      </div>
    </section>
  );
}
