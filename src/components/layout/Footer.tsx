/**
 * Aurora — src/components/layout/Footer.tsx
 *
 * Site footer with brand statement, navigation columns, social links, and legal.
 */

import Link from "next/link";
import { SectionLink } from "@/components/ui/SectionLink";
import { getCachedCategories } from "@/app/api/categories/route";
import { categoryDataList } from "@/data/categories";


function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83.18-.77 1.24-5.26 1.24-5.26s-.32-.63-.32-1.57c0-1.47.85-2.57 1.91-2.57.9 0 1.34.68 1.34 1.49 0 .91-.58 2.27-.88 3.53-.25 1.06.53 1.92 1.57 1.92 1.88 0 3.15-2.4 3.15-5.23 0-2.16-1.46-3.67-3.55-3.67-2.42 0-3.84 1.82-3.84 3.7 0 .73.28 1.52.63 1.95a.25.25 0 01.06.24l-.23.96c-.04.15-.12.18-.28.11-1.05-.49-1.71-2.02-1.71-3.25 0-2.65 1.92-5.07 5.54-5.07 2.91 0 5.16 2.07 5.16 4.84 0 2.89-1.82 5.21-4.34 5.21-.85 0-1.64-.44-1.91-.96l-.52 1.93c-.19.71-.69 1.61-1.03 2.15.78.24 1.6.37 2.45.37 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
  );
}

export async function Footer() {
  let categories = [];
  try {
    categories = await getCachedCategories();
  } catch (error) {
    console.error("Failed to load categories in footer:", error);
  }

  const displayCategories = categories.length > 0 ? categories : categoryDataList;

  return (
    <footer
      role="contentinfo"
      className="bg-bg-primary border-t border-border-subtle"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-20 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Column 1: Brand block */}
          <div className="space-y-8">
            <div>
              <p className="font-display font-black text-2xl tracking-[0.2em] uppercase text-text-primary">
                Aurora
              </p>
              <p className="text-text-secondary text-sm leading-relaxed mt-4 max-w-[280px]">
                Designed in solitude. Worn with intention. High-quality essentials crafted for longevity.
              </p>
            </div>

            <div className="space-y-2 text-xs text-text-muted leading-relaxed">
              <p>Free returns within 30 days.</p>
              <p>Complimentary shipping on orders over $500.</p>
            </div>

            {/* Social Icons */}
            <div className="flex gap-5 text-text-secondary pt-2">
              <a
                href="https://instagram.com"
                aria-label="Aurora on Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary transition-colors"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://pinterest.com"
                aria-label="Aurora on Pinterest"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary transition-colors"
              >
                <PinterestIcon />
              </a>
            </div>

            <p className="text-xs text-text-muted pt-4">
              © 2026 Aurora. All rights reserved.
            </p>
          </div>

          {/* Column 2: Navigation link columns side-by-side */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-text-muted mb-6">
                Collection
              </h3>
              <ul role="list" className="space-y-4">
                <li>
                  <Link
                    href="/products"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Shop All
                  </Link>
                </li>
                {displayCategories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/products/category/${category.slug}`}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-text-muted mb-6">
                Customer Care
              </h3>
              <ul role="list" className="space-y-4">
                <li>
                  <SectionLink
                    href="/#story"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Our Story
                  </SectionLink>
                </li>
                <li>
                  <Link
                    href="/profile"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    My Account
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile/orders"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Track Order
                  </Link>
                </li>
                <li>
                  <SectionLink
                    href="/#newsletter"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Contact & Support
                  </SectionLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
