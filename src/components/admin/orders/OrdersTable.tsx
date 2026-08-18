/**
 * Aurora — src/components/admin/orders/OrdersTable.tsx
 *
 * Sortable, filterable orders table with inline status dropdowns
 * and a "View" action that opens OrderDetailModal.
 */

"use client";

import { type OrderData } from "@/stores/useAdminStore";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { Button } from "@/components/ui/Button";

interface OrdersTableProps {
  orders: OrderData[];
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onViewDetailsClick: (order: OrderData) => void;
  onRefresh: () => void;
  loading: boolean;
}

/** Filterable, sortable orders table with inline status updates. */
export function OrdersTable({
  orders,
  filterStatus,
  onFilterStatusChange,
  searchQuery,
  onSearchChange,
  onViewDetailsClick,
  onRefresh,
  loading,
}: OrdersTableProps) {
  return (
    <div className="space-y-8">

      {/* Filter and Search Panel */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search order #, email, name, ZIP, address..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-border-medium rounded-full focus:border-accent-primary focus:outline-none text-sm transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            className="block flex-1 min-w-0 px-5 py-3 pr-12 bg-bg-secondary border border-border-medium rounded-full text-sm focus:border-accent-primary focus:outline-none transition-colors cursor-pointer appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B6B6B' stroke-width='2'><path stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/></svg>")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 1rem center",
              backgroundSize: "1rem"
            }}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button variant="ghost" size="md" onClick={onRefresh} disabled={loading} className="py-3">
            {loading ? <>Refreshing<span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /></> : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="p-20 text-center text-text-secondary text-sm border border-border-subtle rounded-2xl bg-white">
          No orders found matching the filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto border border-border-subtle rounded-[24px] bg-bg-secondary shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-primary/50 uppercase tracking-wider text-[10px] font-semibold text-text-secondary">
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items count</th>
                <th className="px-6 py-4">Total Price</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Fulfillment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-border-subtle transition-opacity duration-200 ${
                loading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {orders.map((o) => {
                const totalItems = o.items.reduce((sum, item) => sum + item.quantity, 0);
                const orderDate = new Date(o.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr key={o.id} className="hover:bg-bg-primary/25 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-text-primary">
                      {o.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-text-secondary text-xs">
                      {orderDate}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">
                        {o.shippingAddress.firstName} {o.shippingAddress.lastName}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
                        <span>{o.shippingAddress.email}</span>
                        <span className={`px-1.5 py-0.2 rounded-[4px] text-[8px] font-semibold uppercase ${
                          o.userId ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                          {o.userId ? "Member" : "Guest"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {totalItems} item{totalItems !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      ${o.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        o.isPaid 
                          ? "bg-success/10 text-success border border-success/20" 
                          : "bg-text-secondary/10 text-text-secondary border border-border-medium"
                      }`}>
                        {o.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onViewDetailsClick(o)}
                        className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-primary hover:text-accent-primary transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
