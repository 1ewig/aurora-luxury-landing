/**
 * Aurora — src/components/ui/ConfirmDialog.tsx
 *
 * Modal confirmation dialog with animated backdrop and standard styling.
 */

"use client";

import { useEffect } from "react";
import { useBodyScrollLock } from "@/hooks/ui/useBodyScrollLock";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/** Confirmation modal with standard minimal header and consistent design tokens. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  disabled,
  loading,
}: ConfirmDialogProps) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] p-3 pb-6 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-bg-secondary border border-border-subtle rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10">
        
        {/* ================= BARE MINIMUM HEADER ================= */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-border-subtle bg-bg-secondary">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-error shrink-0" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-text-primary truncate">
              Confirm Action
            </span>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={disabled || loading}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer rounded-full hover:bg-bg-primary shrink-0 ml-2 disabled:opacity-50"
            aria-label="Close dialog"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="p-5 sm:p-6 space-y-2">
          <h2
            id="confirm-dialog-title"
            className="font-display font-bold text-base sm:text-lg text-text-primary uppercase tracking-wide leading-snug"
          >
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            {description}
          </p>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-t border-border-subtle bg-bg-secondary flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled || loading}
            className="px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border border-border-subtle hover:border-text-primary bg-white text-text-primary transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled || loading}
            className="px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border border-error text-error hover:bg-error hover:text-white hover:border-error transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span>{confirmLabel}</span>
                <svg className="animate-spin h-3.5 w-3.5 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
