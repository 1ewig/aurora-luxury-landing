/**
 * Aurora — src/components/product/listing/FilterDrawer.tsx
 *
 * Slide-out drawer for category and sort filters on mobile/tablet.
 */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: readonly string[];
  activeCategory: string;
  sortBy: string;
  onApply: (category: string, sortBy: string) => void;
}

/** Renders an animated side drawer with category and sort selection controls. */
export function FilterDrawer({
  isOpen,
  onClose,
  categories,
  activeCategory,
  sortBy,
  onApply,
}: FilterDrawerProps) {
  const [tempCategory, setTempCategory] = useState(activeCategory);
  const [tempSortBy, setTempSortBy] = useState(sortBy);
  const [prevOpen, setPrevOpen] = useState(isOpen);

  if (prevOpen !== isOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setTempCategory(activeCategory);
      setTempSortBy(sortBy);
    }
  }

  const sortOptions = [
    { value: "featured", label: "Featured" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A-Z" },
    { value: "name-desc", label: "Name: Z-A" },
  ];

  const handleApply = () => {
    onApply(tempCategory, tempSortBy);
    onClose();
  };

  const handleReset = () => {
    setTempCategory("All");
    setTempSortBy("featured");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-bg-secondary shadow-2xl flex flex-col h-full border-l border-border-subtle"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border-subtle">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-text-primary">
                Filters
              </h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                aria-label="Close filters"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Categories Section */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
                  Categories
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => {
                    const isSelected = tempCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setTempCategory(category)}
                        className={cn(
                          "px-4 py-3 rounded-xl border text-xs font-semibold uppercase tracking-wider text-left transition-all duration-300 cursor-pointer select-none outline-none",
                          isSelected
                            ? "bg-bg-ink border-bg-ink text-text-inverted"
                            : "bg-bg-primary/50 border-border-medium/60 text-text-secondary hover:border-text-primary hover:text-text-primary"
                        )}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort Section */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
                  Sort By
                </h3>
                <div className="space-y-2">
                  {sortOptions.map((option) => {
                    const isSelected = tempSortBy === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTempSortBy(option.value)}
                        className={cn(
                          "w-full flex items-center justify-between px-5 py-3.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer select-none outline-none",
                          isSelected
                            ? "bg-bg-ink border-bg-ink text-text-inverted"
                            : "bg-bg-primary/50 border-border-medium/60 text-text-secondary hover:border-text-primary hover:text-text-primary"
                        )}
                      >
                        <span>{option.label}</span>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border-subtle bg-bg-primary/30 flex items-center gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-4 border border-border-medium text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-bg-primary transition-colors duration-300 cursor-pointer select-none text-center"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 py-4 bg-bg-ink text-text-inverted text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-text-primary transition-colors duration-300 cursor-pointer select-none text-center"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
