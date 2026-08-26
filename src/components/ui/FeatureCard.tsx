/**
 * Aurora — src/components/ui/FeatureCard.tsx
 *
 * Full-bleed image card with gradient overlay, gold eyebrow label, title,
 * hover-revealed description, optional price tag, and optional circular arrow action.
 */

import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/utils/formatCurrency";
import { cn } from "@/utils/cn";

export interface FeatureCardProps {
  image: string;
  alt?: string;
  eyebrow: string;
  title: string;
  description?: string;
  price?: number;
  href?: string;
  imagePosition?: "top" | "center";
  showArrow?: boolean;
  className?: string;
}

/** Full-bleed image overlay card with expandable description and subtle hover interactions. */
export function FeatureCard({
  image,
  alt,
  eyebrow,
  title,
  description,
  price,
  href,
  imagePosition = "center",
  showArrow,
  className,
}: FeatureCardProps) {
  const shouldShowArrow = showArrow ?? Boolean(href);

  const cardContent = (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] bg-white cursor-pointer group transition-all duration-300 border border-transparent hover:border-accent-primary aspect-[3/4]",
        className
      )}
      style={{
        boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src={image}
            alt={alt || title}
            fill
            quality={85}
            sizes="(max-width: 768px) 100vw, 33vw"
            className={cn(
              "object-cover transition-transform duration-[800ms] ease-out group-hover:scale-105",
              imagePosition === "top" ? "object-top" : "object-center"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10 transition-opacity duration-300 group-hover:from-black/90" />
        </div>
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-8 text-white z-10">
        <div className={cn(shouldShowArrow && "pr-16")}>
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-accent-primary mb-2 block opacity-90">
            {eyebrow}
          </span>
          <h3 className="font-display font-black text-2xl tracking-[0.05em] uppercase mb-1">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-text-muted leading-relaxed max-h-0 group-hover:max-h-24 opacity-0 group-hover:opacity-100 group-hover:mt-3 transition-all duration-500 overflow-hidden">
              {description}
            </p>
          )}
          {typeof price === "number" && (
            <div className="mt-2">
              <span className="font-mono text-sm text-white">
                {formatCurrency(price)}
              </span>
            </div>
          )}
        </div>

        {/* Circular Action Arrow Button */}
        {shouldShowArrow && (
          <div
            aria-hidden="true"
            className="absolute bottom-8 right-8 w-11 h-11 rounded-full border border-white/30 flex items-center justify-center bg-transparent transition-all duration-300 group-hover:bg-accent-primary group-hover:border-accent-primary group-hover:scale-105"
          >
            <svg
              className="w-5 h-5 text-white transition-transform duration-300 group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <article aria-label={title}>
      {href ? (
        <Link href={href} className="block">
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </article>
  );
}
