/**
 * Aurora — src/components/landing/MaterialIndex.tsx
 *
 * Fabric & Materials index page section showcasing high-end luxury textiles with macro close-ups.
 */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { EyebrowLabel } from "@/components/ui/EyebrowLabel";
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
            <article aria-label={material.name}>
              <div
                className="relative overflow-hidden rounded-[20px] bg-white cursor-pointer group transition-all duration-300 border border-transparent hover:border-accent-primary aspect-[3/4]"
                style={{
                  boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                {/* Material Image */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <div className="relative w-full h-full">
                    <Image
                      src={material.image}
                      alt={`Macro texture close-up of ${material.name}`}
                      fill
                      quality={85}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover object-center transition-transform duration-[800ms] ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10 transition-opacity duration-300 group-hover:from-black/90" />
                  </div>
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 text-white z-10">
                  <div className="pr-16">
                    <span className="text-xs font-semibold tracking-[0.2em] uppercase text-accent-primary mb-2 block opacity-90">
                      {material.source}
                    </span>
                    <h3 className="font-display font-black text-2xl tracking-[0.05em] uppercase mb-1">
                      {material.name}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed max-h-0 group-hover:max-h-24 opacity-0 group-hover:opacity-100 group-hover:mt-3 transition-all duration-500 overflow-hidden">
                      {material.description}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
