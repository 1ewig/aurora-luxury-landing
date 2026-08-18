/**
 * Aurora — src/components/admin/inventory/ProductFormModal.tsx
 *
 * Slide-in luxury modal dialog for creating or editing catalog products
 * with full sections for identity, taxonomy, media assets, inventory sizes,
 * and editorial specifications.
 */

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { type ProductData } from "@/stores/useAdminStore";
import { type useProductForm } from "@/hooks/useProductForm";
import { useBodyScrollLock } from "@/hooks/ui/useBodyScrollLock";
import { BasicDetailsFields } from "./BasicDetailsFields";
import { MediaUploadFields } from "./MediaUploadFields";
import { SizeStockFields } from "./SizeStockFields";
import { BulletDetailsFields } from "./BulletDetailsFields";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: ProductData | null;
  form: ReturnType<typeof useProductForm>;
  onDelete?: () => void;
  deleting?: boolean;
}

/** Renders an animated luxury modal with identity details, media uploads, inventory sizes, and specification bullets. */
export function ProductFormModal({
  isOpen,
  onClose,
  editingProduct,
  form,
  onDelete,
  deleting,
}: ProductFormModalProps) {
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] p-3 pb-6 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Shell */}
      <div className="relative w-full max-w-5xl bg-bg-secondary border border-border-subtle rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSave(editingProduct);
          }}
          className="flex flex-col h-full overflow-hidden"
        >
          {/* ================= HEADER ================= */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-border-subtle bg-bg-secondary">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-accent-primary shrink-0" />
              <h2
                id="product-form-title"
                className="text-xs sm:text-sm font-bold uppercase tracking-widest text-text-primary truncate"
              >
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <span className="font-mono text-[11px] font-semibold text-text-secondary bg-bg-primary border border-border-subtle px-2 py-0.5 rounded-md truncate max-w-[130px] sm:max-w-[180px] shrink-0">
                #{form.formId || "New Item"}
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-accent-primary/10 text-accent-vivid border border-accent-primary/20 shrink-0">
                {form.formCategory}
              </span>
              <span
                className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                  form.totalStock > 0
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}
              >
                {form.totalStock} Units in Stock
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer rounded-full hover:bg-bg-primary shrink-0 ml-2"
              aria-label="Close product form"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile sub-banner */}
          <div className="flex sm:hidden items-center justify-between px-5 py-2 border-b border-border-subtle bg-bg-primary/20 text-xs">
            <span className="text-text-muted text-[11px]">Category & Units</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-accent-primary/10 text-accent-vivid border border-accent-primary/20">
                {form.formCategory}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  form.totalStock > 0
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}
              >
                {form.totalStock} units
              </span>
            </div>
          </div>

          {/* ================= SCROLLABLE BODY ================= */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Inline Error Message Alert */}
            {form.errorMessage && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-600 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-medium">{form.errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => form.setErrorMessage(null)}
                  className="text-red-500 hover:text-red-700 font-bold p-1 cursor-pointer transition-colors"
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Split 2-Column Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT COLUMN: Identity, Pricing & Specifications (6 Cols) */}
              <div className="lg:col-span-6 space-y-5">
                <BasicDetailsFields
                  editingProduct={!!editingProduct}
                  formId={form.formId}
                  onFormIdChange={form.setFormId}
                  formName={form.formName}
                  onFormNameChange={form.setFormName}
                  formSlug={form.formSlug}
                  onFormSlugChange={form.setFormSlug}
                  formCategory={form.formCategory}
                  onFormCategoryChange={form.setFormCategory}
                  formPrice={form.formPrice}
                  onFormPriceChange={form.setFormPrice}
                  formBadge={form.formBadge}
                  onFormBadgeChange={form.setFormBadge}
                  formSpan={form.formSpan}
                  onFormSpanChange={form.setFormSpan}
                  formAspectRatio={form.formAspectRatio}
                  onFormAspectRatioChange={form.setFormAspectRatio}
                  formAltText={form.formAltText}
                  onFormAltTextChange={form.setFormAltText}
                />

                <BulletDetailsFields
                  formDetailInput={form.formDetailInput}
                  onFormDetailInputChange={form.setFormDetailInput}
                  onAddDetail={form.handleAddDetail}
                  formDetails={form.formDetails}
                  onRemoveDetail={(index) =>
                    form.setFormDetails((prev) => prev.filter((_, i) => i !== index))
                  }
                />
              </div>

              {/* RIGHT COLUMN: Media Assets & Inventory Sizes (6 Cols) */}
              <div className="lg:col-span-6 space-y-5">
                <MediaUploadFields
                  formDescription={form.formDescription}
                  onFormDescriptionChange={form.setFormDescription}
                  uploading={form.uploading}
                  isReady={form.isReady}
                  mainImageUrl={form.mainImageUrl}
                  onUpload={form.handleUpload}
                  galleryUrls={form.galleryUrls}
                  onRemoveGalleryImage={(index) =>
                    form.setGalleryUrls((prev) => prev.filter((_, i) => i !== index))
                  }
                />

                <SizeStockFields
                  newSizeName={form.newSizeName}
                  onNewSizeNameChange={form.setNewSizeName}
                  newSizeStock={form.newSizeStock}
                  onNewSizeStockChange={form.setNewSizeStock}
                  onAddSize={form.handleAddSize}
                  formSizes={form.formSizes}
                  onStockChange={(size, stock) =>
                    form.setFormSizes((prev) =>
                      prev.map((item) => (item.size === size ? { ...item, stock } : item))
                    )
                  }
                  onRemoveSize={(size) =>
                    form.setFormSizes((prev) => prev.filter((item) => item.size !== size))
                  }
                  onAddPresetSizes={form.handleAddPresetSizes}
                  totalStock={form.totalStock}
                />
              </div>
            </div>
          </div>

          {/* ================= FOOTER ================= */}
          <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 border-t border-border-subtle bg-bg-secondary flex items-center justify-end gap-3">
            {editingProduct && onDelete ? (
              <Button
                type="button"
                onClick={onDelete}
                disabled={deleting || form.saving || form.uploading}
                variant="ghost"
                size="sm"
                className="border-error text-error hover:bg-error hover:text-white hover:border-error text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 shrink-0"
              >
                {deleting ? "Deleting..." : "Delete Product"}
              </Button>
            ) : (
              <span className="text-[11px] text-text-muted font-mono hidden sm:inline mr-auto">
                {form.hasChanges ? "Unsaved changes detected" : "All fields up to date"}
              </span>
            )}

            <Button
              type="submit"
              disabled={!form.hasChanges || form.uploading || form.saving || deleting}
              variant="gold"
              size="sm"
              className={!editingProduct ? "w-full sm:w-auto text-xs sm:text-sm py-2 sm:py-2.5" : "text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 shrink-0"}
            >
              {form.uploading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </span>
              ) : form.saving ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                editingProduct ? "Save Changes" : "Create Product"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
