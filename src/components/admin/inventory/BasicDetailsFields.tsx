/**
 * Aurora — src/components/admin/inventory/BasicDetailsFields.tsx
 *
 * Form fields for product identity, category taxonomy, pricing,
 * and storefront grid layout presentation.
 */

"use client";

import { useCategoriesQuery } from "@/hooks/queries";

interface BasicDetailsFieldsProps {
  editingProduct: boolean;
  formId: string;
  onFormIdChange: (val: string) => void;
  formName: string;
  onFormNameChange: (val: string) => void;
  formSlug: string;
  onFormSlugChange: (val: string) => void;
  formCategory: string;
  onFormCategoryChange: (val: string) => void;
  formPrice: string;
  onFormPriceChange: (val: string) => void;
  formBadge: string;
  onFormBadgeChange: (val: string) => void;
  formSpan: string;
  onFormSpanChange: (val: string) => void;
  formAspectRatio: string;
  onFormAspectRatioChange: (val: string) => void;
  formAltText: string;
  onFormAltTextChange: (val: string) => void;
}

const DEFAULT_CATEGORIES = ["Outerwear", "Knitwear", "Trousers", "Dresses", "Accessories"];

/** Renders structured cards for product identity, taxonomy, pricing, and grid presentation. */
export function BasicDetailsFields(props: BasicDetailsFieldsProps) {
  const { data: dbCategories = [] } = useCategoriesQuery();
  const categoriesList = dbCategories.length > 0
    ? dbCategories.map((c) => c.name)
    : DEFAULT_CATEGORIES;

  return (
    <div className="space-y-4">
      {/* Identity & Taxonomy Card */}
      <div className="border border-border-subtle bg-bg-primary/25 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 pb-1 border-b border-border-subtle/50">
          <svg className="w-3.5 h-3.5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Identity & Taxonomy
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Product ID */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Product ID {props.editingProduct && <span className="text-text-muted font-normal">(Locked)</span>}
            </label>
            <input
              type="text"
              required
              disabled={props.editingProduct}
              value={props.formId}
              onChange={(e) => props.onFormIdChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-medium rounded-xl text-xs font-mono font-semibold text-text-primary disabled:opacity-60 disabled:cursor-not-allowed focus:border-accent-primary focus:outline-none transition-colors"
              placeholder="e.g. p15"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Category
            </label>
            <div className="relative">
              <select
                value={props.formCategory}
                onChange={(e) => props.onFormCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-medium rounded-xl text-xs font-semibold text-text-primary focus:border-accent-primary focus:outline-none transition-colors cursor-pointer appearance-none pr-9 hover:border-text-muted"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B6B6B' stroke-width='2'><path stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/></svg>")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "0.85rem",
                }}
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
            Product Title
          </label>
          <input
            type="text"
            required
            value={props.formName}
            onChange={(e) => props.onFormNameChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-medium rounded-xl text-xs sm:text-sm font-medium text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
            placeholder="e.g. Cashmere Double-Breasted Overcoat"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
            URL Slug
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-text-muted select-none">
              /products/
            </span>
            <input
              type="text"
              required
              value={props.formSlug}
              onChange={(e) => props.onFormSlugChange(e.target.value)}
              className="w-full pl-[5.5rem] pr-3.5 py-2.5 bg-bg-secondary border border-border-medium rounded-xl text-xs font-mono text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
              placeholder="cashmere-double-breasted-overcoat"
            />
          </div>
        </div>

        {/* Badge */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
            Marketing Badge <span className="text-text-muted font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={props.formBadge}
            onChange={(e) => props.onFormBadgeChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-medium rounded-xl text-xs font-medium text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
            placeholder="e.g. New Arrival / Limited Edition / Signature"
          />
        </div>
      </div>

      {/* Pricing & Grid Presentation Card */}
      <div className="border border-border-subtle bg-bg-primary/25 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 pb-1 border-b border-border-subtle/50">
          <svg className="w-3.5 h-3.5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pricing & Layout Presentation
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Price */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Retail Price ($ USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-text-secondary select-none">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={props.formPrice}
                onChange={(e) => props.onFormPriceChange(e.target.value)}
                className="w-full pl-7 pr-3.5 py-2.5 bg-bg-secondary border border-border-medium rounded-xl text-xs font-mono font-semibold text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
                placeholder="495.00"
              />
            </div>
          </div>

          {/* Alt Text */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Accessibility / Alt Text
            </label>
            <input
              type="text"
              required
              value={props.formAltText}
              onChange={(e) => props.onFormAltTextChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-medium rounded-xl text-xs font-medium text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
              placeholder="e.g. Model wearing charcoal wool overcoat"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Span */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Grid Span <span className="text-text-muted font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={props.formSpan}
              onChange={(e) => props.onFormSpanChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-medium rounded-xl text-xs font-mono text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
              placeholder="e.g. col-span-2 / tall"
            />
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
              Aspect Ratio <span className="text-text-muted font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={props.formAspectRatio}
              onChange={(e) => props.onFormAspectRatioChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-medium rounded-xl text-xs font-mono text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
              placeholder="e.g. 3/4 or portrait"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
