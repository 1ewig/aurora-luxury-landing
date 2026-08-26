/**
 * Aurora — src/components/landing/FeaturedCollection.tsx
 *
 * Featured collection product grid section displaying curated products.
 */

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { EyebrowLabel } from "@/components/ui/EyebrowLabel";
import { Button } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { staggerContainer, scaleIn, fadeInUp } from "@/animations/variants";
import type { CategoryMetadata } from "@/hooks/queries";

interface FeaturedCollectionProps {
  categories: CategoryMetadata[];
}

/** Featured collection grid displaying dynamic daily categories with animations. */
export function FeaturedCollection({ categories }: FeaturedCollectionProps) {
  return (
    <section
      aria-labelledby="collection-heading"
      className="py-20 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto"
    >
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-16 text-center md:text-left md:flex md:items-center md:justify-between"
      >
        <div>
          <EyebrowLabel>Curated Edits</EyebrowLabel>
          <h2
            id="collection-heading"
            className="font-sans font-black leading-tight tracking-[-0.02em] mt-4 text-text-primary"
            style={{ fontSize: "clamp(2.5rem, 5vw, 5.5rem)" }}
          >
            Seasonal <span className="text-accent-primary">Edit.</span>
          </h2>
        </div>
        <p className="text-text-secondary font-light text-sm md:text-base max-w-sm mt-4 md:mt-0 leading-relaxed text-center md:text-left">
          Curated seasonal capsules designed for versatile elegance and lasting ease.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10% 0px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {categories.map((category) => (
          <motion.div
            key={category.slug}
            variants={scaleIn}
          >
            <FeatureCard
              image={category.image}
              alt={`${category.name} cover`}
              eyebrow="Collection"
              title={category.name}
              description={category.description}
              href={`/products/category/${category.slug}`}
              imagePosition="center"
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="flex justify-center mt-16">
        <Link href="/products">
          <Button
            variant="ghost"
            size="lg"
          >
            View Entire Collection →
          </Button>
        </Link>
      </div>
    </section>
  );
}
