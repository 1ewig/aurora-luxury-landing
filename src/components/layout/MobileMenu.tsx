/**
 * Aurora — src/components/layout/MobileMenu.tsx
 *
 * Full-screen overlay menu for mobile navigation with staggered link animations.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SectionLink } from "@/components/ui/SectionLink";
import { staggerContainer, menuItemVariant } from "@/animations/variants";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: Array<{ href: string; label: string }>;
}

export function MobileMenu({
  isOpen,
  onClose,
  navLinks,
}: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mobile-menu"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={{
            hidden: { x: "100%", opacity: 0 },
            visible: { x: 0, opacity: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
            exit: { x: "100%", opacity: 0, transition: { duration: 0.4, ease: [0.55, 0.06, 0.68, 0.19] } },
          }}
          className="fixed inset-0 z-[55] bg-bg-ink flex flex-col items-start justify-center px-10"
        >
          {/* Close button */}
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="absolute top-5 right-6 text-text-inverted p-2 text-2xl hover:text-accent-primary transition-colors cursor-pointer"
          >
            ✕
          </button>

          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            role="list"
            className="space-y-6"
          >
            {navLinks.map((link) => (
              <motion.li key={link.label} variants={menuItemVariant}>
                <SectionLink
                  href={link.href}
                  onClick={onClose}
                  className="text-5xl font-black text-text-inverted hover:text-accent-primary transition-colors tracking-tight leading-none block"
                >
                  {link.label}
                </SectionLink>
              </motion.li>
            ))}
            

          </motion.ul>

          <div className="mt-16">
            <p className="text-text-muted text-sm tracking-wide">
              SS 2026 Collection
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
