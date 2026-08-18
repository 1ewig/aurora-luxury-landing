/**
 * Aurora — src/components/product/detail/ProductActions.tsx
 *
 * Add-to-bag and buy-now action buttons with size selection.
 */
"use client";

import { SizeSelector } from "./SizeSelector";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/data/products";

interface ProductActionsProps {
  product: Product;
  selectedSize: string;
  isInCart: boolean;
  onAddToBag: () => void;
  onBuyNow: () => void;
  onSizeChange: (size: string) => void;
  onOpenSizeGuide: () => void;
}

/** Renders size selector and add-to-bag / buy-now action buttons. */
export function ProductActions({
  product,
  selectedSize,
  isInCart,
  onAddToBag,
  onBuyNow,
  onSizeChange,
  onOpenSizeGuide,
}: ProductActionsProps) {
  return (
    <div className="space-y-6 border-t border-border-subtle pt-6">
      <SizeSelector
        sizes={product.sizes || []}
        selectedSize={selectedSize}
        onChange={onSizeChange}
        onOpenSizeGuide={onOpenSizeGuide}
      />

      <div className="flex flex-row gap-3 pt-4">
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          onClick={onAddToBag}
          disabled={isInCart}
          className="py-4 font-semibold uppercase tracking-wider text-xs disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isInCart ? "Added!" : "Add to Bag"}
        </Button>
        <Button
          variant="filled"
          size="lg"
          fullWidth
          onClick={onBuyNow}
          className="py-4 font-semibold uppercase tracking-wider text-xs"
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
