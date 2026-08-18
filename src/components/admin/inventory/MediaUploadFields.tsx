/**
 * Aurora — src/components/admin/inventory/MediaUploadFields.tsx
 *
 * Form section for product editorial description, high-fidelity main image
 * asset management, and multi-image gallery uploads with InsForge storage.
 */

"use client";

import { useRef } from "react";
import Image from "next/image";

interface MediaUploadFieldsProps {
  formDescription: string;
  onFormDescriptionChange: (val: string) => void;
  uploading: boolean;
  isReady: boolean;
  mainImageUrl: string;
  onUpload: (files: FileList | null, isGallery: boolean) => void;
  galleryUrls: string[];
  onRemoveGalleryImage: (index: number) => void;
}

/** Renders description input and luxury dropzones/previews for primary and gallery media. */
export function MediaUploadFields({
  formDescription,
  onFormDescriptionChange,
  uploading,
  isReady,
  mainImageUrl,
  onUpload,
  galleryUrls,
  onRemoveGalleryImage,
}: MediaUploadFieldsProps) {
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      {/* Product Narrative & Description Card */}
      <div className="border border-border-subtle bg-bg-primary/25 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 pb-1 border-b border-border-subtle/50">
          <svg className="w-3.5 h-3.5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Editorial Description
        </h3>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
            Product Story & Overview
          </label>
          <textarea
            required
            rows={3}
            value={formDescription}
            onChange={(e) => onFormDescriptionChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-bg-secondary border border-border-medium rounded-xl text-xs sm:text-sm text-text-primary focus:border-accent-primary focus:outline-none transition-colors leading-relaxed resize-none"
            placeholder="Provide a compelling luxury description highlighting silhouette, cut, tactile hand-feel, and craftsmanship..."
          />
        </div>
      </div>

      {/* Media Assets & Photography Card */}
      <div className="border border-border-subtle bg-bg-primary/25 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-border-subtle/50">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Media & Photography
          </h3>
          <span className="text-[10px] font-mono text-text-muted">
            {galleryUrls.length + (mainImageUrl ? 1 : 0)} asset{galleryUrls.length + (mainImageUrl ? 1 : 0) === 1 ? "" : "s"}
          </span>
        </div>

        {/* Hidden inputs */}
        <input
          ref={mainFileInputRef}
          type="file"
          accept="image/*"
          disabled={!isReady || uploading}
          onChange={(e) => onUpload(e.target.files, false)}
          className="hidden"
        />
        <input
          ref={galleryFileInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={!isReady || uploading}
          onChange={(e) => onUpload(e.target.files, true)}
          className="hidden"
        />

        {/* Primary Hero Image Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Primary Product Image <span className="text-accent-vivid font-semibold">*</span>
            </span>
            {uploading && (
              <span className="text-[10px] font-semibold text-accent-vivid flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading to InsForge...
              </span>
            )}
          </div>

          {mainImageUrl ? (
            <div className="flex items-start gap-4 p-3 bg-bg-secondary border border-border-subtle rounded-xl">
              <div className="relative w-20 h-28 sm:w-24 sm:h-32 rounded-lg overflow-hidden border border-border-subtle bg-bg-primary shrink-0 group">
                <Image
                  src={mainImageUrl}
                  alt="Main hero preview"
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 py-1 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-accent-primary/10 text-accent-vivid border border-accent-primary/20 text-[10px] font-semibold uppercase tracking-wider">
                    Primary Cover
                  </span>
                </div>
                <p className="text-[11px] font-mono text-text-muted truncate">
                  {mainImageUrl}
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={!isReady || uploading}
                    onClick={() => mainFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-bg-primary hover:bg-border-subtle text-text-primary border border-border-subtle rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Replace Image
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => isReady && !uploading && mainFileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed border-border-medium hover:border-accent-primary rounded-xl text-center cursor-pointer transition-all bg-bg-secondary/50 hover:bg-bg-secondary ${
                !isReady || uploading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-9 h-9 rounded-full bg-accent-primary/10 text-accent-vivid flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary">Click to select primary image</p>
                  <p className="text-[10px] text-text-muted mt-0.5">High-res WebP, JPG or PNG (up to 50MB)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Gallery Images Section */}
        <div className="space-y-2 pt-2 border-t border-border-subtle/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Gallery Lookbook & Angles ({galleryUrls.length})
            </span>
            <button
              type="button"
              disabled={!isReady || uploading}
              onClick={() => galleryFileInputRef.current?.click()}
              className="text-[11px] font-semibold text-accent-vivid hover:underline cursor-pointer disabled:opacity-50"
            >
              + Add Gallery Images
            </button>
          </div>

          {galleryUrls.length === 0 ? (
            <p className="text-xs text-text-muted italic py-1">No additional gallery views uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 pt-1">
              {galleryUrls.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="relative group rounded-lg overflow-hidden border border-border-subtle bg-bg-primary aspect-[3/4]"
                >
                  <Image
                    src={url}
                    alt={`Gallery perspective ${index + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                    <button
                      type="button"
                      onClick={() => onRemoveGalleryImage(index)}
                      className="p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                      title="Remove image"
                      aria-label="Remove image"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <span className="absolute bottom-1 left-1 bg-black/70 text-white font-mono text-[9px] px-1 py-0.2 rounded">
                    #{index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
