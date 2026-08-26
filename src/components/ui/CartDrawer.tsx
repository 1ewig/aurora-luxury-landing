/**
 * Aurora — src/components/ui/CartDrawer.tsx
 *
 * Slide-in cart drawer with item list, quantity controls, and checkout CTA.
 */

"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/useCartStore";
import { useBodyScrollLock } from "@/hooks/ui/useBodyScrollLock";
import Image from "next/image";
import { formatCurrency } from "@/utils/formatCurrency";
import { drawerSlide } from "@/animations/variants";

/** Cart slide-out drawer with line items, quantity adjusters, and total. */
export function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQuantity, totalItems, totalPrice } =
    useCartStore();

  useBodyScrollLock(isOpen);

  const count = totalItems();
  const total = totalPrice();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            variants={drawerSlide}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border-subtle">
              <h2 className="font-medium text-text-primary text-base">
                Shopping Bag{" "}
                <span className="text-text-muted font-normal">({count})</span>
              </h2>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="p-2 hover:bg-bg-primary rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <p className="text-text-secondary">Your bag is empty.</p>
                  <p className="text-sm text-text-muted">
                    Add something beautiful to continue.
                  </p>
                </div>
              ) : (
                <ul className="space-y-6">
                  {items.map((item) => (
                    <li
                      key={`${item.id}-${item.size}`}
                      className="flex gap-4"
                    >
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeCart}
                        className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-bg-primary relative"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          quality={50}
                          sizes="80px"
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeCart}
                          className="font-medium text-text-primary text-sm leading-snug hover:text-accent-primary transition-colors"
                        >
                          {item.name}
                        </Link>
                        <p className="text-text-muted text-xs mt-1">
                          Size: {item.size}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                item.quantity > 1
                                  ? updateQuantity(
                                      item.id,
                                      item.size,
                                      item.quantity - 1
                                    )
                                  : removeItem(item.id, item.size)
                              }
                              className="w-7 h-7 rounded-full border border-border-subtle flex items-center justify-center text-sm hover:border-text-primary transition-colors"
                            >
                              −
                            </button>
                            <span className="text-sm w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.size,
                                  item.quantity + 1
                                )
                              }
                              className="w-7 h-7 rounded-full border border-border-subtle flex items-center justify-center text-sm hover:border-text-primary transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-mono text-sm font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.size)}
                        aria-label={`Remove ${item.name}`}
                        className="text-text-muted hover:text-text-primary transition-colors self-start mt-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-8 py-6 border-t border-border-subtle">
                <div className="flex justify-between mb-6">
                  <span className="text-text-secondary">Total</span>
                  <span className="font-mono font-medium text-text-primary">
                    {formatCurrency(total)}
                  </span>
                </div>
                <Link href="/checkout" onClick={closeCart} className="block w-full">
                  <Button variant="filled" size="lg" fullWidth>
                    Checkout →
                  </Button>
                </Link>
                <p className="text-center text-xs text-text-muted mt-3">
                  Complimentary shipping on orders over $500
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
