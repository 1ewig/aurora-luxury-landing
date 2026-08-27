/**
 * Aurora — src/components/admin/orders/OrdersClient.tsx
 *
 * Client-side orchestrator component for order management panel.
 * Connects order queries, state variables, and callbacks to the interactive
 * table view and detail slide-over modal.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { AdminHeaderPanel } from "@/components/ui/AdminHeaderPanel";
import { Pagination } from "@/components/ui/Pagination";
import { OrdersTable } from "./OrdersTable";
import { OrdersSkeleton } from "./OrdersSkeleton";
import { useOrdersManagement } from "@/hooks/useOrdersManagement";

const OrderDetailModal = dynamic(
  () => import("./OrderDetailModal").then((m) => m.OrderDetailModal),
  { ssr: false }
);

export function OrdersClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';

  const {
    orders,
    totalPages,
    loading,
    error,
    selectedOrder,
    setSelectedOrder,
    updateOrderStatus,
    updatingOrderId,
    isAdmin,
    fetchOrders,
  } = useOrdersManagement(page, search, status);

  const [localSearch, setLocalSearch] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);

  if (prevSearch !== search) {
    setPrevSearch(search);
    setLocalSearch(search);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
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
  }, [localSearch, search, searchParams, router, pathname]);

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

  return (
    <div className="space-y-8 pb-12">
      {loading && orders.length === 0 ? (
        <OrdersSkeleton />
      ) : error ? (
        <div className="p-8 text-center text-error border border-border-subtle rounded-2xl bg-white">
          {error}
        </div>
      ) : (
        <>
          <AdminHeaderPanel
            title="Order Processing"
            description="Fulfill pending purchases and process order statuses."
          />

          <OrdersTable
            orders={orders}
            filterStatus={status}
            onFilterStatusChange={(val) => updateParam('status', val)}
            searchQuery={localSearch}
            onSearchChange={setLocalSearch}
            onViewDetailsClick={setSelectedOrder}
            onRefresh={fetchOrders}
            loading={loading}
          />

          {totalPages > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => updateParam('page', String(p))}
            />
          )}

          <OrderDetailModal
            isOpen={!!selectedOrder}
            onClose={() => setSelectedOrder(null)}
            order={selectedOrder ? (orders.find((o) => o.id === selectedOrder.id) || selectedOrder) : null}
            onStatusUpdate={updateOrderStatus}
            updatingStatusId={updatingOrderId}
            isAdmin={isAdmin}
          />
        </>
      )}
    </div>
  );
}
