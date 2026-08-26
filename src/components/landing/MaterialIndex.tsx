/**
 * Aurora — src/components/landing/MaterialIndex.tsx
 *
 * Fabric & Materials index page section showcasing high-end luxury textiles with macro close-ups.
 */

"use client";

import { motion } from "framer-motion";
import { EyebrowLabel } from "@/components/ui/EyebrowLabel";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { fadeInUp, scaleIn, staggerContainer } from "@/animations/variants";
import type { MaterialItem } from "@/data/materials";

interface MaterialIndexProps {
  materials: MaterialItem[];
}

export function MaterialIndex({ materials }: MaterialIndexProps) {
  return (
    <section
      id="materials-index"
      aria-labelledby="materials-heading"
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
          <EyebrowLabel>Tactile Luxury</EyebrowLabel>
          <h2
            id="materials-heading"
            className="font-sans font-black leading-tight tracking-[-0.02em] mt-4 text-text-primary"
            style={{ fontSize: "clamp(2.5rem, 5vw, 5.5rem)" }}
          >
            Material <span className="text-accent-primary">Archive.</span>
          </h2>
        </div>
        <p className="text-text-secondary font-light text-sm md:text-base max-w-sm mt-4 md:mt-0 leading-relaxed text-center md:text-left">
          Noble heritage fabrics chosen with intention and crafted to age with grace.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10% 0px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {materials.map((material) => (
          <motion.div
            key={material.name}
            variants={scaleIn}
          >
            <FeatureCard
              image={material.image}
              alt={`Macro texture close-up of ${material.name}`}
              eyebrow={material.source}
              title={material.name}
              description={material.description}
              imagePosition="center"
              showArrow={false}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
