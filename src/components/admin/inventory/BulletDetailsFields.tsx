/**
 * Aurora — src/components/admin/inventory/BulletDetailsFields.tsx
 *
 * Form section for managing editorial detail bullet points,
 * fabric specifications, craftsmanship notes, and care instructions.
 */

"use client";

interface BulletDetailsFieldsProps {
  formDetailInput: string;
  onFormDetailInputChange: (val: string) => void;
  onAddDetail: () => void;
  formDetails: string[];
  onRemoveDetail: (index: number) => void;
}

/** Renders luxury card for adding and editing product specification bullet points. */
export function BulletDetailsFields({
  formDetailInput,
  onFormDetailInputChange,
  onAddDetail,
  formDetails,
  onRemoveDetail,
}: BulletDetailsFieldsProps) {
  return (
    <div className="border border-border-subtle bg-bg-primary/25 rounded-2xl p-4 sm:p-5 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-border-subtle/50">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Specifications & Details
        </h3>
        <span className="font-mono text-[11px] font-semibold text-text-secondary bg-bg-primary border border-border-subtle px-2 py-0.5 rounded-md">
          {formDetails.length} bullet{formDetails.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Add Detail Input */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
          Add Specification Point
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="e.g. 100% Virgin Cashmere, Horn buttons, Made in Italy"
            value={formDetailInput}
            onChange={(e) => onFormDetailInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddDetail();
              }
            }}
            className="flex-1 px-3.5 py-2 bg-bg-secondary border border-border-medium rounded-xl text-xs text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={onAddDetail}
            className="px-3.5 py-2 bg-bg-ink hover:bg-text-primary text-text-inverted rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0"
          >
            Add
          </button>
        </div>
      </div>

      {/* Active Details List */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
          Product Details List
        </span>

        {formDetails.length === 0 ? (
          <p className="text-xs text-text-muted italic py-1">No bullet points added yet.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {formDetails.map((detail, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-3 bg-bg-secondary p-2.5 px-3 border border-border-subtle rounded-xl text-xs hover:border-border-medium transition-colors"
              >
                <div className="flex items-start gap-2 min-w-0 pt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0 mt-1.5" />
                  <span className="text-text-primary text-xs leading-relaxed break-words">{detail}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveDetail(index)}
                  className="p-1 text-text-muted hover:text-error transition-colors cursor-pointer rounded shrink-0"
                  title="Remove detail bullet"
                  aria-label={`Remove detail: ${detail}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
