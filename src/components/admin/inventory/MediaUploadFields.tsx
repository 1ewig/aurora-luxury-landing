/**
 * Aurora — src/components/admin/inventory/MediaUploadFields.tsx
 *
 * Form fields for product description, main image upload, and gallery image uploads.
 */
"use client";

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

/** Renders textarea for description and file inputs for main and gallery images. */
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
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
          Description
        </label>
        <textarea
          required
          value={formDescription}
          onChange={(e) => onFormDescriptionChange(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-bg-primary border border-border-medium rounded-2xl text-sm focus:border-accent-primary focus:outline-none"
          placeholder="Product detailed description..."
        />
      </div>

      <div className="border border-border-subtle p-4 rounded-2xl bg-bg-primary/20 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
            Main Image ({uploading ? "Uploading..." : "Click to select"})
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              disabled={!isReady}
              onChange={(e) => onUpload(e.target.files, false)}
              className="text-xs text-text-secondary file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border file:border-border-medium file:text-xs file:font-semibold file:bg-white hover:file:bg-bg-primary file:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            />
            {mainImageUrl && (
              <div className="relative w-10 h-14 rounded overflow-hidden border border-border-subtle flex-shrink-0">
                <Image
                  src={mainImageUrl}
                  alt="Upload preview"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
            Gallery Images
          </label>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={!isReady}
              onChange={(e) => onUpload(e.target.files, true)}
              className="text-xs text-text-secondary file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border file:border-border-medium file:text-xs file:font-semibold file:bg-white hover:file:bg-bg-primary file:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <div className="flex gap-2 overflow-x-auto py-1">
              {galleryUrls.map((url, index) => (
                <div key={index} className="relative group flex-shrink-0">
                  <div className="relative w-10 h-14 rounded overflow-hidden border border-border-subtle">
                    <Image
                      src={url}
                      alt="Gallery item"
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveGalleryImage(index)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 rounded-full text-white text-[10px] flex items-center justify-center hover:bg-red-700 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
