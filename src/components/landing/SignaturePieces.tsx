/**
 * Aurora — src/components/landing/SignaturePieces.tsx
 *
 * Curated grid of the brand's signature pieces with overlay card presentation.
 */

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { EyebrowLabel } from "@/components/ui/EyebrowLabel";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatCurrency";
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
        {products.map((product, i) => {
          return (
            <motion.div
              key={product.id}
              variants={cardEnter(i)}
            >
              <article aria-label={product.name}>
                <Link href={`/products/${product.slug}`} className="block">
                  <div
                    className="relative overflow-hidden rounded-[20px] bg-white cursor-pointer group transition-all duration-300 border border-transparent hover:border-accent-primary aspect-[3/4]"
                    style={{
                      boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Product Image */}
                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                      <div className="relative w-full h-full">
                        <Image
                          src={product.image}
                          alt={product.altText}
                          fill
                          quality={85}
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover object-top transition-transform duration-[800ms] ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10 transition-opacity duration-300 group-hover:from-black/90" />
                      </div>
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-8 text-white z-10">
                      <div className="pr-16">
                        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-accent-primary mb-2 block opacity-90">
                          {product.category}
                        </span>
                        <h3 className="font-display font-black text-2xl tracking-[0.05em] uppercase mb-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed max-h-0 group-hover:max-h-24 opacity-0 group-hover:opacity-100 group-hover:mt-3 transition-all duration-500 overflow-hidden">
                          {product.description}
                        </p>
                        <div className="mt-2">
                          <span className="font-mono text-sm text-white">
                            {formatCurrency(product.price)}
                          </span>
                        </div>
                      </div>

                      <div className="absolute bottom-8 right-8 w-11 h-11 rounded-full border border-white/30 flex items-center justify-center bg-transparent transition-all duration-300 group-hover:bg-accent-primary group-hover:border-accent-primary group-hover:scale-105">
                        <svg
                          className="w-5 h-5 text-white transition-transform duration-300 group-hover:translate-x-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            </motion.div>
          );
        })}
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
