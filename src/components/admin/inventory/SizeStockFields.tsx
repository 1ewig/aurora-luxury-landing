/**
 * Aurora — src/components/admin/inventory/SizeStockFields.tsx
 *
 * Form section for adding, editing, and managing product size variants
 * and inventory stock allocations with quick presets and stock badges.
 */

"use client";

import { type SizeStock } from "@/stores/useAdminStore";

interface SizeStockFieldsProps {
  newSizeName: string;
  onNewSizeNameChange: (val: string) => void;
  newSizeStock: string;
  onNewSizeStockChange: (val: string) => void;
  onAddSize: () => void;
  formSizes: SizeStock[];
  onStockChange: (size: string, stock: number) => void;
  onRemoveSize: (size: string) => void;
  onAddPresetSizes?: (preset: "apparel" | "one-size" | "numeric") => void;
  totalStock?: number;
}

/** Renders luxury card for sizes and stock levels with variant presets and status indicators. */
export function SizeStockFields({
  newSizeName,
  onNewSizeNameChange,
  newSizeStock,
  onNewSizeStockChange,
  onAddSize,
  formSizes,
  onStockChange,
  onRemoveSize,
  onAddPresetSizes,
  totalStock = formSizes.reduce((acc, s) => acc + (Number(s.stock) || 0), 0),
}: SizeStockFieldsProps) {
  return (
    <div className="border border-border-subtle bg-bg-primary/25 rounded-2xl p-4 sm:p-5 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-border-subtle/50">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Sizes & Inventory Stock
        </h3>
        <span className="font-mono text-[11px] font-semibold text-text-secondary bg-bg-primary border border-border-subtle px-2 py-0.5 rounded-md">
          {totalStock} total units
        </span>
      </div>

      {/* Preset Buttons */}
      {onAddPresetSizes && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
            Quick Size Presets
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onAddPresetSizes("apparel")}
              className="px-2.5 py-1 bg-bg-secondary hover:bg-bg-primary border border-border-subtle hover:border-border-medium rounded-lg text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              + Apparel (XS–XL)
            </button>
            <button
              type="button"
              onClick={() => onAddPresetSizes("numeric")}
              className="px-2.5 py-1 bg-bg-secondary hover:bg-bg-primary border border-border-subtle hover:border-border-medium rounded-lg text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              + Numeric (36–44)
            </button>
            <button
              type="button"
              onClick={() => onAddPresetSizes("one-size")}
              className="px-2.5 py-1 bg-bg-secondary hover:bg-bg-primary border border-border-subtle hover:border-border-medium rounded-lg text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              + One Size
            </button>
          </div>
        </div>
      )}

      {/* Add Size Input Row */}
      <div className="space-y-1.5 pt-1">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
          Add Custom Variant
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Size (e.g. XXL, 42, OS)"
            value={newSizeName}
            onChange={(e) => onNewSizeNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddSize();
              }
            }}
            className="flex-1 px-3.5 py-2 bg-bg-secondary border border-border-medium rounded-xl text-xs font-mono text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
          />
          <div className="relative w-24">
            <input
              type="number"
              min="0"
              placeholder="Qty"
              value={newSizeStock}
              onChange={(e) => onNewSizeStockChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddSize();
                }
              }}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-medium rounded-xl text-xs font-mono text-center text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={onAddSize}
            className="px-3.5 py-2 bg-bg-ink hover:bg-text-primary text-text-inverted rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0"
          >
            Add
          </button>
        </div>
      </div>

      {/* Active Sizes List */}
      <div className="space-y-2 pt-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
          Configured Size Variants ({formSizes.length})
        </span>

        {formSizes.length === 0 ? (
          <p className="text-xs text-text-muted italic py-1">No size variants configured.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {formSizes.map((s) => {
              const isLowStock = s.stock > 0 && s.stock < 5;
              const isOutOfStock = s.stock === 0;

              return (
                <div
                  key={s.size}
                  className="flex items-center justify-between bg-bg-secondary p-2.5 px-3 border border-border-subtle rounded-xl text-xs hover:border-border-medium transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-text-primary bg-bg-primary border border-border-subtle px-2 py-0.5 rounded-md min-w-[2.25rem] text-center">
                      {s.size}
                    </span>
                    {isOutOfStock ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Low Stock
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-text-muted">Stock:</span>
                      <input
                        type="number"
                        min="0"
                        value={s.stock}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (isNaN(val)) return;
                          onStockChange(s.size, Math.max(0, val));
                        }}
                        className="w-16 px-2 py-1 bg-bg-primary border border-border-medium rounded-lg text-xs font-mono font-semibold text-center text-text-primary focus:outline-none focus:border-accent-primary"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveSize(s.size)}
                      className="p-1 text-text-muted hover:text-error transition-colors cursor-pointer rounded"
                      title="Remove size variant"
                      aria-label={`Remove size ${s.size}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
