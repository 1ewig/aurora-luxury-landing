/**
 * Aurora — src/components/admin/inventory/InventoryClient.tsx
 *
 * Client component managing product catalog inventory operations.
 * Handles product search, category filtering, delete confirmations, and
 * launches the form modal for adding or editing items.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { ProductData } from "@/stores/useAdminStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAdminProductsQuery, useDeleteProductMutation } from "@/hooks/queries";
import { useProductForm } from "@/hooks/useProductForm";
import dynamic from "next/dynamic";
import { Pagination } from "@/components/ui/Pagination";
import { AdminHeaderPanel } from "@/components/ui/AdminHeaderPanel";
import { Button } from "@/components/ui/Button";
import { InventoryTable } from "./InventoryTable";
import { InventorySkeleton } from "./InventorySkeleton";

const ProductFormModal = dynamic(
  () => import("./ProductFormModal").then((m) => m.ProductFormModal),
  { ssr: false }
);
const ConfirmDialog = dynamic(
  () => import("@/components/ui/ConfirmDialog").then((m) => m.ConfirmDialog),
  { ssr: false }
);

export function InventoryClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const urlSearch = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'All';

  const { data, isLoading, isFetching, error, refetch } = useAdminProductsQuery({
    page,
    limit: 20,
    search: urlSearch,
    category: category === 'All' ? undefined : category,
  });

  const deleteMutation = useDeleteProductMutation();
  const isAdmin = useAuthStore((s) => s.user?.isAdmin ?? false);

  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductData | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (prevUrlSearch !== urlSearch) {
    setPrevUrlSearch(urlSearch);
    setLocalSearch(urlSearch);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== urlSearch) {
        const p = new URLSearchParams(searchParams.toString());
        if (localSearch) {
          p.set('search', localSearch);
        } else {
          p.delete('search');
        }
        p.set('page', '1');
        router.replace(`${pathname}?${p.toString()}`);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, urlSearch, searchParams, router, pathname]);

  const updateParam = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) {
      p.set(key, value);
    } else {
      p.delete(key);
    }
    if (key !== 'page') p.set('page', '1');
    router.replace(`${pathname}?${p.toString()}`);
  }, [searchParams, pathname, router]);

  const products: ProductData[] = data?.products ?? [];
  const totalPages = data?.totalPages ?? 0;

  const form = useProductForm(() => {
    setIsModalOpen(false);
  });

  function handleOpenModal(product?: ProductData) {
    if (product) {
      setEditingProduct(product);
      form.resetForm(product);
    } else {
      setEditingProduct(null);
      form.resetForm(null);
    }
    setIsModalOpen(true);
  }

  async function handleDeleteConfirm() {
    if (productToDelete) {
      setDeleting(true);
      try {
        await deleteMutation.mutateAsync(productToDelete.id);
        setProductToDelete(null);
        setIsModalOpen(false);
      } catch (err: any) {
        alert(err.message || "Failed to delete product");
      } finally {
        setDeleting(false);
      }
    }
  }

  const displayError = error ? (typeof error === 'object' && 'message' in error ? (error as Error).message : 'An error occurred') : null;

  return (
    <div className="space-y-8 pb-12">
      {isLoading && products.length === 0 ? (
        <InventorySkeleton />
      ) : displayError ? (
        <div className="p-8 text-center text-error border border-border-subtle rounded-2xl bg-white">
          {displayError}
        </div>
      ) : (
        <>
          <AdminHeaderPanel
            title="Inventory Management"
            description="Add, update, or remove items from the catalog."
            action={isAdmin ? (
              <Button onClick={() => handleOpenModal()} variant="gold" size="sm">
                Add Product
              </Button>
            ) : undefined}
          />

          <InventoryTable
            filteredProducts={products}
            searchQuery={localSearch}
            onSearchChange={setLocalSearch}
            selectedCategory={category}
            onCategoryChange={(val) => updateParam('category', val)}
            onEditClick={handleOpenModal}
            isAdmin={isAdmin}
            onRefresh={refetch}
            loading={isLoading || isFetching}
          />

          {data && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => updateParam('page', String(p))}
            />
          )}

          <ProductFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            editingProduct={editingProduct}
            form={form}
            onDelete={() => setProductToDelete(editingProduct)}
            deleting={deleting}
          />

          <ConfirmDialog
            open={!!productToDelete}
            title="Delete Product"
            description={`Are you sure you want to permanently delete the product "${productToDelete?.name}"? All sizes, image listings, and unused storage assets will be deleted. This cannot be undone.`}
            confirmLabel={deleting ? "Deleting" : "Delete"}
            cancelLabel="Cancel"
            onConfirm={handleDeleteConfirm}
            onCancel={() => setProductToDelete(null)}
            disabled={deleting}
          />
        </>
      )}
    </div>
  );
}
