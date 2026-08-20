/**
 * Aurora — src/components/layout/AnnouncementBar.tsx
 *
 * Top announcement strip for complimentary shipping message.
 * Collapses smoothly when scrolling down and reappears when scrolling up from anywhere.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";

interface AnnouncementBarProps {
  visible?: boolean;
  message?: string;
}

export function AnnouncementBar({
  visible = true,
  message = "Complimentary worldwide shipping on orders over $500.",
}: AnnouncementBarProps) {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="announcement-strip"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            height: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
            opacity: { duration: 0.25, ease: "linear" },
          }}
          className="overflow-hidden bg-bg-ink border-b border-white/5"
        >
          <div className="text-text-inverted text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.18em] uppercase py-2 text-center px-4 font-medium truncate">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
