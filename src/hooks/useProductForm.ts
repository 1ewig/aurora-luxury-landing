/**
 * Aurora — src/hooks/useProductForm.ts
 *
 * Admin product create/edit form hook. Manages ~15 form fields,
 * InsForge storage image upload, size/stock variant management,
 * detail bullet editing, auto-slug generation, and snapshot-based
 * change detection (dirty flag).
 *
 * On save, calls useSaveProductMutation (POST or PUT depending on
 * whether editingProduct is passed). On success, calls onSuccess()
 * which typically refreshes the product list and closes the form.
 */

import { useState, useEffect } from "react";
import { useInsforgeClient } from "@/lib/insforge";
import { useSaveProductMutation } from "@/hooks/queries";
import type { ProductData, SizeStock } from "@/stores/useAdminStore";

/** Admin product form state and handlers for create/edit workflow. */
export function useProductForm(onSuccess: () => void) {
  const saveMutation = useSaveProductMutation();
  const { client: insforge, isReady } = useInsforgeClient();

  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState<string>("Outerwear");
  const [formPrice, setFormPrice] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formAltText, setFormAltText] = useState("");
  const [formSpan, setFormSpan] = useState("");
  const [formAspectRatio, setFormAspectRatio] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDetailInput, setFormDetailInput] = useState("");
  const [formDetails, setFormDetails] = useState<string[]>([]);
  const [formSizes, setFormSizes] = useState<SizeStock[]>([
    { size: "S", stock: 10 },
    { size: "M", stock: 10 },
    { size: "L", stock: 10 },
  ]);
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizeStock, setNewSizeStock] = useState("10");

  const [mainImageUrl, setMainImageUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /*
   * JSON-serialized snapshot of the initial form state.
   * Compared against currentSnapshot() to determine if the user
   * has made changes (enables/disables the save button).
   */
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");

  function currentSnapshot() {
    return JSON.stringify({
      id: formId,
      name: formName,
      slug: formSlug,
      category: formCategory,
      price: formPrice,
      badge: formBadge,
      altText: formAltText,
      span: formSpan,
      aspectRatio: formAspectRatio,
      description: formDescription,
      details: formDetails,
      sizes: formSizes,
      image: mainImageUrl,
      images: galleryUrls,
    });
  }

  const hasChanges = currentSnapshot() !== initialSnapshot;
  const totalStock = formSizes.reduce((acc, s) => acc + (Number(s.stock) || 0), 0);

  /*
   * Auto-generate slug from name when creating a new product.
   * Only fires when formId is empty (no existing product loaded).
   * Prevents overriding a manually-set slug during edits.
   */
  useEffect(() => {
    if (!formId && formName) {
      const slugified = formName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setFormSlug(slugified);
    }
  }, [formName, formId]);

  /** Populates the form for editing or resets to defaults for creation. */
  function resetForm(product?: ProductData | null) {
    setErrorMessage(null);
    if (product) {
      setFormId(product.id);
      setFormName(product.name);
      setFormSlug(product.slug);
      setFormCategory(product.category);
      setFormPrice(String(product.price));
      setFormBadge(product.badge || "");
      setFormAltText(product.altText || "");
      setFormSpan(product.span || "");
      setFormAspectRatio(product.aspectRatio || "");
      setFormDescription(product.description || "");
      setFormDetails(product.details || []);
      setFormSizes(product.sizes || []);
      setMainImageUrl(product.image);
      setGalleryUrls(product.images || []);
      setInitialSnapshot(
        JSON.stringify({
          id: product.id,
          name: product.name,
          slug: product.slug,
          category: product.category,
          price: String(product.price),
          badge: product.badge || "",
          altText: product.altText || "",
          span: product.span || "",
          aspectRatio: product.aspectRatio || "",
          description: product.description || "",
          details: product.details || [],
          sizes: product.sizes || [],
          image: product.image,
          images: product.images || [],
        })
      );
    } else {
      // Reset to default blank form for new product creation
      setFormId("");
      setFormName("");
      setFormSlug("");
      setFormCategory("Outerwear");
      setFormPrice("");
      setFormBadge("");
      setFormAltText("");
      setFormSpan("");
      setFormAspectRatio("");
      setFormDescription("");
      setFormDetails([]);
      setFormSizes([
        { size: "S", stock: 10 },
        { size: "M", stock: 10 },
        { size: "L", stock: 10 },
      ]);
      setMainImageUrl("");
      setGalleryUrls([]);
      setInitialSnapshot(
        JSON.stringify({
          id: "",
          name: "",
          slug: "",
          category: "Outerwear",
          price: "",
          badge: "",
          altText: "",
          span: "",
          aspectRatio: "",
          description: "",
          details: [],
          sizes: [
            { size: "S", stock: 10 },
            { size: "M", stock: 10 },
            { size: "L", stock: 10 },
          ],
          image: "",
          images: [],
        })
      );
    }
  }

  /*
   * Uploads file(s) to the InsForge 'product-media' storage bucket.
   * Generates a safe filename key: {productId}/{sanitized-original-name}.
   * For main image uploads, the uploaded URL is also prepended to the
   * gallery list to ensure it's the first gallery entry.
   */
  async function handleUpload(files: FileList | null, isGallery = false) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setErrorMessage(null);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const idForPath = formId.trim() || "temp";
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const key = `${idForPath}/${safeName}`;

        const { data, error } = await insforge.storage.from("product-media").upload(key, file);
        if (error) throw error;
        return data?.url || "";
      });

      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter(Boolean);

      if (isGallery) {
        setGalleryUrls((prev) => [...prev, ...validUrls]);
      } else {
        setMainImageUrl(validUrls[0] || "");
        setGalleryUrls((prev) => {
          const newUrl = validUrls[0] || "";
          const filtered = prev.filter((u) => u !== newUrl);
          return [newUrl, ...filtered];
        });
      }
    } catch (err: any) {
      setErrorMessage(`Upload failed: ${err.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(editingProduct: ProductData | null) {
    setErrorMessage(null);
    if (!formId.trim()) {
      setErrorMessage("Product ID is required (e.g. p15)");
      return;
    }
    if (!formName.trim()) {
      setErrorMessage("Product Name is required");
      return;
    }
    if (!formPrice || isNaN(parseFloat(formPrice)) || parseFloat(formPrice) < 0) {
      setErrorMessage("Please enter a valid non-negative price");
      return;
    }
    if (!mainImageUrl) {
      setErrorMessage("Main product image is required. Please upload an image.");
      return;
    }

    setSaving(true);
    const payload = {
      id: formId.trim(),
      slug: formSlug.trim(),
      name: formName.trim(),
      category: formCategory,
      price: parseFloat(formPrice),
      badge: formBadge.trim() || null,
      image: mainImageUrl,
      altText: formAltText.trim() || formName.trim(),
      span: formSpan.trim() || null,
      aspectRatio: formAspectRatio.trim() || null,
      description: formDescription.trim(),
      images: galleryUrls,
      sizes: formSizes.map((s) => ({
        size: s.size,
        stock: typeof s.stock === 'number' && !isNaN(s.stock) ? Math.max(0, Math.floor(s.stock)) : Math.max(0, parseInt(String(s.stock), 10) || 0),
      })),
      details: formDetails,
    };

    try {
      await saveMutation.mutateAsync({ product: payload, id: editingProduct?.id });
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  function handleAddDetail() {
    if (formDetailInput.trim()) {
      setFormDetails((prev) => [...prev, formDetailInput.trim()]);
      setFormDetailInput("");
      setErrorMessage(null);
    }
  }

  /*
   * Adds a new size variant with case-insensitive dedup.
   * If a size with the same name (case-insensitive) already exists
   * in the list, it is replaced rather than duplicated.
   */
  function handleAddSize() {
    if (newSizeName.trim()) {
      const stock = parseInt(newSizeStock, 10);
      if (isNaN(stock) || stock < 0) {
        setErrorMessage("Invalid stock level: please provide a non-negative number");
        return;
      }
      setErrorMessage(null);
      setFormSizes((prev) => {
        const filtered = prev.filter((s) => s.size.toUpperCase() !== newSizeName.trim().toUpperCase());
        return [...filtered, { size: newSizeName.trim().toUpperCase(), stock }];
      });
      setNewSizeName("");
    }
  }

  function handleAddPresetSizes(preset: "apparel" | "one-size" | "numeric") {
    setErrorMessage(null);
    if (preset === "apparel") {
      setFormSizes([
        { size: "XS", stock: 10 },
        { size: "S", stock: 10 },
        { size: "M", stock: 10 },
        { size: "L", stock: 10 },
        { size: "XL", stock: 10 },
      ]);
    } else if (preset === "one-size") {
      setFormSizes([{ size: "ONE SIZE", stock: 20 }]);
    } else if (preset === "numeric") {
      setFormSizes([
        { size: "36", stock: 5 },
        { size: "38", stock: 10 },
        { size: "40", stock: 10 },
        { size: "42", stock: 10 },
        { size: "44", stock: 5 },
      ]);
    }
  }

  return {
    formId, setFormId,
    formName, setFormName,
    formSlug, setFormSlug,
    formCategory, setFormCategory,
    formPrice, setFormPrice,
    formBadge, setFormBadge,
    formAltText, setFormAltText,
    formSpan, setFormSpan,
    formAspectRatio, setFormAspectRatio,
    formDescription, setFormDescription,
    formDetailInput, setFormDetailInput,
    formDetails, setFormDetails,
    formSizes, setFormSizes,
    newSizeName, setNewSizeName,
    newSizeStock, setNewSizeStock,
    mainImageUrl, setMainImageUrl,
    galleryUrls, setGalleryUrls,
    uploading,
    saving,
    isReady,
    hasChanges,
    totalStock,
    errorMessage,
    setErrorMessage,
    resetForm,
    handleUpload,
    handleSave,
    handleAddDetail,
    handleAddSize,
    handleAddPresetSizes,
  };
}
